import type { ChatMessage } from '@cms/shared';
import type { IChatRepository } from '../infrastructures/chat-repository.interface';
import type { ServiceLogger } from '../types/logger';
import type { CmsClient } from '../infrastructures/cms-client';
import { type EntityDto, type AttributeDto } from '../models/cms/dtos';
import type { AgentMessage } from '../infrastructures/agent.interface';
import { OrchestratorResolver } from '../models/orchestrators/orchestrator-resolver';

export class ChatService {
    constructor(
        private readonly repository: IChatRepository,
        private readonly cmsClient: CmsClient,
        private readonly orchestratorResolver: OrchestratorResolver,
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

    async handleUserMessage(userId: string, content: string, externalCookie: string,
        onNewMessage: (msg: ChatMessage) => void): Promise<void> {
        // 1. Save and notify user message
        const userMessage = await this.saveUserMessage(userId, content);
        onNewMessage(userMessage);

        // 2. Command Resolver
        const orchestrator = await this.orchestratorResolver.resolve(content);
        if (orchestrator) {
            this.logger.info('Executing resolved orchestrator');

            const context = {
                userId,
                externalCookie,
                saveAssistantMessage: async (content: string) => {
                    const message = await this.saveAssistantMessage(userId, content);
                    onNewMessage(message); // Emit the full ChatMessage to socket
                    return message;
                },
            };

            await orchestrator.handle(content, '', context);
            return;
        }

        // Fallback or default behavior if no command resolved
        const aiMessage = await this.saveAssistantMessage(userId, "I'm not sure how to help with that. Could you try rephrasing? (Tip: I can help you list, add, edit, or delete entities, or create new ones!)");
        onNewMessage(aiMessage);
    }
}
