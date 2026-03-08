
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
    AGENT_NAMES,
} from '@cms/shared';
import { PAGE_COMPONENT_REGISTRY } from './page-components/index';
import { UserVisibleError } from './user-visible-error';
import type { LayoutSection, SchemaDto } from '@cms/shared';

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
                if (instruction.componentTypeId) {
                    const addon = PAGE_COMPONENT_REGISTRY.find(a => a.id === instruction.componentTypeId);
                    if (addon) {
                        followingTaskItems.push({
                            agentName: addon.agentName as AgentName,
                            status: 'pending',
                            description: instruction.instruction,
                            schemaId: plan.schemaId,
                            metadata: { componentId: instruction.id }
                        });
                        continue;
                    }
                }
                followingTaskItems.push({
                    agentName: AGENT_NAMES.COMPONENT_BUILDER as AgentName,
                    status: 'pending',
                    description: instruction.instruction,
                    schemaId: plan.schemaId,
                    metadata: { componentId: instruction.id }
                });
            }
        }

        // Return early with the components, LayoutBuilder is removed.

        return { feedback: null, syncedSchemaIds: [], followingTaskItems };
    }

    async finalize(_feedbackData: any, _context: AgentContext): Promise<FinalizeResult> {
        return { syncedSchemaIds: [] };
    }

    private async generateArchitecturePlan(userInput: string, context: AgentContext, availableQueries: SchemaDto[], pagePlan: PagePlan, templateStyle: string, existingArchitecture?: Partial<PageArchitecture>): Promise<ThinkResult<PageArchitecture>> {

        const message = {
            existingArchitecture,
            queries: availableQueries.map(x => ({ name: x.name, source: x.settings.query?.source, arguments: x.settings.query?.variables })),
            addones: PAGE_COMPONENT_REGISTRY.filter(x => x.id != "common_component").map(x => ({ id: x.id, label: x.label, desc: x.chatMessage })),
            ...pagePlan

        }

        const developerMessage = JSON.stringify(message);

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
