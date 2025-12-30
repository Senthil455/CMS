import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const schemaRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get(ENDPOINTS.SCHEMA.ALL, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const schemas = await fastify.cms.getAllSchemas(request.session.externalCookie!);

            // Group by type for convenience
            const entities = schemas.filter(s => s.type === 'entity');
            const queries = schemas.filter(s => s.type === 'query');
            const pages = schemas.filter(s => s.type === 'page');

            return {
                success: true,
                data: {
                    entities,
                    queries,
                    pages
                }
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch schemas' });
        }
    });

    fastify.post(ENDPOINTS.SCHEMA.SAVE, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const payload = request.body as any;
            const result = await fastify.cms.saveEntity(request.session.externalCookie!, payload);
            return { success: true, data: result.data };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: error || 'Failed to save schema' });
        }
    });
};

export default schemaRoutes;
