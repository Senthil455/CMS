import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { User } from '@cms/shared';

import { type SchemaDto, type SaveSchemaPayload, type XEntityDto, type AssetListResponse, ENDPOINTS, CmsApiClient } from '@cms/shared';

export class CmsClient {
    private populatingPromise: Promise<void> | null = null;
    constructor(private readonly baseUrl: string) { }

    async getClient(externalCookie: string): Promise<CmsApiClient> {
        // Filter to only include ASP.NET Identity cookie for Auth Headers
        const authCookie = externalCookie.split(';')
            .map(c => c.trim())
            .find(c => c.startsWith('.AspNetCore.Identity.Application='));

        // Note: For some endpoints we might need the full externalCookie (if it contains other needed cookies?), 
        // but getMe specifically checked for AspNetCore.Identity.
        // The original code used `authCookie` for getMe, but `externalCookie` for others.
        // Let's use `externalCookie` generally, but ensure we have headers.

        // Actually, original getMe threw if no authCookie.
        // Other methods just passed externalCookie. 
        // We should probably preserve the 'throw if missing' for getMe if it's critical, 
        // but createClient acts as a factory.

        const headers: Record<string, string> = {};
        if (externalCookie) {
            headers['Cookie'] = externalCookie;
        }

        return new CmsApiClient(axios.create({
            baseURL: this.baseUrl,
            headers
        }));

        // TODO: Handle the specific authCookie check for getMe if strictly needed.
        // Original code: if (!authCookie) throw Error... inside getMe.
        // We can move that check to getMe wrapper or just let upstream 401.
    }

    async getMe(externalCookie: string) {
        const authCookie = externalCookie.split(';')
            .map(c => c.trim())
            .find(c => c.startsWith('.AspNetCore.Identity.Application='));

        if (!authCookie) {
            throw new Error('No ASP.NET Identity cookie found');
        }

        const client = new CmsApiClient(axios.create({
            baseURL: this.baseUrl,
            headers: { Cookie: authCookie }
        }));
        return client.getMe();
    }

    async login(payload: any): Promise<{ cookie: string, user: User }> {
        // We need special handling because we want the Set-Cookie header
        const resp = await axios.post(`${this.baseUrl}${ENDPOINTS.AUTH.LOGIN}`, payload);
        const setCookie = resp.headers['set-cookie'];
        const externalUser = resp.data;
        return {
            cookie: setCookie ? setCookie.join('; ') : '',
            user: {
                id: externalUser.id,
                username: externalUser.name || externalUser.email,
                avatarUrl: this.baseUrl + externalUser.avatarUrl,
                email: externalUser.email,
                roles: externalUser.roles,
                allowedMenus: externalUser.allowedMenus
            } as User
        };
    }

    async getAllEntities(externalCookie: string): Promise<SchemaDto[]> {
        return (await this.getClient(externalCookie)).getAllEntities();
    }

    async getAllQueries(externalCookie: string): Promise<SchemaDto[]> {
        return (await this.getClient(externalCookie)).getAllQueries();
    }

    async getSchemaByName(externalCookie: string, name: string, type: string): Promise<SchemaDto> {
        return (await this.getClient(externalCookie)).getSchemaByName(name, type);
    }

    async getSchemaById(externalCookie: string, id: string): Promise<SchemaDto> {
        return (await this.getClient(externalCookie)).getSchemaById(id);
    }

    async getSchemaBySchemaId(externalCookie: string, id: string): Promise<SchemaDto> {
        return (await this.getClient(externalCookie)).getSchemaBySchemaId(id);
    }

    async getXEntity(externalCookie: string, entityName: string): Promise<XEntityDto> {
        return (await this.getClient(externalCookie)).getXEntity(entityName);
    }

    async getAllXEntity(externalCookie: string): Promise<XEntityDto[]> {
        return (await this.getClient(externalCookie)).getAllXEntity();
    }

    async requestQuery(externalCookie: string, queryName: string) {
        return (await this.getClient(externalCookie)).requestQuery(queryName);
    }

    async saveEntityDefine(externalCookie: string, payload: SaveSchemaPayload) {
        try {
            return (await this.getClient(externalCookie)).saveEntityDefine(payload);
        } catch (error: any) {
            if (error.response?.data) throw error.response.data;
            throw error;
        }
    }

    async saveSchema(externalCookie: string, payload: SaveSchemaPayload) {
        try {
            return (await this.getClient(externalCookie)).saveSchema(payload);
        } catch (error: any) {
            if (error.response?.data) throw error.response.data;
            throw error;
        }
    }

