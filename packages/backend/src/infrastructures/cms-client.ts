import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { User } from '@cms/shared';

import { type SchemaDto, type SaveSchemaPayload, type XEntityDto, type AssetListResponse, ENDPOINTS } from '@cms/shared';

export class CmsClient {
    constructor(private readonly baseUrl: string) { }

    async getMe(externalCookie: string) {
        const resp = await axios.get(`${this.baseUrl}${ENDPOINTS.AUTH.ME}`, {
            headers: {
                Cookie: externalCookie
            }
        });


        const externalUser = resp.data;
        return {
            id: externalUser.id,
            username: externalUser.name || externalUser.email,
            avatarUrl: this.baseUrl + externalUser.avatarUrl,
        } as User;
    }

    async getAllEntities(externalCookie: string): Promise<SchemaDto[]> {
        const resp = await axios.get(`${this.baseUrl}${ENDPOINTS.SCHEMA.ALL}entity`, {
            headers: {
                Cookie: externalCookie
            }
        });
        return resp.data;
    }

    async getAllQueries(externalCookie: string): Promise<SchemaDto[]> {
        const resp = await axios.get(`${this.baseUrl}${ENDPOINTS.SCHEMA.ALL}query`, {
            headers: {
                Cookie: externalCookie
            }
        });
        return resp.data;
    }

    async getXEntity(externalCookie: string, entityName: string): Promise<XEntityDto> {
        const url = `/api/schemas/entity/${entityName}`;
        const resp = await axios.get(`${this.baseUrl}${url}`, {
            headers: {
                Cookie: externalCookie
            }
        });
        return resp.data;
    }

    async getAllXEntity(externalCookie: string): Promise<XEntityDto[]> {
        const entities = await this.getAllEntities(externalCookie);
        const promises = entities.map(e => this.getXEntity(externalCookie, e.name));
        return Promise.all(promises);
    }

    async requestQuery(externalCookie: string, queryName: string) {
        const url = ENDPOINTS.QUERY.GET_DATA.replace(':id', queryName);
        const resp = await axios.get(`${this.baseUrl}${url}?limit=5`, {
            headers: {
                Cookie: externalCookie
            }
        });
        return resp.data;
    }

    async saveEntityDefine(externalCookie: string, payload: SaveSchemaPayload) {
        try {
            return await axios.post(`${this.baseUrl}${ENDPOINTS.SCHEMA.DEFINE}`, payload, {
                headers: {
                    Cookie: externalCookie
                }
            });
        } catch (error: any) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw error;
        }
    }

    async saveSchema(externalCookie: string, payload: SaveSchemaPayload) {
        try {
            return await axios.post(`${this.baseUrl}${ENDPOINTS.SCHEMA.SAVE}`, payload, {
                headers: {
                    Cookie: externalCookie
                }
            });
        } catch (error: any) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw error;
        }
    }

    async generateSDL(externalCookie: string): Promise<string> {
        const { getIntrospectionQuery, buildClientSchema, printSchema } = await import('graphql');

        const resp = await axios.post(`${this.baseUrl}${ENDPOINTS.GRAPHQL}`, {
            query: getIntrospectionQuery()
        }, {
            headers: {
                Cookie: externalCookie
            }
        });

        const introspectionResponse = resp.data.data;
        const schema = buildClientSchema(introspectionResponse);
        const sdl = printSchema(schema);
        return sdl;
    }

    async saveQuery(externalCookie: string, queryName: string, query: string, variables?: any) {
        const payload: SaveSchemaPayload = {
            schemaId: '',
            type: 'query',
            settings: {
                query: {
                    name: queryName,
                    entityName: '',
                    source: query,
                    filters: [],
                    sorts: [],
                    reqVariables: [],
                    distinct: false,
                    ideUrl: '',
                    pagination: { offset: '0', limit: '10' }
                }
            }
        };

        const saveResp = await this.saveSchema(externalCookie, payload);
        const schemaId = saveResp.data.schemaId;

        return schemaId;
    }

    async insertSingleData(externalCookie: string, entity: XEntityDto, data: any) {
        delete data[entity.primaryKey];
        delete data['createdAt'];
        delete data['updatedAt'];
        delete data['createdBy'];

        const url = `/api/entities/${entity.name}/insert`;
        try {
            return await axios.post(`${this.baseUrl}${url}`, data, {
                headers: {
                    Cookie: externalCookie
                }
            });
        } catch (error: any) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw error;
        }
    }

    async insertData(externalCookie: string, entity: XEntityDto, data: any, idMaps: Record<string, Record<string, any>> = {}) {
        await this.populateExamplePics(externalCookie);
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
                    const newId = resp.data[target.primaryKey];
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
                        const newId = resp.data[target.primaryKey];
                        if (originalId) idMaps[field][originalId] = newId;
                        item[target.primaryKey] = newId;
                    }
                }
            } else if (attr.displayType == 'image') {

            }
        }
        await this.insertSingleData(externalCookie, entity, data);
    }

    async populateExamplePics(externalCookie: string) {
        try {
            const assetsResp = await this.getAllAsset(externalCookie);

            if (assetsResp.totalRecords !== 0) {
                return;
            }

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const examplePicsPath = path.resolve(__dirname, '../../assets', 'example_pics');
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
                    const blob = new Blob([fileBuffer]);
                    formData.append('Files', blob, file);

                    await axios.post(`${this.baseUrl}/api/assets`, formData, {
                        headers: {
                            Cookie: externalCookie,
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to populate example pics:', error);
        }
    }

    async getAllAsset(externalCookie: string): Promise<AssetListResponse> {
        const url = `${ENDPOINTS.ASSETS}`;
        const resp = await axios.get(`${this.baseUrl}${url}`, {
            headers: {
                Cookie: externalCookie
            }
        });
        return resp.data;
    }
}

