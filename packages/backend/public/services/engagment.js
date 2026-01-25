import { engagementApi } from '../api/engagement.js';
import { userService } from './user.js';

export const engagementService = {
    getStats(entityName) {
        const recordId = window.location.pathname.split('/').filter(Boolean).pop();
        return engagementApi.getStats(entityName, recordId)
            .catch(() => {
                console.log('Mock: Engagement API not found');
                return {
                    view: { count: 0, active: false },
                    like: { count: 0, active: false },
                    share: { count: 0, active: false },
                    bookmark: { active: false }
                };
            });
    },
    async toggle(entityName, type, stats) {
        try {
            await userService.ensureLogin();
        } catch (e) {
            console.log('Login failed or cancelled, cannot toggle');
            return;
        }

        const recordId = window.location.pathname.split('/').filter(Boolean).pop();

        const s = stats[type];
        s.active = !s.active;
        if (typeof s.count !== 'undefined') s.count += s.active ? 1 : -1;

        return engagementApi.toggle(entityName, type, recordId, s.active).catch(e => {
            console.error('Failed to toggle engagement', e);
            // Revert state on error? For now just log.
        });
    }

};

