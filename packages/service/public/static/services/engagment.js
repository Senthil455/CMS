import { engagementApi } from '../api/engagement.js';
import { userService } from './user.js';
import { bookmarkDialog } from '../components/bookmark-dialog.js';
import { shareDialog } from '../components/share-dialog.js';

export const engagementService = {
    _getRecordId() {
        const meta = document.querySelector('meta[name="record-id"]');
        return meta?.content || window.location.pathname.split('/').filter(Boolean).pop();
    },
    getStats(entityName) {
        const recordId = this._getRecordId();
        return engagementApi.getStats(entityName, recordId)
            .then(data => {
                // Standardize the shape to match Alpine expectations
                return {
                    view: data.view || { count: 0, active: false },
                    like: data.like || { count: 0, active: false },
                    share: data.share || { count: 0, active: false },
                    bookmark: data.bookmark || { count: 0, active: false }
                };
            })
            .catch(() => {
                console.log('Mock: Engagement API not found');
                return {
                    view: { count: 0, active: false },
                    like: { count: 0, active: false },
                    share: { count: 0, active: false },
                    bookmark: { count: 0, active: false }
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

        const recordId = this._getRecordId();

        if (type === 'bookmark') {
            return this.saveBookmark(entityName, stats);
        }

        const s = stats[type];
        s.active = !s.active;
        if (typeof s.count !== 'undefined') s.count += s.active ? 1 : -1;

        return engagementApi.toggle(entityName, type, recordId, s.active).catch(e => {
            console.error('Failed to toggle engagement', e);
            // Revert state on error? For now just log.
        });
    },

    async saveBookmark(entityName, stats) {
        try {
            await userService.ensureLogin();
            const recordId = this._getRecordId();
            const folders = await engagementApi.fetchBookmarkFolders(entityName, recordId);
            const result = await bookmarkDialog.show(entityName, recordId, folders);

            await engagementApi.saveBookmark(entityName, recordId, result);

            if (stats && stats.bookmark) {
                stats.bookmark.active = true;
            }

            console.log('Bookmarked successfully');
        } catch (e) {
            if (e.message !== 'Cancelled') {
                console.error('Failed to save bookmark', e);
            }
        }
    },

    async share(entityName, stats) {
        try {
            const platform = await shareDialog.show(window.location.href, document.title);
            const recordId = this._getRecordId();

            await engagementApi.markActivity(entityName, recordId, 'share');

            const url = window.location.href;
            const title = document.title || 'Check this out!';

            switch (platform) {
                case 'x':
                    window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
                    break;
                case 'email':
                    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
                    break;
                case 'reddit':
                    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
                    break;
                case 'clipboard':
                    await navigator.clipboard.writeText(url);
                    console.log('Link copied to clipboard');
                    break;
            }

            if (stats && stats.share) {
                stats.share.count++;
                stats.share.active = true;
            }
        } catch (e) {
            if (e.message !== 'Cancelled') {
                console.error('Error sharing:', e);
            }
        }
    },

    async getUnreadCount() {
        try {
            const user = await userService.fetchMe();
            if (!user) return 0;
            return await engagementApi.getUnreadNotifications();
        } catch (e) {
            console.error('Failed to get unread notifications', e);
            return 0;
        }
    },

    async trackVisit() {
        try {
            return await engagementApi.trackVisit();
        } catch (e) {
            console.error('Failed to track visit', e);
        }
    }

};

