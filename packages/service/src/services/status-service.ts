import { SOCKET_EVENTS, type OnServerToClientEvent } from '@cms/shared';

export class StatusService {
    private userStatuses: Record<string, { agentName: string, createdAt: number } | null> = {};

    public setStatus(userId: string, agentName: string, onEvent: OnServerToClientEvent): void {
        const status = { agentName, createdAt: Date.now() };
        this.userStatuses[userId] = status;
        onEvent(SOCKET_EVENTS.CHAT.AGENT_STATUS, status);
    }

    public getStatus(userId: string): { agentName: string, createdAt: number } | null {
        return this.userStatuses[userId] || null;
    }

    public clearStatus(userId: string, onEvent: OnServerToClientEvent): void {
        this.userStatuses[userId] = null;
        onEvent(SOCKET_EVENTS.CHAT.AGENT_STATUS, { agentName: null });
    }
}

export const statusService = new StatusService();
