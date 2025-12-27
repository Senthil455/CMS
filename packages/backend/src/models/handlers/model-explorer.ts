import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatHandler, type ChatContext } from './chat-handler';

export class ModelExplorer implements ChatHandler {
    constructor(
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async handle(userInput: string, context: ChatContext): Promise<void> {
        try {
            await context.saveAssistantMessage('Let me fetch the current entities from CMS...');

            const entities = await this.cmsClient.getAllEntities(context.externalCookie);

            if (!entities || entities.length === 0) {
                await context.saveAssistantMessage('No entities found in the system. Would you like me to help you design some?');
                return;
            }

            let responseContent = `Here are the entities currently defined in your system:\n\n`;
            entities.forEach((schema, index) => {
                const entity = schema.settings?.entity;
                if (entity) {
                    responseContent += `### ${index + 1}. ${entity.displayName || entity.name}\n`;
                    responseContent += `**Table Name:** \`${entity.tableName}\`\n\n`;

                    if (entity.attributes && entity.attributes.length > 0) {
                        responseContent += `| Attribute | Header | Data Type | Display Type |\n`;
                        responseContent += `| :--- | :--- | :--- | :--- |\n`;

                        entity.attributes.forEach((attr: any) => {
                            responseContent += `| ${attr.field} | ${attr.header} | ${attr.dataType} | ${attr.displayType} |\n`;
                        });
                    }

                    responseContent += `\n---\n\n`;
                }
            });

            responseContent += `\nTotal: **${entities.length}** entities. How can I help you with these?`;

            await context.saveAssistantMessage(responseContent);
        } catch (error) {
            this.logger.error({ error }, 'Error in ModelExplorer handle');
            await context.saveAssistantMessage("I'm sorry, I encountered an error while fetching entities.");
        }
    }
}
