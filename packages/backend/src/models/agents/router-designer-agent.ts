
import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, type AgentResponse, handleAgentError } from './chat-agent';
import { AGENT_NAMES, type SaveSchemaPayload, type TemplateSelectionResponse } from '@cms/shared';
import { RouterDesigner, type RoutingPlan } from '../planners/router-designer';

export interface RouterDesignerAgentPlan extends RoutingPlan {
    pageName: string;
    userInput: string;
    schemaId?: string;
}

export class RouterDesignerAgent implements Agent<RouterDesignerAgentPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly routerDesigner: RouterDesigner,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger
    ) { }

    async think(userInput: string, context: AgentContext): Promise<RouterDesignerAgentPlan> {
        let existingRoutingPlan: any = undefined;
        let schemaId = '';
        let pageType = 'list'; // Default

        // 1. Check if input is JSON (TemplateSelectionResponse) or string
        let originalInput = userInput;

        try {
            // Try parsing if it looks like JSON or if it comes from template selection
            if (userInput.trim().startsWith('{')) {
                const selectionResponse = JSON.parse(userInput) as TemplateSelectionResponse;
                if (selectionResponse.requestPayload) {
                    originalInput = selectionResponse.requestPayload.userInput;
                    // SchemaId is not directly in payload anymore, but might be in input string in legacy cases
                    // or we rely on the parser below.

                    // Read pageType directly
                    if (selectionResponse.requestPayload.pageType) {
                        pageType = selectionResponse.requestPayload.pageType;
                    }
                }
            }
        } catch (e) {
            // Not JSON, normal input
        }

        // 2. Or check for #schemaId
        if (!schemaId) {
            const idMatch = originalInput.match(new RegExp(`${AGENT_NAMES.ROUTER_DESIGNER}#([^:]+):`));
            if (idMatch && idMatch[1]) {
                schemaId = idMatch[1];
                try {
                    const existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
                    if (existingSchema && existingSchema.settings?.page?.metadata) {
                        const metadata = JSON.parse(existingSchema.settings.page.metadata);
                        existingRoutingPlan = metadata.routingPlan;
                        if (metadata.architecturePlan?.pageType) {
                            pageType = metadata.architecturePlan.pageType;
                        }
                    }
                } catch (e) {
                    this.logger.warn({ schemaId }, 'Failed to fetch existing schema for routing');
                }
            }
        }

        const routingPlan = await this.routerDesigner.plan(originalInput, context, existingRoutingPlan);

        return {
            ...routingPlan,
            userInput: originalInput,
            schemaId,
            // We'll attach pageType to the saved metadata, so pass it along loosely or relying on it being in plan?
            // RoutingPlan doesn't have pageType. We need to preserve it.
            // Let's hack it into routingPlan or just save it. 
            // Better: Return it in plan.
            // But interface RoutingPlan is fixed.
            // We will just handle it in Act.
        } as RouterDesignerAgentPlan & { pageType: string };
    }

    async act(plan: RouterDesignerAgentPlan & { pageType?: string }, context: AgentContext): Promise<void> {
        // Create or Update Schema
        let name = plan.pageName || `generated-page-${Date.now()}`;
        const pageType = plan.pageType || 'list';

        // Retrieve existing if we have schemaId to preserve other metadata?
        // Ideally we do non-destructive updates. 
        // But here we are "Designing", so we might overwrite routingPlan.

        const payload: SaveSchemaPayload = {
            schemaId: plan.schemaId || null,
            type: 'page',
            settings: {
                page: {
                    name: name,
                    title: name, // Temporary title
                    html: '', // Empty for now, or preserve? 
                    // Wait, if editing, we shouldn't wipe HTML.
                    // We need to fetch existing if schemaId exists.
                    source: 'ai',
                    metadata: JSON.stringify({
                        routingPlan: plan,
                        // Preserve architecture plan's pageType if possible or set it
                        architecturePlan: { pageType }
                    }),
                }
            }
        };

        if (plan.schemaId) {
            const existing = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, plan.schemaId);
            if (existing && existing.settings?.page) {
                payload.settings.page.html = existing.settings.page.html;
                payload.settings.page.title = existing.settings.page.title;
                if (existing.settings.page.metadata) {
                    const meta = JSON.parse(existing.settings.page.metadata);
                    payload.settings.page.metadata = JSON.stringify({
                        ...meta,
                        routingPlan: plan,
                        architecturePlan: {
                            ...meta.architecturePlan,
                            pageType // Ensure pageType is set/updated
                        }
                    });
                }
            }
        }

        const saveResp = await this.cmsClient.saveSchema(context.externalCookie, payload);
        const newSchemaId = saveResp.data.schemaId;

        // Update plan with new schema ID so handle() can access it
        // We need to cast or ensure plan is mutable/has this property. 
        // Since we defined the interface, let's just assign it and assume handle uses it.
        // But wait, plan is RouterDesignerAgentPlan. It has schemaId optional.
        plan.schemaId = newSchemaId;

        await context.onSchemasSync({
            task_type: AGENT_NAMES.ROUTER_DESIGNER,
            schemasId: [newSchemaId]
        });

        await context.saveAssistantMessage(`I've designed the routing for your page.`);
    }

    async handle(userInput: string, context: AgentContext): Promise<AgentResponse | null> {
        try {
            const plan = await this.think(userInput, context);
            await context.saveAiResponseLog(AGENT_NAMES.ROUTER_DESIGNER, JSON.stringify({ ...plan, taskType: context.taskType }));
            await this.act(plan, context);

            // Chain to Architect
            return {
                nextAgent: AGENT_NAMES.ARCHITECT_DESIGNER,
                nextUserInput: `@${AGENT_NAMES.ARCHITECT_DESIGNER} #${plan.schemaId}: Plan architecture for ${plan.userInput}`
            };

        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "designing your route", this.aiProvider);
            return null;
        }
    }
}
