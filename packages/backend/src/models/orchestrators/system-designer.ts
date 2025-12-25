import type { AIAgent } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatOrchestrator, type ChatContext } from './chat-orchestrator';
import { type EntityDto } from '../cms/dtos';
import { EntityModel } from '../cms/entity-model';

export interface SystemDesignerResponse {
    entities: EntityDto[];
    relationships: any[];
}

export class SystemDesigner implements ChatOrchestrator {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly entitySchema: string,
        private readonly attributeSchema: string,
        private readonly relationshipSchema: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async create(userInput: string): Promise<SystemDesignerResponse> {
        const schemasText = [
            { name: 'entity', content: this.entitySchema },
            { name: 'attribute', content: this.attributeSchema },
            { name: 'relationship', content: this.relationshipSchema }
        ].map(s => `${s.name.toUpperCase()} SCHEMA:\n${s.content}`).join('\n\n');

        const response = await this.aiAgent.generate(
            this.systemPrompt,
            schemasText,
            userInput
        );

        return response;
    }

    async handle(userInput: string, _entityName: string, context: ChatContext): Promise<void> {
        try {
            await context.saveAssistantMessage('I am system designer, I am analyzing your requirements...');

            const resp = await this.create(userInput);

            // Save AI response to database log
            await context.saveAiResponseLog('system-designer', JSON.stringify(resp));


            // Normalize: handle cases where AI might return 'fields' instead of 'attributes'
            const entities = (resp.entities || []).map((e: any) => ({
                ...e,
                attributes: e.attributes || e.fields || []
            }));

            // normalize attributes using model behavior
            const normalizedEntities = entities.map((entity: any) => new EntityModel(entity).normalize());

            let responseContent = `I am system designer, I have analyzed your requirements. Based on your requirements, I've generated the following entities:\n\n`;
            normalizedEntities.forEach((entity, index) => {
                responseContent += `### ${index + 1}. ${entity.name}\n`;
                responseContent += `**Table Name:** \`${entity.tableName}\`\n\n`;

                responseContent += `| Attribute | Header | Data Type | Display Type | In List |\n`;
                responseContent += `| :--- | :--- | :--- | :--- | :--- |\n`;

                entity.attributes.forEach((attr: any) => {
                    responseContent += `| ${attr.field} | ${attr.header} | ${attr.dataType} | ${attr.displayType} | ${attr.inList ? '✅' : '❌'} |\n`;
                });

                responseContent += `\n---\n\n`;
            });

            await context.saveAssistantMessage(responseContent);

            // 3. Save to CMS

            // Save normal entities first
            for (const entity of normalizedEntities) {
                try {
                    await this.cmsClient.saveEntity(context.externalCookie, {
                        type: 'entity',
                        settings: {
                            entity
                        }
                    });
                    this.logger.info({ entityName: entity.name }, 'Successfully saved entity to CMS');
                } catch (saveError) {
                    this.logger.error({ error: saveError, entityName: entity.name }, 'Failed to save entity to CMS');
                }
            }

            responseContent += `\nI have saved these definitions for you. How else can I help?`;

            await context.saveAssistantMessage(responseContent);
        } catch (error: any) {
            this.logger.error({ error, stack: error?.stack }, 'Error in SystemDesigner handle');
            await context.saveAssistantMessage("I'm sorry, I encountered an error while generating your entities.");
        }
    }
}
