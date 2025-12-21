import { Server } from 'socket.io';
import { ChatService } from '../services/chat-service';
import type { ServerToClientEvents, ClientToServerEvents } from '@cms/shared';

declare module 'fastify' {
    interface FastifyInstance {
        io: Server<ClientToServerEvents, ServerToClientEvents>;
        chatService: ChatService;
    }
}

