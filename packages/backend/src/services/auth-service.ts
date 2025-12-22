import type { User } from '@cms/shared';
import type { ServiceLogger } from '../types/logger';
import { CmsClient } from '../infrastructures/cms-client';

export interface AuthResult {
    user: User;
    cookie: string;
}

export class AuthService {
    constructor(
        private readonly client: CmsClient,
        private readonly logger: ServiceLogger
    ) { }

    async validateUser(usernameOrEmail: string, password?: string): Promise<AuthResult | null> {
        try {
            // 1. Login to external service
            const loginResp = await this.client.login(usernameOrEmail, password);

            const cookies = loginResp.headers['set-cookie'];
            this.logger.info({ usernameOrEmail, cookies }, 'Attempting to validate user');
            if (!cookies || cookies.length === 0) {
                this.logger.warn({ usernameOrEmail }, 'Login failed: No cookies received from external service');
                return null;
            }

            const externalCookie = cookies[0];
            if (!externalCookie) return null;

            // 2. Fetch user profile with the received cookie
            const user = await this.getUserProfile(externalCookie);
            if (!user) {
                this.logger.warn({ usernameOrEmail }, 'Login failed: Could not fetch user profile');
                return null;
            }

            return { user, cookie: externalCookie };
        } catch (error) {
            this.logger.error({ error, usernameOrEmail }, 'External Auth Error');
            return null;
        }
    }

    async getUserProfile(externalCookie: string): Promise<User | null> {
        try {
            return await this.client.getMe(externalCookie);
        } catch (error) {
            this.logger.error({ error }, 'External Profile Error');
            return null;
        }
    }

    async logout(externalCookie: string): Promise<void> {
        try {
            await this.client.logout(externalCookie);
            this.logger.info('External logout successful');
        } catch (error) {
            this.logger.error({ error }, 'External Logout Error');
        }
    }
}
