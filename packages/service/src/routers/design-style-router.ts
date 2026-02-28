import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { SqliteDesignStyleRepository } from '../repositories/design-style-repository';

const designStyleRouter: FastifyPluginAsync = async (fastify) => {
    const prisma = fastify.prisma;
    const repository = new SqliteDesignStyleRepository(prisma);

    // GET /cmsapi/design-styles
    fastify.get('/cmsapi/design-styles', {
        preHandler: [fastify.authenticate]
    }, async () => {
        const styles = await repository.getAllDesignStyles();
        return { success: true, data: styles };
    });

    // POST /cmsapi/design-styles
    const createSchema = z.object({
        name: z.string().min(1),
        displayName: z.string().min(1),
        description: z.string().optional().default(''),
        listPrompt: z.string().optional().default(''),
        detailPrompt: z.string().optional().default(''),
    });

    fastify.post('/cmsapi/design-styles', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const body = createSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ error: 'Invalid request body', details: body.error.flatten() });
        }
        try {
            const style = await repository.createDesignStyle(body.data);
            return { success: true, data: style };
        } catch (e: any) {
            if (e.code === 'P2002') {
                return reply.status(409).send({ error: `Style name "${body.data.name}" already exists` });
            }
            throw e;
        }
    });

    // PUT /cmsapi/design-styles/:id
    const updateSchema = z.object({
        name: z.string().min(1).optional(),
        displayName: z.string().min(1).optional(),
        description: z.string().optional(),
        listPrompt: z.string().optional(),
        detailPrompt: z.string().optional(),
    });

    fastify.put('/cmsapi/design-styles/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = updateSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ error: 'Invalid request body', details: body.error.flatten() });
        }
        try {
            // Strip undefined values to satisfy Prisma's exactOptionalPropertyTypes
            const updateData: Record<string, any> = {};
            for (const [key, val] of Object.entries(body.data)) {
                if (val !== undefined) updateData[key] = val;
            }
            const style = await repository.updateDesignStyle(parseInt(id), updateData);
            return { success: true, data: style };
        } catch (e: any) {
            if (e.code === 'P2025') {
                return reply.status(404).send({ error: 'Style not found' });
            }
            throw e;
        }
    });

    // DELETE /cmsapi/design-styles/:id
    fastify.delete('/cmsapi/design-styles/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        try {
            await repository.deleteDesignStyle(parseInt(id));
            return { success: true };
        } catch (e: any) {
            if (e.code === 'P2025') {
                return reply.status(404).send({ error: 'Style not found' });
            }
            throw e;
        }
    });
};

export default designStyleRouter;
