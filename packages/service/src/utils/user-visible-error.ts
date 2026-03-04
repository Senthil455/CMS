export class UserVisibleError extends Error {
    constructor(message: string, public override readonly cause?: any) {
        super(message);
        this.name = 'UserVisibleError';
    }
}
