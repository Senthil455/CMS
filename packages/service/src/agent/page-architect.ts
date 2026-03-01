
import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type Agent, type AgentPlanResponse } from './chat-assistant';
import { AGENT_NAMES } from '@cms/shared';
import { PageOperator } from '../operators/page-operator';
import { type PageArchitecture, type PagePlan } from '@cms/shared';
import { PAGE_ADDON_REGISTRY } from './page-addons/index';

export interface ArchitectDesignerAgentPlan extends PageArchitecture {
    userInput: string;
    schemaId: string;
}

export class PageArchitect implements Agent<ArchitectDesignerAgentPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly architectSystemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly pageOperator: PageOperator
    ) { }

    async think(userInput: string, context: AgentContext): Promise<AgentPlanResponse<ArchitectDesignerAgentPlan>> {
        // Extract schemaId
        const schemaId = context.schemaId;
        if (!schemaId) {
            throw new Error("Architecture Designer requires a valid schema ID in context.");
        }

        const existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingSchema || !existingSchema.settings?.page?.metadata) {
            throw new Error("Schema not found or missing metadata for architecture planning.");
        }


        const metadata = existingSchema.settings.page.metadata;
        const routingPlan = metadata.plan;
        const actualUserInput = metadata.userInput || userInput;

        if (!routingPlan) {
            throw new Error("Routing plan not found in page metadata.");
        }

        await context.saveAgentMessage(`Planning architecture for ${routingPlan.pageType} page...`);

        // Pass pageType from metadata if available to guide architect
        const existingArchitecture = metadata.architecture || {};

        const queries = await this.cmsClient.getAllQueries(context.externalCookie);
        const templateStyle = metadata.templateId || '';

        const { plan, prompts } = await this.generateArchitecturePlan(actualUserInput, context, queries, routingPlan, templateStyle, existingArchitecture);

        return {
            plan: {
                ...plan,
                userInput: actualUserInput,
                schemaId
            },
            prompts
        };
    }

    async act(plan: ArchitectDesignerAgentPlan, context: AgentContext): Promise<boolean> {
        await this.pageOperator.saveArchitecture(plan.schemaId, plan, context.externalCookie);

        // Also save componentInstructions into metadata at the top level
        if (plan.componentInstructions && plan.componentInstructions.length > 0) {
            await this.pageOperator.saveComponentInstructions(plan.schemaId, plan.componentInstructions, context.externalCookie);
        }

        await context.saveAgentMessage(`I've planned the structure and components for your page.`);
        return false;
    }

    private async generateArchitecturePlan(userInput: string, context: AgentContext, availableQueries: any[], pagePlan: PagePlan, templateStyle: string, existingArchitecture?: Partial<PageArchitecture>): Promise<AgentPlanResponse<PageArchitecture>> {
        const queryListContext = availableQueries.map((q: any) =>
            `- ${q.name}: ${q.settings?.query?.source}
             arguments: ${JSON.stringify(q.settings?.query?.arguments)}
            `).join('\n');

        const addonsListContext = PAGE_ADDON_REGISTRY.map(addon =>
            `- ${addon.id}: ${addon.label} (${addon.pageTypes.join(', ')} pages) - ${addon.chatMessage}`
        ).join('\n');

        let developerMessage = `
${templateStyle ? `DESIGN TEMPLATE: ${templateStyle}\n` : ''}
ROUTING PLAN:
- Planned Path: ${pagePlan.pageName}
- Parameters: ${pagePlan.primaryParameter || 'None'}
- Linking Rules: ${pagePlan.linkingRules?.join(', ') || 'None'}

AVAILABLE ADD-ONS:
${addonsListContext}

AVAILABLE QUERIES:
${queryListContext}
`;

        if (existingArchitecture) {
            developerMessage += `\nEXISTING STRUCTURE:\n${JSON.stringify(existingArchitecture, null, 2)}\nPreserve the existing structure unless changes are requested.`;
        }

        developerMessage += '\n\nIDENTIFY THE PAGE TYPE AND PLAN THE STRUCTURE. Use the parameters from routing plan to select appropriate queries.';

        await context.saveAgentMessage(`Designing page architecture...`);

        const response = await this.aiProvider.generate(
            this.architectSystemPrompt,
            developerMessage,
            userInput,
            context?.selection.model,
            context.signal ? { signal: context.signal } : undefined
        );

        // Expecting JSON response as specified in prompt
        try {
            if (typeof response === 'string') {
                return {
                    plan: JSON.parse(response),
                    prompts: {
                        systemPrompt: this.architectSystemPrompt,
                        developerMessage,
                        userInput: userInput
                    }
                };
            }
            return {
                plan: response as ArchitectDesignerAgentPlan,
                prompts: {
                    systemPrompt: this.architectSystemPrompt,
                    developerMessage,
                    userInput: userInput
                }
            };
        } catch (e) {
            this.logger.error({ error: e, response }, 'Failed to parse PageArchitect response');
            // Fallback plan
            return {
                plan: {
                    pageTitle: 'Fallback Page',
                    sections: [
                        { preset: '12', columns: [{ span: 12, id: 'main-content' }] }
                    ],
                    selectedQueries: [
                        { queryName: 'fallback_query', fieldName: 'data', type: 'list', description: 'Default query', args: {} }
                    ],
                    architectureHints: 'Generate a basic layout'
                },
                prompts: {
                    systemPrompt: this.architectSystemPrompt,
                    developerMessage,
                    userInput
                }
            };
        }
    }
}
