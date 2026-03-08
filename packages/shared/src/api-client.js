import { ENDPOINTS } from './endpoints.js';
export class CmsApiClient {
    axios;
    constructor(axios) {
        this.axios = axios;
    }
    async getMe() {
        const resp = await this.axios.get(ENDPOINTS.AUTH.ME);
        const externalUser = resp.data;
        // Map fields if necessary, or assume response matches User
        // Note: cms-client.ts manually mapped fields. We should preserve that logic if the DTOs differ.
        // Assuming the upstream returns the raw user object and we need to map it to our User interface.
        // Or if the upstream IS returning our User interface.
        // cms-client.ts logic:
        /*
            id: externalUser.id,
            username: externalUser.name || externalUser.email,
            avatarUrl: this.baseUrl + externalUser.avatarUrl,
        */
        // The baseUrl handling for avatarUrl is tricky in a shared client. 
        // Iterate: The AxiosInstance has a baseURL. But we might need the full URL for the avatar.
        // If usage expects absolute URL, we might need to prepend baseURL.
        // However, axios.defaults.baseURL is accessible?
        const baseURL = this.axios.defaults.baseURL || '';
        return {
            id: externalUser.id,
            username: externalUser.name || externalUser.email,
            avatarUrl: externalUser.avatarUrl ? (externalUser.avatarUrl.startsWith('http') ? externalUser.avatarUrl : baseURL + externalUser.avatarUrl) : null,
            email: externalUser.email,
            roles: externalUser.roles,
            allowedMenus: externalUser.allowedMenus,
            // Add other fields as they come from upstream
            ...externalUser
        };
    }
    async login(payload) {
        const resp = await this.axios.post(ENDPOINTS.AUTH.LOGIN, payload);
        const externalUser = resp.data;
        const baseURL = this.axios.defaults.baseURL || '';
        return {
            id: externalUser.id,
            username: externalUser.name || externalUser.email,
            avatarUrl: externalUser.avatarUrl ? (externalUser.avatarUrl.startsWith('http') ? externalUser.avatarUrl : baseURL + externalUser.avatarUrl) : null,
            ...externalUser
        };
    }
    async register(payload) {
        const resp = await this.axios.post(ENDPOINTS.AUTH.REGISTER, payload);
        return resp.data;
    }
    async changePassword(payload) {
        await this.axios.post(ENDPOINTS.AUTH.PROFILE_PASSWORD, payload);
    }
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append("file", file);
        await this.axios.post(ENDPOINTS.AUTH.PROFILE_AVATAR, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    }
    async logout() {
        await this.axios.get(ENDPOINTS.AUTH.LOGOUT);
    }
    async getSystemStatus() {
        const resp = await this.axios.get(ENDPOINTS.SYSTEM.IS_READY);
        return resp.data;
    }
    async getAllEntities() {
        const resp = await this.axios.get(`${ENDPOINTS.SCHEMA.ALL}entity`);
        return resp.data;
    }
    async getAllQueries() {
        const resp = await this.axios.get(`${ENDPOINTS.SCHEMA.ALL}query`);
        return resp.data;
    }
    async getSchemaByName(name, type) {
        const url = ENDPOINTS.SCHEMA.GET_BY_NAME.replace(':name', name) + `?type=${type}`;
        const resp = await this.axios.get(url);
        return resp.data;
    }
    async getSchemaById(id) {
        const url = ENDPOINTS.SCHEMA.GET_BY_ID.replace(':id', id);
        const resp = await this.axios.get(url);
        return resp.data;
    }
    async getSchemaBySchemaId(id) {
        const url = ENDPOINTS.SCHEMA.GET_BY_SCHEMA_ID.replace(':id', id);
        const resp = await this.axios.get(url);
        return resp.data;
    }
    async getXEntity(entityName) {
        const url = ENDPOINTS.SCHEMA.GET_ENTITY.replace(':entityName', entityName);
        const resp = await this.axios.get(url);
        return resp.data;
    }
    async getAllXEntity() {
        const entities = await this.getAllEntities();
        // Parallel requests
        const promises = entities.map(e => this.getXEntity(e.name));
        return Promise.all(promises);
    }
    async requestQuery(queryName, limit = 5) {
        const url = ENDPOINTS.QUERY.GET_DATA.replace(':id', queryName);
        const resp = await this.axios.get(`${url}?limit=${limit}`);
        return resp.data;
    }
    async saveEntityDefine(payload) {
        const resp = await this.axios.post(ENDPOINTS.SCHEMA.DEFINE, payload);
        return resp.data;
    }
    async saveSchema(payload) {
        const resp = await this.axios.post(ENDPOINTS.SCHEMA.SAVE, payload);
        return resp.data;
    }
    async insertSingleData(entityName, data) {
        // Data cleaning should probably happen before calling this, or here?
        // service removes primaryKey, createdAt, etc.
        // Shared client should probably trust the caller or have a separate helper.
        // Implementing raw call here.
        const url = `/api/entities/${entityName}/insert`;
        const resp = await this.axios.post(url, data);
        return resp.data;
    }
    async getAllAsset() {
        const resp = await this.axios.get(ENDPOINTS.ASSETS.BASE);
        return resp.data;
    }
}
//# sourceMappingURL=api-client.js.map