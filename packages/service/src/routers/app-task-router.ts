import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const appTaskRouter: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Registering app task router...');
    console.log('APP TASK ROUTER LOADING...', ENDPOINTS.APP_TASKS.LATEST);
    fastify.get(ENDPOINTS.APP_TASKS.LATEST, {
        preHandler: [fastify.authenticate]
    }, async (request) => {
        const { limit } = request.query as { limit?: string };
        const tasks = await fastify.agentTaskRepository.findLatest(limit ? parseInt(limit, 10) : 20);
        return { success: true, data: tasks };
    });

    fastify.patch(ENDPOINTS.APP_TASKS.TOGGLE_ITEM, {
        preHandler: [fastify.authenticate]
    }, async (request) => {
        const { taskId, index } = request.params as { taskId: string, index: string };
        fastify.log.info({ taskId, index }, 'PATCH toggle item request received');
        await fastify.taskOperator.toggleItemStatus(parseInt(taskId, 10), parseInt(index, 10));
        return { success: true };
    });
};

export default appTaskRouter;
