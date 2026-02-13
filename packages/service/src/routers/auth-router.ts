import type { FastifyPluginAsync } from 'fastify';

const authRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get('/api/me', async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ success: false });
        }
        return request.user;
    });

    fastify.post('/api/login', async (request, reply) => {
        const payload = request.body;
        try {
            const { cookie, user } = await fastify.authService.login(payload);

            // If we got a cookie from CMS, we should ideally set it in the browser
            // so that subsequent requests include it.
            if (cookie) {
                const cookies = cookie.split('; ');
                reply.header('Set-Cookie', cookies);
            }


            return user;
        } catch (error: any) {
            fastify.log.error(error, 'Login failed');
            return reply.status(401).send({ success: false, error: 'Login failed' });
        }
    });

    fastify.post('/api/logout', async (request, reply) => {
        // Implementation for logout if needed
        return { success: true };
    });
};

export default authRouter;
