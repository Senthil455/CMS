import { AuthService } from '../services/auth-service';
import { OrchestratorService } from '../services/orchestrator-service';
import { SocketService } from '../services/socket-service';
import { StatusService } from '../services/status-service';
import { IntentClassifier } from '../models/agents/intent-classifier';
import { AIProvider } from '../infrastructures/ai-provider.interface';
import { CmsClient } from '../infrastructures/cms-client';
import type { ServerToClientEvents, ClientToServerEvents, User } from '@cms/shared';
import type { SessionStore } from '@fastify/session';
import { PrismaClient } from '@prisma/client';
import { IChatMessageRepository } from '../repositories/chat-message-repository';
import { IAiResponseLogRepository } from '../repositories/ai-response-log-repository';
import { IDesignStyleRepository } from '../repositories/design-style-repository';
import { ISystemSettingRepository } from '../repositories/system-setting-repository';
import { IAgentTaskRepository } from '../repositories/agent-task-repository';
import { TaskOperator } from '../operators/task-operator';
import '@fastify/session';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        io: Server<ClientToServerEvents, ServerToClientEvents>;
        orchestratorService: OrchestratorService;
        taskOperator: TaskOperator;
        authService: AuthService;
        socketService: SocketService;
        statusService: StatusService;
        intentClassifier: Record<string, IntentClassifier>;
        aiProvider: Record<string, AIProvider>;
        cms: CmsClient;
        sessionStore: SessionStore;
        chatMessageRepository: IChatMessageRepository;
        aiResponseLogRepository: IAiResponseLogRepository;
        designStyleRepository: IDesignStyleRepository;
        systemSettingRepository: ISystemSettingRepository;
        agentTaskRepository: IAgentTaskRepository;
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

