import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { AgentContext } from '../agents/chat-agent';
import type { Planner } from './planner.interface';
import type { RoutingPlan } from './router-designer';

export interface PageArchitecturePlan {
    pageType: 'list' | 'detail' | 'dashboard' | 'form' | 'custom';
    layout: {
        hasHeader: boolean;
        hasSidebar: boolean;
        hasFooter: boolean;
        structure: string;
    };

    selectedQueries: Array<{
        queryName: string;
        fieldName: string;
        type: 'single' | 'list';
        description: string;
        args: Record<string, 'fromPath' | 'fromQuery'>;
    }>;
    components: Array<{
        name: string;
        type: string;
        queriesUsed: string[];
    }>;
    architectureHints: string;
}

export class PageArchitect implements Planner<PageArchitecturePlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
    ) { }

    async plan(userInput: string, context: AgentContext, availableQueries: any[], routingPlan: RoutingPlan, existingArchitecture?: Partial<PageArchitecturePlan>): Promise<PageArchitecturePlan> {
        const queryListContext = availableQueries.map(q =>
            `- ${q.name}: ${q.settings?.query?.source}
             arguments: ${JSON.stringify(q.settings?.query?.arguments)}
            `).join('\n');

        let developerMessage = `
ROUTING PLAN:
- Planned Path: ${routingPlan.pageName}
- Parameters: ${routingPlan.primaryParameter || 'None'}
- Linking Rules: ${routingPlan.linkingRules.join(', ')}

AVAILABLE QUERIES:
${queryListContext}
`;

        if (existingArchitecture) {
            developerMessage += `\nEXISTING STRUCTURE:\n${JSON.stringify(existingArchitecture, null, 2)}\nPreserve the existing structure unless changes are requested.`;
        }

        developerMessage += '\n\nIDENTIFY THE PAGE TYPE AND PLAN THE STRUCTURE. Use the parameters from routing plan to select appropriate queries.';

        const response = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            userInput
        );

        // Expecting JSON response as specified in prompt
        try {
            if (typeof response === 'string') {
                return JSON.parse(response);
            }
            return response as PageArchitecturePlan;
        } catch (e) {
            console.error('Failed to parse PageArchitect response:', response);
            // Fallback plan
            return {
                pageType: 'custom',
                layout: { hasHeader: true, hasSidebar: false, hasFooter: false, structure: 'Simple container' },
                selectedQueries: [
                    { queryName: 'fallback_query', fieldName: 'data', type: 'list', description: 'Default query', args: {} }
                ],
                components: [],
                architectureHints: 'Generate a basic layout'
            };
        }
    }
}
