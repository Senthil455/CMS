import axios from 'axios';
import type { User } from '@cms/shared';

import { type SchemaDto, type SaveSchemaPayload, ENDPOINTS } from '@cms/shared';

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
            schemaId: null,
            type: 'query',
            settings: {
                query: {
                    name: queryName,
                    entityName: '',
                    source: '',
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

        await axios.post(`${this.baseUrl}${ENDPOINTS.GRAPHQL}`, {
            query,
            variables
        }, {
            headers: {
                Cookie: externalCookie,
                'x-name': queryName,
                'x-schema-id': schemaId
            }
        });
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
}

