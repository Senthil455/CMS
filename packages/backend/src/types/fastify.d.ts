import { AuthService } from '../services/auth-service';
import type { ServerToClientEvents, ClientToServerEvents, User } from '@cms/shared';
import type { SessionStore } from '@fastify/session';
import '@fastify/session';

declare module 'fastify' {
    interface FastifyInstance {
        io: Server<ClientToServerEvents, ServerToClientEvents>;
        chatService: ChatService;
        authService: AuthService;
        sessionStore: SessionStore;
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }

    interface FastifyRequest {
        user?: User;
    }

    interface Session {
        externalCookie?: string;
        userId?: string;
    }
}

