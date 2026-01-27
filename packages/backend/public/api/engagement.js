export const engagementApi = {
    async getStats(entityName, recordId) {
        const response = await fetch(`/api/engagements/${entityName}/${recordId}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    },

    async toggle(entityName, type, recordId, active) {
        const response = await fetch(`/api/engagements/toggle/${entityName}/${recordId}/?type=${type}&active=${active}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error(`Failed to toggle ${type}`);
        return response.json();
    },

    async saveBookmark(entity, id, payload) {
        const response = await fetch(`/api/bookmarks/${entity}/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to save bookmark');
        return response.json();
    },

    async fetchBookmarkFolders(entity, id) {
        const response = await fetch(`/api/bookmarks/folders/${entity}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch bookmark folders');
        return response.json();
    },

    async markActivity(entityName, recordId, type) {
        const response = await fetch(`/api/engagements/mark/${entityName}/${recordId}?type=${type}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error(`Failed to record ${type} activity`);
        return response.json();
    }
};
