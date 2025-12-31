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
        } catch (error) {
            this.logger.error({ error }, 'External Profile Error');
            return null;
        }
    }
}
