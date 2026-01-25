import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { AgentContext } from '../agents/chat-agent';
import type { Planner } from './planner.interface';

export interface PageTypePlan {
    pageType: 'list' | 'detail';
    schemaId?: string | null;
    entityName?: string | null;
}

export class PageTypePlanner implements Planner<PageTypePlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
    ) { }

    async plan(userInput: string, context: AgentContext, entityNames: string[] = []): Promise<PageTypePlan> {

        const entitiesList = entityNames.length > 0 ? entityNames.join(", ") : "None";

        const response = await this.aiProvider.generate(
            this.systemPrompt,
            `Existing Entities: [${entitiesList}]\n\nDetermine the page type and relevant entity based on user input.`,
            userInput
        );

        try {
            if (typeof response === 'string') {
                return JSON.parse(response);
            }
            return response as PageTypePlan;
        } catch (e) {
            // Default to list if unsure
            return { pageType: 'list', schemaId: null };
        }
    }
}
