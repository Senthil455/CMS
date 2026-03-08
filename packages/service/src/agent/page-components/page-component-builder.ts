import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type ThinkResult, type Agent, type ActResult, type FinalizeResult } from '../chat-assistant';
import { type ComponentInstruction, type PageComponentDefinition, type PageMetadata } from '@cms/shared';
import { PageOperator } from '../../operators/page-operator';
import { UserVisibleError } from '../user-visible-error';
import type { PageComponent } from '@cms/shared';


export class PageComponentBuilder implements Agent<PageComponent> {
    constructor(
        private readonly addonDef: PageComponentDefinition,
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly snippet: string | undefined,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly pageOperator: PageOperator,
        private readonly baseUrl: string,
        private readonly getStylePrompt?: (styleName: string, pageType: string) => Promise<string>,
    ) { }

    async think(userInput: string, context: AgentContext, componentInstruction?: ComponentInstruction): Promise<ThinkResult<PageComponent>> {
        this.logger.info(`PageComponentBuilder[${this.addonDef.id}] think started`);

        const existingPageSchema = context.schemaId && await this.cmsClient.getSchemaBySchemaId(context.externalCookie, context.schemaId);
        if (!existingPageSchema || !existingPageSchema.settings?.page?.metadata) {
            throw new UserVisibleError(`Page schema not found or missing metadata for ID: ${context.schemaId}`);
        }

        const pageDto = existingPageSchema.settings.page;
        const metadata = pageDto.metadata;
        const originalInput = metadata.userInput || userInput;
        const componentId = context.metadata?.componentId as string;
        const instruction = metadata.architecture?.componentInstructions?.find(x => x.id == componentId)

        const templateStyle = metadata.templateId || '';
        const stylePrompt = this.getStylePrompt ? await this.getStylePrompt(templateStyle, metadata.plan!.pageType) : '';
        const developerMessage = {
            ...metadata.plan,
            componentInstruction,
            stylePrompt,
            querys: this.filterQuery(metadata, instruction!),
            existingHtml: metadata.components?.find(x => x.id == componentId)?.html,
            snippet: this.snippet?.replace(/{{entityName}}/g, metadata.plan?.entityName ?? "")
        };

        await context.saveAgentMessage(`I am building component: ${instruction!.id} (${this.addonDef.label})`);
        const finalDeveloperMessage = JSON.stringify(developerMessage);

        const aiResponse = await this.aiProvider.generate(
            this.systemPrompt,
            finalDeveloperMessage,
            componentId ? userInput : originalInput,
            context.signal ? { signal: context.signal } : undefined
        ) as { html: string };

        return {
            plan: {
                id: componentId,
                html: aiResponse.html,
                componentTypeId: this.addonDef.id,
            },
            prompts: {
                systemPrompt: this.systemPrompt,
                developerMessage: finalDeveloperMessage,
                userInput: componentId ? userInput : originalInput
            }
        };
    }

    async act(plan: PageComponent, context: AgentContext): Promise<ActResult<PageComponent>> {
        const newSchemaId = await this.pageOperator.saveComponents(context.schemaId!, plan, context.externalCookie);
        return { feedback: null, syncedSchemaIds: [newSchemaId] };
    }

    async finalize(_feedbackData: any, _context: AgentContext): Promise<FinalizeResult> {
        return { syncedSchemaIds: [] };
    }

    private async filterQuery(metadata: PageMetadata, componentInstruction: ComponentInstruction) {
        return metadata.architecture?.selectedQueries || []
            .filter((sq: any) => componentInstruction.queriesToUse.includes(sq.queryName))
            .map((sq: any) => ({
                queryName: sq.queryName,
                fieldName: sq.fieldName,
                type: sq.type,
                args: sq.args,
            }));
    }
}

