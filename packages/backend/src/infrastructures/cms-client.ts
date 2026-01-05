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

    async saveEntity(externalCookie: string, payload: SaveSchemaPayload) {
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

    async savePage(externalCookie: string, payload: SaveSchemaPayload) {
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

    async query(externalCookie: string, query: string, variables?: any) {
        return axios.post(`${this.baseUrl}${ENDPOINTS.GRAPHQL}`, {
            query,
            variables
        }, {
            headers: {
                Cookie: externalCookie
            }
        });
    }
}

