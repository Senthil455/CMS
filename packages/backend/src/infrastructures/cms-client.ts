import axios from 'axios';
import type { User } from '@cms/shared';

import type { SchemaDto, SaveEntityPayload } from '@cms/shared';

export class CmsClient {
    constructor(private readonly baseUrl: string) { }

    async login(usernameOrEmail: string, password?: string) {
        return axios.post(`${this.baseUrl}/api/login`, {
            usernameOrEmail,
            password
        }, {
            validateStatus: (status) => status === 200,
        });
    }

    async getMe(externalCookie: string) {
        const resp = await axios.get(`${this.baseUrl}/api/me`, {
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
        const resp = await axios.get(`${this.baseUrl}/api/schemas?type=entity`, {
            headers: {
                Cookie: externalCookie
            }
        });
        return resp.data;
    }

    async saveEntity(externalCookie: string, payload: SaveEntityPayload) {
        try {
            return await axios.post(`${this.baseUrl}/api/schemas/entity/define`, payload, {
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

    async logout(externalCookie: string) {
        return axios.get(`${this.baseUrl}/api/logout`, {
            headers: {
                Cookie: externalCookie
            }
        });
    }
}
