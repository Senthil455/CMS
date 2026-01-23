import { AuthService } from '../services/auth-service';
import { ChatService } from '../services/chat-service';
import { IntentClassifier } from '../models/handlers/intent-classifier';
import { AIProvider } from '../infrastructures/agent.interface';
import { CmsClient } from '../infrastructures/cms-client';
import type { ServerToClientEvents, ClientToServerEvents, User } from '@cms/shared';
import type { SessionStore } from '@fastify/session';
import '@fastify/session';

declare module 'fastify' {
    interface FastifyInstance {
        io: Server<ClientToServerEvents, ServerToClientEvents>;
        chatService: ChatService;
        authService: AuthService;
        intentClassifier: Record<string, IntentClassifier>;
        aiProvider: Record<string, AIProvider>;
        cms: CmsClient;
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

