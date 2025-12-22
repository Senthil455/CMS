import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS, type LoginRequest } from '@cms/shared';

const authRouter: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: LoginRequest }>(ENDPOINTS.AUTH.LOGIN, async (request, reply) => {
        const { usernameOrEmail, password } = request.body;
        fastify.log.info(`Login request for ${usernameOrEmail}`);
        const result = await fastify.authService.validateUser(usernameOrEmail, password);

        if (!result) {
            return reply.status(401).send({ success: false, error: 'Invalid credentials' });
        }

        const { user, cookie } = result;
        fastify.log.info({ user, cookie }, 'User validated successfully');
        // Save to session
        request.session.externalCookie = cookie;
        request.session.userId = user.id.toString();

        return { success: true, data: user };
    });

    fastify.post(ENDPOINTS.AUTH.LOGOUT, async (request, reply) => {
        const externalCookie = request.session.externalCookie;
        if (externalCookie) {
            await fastify.authService.logout(externalCookie);
        }
        request.session.destroy();
        return { success: true };
    });

    fastify.get(ENDPOINTS.AUTH.ME, async (request, reply) => {
        const externalCookie = request.session.externalCookie;

        if (!externalCookie) {
            return reply.status(401).send({ success: false, error: 'Not authenticated' });
        }

        const user = await fastify.authService.getUserProfile(externalCookie);

        if (!user) {
            request.session.destroy();
            return reply.status(401).send({ success: false, error: 'Invalid session' });
        }

        return { success: true, data: user };
    });
};

export default authRouter;
