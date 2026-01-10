import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import type { User } from '@cms/shared';

import { type SchemaDto, type SaveSchemaPayload, type XEntityDto, ENDPOINTS } from '@cms/shared';

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

    async insertData(externalCookie: string, entityName: string, data: any) {
        const url = `/api/entities/${entityName}/insert`;
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

    async populateExamplePics(externalCookie: string) {
        try {
            const assetsResp = await axios.get(`${this.baseUrl}/api/assets?linkCount=true&offset=0&limit=48&sort[id]=-1`, {
                headers: {
                    Cookie: externalCookie
                }
            });

            if (assetsResp.data.totalRecords !== 0) {
                return;
            }

            const examplePicsPath = path.resolve(process.cwd(), 'assets', 'example_pics');
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
}

