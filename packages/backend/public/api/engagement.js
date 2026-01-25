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
    }
};
