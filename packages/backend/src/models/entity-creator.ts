import type { IAgent } from '../infrastructures/agent.interface';
import { type ChatAgent, type ChatContext } from './chat-agent';
import { normalizeEntity, sortEntitiesByDependency, type SchemaEntity } from './schema';

export class EntityCreator implements ChatAgent {
    constructor(
        private readonly agent: IAgent,
        private readonly systemPrompt: string,
        private readonly entitySchema: string,
        private readonly attributeSchema: string
    ) { }

    async create(userInput: string): Promise<any[]> {
        const schemasText = [
            { name: 'entity', content: this.entitySchema },
            { name: 'attribute', content: this.attributeSchema }
        ].map(s => `${s.name.toUpperCase()} SCHEMA:\n${s.content}`).join('\n\n');

        const response = await this.agent.generate(
            this.systemPrompt,
            schemasText,
            userInput
        );

        return (response?.entities || []) as any[];
    }

    async handle(userInput: string, _entityName: string, context: ChatContext): Promise<void> {
        try {
            await context.saveAssistantMessage('I am analyzing your requirements...');

            const entities = await this.create(userInput);

            // normalize attributes using model behavior
            const normalizedEntities = entities.map((entity: any) => normalizeEntity(entity));

            let responseContent = `I have analyzed your requirements. Based on our online course system schema, I've generated the following entities:\n\n`;
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
            const sortedEntities = sortEntitiesByDependency(normalizedEntities as SchemaEntity[]);
            for (const entity of sortedEntities) {
                try {
                    await context.cmsClient.saveEntity(context.externalCookie, {
                        type: 'entity',
                        settings: {
                            entity: entity as SchemaEntity
                        }
                    });
                    context.logger.info({ entityName: entity.name }, 'Successfully saved entity to CMS');
                } catch (saveError) {
                    context.logger.error({ error: saveError, entityName: entity.name }, 'Failed to save entity to CMS');
                }
            }

            responseContent += `\nI have saved these definitions for you. How else can I help?`;

            await context.saveAssistantMessage(responseContent);
        } catch (error) {
            context.logger.error({ error }, 'Error in EntityCreator handle');
            await context.saveAssistantMessage("I'm sorry, I encountered an error while generating your entities.");
        }
    }
}