    async generateSDL(externalCookie: string): Promise<string> {
        // This has complex logic with graphql import, maybe keep as is or move to share?
        // Shared client doesn't have graphql dep. Keep logic here but use client for call?
        // The original code imports 'graphql' dynamically.
        // The call is axios.post(graphql).
        // I'll keep it as is or wrap axios call.

        const { getIntrospectionQuery, buildClientSchema, printSchema } = await import('graphql');
        const query = getIntrospectionQuery();

        // Use raw axios or client? Client doesn't have graphql method yet.
        // Let's us raw axios for now as it's specialized.
        const resp = await axios.post(`${this.baseUrl}${ENDPOINTS.GRAPHQL}`, { query }, {
            headers: { Cookie: externalCookie }
        });

        const introspectionResponse = resp.data.data;
        const schema = buildClientSchema(introspectionResponse);
        return printSchema(schema);
    }

    async saveQuery(externalCookie: string, schemaId: string, queryName: string, query: string) {
        // Uses saveSchema internally.
        // Map payload constructs here.
        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'query',
            settings: {
                query: {
                    name: queryName,
                    entityName: '',
                    source: query,
                    filters: [],
                    sorts: [],
                    variables: [],
                    distinct: false,
                    ideUrl: '',
                    pagination: { offset: '0', limit: '10' }
                }
            }
        };
        const saveResp = await this.saveSchema(externalCookie, payload);
        return saveResp.schemaId; // Verify return type of saveSchema
    }

    async insertSingleData(externalCookie: string, entity: XEntityDto, data: any) {
        // Data cleaning logic
        delete data[entity.primaryKey];
        delete data['createdAt'];
        delete data['updatedAt'];
        delete data['createdBy'];

        try {
            return (await this.getClient(externalCookie)).insertSingleData(entity.name, data);
        } catch (error: any) {
            if (error.response?.data) throw error.response.data;
            throw error;
        }
    }

    async insertData(externalCookie: string, entity: XEntityDto, data: any, idMaps: Record<string, Record<string, any>> = {}) {
        await this.populateExamplePics(externalCookie);
        // ... Logic for lookup/junction recursion ...
        // This relies on this.insertSingleData, which now uses client.
        // The recursion logic itself is fine to stay here.

        for (const attr of entity.attributes) {
            const field = attr.field;
            if (attr.lookup && data[field]) {
                const target = attr.lookup;
                const item = data[field];
                const originalId = item[target.primaryKey];

                if (!idMaps[field]) idMaps[field] = {};

                if (originalId && idMaps[field][originalId]) {
                    data[field][attr.lookup!.primaryKey] = idMaps[field][originalId];
                } else {
                    const resp = await this.insertSingleData(externalCookie, attr.lookup!, item);
                    const newId = resp[target.primaryKey]; // resp.data? insertSingleData returns resp.data from client
                    if (originalId) idMaps[field][originalId] = newId;
                    item[target.primaryKey] = newId;
                }
            } else if (attr.junction && Array.isArray(data[field])) {
                const target = attr.junction
                if (!idMaps[field]) idMaps[field] = {};
                for (const item of data[field]) {
                    const originalId = item[target.primaryKey];
                    if (originalId && idMaps[field][originalId]) {
                        item[target.primaryKey] = idMaps[field][originalId];
                    } else {
                        const resp = await this.insertSingleData(externalCookie, target, item);
                        const newId = resp[target.primaryKey];
                        if (originalId) idMaps[field][originalId] = newId;
                        item[target.primaryKey] = newId;
                    }
                }
            } else if (attr.displayType == 'image') {
                const assets = await this.getAllAsset(externalCookie);
                if (assets.items.length > 0) {
                    const randomAsset = assets.items[Math.floor(Math.random() * assets.items.length)];
                    if (randomAsset) {
                        data[field] = randomAsset.path;
                    }
                }
            }
        }
        await this.insertSingleData(externalCookie, entity, data);
    }

    async populateExamplePics(externalCookie: string) {
        // Keep as is.
        if (this.populatingPromise) {
            return this.populatingPromise;
        }

        this.populatingPromise = (async () => {
            try {
                const assetsResp = await this.getAllAsset(externalCookie);

                if (assetsResp.totalRecords !== 0) {
                    return;
                }

                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const examplePicsPath = path.resolve(__dirname, '../../resources/assets', 'example_pics');
                if (!fs.existsSync(examplePicsPath)) {
                    return;
                }

                const categories = fs.readdirSync(examplePicsPath);
                for (const category of categories) {
                    const categoryPath = path.join(examplePicsPath, category);
                    if (!fs.statSync(categoryPath).isDirectory()) continue;

                    const files = fs.readdirSync(categoryPath);
                    for (const file of files) {
                        const filePath = path.join(categoryPath, file);
                        if (!fs.statSync(filePath).isFile()) continue;

                        const formData = new FormData();
                        const fileBuffer = fs.readFileSync(filePath);
                        const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
                        formData.append('Files', blob, file);

                        await axios.post(`${this.baseUrl}/api/assets`, formData, {
                            headers: {
                                Cookie: externalCookie,
                            },
                            timeout: 30000,
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to populate example pics:', error);
            } finally {
                this.populatingPromise = null;
            }
        })();

        return this.populatingPromise;
    }

    async getAllAsset(externalCookie: string): Promise<AssetListResponse> {
        return (await this.getClient(externalCookie)).getAllAsset();
    }

}

