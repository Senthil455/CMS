import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from './endpoints.js';
import type { User } from './contracts.js';
import type { SchemaDto, SaveSchemaPayload, XEntityDto, AssetListResponse } from './dtos.js';

export class CmsApiClient {
    constructor(private readonly axios: AxiosInstance) { }

    async getMe(): Promise<User> {
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
        } as User;
    }

    async login(payload: any): Promise<User> {
        const resp = await this.axios.post(ENDPOINTS.AUTH.LOGIN, payload);
        const externalUser = resp.data;
        const baseURL = this.axios.defaults.baseURL || '';

        return {
            id: externalUser.id,
            username: externalUser.name || externalUser.email,
            avatarUrl: externalUser.avatarUrl ? (externalUser.avatarUrl.startsWith('http') ? externalUser.avatarUrl : baseURL + externalUser.avatarUrl) : null,
            ...externalUser
        } as User;
    }

    async register(payload: import('./contracts.js').RegisterReq): Promise<User> {
        const resp = await this.axios.post(ENDPOINTS.AUTH.REGISTER, payload);
        return resp.data as User;
    }

    async changePassword(payload: import('./contracts.js').ChangePasswordReq): Promise<void> {
        await this.axios.post(ENDPOINTS.AUTH.PROFILE_PASSWORD, payload);
    }

    async uploadAvatar(file: any): Promise<void> {
        const formData = new FormData();
        formData.append("file", file);
        await this.axios.post(ENDPOINTS.AUTH.PROFILE_AVATAR, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    }

    async logout(): Promise<void> {
        await this.axios.get(ENDPOINTS.AUTH.LOGOUT);
    }

    async getSystemStatus(): Promise<import('./contracts.js').SystemStatusResponse> {
        const resp = await this.axios.get(ENDPOINTS.SYSTEM.IS_READY);
        return resp.data;
    }

    async getAllEntities(): Promise<SchemaDto[]> {
        const resp = await this.axios.get(`${ENDPOINTS.SCHEMA.ALL}entity`);
        return resp.data;
    }

    async getAllQueries(): Promise<SchemaDto[]> {
        const resp = await this.axios.get(`${ENDPOINTS.SCHEMA.ALL}query`);
        return resp.data;
    }

    async getSchemaByName(name: string, type: string): Promise<SchemaDto> {
        const url = ENDPOINTS.SCHEMA.GET_BY_NAME.replace(':name', name) + `?type=${type}`;
        const resp = await this.axios.get(url);
        return resp.data;
    }

    async getSchemaById(id: string): Promise<SchemaDto> {
        const url = ENDPOINTS.SCHEMA.GET_BY_ID.replace(':id', id);
        const resp = await this.axios.get(url);
        return resp.data;
    }

    async getSchemaBySchemaId(id: string): Promise<SchemaDto> {
        const url = ENDPOINTS.SCHEMA.GET_BY_SCHEMA_ID.replace(':id', id);
        const resp = await this.axios.get(url);
        return resp.data;
    }

    async getXEntity(entityName: string): Promise<XEntityDto> {
        const url = ENDPOINTS.SCHEMA.GET_ENTITY.replace(':entityName', entityName);
        const resp = await this.axios.get(url);
        return resp.data;
    }

    async getAllXEntity(): Promise<XEntityDto[]> {
        const entities = await this.getAllEntities();
        // Parallel requests
        const promises = entities.map(e => this.getXEntity(e.name));
        return Promise.all(promises);
    }

    async requestQuery(queryName: string, limit = 5): Promise<any> {
        const url = ENDPOINTS.QUERY.GET_DATA.replace(':id', queryName);
        const resp = await this.axios.get(`${url}?limit=${limit}`);
        return resp.data;
    }

    async saveEntityDefine(payload: SaveSchemaPayload): Promise<any> {
        const resp = await this.axios.post(ENDPOINTS.SCHEMA.DEFINE, payload);
        return resp.data;
    }

    async saveSchema(payload: SaveSchemaPayload): Promise<any> {
        const resp = await this.axios.post(ENDPOINTS.SCHEMA.SAVE, payload);
        return resp.data;
    }

    async insertSingleData(entityName: string, data: any): Promise<any> {
        // Data cleaning should probably happen before calling this, or here?
        // service removes primaryKey, createdAt, etc.
        // Shared client should probably trust the caller or have a separate helper.
        // Implementing raw call here.
        const url = `/api/entities/${entityName}/insert`;
        const resp = await this.axios.post(url, data);
        return resp.data;
    }

    async getAllAsset(): Promise<AssetListResponse> {
        const resp = await this.axios.get(ENDPOINTS.ASSETS.BASE);
        return resp.data;
    }

    // Additional methods can be added as needed
}
