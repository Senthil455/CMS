import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SystemDesigner } from '../system-designer.js';
import { StubAgent } from '../../../infrastructures/stub-agent.js';
import type { ChatContext } from '../chat-handler.js';
import { CmsClient } from '../../../infrastructures/cms-client.js';
import type { ServiceLogger } from '../../../types/logger.js';
import { config } from '../../../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load stub content
const stubPath = path.join(__dirname, '../../../../assets/prompts/stub/system-designer.txt');
const stubContent = fs.readFileSync(stubPath, 'utf8');

describe('SystemDesigner', () => {
    // Enhanced Mock Logger to show Axios error details
    const mockLogger: ServiceLogger = {
        info: vi.fn(),
        error: vi.fn((...args) => {
            const [obj, msg] = args;
            if (obj && typeof obj === 'object' && obj.error?.isAxiosError) {
                console.error('[ERROR]', msg, obj.error.response?.data);
            }
        }),
        warn: vi.fn(),
        debug: vi.fn(),
    } as any;

    const realCmsClient = new CmsClient(config.CMS_BASE_URL);

    const mockChatContext: ChatContext = {
        saveAssistantMessage: vi.fn().mockResolvedValue({ id: 1 }),
        saveAiResponseLog: vi.fn().mockResolvedValue(undefined),
        externalCookie: 'test-cookie',
        userId: '123',
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should propose schemas and categorize them', async () => {
        // Mock getAllEntities to return an existing entity
        vi.spyOn(realCmsClient, 'getAllEntities').mockResolvedValue([
            { name: 'course', schemaId: 'sid-123' }
        ] as any);

        const systemDesigner = new SystemDesigner(
            new StubAgent(),
            stubContent,
            'ENTITY_SCHEMA_STUB',
            'ATTRIBUTE_SCHEMA_STUB',
            'RELATIONSHIP_SCHEMA_STUB',
            realCmsClient,
            mockLogger
        );

        await systemDesigner.handle('test input', 'none', mockChatContext);

        // Verification: Check if saveAssistantMessage was called with PROPOSED_SCHEMA payload
        expect(mockChatContext.saveAssistantMessage).toHaveBeenCalledWith(
            expect.stringContaining('analyzed your requirements and proposed the following schema changes'),
            expect.objectContaining({
                type: 'PROPOSED_SCHEMA',
                entities: expect.arrayContaining([
                    expect.objectContaining({
                        status: 'overwrite',
                        schemaId: 'sid-123',
                        entity: expect.objectContaining({ name: 'course' })
                    })
                ])
            })
        );
    });
});
