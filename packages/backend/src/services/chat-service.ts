import type { ChatMessage } from '@cms/shared';
import type { IChatRepository } from '../models/chat-repository.interface';

export class ChatService {
    constructor(private repository: IChatRepository) { }

    async getHistory(): Promise<ChatMessage[]> {
        return this.repository.findAll();
    }

    async saveUserMessage(content: string): Promise<ChatMessage> {
        return this.repository.save({ content, role: 'user' });
    }

    async saveAssistantMessage(content: string): Promise<ChatMessage> {
        return this.repository.save({ content, role: 'assistant' });
    }

    async handleUserMessage(content: string, onNewMessage: (msg: ChatMessage) => void): Promise<void> {
        // 1. Save and notify user message
        const userMessage = await this.saveUserMessage(content);
        onNewMessage(userMessage);

        // 2. Simulate AI logic (this would be where LLM call happens)
        // We do this asynchronously without awaiting so the user gets immediate feedback
        setTimeout(async () => {
            try {
                const aiMessage = await this.saveAssistantMessage(
                    `I have saved your requirement: "${content}". How can I help further?`
                );
                onNewMessage(aiMessage);
            } catch (error) {
                console.error('Error in AI response generation:', error);
            }
        }, 1000);
    }
}
