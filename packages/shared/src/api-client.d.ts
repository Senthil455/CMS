import type { AxiosInstance } from 'axios';
import type { User } from './contracts.js';
import type { SchemaDto, SaveSchemaPayload, XEntityDto, AssetListResponse } from './cms.dto.js';
export declare class CmsApiClient {
    private readonly axios;
    constructor(axios: AxiosInstance);
    getMe(): Promise<User>;
    login(payload: any): Promise<User>;
    register(payload: import('./contracts.js').RegisterReq): Promise<User>;
    changePassword(payload: import('./contracts.js').ChangePasswordReq): Promise<void>;
    uploadAvatar(file: any): Promise<void>;
    logout(): Promise<void>;
    getSystemStatus(): Promise<import('./contracts.js').SystemStatusResponse>;
    getAllEntities(): Promise<SchemaDto[]>;
    getAllQueries(): Promise<SchemaDto[]>;
    getSchemaByName(name: string, type: string): Promise<SchemaDto>;
    getSchemaById(id: string): Promise<SchemaDto>;
    getSchemaBySchemaId(id: string): Promise<SchemaDto>;
    getXEntity(entityName: string): Promise<XEntityDto>;
    getAllXEntity(): Promise<XEntityDto[]>;
    requestQuery(queryName: string, limit?: number): Promise<any>;
    saveEntityDefine(payload: SaveSchemaPayload): Promise<any>;
    saveSchema(payload: SaveSchemaPayload): Promise<any>;
    insertSingleData(entityName: string, data: any): Promise<any>;
    getAllAsset(): Promise<AssetListResponse>;
}
//# sourceMappingURL=api-client.d.ts.map