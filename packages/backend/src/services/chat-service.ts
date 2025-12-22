import type { ChatMessage } from '@cms/shared';
import type { IChatRepository } from '../models/chat-repository.interface';
import type { IAgent } from '../models/agent.interface';
import type { ServiceLogger } from '../types/logger';

export class ChatService {
    constructor(
        private readonly repository: IChatRepository,
        private readonly agent: IAgent,
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

    async handleUserMessage(userId: string, content: string, onNewMessage: (msg: ChatMessage) => void): Promise<void> {
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

            let responseContent = `I have analyzed your requirements. Based on our online course system schema, I've generated the following entities:\n\n`;
            entities.forEach((entity, index) => {
                responseContent += `${index + 1}. **${entity.name}** (Table: \`${entity.tableName}\`)\n`;
            });

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
