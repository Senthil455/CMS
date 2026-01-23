import type { AIProvider } from '../../infrastructures/agent.interface';
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
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly styleMap: Record<string, string>,
        private readonly engagementBarPrompt?: string,
    ) { }

    async generate(
        userInput: string,
        routingPlan: RoutingPlan,
        architecturePlan: PageArchitecturePlan,
        queryDetails: string[],
        existingPageSchema: SchemaDto | null,
        templateStyle: string = 'modern',
        enableEngagementBar: boolean = false
    ): Promise<HtmlGenerationResponse> {

        const pageType = architecturePlan.pageType === 'detail' ? 'detail' : 'list';
        const styleKey = `${templateStyle}-${pageType}`;
        const stylePrompt = this.styleMap[styleKey] || this.styleMap[`modern-${pageType}`] || this.styleMap[templateStyle] || 'DESIGN STYLE INSTRUCTION: Modern Editorial';

        let developerMessage = `
${stylePrompt}
`;

        if (enableEngagementBar && this.engagementBarPrompt) {
            developerMessage += `\n\n${this.engagementBarPrompt}\n`;
        }

        developerMessage += `
ROUTING PLAN:
- Path: ${routingPlan.pageName}
- Parameters: ${routingPlan.primaryParameter || 'None'}
- Linking Rules: ${routingPlan.linkingRules.join('\n  ')}

ARCHITECTURAL PLAN:
- Page Type: ${architecturePlan.pageType}
- Layout: ${architecturePlan.layout.structure}
- Selected Queries & Argument Sources: 
${architecturePlan.selectedQueries.map(sq => `  * ${sq.queryName} (Field: ${sq.fieldName}, Type: ${sq.type}): ${JSON.stringify(sq.args)} (fromPath=Source from primary route param; fromQuery=Source from same-named URL query param)`).join('\n')}
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

        const response = await this.aiProvider.generate(
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
