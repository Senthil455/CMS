import type { User } from '@cms/shared';
import type { ServiceLogger } from '../types/logger';
import { CmsClient } from '../infrastructures/cms-client';

export class AuthService {
    constructor(
        private readonly client: CmsClient,
        private readonly logger: ServiceLogger
    ) { }


    async getUserProfile(externalCookie: string): Promise<User | null> {
        try {
            return await this.client.getMe(externalCookie);
        } catch (error: any) {
            const errorSummary = {
                message: error.message,
                status: error.response?.status,
                url: error.config?.url
            };
            this.logger.error(errorSummary, 'External Profile Error');
            return null;
        }
    }

    async login(payload: any): Promise<{ cookie: string, user: User }> {
        return await this.client.login(payload);
    }

}
