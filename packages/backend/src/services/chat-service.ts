import type { ChatMessage } from '@cms/shared';
import type { IChatRepository } from '../infrastructures/chat-repository.interface';
import type { IAgent } from '../infrastructures/agent.interface';
import type { ServiceLogger } from '../types/logger';
import type { CmsClient } from '../infrastructures/cms-client';
import { type SchemaEntity, type SchemaAttribute, normalizeEntity, sortEntitiesByDependency } from '../models/schema';

export class ChatService {
    constructor(
        private readonly repository: IChatRepository,
        private readonly agent: IAgent,
        private readonly cmsClient: CmsClient,
        private readonly prompt: string,
        private readonly entitySchema: string,
        private readonly attributeSchema: string,
        private readonly logger: ServiceLogger
    ) { }

    async getHistory(userId: string): Promise<ChatMessage[]> {
        return this.repository.findAll(userId);
    }

    async saveUserMessage(userId: string, content: string): Promise<ChatMessage> {
        return this.repository.save({ userId, content, role: 'user' });
    }

    async saveAssistantMessage(userId: string, content: string): Promise<ChatMessage> {
        return this.repository.save({ userId, content, role: 'assistant' });
    }

    async handleUserMessage(userId: string, content: string, externalCookie: string, onNewMessage: (msg: ChatMessage) => void): Promise<void> {
        // 1. Save and notify user message
        const userMessage = await this.saveUserMessage(userId, content);
        onNewMessage(userMessage);

        // 2. AI logic
        try {
            const entities = await this.agent.generate({
                requirements: content,
                prompt: this.prompt,
                schemas: [
                    { name: 'entity', content: this.entitySchema },
                    { name: 'attribute', content: this.attributeSchema }
                ]
            });

            // normalize attributes using model behavior
            const normalizedEntities = entities.map((entity: any) => normalizeEntity(entity));

            let responseContent = `I have analyzed your requirements. Based on our online course system schema, I've generated the following entities:\n\n`;
            normalizedEntities.forEach((entity, index) => {
                responseContent += `${index + 1}. **${entity.name}** (Table: \`${entity.tableName}\`)\n`;
            });

            // 3. Save to CMS
            const sortedEntities = sortEntitiesByDependency(normalizedEntities as SchemaEntity[]);
            for (const entity of sortedEntities) {
                try {
                    await this.cmsClient.saveEntity(externalCookie, {
                        type: 'entity',
                        settings: {
                            entity: entity as SchemaEntity
                        }
                    });
                    this.logger.info({ entityName: entity.name }, 'Successfully saved entity to CMS');
                } catch (saveError) {
                    this.logger.error({ error: saveError, entityName: entity.name }, 'Failed to save entity to CMS');
                }
            }

            responseContent += `\nI have saved these definitions for you. How else can I help?`;

            const aiMessage = await this.saveAssistantMessage(userId, responseContent);
            onNewMessage(aiMessage);
        } catch (error) {
            this.logger.error({ error }, 'Error in AI response generation');
            const errorMessage = await this.saveAssistantMessage(userId, "I'm sorry, I encountered an error while processing your request.");
            onNewMessage(errorMessage);
        }
    }
}
