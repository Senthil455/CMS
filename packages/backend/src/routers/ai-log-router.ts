import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const aiLogRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get(ENDPOINTS.AI.LOGS, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { chatService } = fastify as any;
        const logs = await chatService.getAiResponseLogs();
        return { success: true, data: logs };
    });
    fastify.post(ENDPOINTS.AI.ACT_ON_LOG, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { continuePipeline } = request.body as { continuePipeline?: boolean };
        const { chatService, socketService } = fastify as any;
        const user = request.user as { id: string };

        await chatService.actOnLog(parseInt(id), user.id, request.headers.cookie || '', (event: string, payload: any) => {
            socketService.emitToUser(user.id, event, payload);
        }, continuePipeline);

        return { success: true };
    });
    fastify.delete(ENDPOINTS.AI.DELETE_LOG, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { chatService } = fastify as any;
        await chatService.deleteAiResponseLog(parseInt(id));
        return { success: true };
    });
};

export default aiLogRouter;
