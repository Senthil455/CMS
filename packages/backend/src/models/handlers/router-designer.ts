import type { AIProvider } from '../../infrastructures/agent.interface';
import type { ChatContext } from './chat-handler';

export interface RoutingPlan {
    pageName: string;
    primaryParameter?: string;
    linkingRules: string[];
    routerHints: string;
}

export class RouterDesigner {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
    ) { }

    async plan(userInput: string, context: ChatContext, existingPlan?: RoutingPlan): Promise<RoutingPlan> {
        let developerMessage = 'DETERMINE THE ROUTING STRUCTURE AND LINKING RULES.';

        if (existingPlan) {
            developerMessage += `\n\nEXISTING ROUTING PLAN:\n${JSON.stringify(existingPlan, null, 2)}\nPreserve the general structure unless changes are requested.`;
        }

        const response = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            userInput
        );

        try {
            if (typeof response === 'string') {
                return JSON.parse(response);
            }
            return response as RoutingPlan;
        } catch (e) {
            console.error('Failed to parse RouterDesigner response:', response);
            return {
                pageName: `generated-page-${Date.now()}`,
                linkingRules: [],
                routerHints: 'Fallback to default naming'
            };
        }
    }
}
