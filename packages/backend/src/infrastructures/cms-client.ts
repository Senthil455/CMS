import axios from 'axios';
import type { User } from '@cms/shared';

export interface EntitySchema {
    id: number;
    schemaId: string;
    name: string;
    type: string;
    publicationStatus: string;
    isLatest: boolean;
    createdAt: string;
    createdBy: string;
    settings: {
        entity: {
            name: string;
            displayName: string;
            tableName: string;
            primaryKey: string;
            labelAttributeName: string;
            attributes: {
                field: string;
                header: string;
                dataType: string;
                displayType: string;
                inList: boolean;
                inDetail: boolean;
                isDefault: boolean;
                options: string;
                validation: string;
            }[];
        };
    };
}

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

    async getAllEntities(externalCookie: string): Promise<EntitySchema[]> {
        const resp = await axios.get(`${this.baseUrl}/api/schemas?type=entity`, {
            headers: {
                Cookie: externalCookie
            }
        });
        return resp.data;
    }

    async logout(externalCookie: string) {
        return axios.get(`${this.baseUrl}/api/logout`, {
            headers: {
                Cookie: externalCookie
            }
        });
    }
}
