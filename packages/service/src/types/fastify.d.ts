import { AuthService } from '../services/auth-service';
import { ChatService } from '../services/chat-service';
import { SocketService } from '../services/socket-service';
import { StatusService } from '../services/status-service';
import { IntentClassifier } from '../models/agents/intent-classifier';
import { AIProvider } from '../infrastructures/ai-provider.interface';
import { CmsClient } from '../infrastructures/cms-client';
import type { ServerToClientEvents, ClientToServerEvents, User } from '@cms/shared';
import type { SessionStore } from '@fastify/session';
import { PrismaClient } from '@prisma/client';
import '@fastify/session';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        io: Server<ClientToServerEvents, ServerToClientEvents>;
        chatService: ChatService;
        authService: AuthService;
        socketService: SocketService;
        statusService: StatusService;
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

