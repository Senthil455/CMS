import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EntityGenerator } from '../entity-generator.js';

import type { AgentContext } from '../chat-agent.js';
import { CmsClient } from '../../../infrastructures/cms-client.js';
import type { ServiceLogger } from '../../../types/logger.js';
import { config } from '../../../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load stub content
const stubPath = path.join(__dirname, '../../../../assets/prompts/stub/entity-generator.txt');
const stubContent = fs.readFileSync(stubPath, 'utf8');

describe('EntityGenerator', () => {
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

    const mockChatContext: AgentContext = {
        saveAssistantMessage: vi.fn().mockResolvedValue({ id: 1 }),
        saveAiResponseLog: vi.fn().mockResolvedValue(undefined),
        onConfirmSchemaSummary: vi.fn().mockResolvedValue(undefined),
        externalCookie: 'test-cookie',
        userId: '123'
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should propose schemas and categorize them', async () => {
        // Mock getAllEntities to return an existing entity
        vi.spyOn(realCmsClient, 'getAllEntities').mockResolvedValue([
            { name: 'post', schemaId: 'sid-123' }
        ] as any);

        // Mock provider
        const agent = {
            generate: async (system: string, developer: string, user: string) => {
                return JSON.parse(user);
            }
        };
        let generator: EntityGenerator = new EntityGenerator(
            agent,
            stubContent,
            'ENTITY_SCHEMA_STUB',
            'ATTRIBUTE_SCHEMA_STUB',
            'RELATIONSHIP_SCHEMA_STUB',
            realCmsClient,
            mockLogger
        );

        await generator.handle('test input', mockChatContext);

        // Verification: Check if onConfirmSchemaSummary was called
        expect(mockChatContext.onConfirmSchemaSummary).toHaveBeenCalledWith(
            expect.objectContaining({
                entities: expect.arrayContaining([
                    expect.objectContaining({
                        name: 'post',
                        schemaId: 'sid-123'
                    })
                ])
            })
        );
    });
});
