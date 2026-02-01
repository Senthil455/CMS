export class StatusService {
    private userStatuses: Record<string, string[]> = {};

    public updateStatus(userId: string, status: string): void {
        if (!this.userStatuses[userId]) {
            this.userStatuses[userId] = [];
        }

        const history = this.userStatuses[userId];

        // Only push if it's different from the last status to avoid noise
        if (history.length === 0 || history[history.length - 1] !== status) {
            history.push(status);
        }

        // Keep only top 3
        if (history.length > 3) {
            this.userStatuses[userId] = history.slice(-3);
        }
    }

    public getStatuses(userId: string): string[] {
        return this.userStatuses[userId] || [];
    }

    public clearStatus(userId: string): void {
        delete this.userStatuses[userId];
    }
}

export const statusService = new StatusService();
