
import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type Agent, type ThinkResult, type ActResult, type FinalizeResult } from './chat-assistant';
import { PageOperator } from '../operators/page-operator';
import { type AgentTaskItem } from '../models/agent-task-model';
import {
    type PageArchitecture,
    type PagePlan,
    type AgentName,
    AGENT_NAMES
} from '@cms/shared';
import { PAGE_ADDON_REGISTRY } from './page-addons/index';
import { UserVisibleError } from './user-visible-error';

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

    async think(userInput: string, context: AgentContext): Promise<ThinkResult<ArchitectDesignerAgentPlan>> {
        // Extract schemaId
        const schemaId = context.schemaId;
        if (!schemaId) {
            throw new UserVisibleError("Architecture Designer requires a valid schema ID in context.");
        }

        const existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingSchema || !existingSchema.settings?.page?.metadata) {
            throw new UserVisibleError("Schema not found or missing metadata for architecture planning.");
        }


        const metadata = existingSchema.settings.page.metadata;
        const routingPlan = metadata.plan;
        const actualUserInput = metadata.userInput || userInput;

        if (!routingPlan) {
            throw new UserVisibleError("Routing plan not found in page metadata.");
        }

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

    async act(plan: ArchitectDesignerAgentPlan, context: AgentContext): Promise<ActResult<ArchitectDesignerAgentPlan>> {
        await this.pageOperator.saveArchitecture(plan.schemaId, plan, context.externalCookie);

        // Build layoutJson from sections
        const layoutJson: any = {
            sections: plan.sections.map(section => ({
                preset: section.preset,
                columns: section.columns.map(col => ({
                    span: col.span,
                    blocks: [{ id: col.id, type: 'component' }]
                }))
            }))
        };
        await this.pageOperator.saveLayoutJson(plan.schemaId, layoutJson, context.externalCookie);

        // Also save componentInstructions into metadata at the top level
        if (plan.componentInstructions && plan.componentInstructions.length > 0) {
            await this.pageOperator.saveComponentInstructions(plan.schemaId, plan.componentInstructions, context.externalCookie);
        }

        const componentCount = plan.componentInstructions ? plan.componentInstructions.length : 0;
        let message = `I have finished designing the page architecture. I will now create tasks for building each component.\n\n**Components Plan (${componentCount}):**\n`;
        if (componentCount > 0) {
            plan.componentInstructions!.forEach(comp => {
                message += `- **${comp.id}**: ${comp.instruction}\n`;
            });
        }

        await context.saveAgentMessage(message);

        // Generate following tasks for components
        const followingTaskItems: Omit<AgentTaskItem, 'index'>[] = [];

        if (plan.componentInstructions) {
            for (const instruction of plan.componentInstructions) {
                if (instruction.addonId) {
                    const addon = PAGE_ADDON_REGISTRY.find(a => a.id === instruction.addonId);
                    followingTaskItems.push({
                        agentName: (addon?.agentName || AGENT_NAMES.COMPONENT_BUILDER) as AgentName,
                        status: 'pending',
                        description: instruction.instruction,
                        schemaId: plan.schemaId,
                        metadata: { componentId: instruction.id }
                    });
                } else {
                    followingTaskItems.push({
                        agentName: AGENT_NAMES.COMPONENT_BUILDER as AgentName,
                        status: 'pending',
                        description: instruction.instruction,
                        schemaId: plan.schemaId,
                        metadata: { componentId: instruction.id }
                    });
                }
            }
        }

        // Return early with the components, LayoutBuilder is removed.

        return { feedback: null, syncedSchemaIds: [], followingTaskItems };
    }

    async finalize(_feedbackData: any, _context: AgentContext): Promise<FinalizeResult> {
        return { syncedSchemaIds: [] };
    }

    private async generateArchitecturePlan(userInput: string, context: AgentContext, availableQueries: any[], pagePlan: PagePlan, templateStyle: string, existingArchitecture?: Partial<PageArchitecture>): Promise<ThinkResult<PageArchitecture>> {
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

        const response = await this.aiProvider.generate(
            this.architectSystemPrompt,
            developerMessage,
            userInput,
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
            throw new UserVisibleError("I couldn't understand the generated architecture plan. Please try again.");
        }
    }
}
