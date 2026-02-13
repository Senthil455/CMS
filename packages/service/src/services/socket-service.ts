import { Server } from 'socket.io';

export class SocketService {
    constructor(private readonly io: Server) { }

    emitToUser(userId: string, event: string, payload: any): void {
        const sockets = this.io.sockets.sockets;
        for (const [id, socket] of sockets) {
            const user = (socket.data as any).user;
            if (user && user.id === userId) {
                socket.emit(event, payload);
            }
        }
    }
}
