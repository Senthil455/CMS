import type { AIAgent } from '../../infrastructures/agent.interface';
import type { ChatContext } from './chat-handler';
import { type SchemaDto } from '@cms/shared';
import { type RoutingPlan } from './router-designer';
import { type PageArchitecturePlan } from './page-architect';

export interface HtmlGenerationResponse {
    name: string;
    title: string;
    html: string;
}



export class HtmlGenerator {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
    ) { }

    async generate(
        userInput: string,
        routingPlan: RoutingPlan,
        architecturePlan: PageArchitecturePlan,
        queryDetails: string[],
        existingPageSchema: SchemaDto | null
    ): Promise<HtmlGenerationResponse> {
        let developerMessage = `
ROUTING PLAN:
- Path: ${routingPlan.pageName}
- Parameters: ${routingPlan.primaryParameter || 'None'}
- Linking Rules: ${routingPlan.linkingRules.join('\n  ')}

ARCHITECTURAL PLAN:
- Page Type: ${architecturePlan.pageType}
- Layout: ${architecturePlan.layout.structure}
- Selected Queries & Argument Sources: 
${architecturePlan.selectedQueries.map(sq => `  * ${sq.queryName}: ${JSON.stringify(sq.args)} (fromPath=Source from primary route param; fromQuery=Source from same-named URL query param)`).join('\n')}
- Hints: ${architecturePlan.architectureHints}

DATA ENDPOINTS:
${queryDetails.join('\n')}
`;

        if (existingPageSchema && existingPageSchema.settings.page) {
            const p = existingPageSchema.settings.page;
            developerMessage += `\n\nEXISTING PAGE CONTENT:\n${JSON.stringify({
                name: p.name,
                title: p.title,
                html: p.html
            }, null, 2)}`;
        }

        const response = await this.aiAgent.generate(
            this.systemPrompt,
            developerMessage,
            userInput
        );

        if (typeof response === 'string') {
            return JSON.parse(response);
        }
        return response as HtmlGenerationResponse;
    }
}
