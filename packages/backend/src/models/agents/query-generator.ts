import type { AIProvider } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, handleAgentError } from './chat-agent';
import { type QueryResponse, type SchemaDto, type SaveSchemaPayload, AGENT_TRIGGERS } from '@cms/shared';

export interface QueryGeneratorPlan extends QueryResponse {
    schemaId?: string;
    existingPageSchema: SchemaDto | null;
}

export class QueryGenerator implements Agent<QueryGeneratorPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async think(userInput: string, context: AgentContext): Promise<QueryGeneratorPlan> {
        let existingPageSchema: SchemaDto | null = null;
        let schemaId = '';

        // 1. Identification: Check if user input contains #schemaId:
        const idMatch = userInput.match(new RegExp(`${AGENT_TRIGGERS.QUERY_GENERATOR}#([^:]+):`));
        if (idMatch) {
            try {
                existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, idMatch[1] as string);
                schemaId = idMatch[1] as string;
                if (existingPageSchema && existingPageSchema.type === 'query') {
                    const qName = existingPageSchema.name;
                    await context.saveAssistantMessage(`I found the existing query "${qName}". I will fetch the latest schema and help you modify it...`);
                }
            } catch (e) {
                this.logger.warn({ schemaId }, 'Existing query not found for modification');
                await context.saveAssistantMessage(`I couldn't find the existing query with ID "${schemaId}". I will generate a new query for you...`);
            }
        }

        const schemas = await this.cmsClient.getAllEntities(context.externalCookie);
        const schemaContext = schemas.map(s => `Entity: ${s.name}\nAttributes: ${JSON.stringify(s.settings?.entity?.attributes || [])}`).join('\n\n');

        let developerMessage = `Note: You are generating a CMS Query Schema (JSON).
Existing schemas:
${schemaContext}
`;
        if (existingPageSchema && existingPageSchema.type === 'query') {
            developerMessage += `\n\nExisting Query to Modify:\n${JSON.stringify(existingPageSchema.settings.query, null, 2)}`;
        }

        const response: QueryResponse = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            userInput
        );

        return {
            ...response,
            schemaId,
            existingPageSchema
        };
    }

    async act(plan: QueryGeneratorPlan, context: AgentContext): Promise<void> {

        if (!plan.queries || Object.keys(plan.queries).length === 0) {
            await context.saveAssistantMessage("I couldn't generate a valid query configuration. Please try again with more details.");
            return;
        }

        const schemaIds: string[] = [];

        for (const [name, source] of Object.entries(plan.queries)) {
            await context.saveAssistantMessage(`Executing generated query "${name}":\n${source}`);

            let targetSchemaId = '';
            // If we are editing, check if name matches
            if (plan.existingPageSchema && (plan.existingPageSchema.name === name || plan.existingPageSchema.settings?.query?.name === name)) {
                targetSchemaId = plan.schemaId || '';
            }

            // We need to saveQuery which internally does saveSchema.
            // But CmsClient.saveQuery helper simplifies this.
            try {
                const newSchemaId = await this.cmsClient.saveQuery(context.externalCookie, targetSchemaId, name, source);
                schemaIds.push(newSchemaId);
                await context.saveAssistantMessage(`Query "${name}" executed successfully.`);
            } catch (e: any) {
                this.logger.error({ error: e }, 'Failed to save query');
                await context.saveAssistantMessage(`Failed to save query "${name}".`);
            }
        }

        if (schemaIds.length > 0) {
            await context.onSchemasSync({
                task_type: 'query_generator',
                schemasId: schemaIds
            });
            const finalMessage = plan.existingPageSchema
                ? `I have updated the queries, you can view them in CMS.`
                : `I have generated the queries, you can find them in CMS.`;
            await context.saveAssistantMessage(finalMessage);
        }
    }

    async handle(userInput: string, context: AgentContext): Promise<void> {
        try {
            const plan = await this.think(userInput, context);

            // Save AI response to database log
            await context.saveAiResponseLog('query-generator',
                JSON.stringify({ ...plan, taskType: context.taskType })
            );

            await this.act(plan, context);
        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "generating your query", this.aiProvider);
        }
    }
}
