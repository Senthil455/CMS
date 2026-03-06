import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';

import { type AgentContext, type ThinkResult, type Agent, type ActResult, type FinalizeResult } from './chat-assistant';
import type { ServiceLogger } from '../types/logger';
import { type QueryResponse, type SchemaDto, type SaveSchemaPayload, AGENT_NAMES } from '@cms/shared';

export interface QueryGeneratorPlan extends QueryResponse {
    schemaId?: string;
    existingSchema: SchemaDto | null;
}

export class QueryGenerator implements Agent<QueryGeneratorPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async think(userInput: string, context: AgentContext): Promise<ThinkResult<QueryGeneratorPlan>> {
        let existingSchema: SchemaDto | null = null;
        let schemaId = '';

        // 1. Identification: Check if user input contains #schemaId:
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.QUERY_BUILDER}#([^:]+):`));
        if (idMatch) {
            try {
                existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, idMatch[1] as string);
                schemaId = idMatch[1] as string;
                if (existingSchema && existingSchema.type === 'query') {
                    const qName = existingSchema.name;
                    await context.saveAgentMessage(`I found the existing query "${qName}". I will fetch the latest schema and help you modify it...`);
                }
            } catch (e) {
                await context.saveAgentMessage(`I couldn't find the existing query with ID "${schemaId}". I will generate a new query for you...`);
            }
        }

        const sdl = await this.cmsClient.generateSDL(context.externalCookie);

        let developerMessage = `## GraphQL SDL Schema
${sdl}
`;
        if (existingSchema && existingSchema.type === 'query') {
            developerMessage += `\n\nExisting Query to Modify:\n${JSON.stringify(existingSchema.settings.query, null, 2)}`;
        }


        const response = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            userInput,
            context.signal ? { signal: context.signal } : undefined
        );

        return {
            plan: {
                ...response,
                schemaId,
                existingSchema
            },
            prompts: {
                systemPrompt: this.systemPrompt,
                developerMessage,
                userInput
            }
        };
    }

    async act(plan: QueryGeneratorPlan, context: AgentContext): Promise<ActResult<QueryGeneratorPlan>> {

        if (!plan.queries || Object.keys(plan.queries).length === 0) {
            await context.saveAgentMessage("I couldn't generate a valid query configuration. Please try again with more details.");
            return { feedback: null, syncedSchemaIds: [] };
        }

        const schemaIds: string[] = [];

        for (const [name, source] of Object.entries(plan.queries)) {
            let targetSchemaId = '';
            // If we are editing, check if name matches
            if (plan.existingSchema && (plan.existingSchema.name === name || plan.existingSchema.settings?.query?.name === name)) {
                targetSchemaId = plan.schemaId || '';
            }

            // We need to saveQuery which internally does saveSchema.
            // But CmsClient.saveQuery helper simplifies this.
            const newSchemaId = await this.cmsClient.saveQuery(context.externalCookie, targetSchemaId, name, source);
            schemaIds.push(newSchemaId);
        }

        if (schemaIds.length > 0) {
            const queryNames = Object.keys(plan.queries).join(', ');
            const finalMessage = `All confirmed queries have been committed to the system: ${queryNames}`;
            await context.saveAgentMessage(finalMessage);
        }
        return { feedback: null, syncedSchemaIds: schemaIds };
    }

    async finalize(_feedbackData: any, _context: AgentContext): Promise<FinalizeResult> {
        return { syncedSchemaIds: [] };
    }
}
