
import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type Agent, type ThinkResult, type ActResult, type FinalizeResult } from './chat-assistant';
import { PageOperator } from '../operators/page-operator';
import { type AgentTaskItem } from '../models/agent-task-model';
import {
    type PageArchitecture,
    type AgentName,
    AGENT_NAMES,
} from '@cms/shared';
import { PAGE_COMPONENT_REGISTRY } from './page-components/index';
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
        const existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, context.schemaId!);
        if (!existingSchema || !existingSchema.settings?.page?.metadata) {
            throw new UserVisibleError("Schema not found or missing metadata for architecture planning.");
        }

        const metadata = existingSchema.settings.page.metadata;
        const actualUserInput = metadata.userInput || userInput;
        const existingArchitecture = metadata.architecture || {};

        const queries = await this.cmsClient.getAllQueries(context.externalCookie);

        const message = {
            "EXISTING STRUCTURE": existingArchitecture,
            "AVAILABLE QUERIES": queries.map(x => ({ name: x.name, source: x.settings.query?.source, arguments: x.settings.query?.variables })),
            "AVAILABLE Components": PAGE_COMPONENT_REGISTRY.filter(x => x.pageTypes.includes(metadata.plan!.pageType!))
                .map(x => ({ id: x.id, label: x.label, desc: x.chatMessage })),
            ...metadata.plan!
        }

        const plan = await this.aiProvider.generate(
            this.architectSystemPrompt,
            JSON.stringify(message),
            userInput,
            context.signal ? { signal: context.signal } : undefined
        )

        return {
            plan: {
                ...plan,
                userInput: actualUserInput,
                schemaId: context.schemaId!
            },
            prompts: {
                systemPrompt: this.architectSystemPrompt,
                developerMessage: JSON.stringify(message),
                userInput
            }
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
                if (instruction.needsBuild === false) {
                    this.logger.info({ componentId: instruction.id }, 'Skipping build task for unchanged component');
                    continue;
                }

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

        return { feedback: null, syncedSchemaIds: [], followingTaskItems };
    }

    async finalize(_feedbackData: any, _context: AgentContext): Promise<FinalizeResult> {
        return { syncedSchemaIds: [] };
    }

}
