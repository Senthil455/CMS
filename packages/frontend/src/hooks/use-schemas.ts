import useSWR from 'swr';
import axios from 'axios';
import { ENDPOINTS, type SchemaDto, type SaveSchemaPayload } from '@cms/shared';
import { config } from '../config';

const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);

export function useSchemas() {
    const { data, error, isLoading, mutate } = useSWR<SchemaDto[]>(
        `${config.CMS_BASE_URL}${ENDPOINTS.SCHEMA.ALL}`,
        fetcher,
        {
            shouldRetryOnError: false,
            revalidateOnFocus: false,
        }
    );

    const saveEntity = async (payload: SaveSchemaPayload) => {
        const resp = await axios.post(`${config.CMS_BASE_URL}${ENDPOINTS.SCHEMA.SAVE}`, payload, {
            withCredentials: true
        });
        if (resp.data.success) {
            await mutate();
            return resp.data;
        } else {
            throw new Error(resp.data.error || 'Failed to save entity');
        }
    };

    const deleteSchema = async (id: number) => {
        // Replace :id parameter manually since it's simple
        const endpoint = ENDPOINTS.SCHEMA.DELETE.replace(':id', id.toString());
        const url = `${config.CMS_BASE_URL}${endpoint}`;

        await axios.delete(url, {
            withCredentials: true
        });
        await mutate();
    };

    return {
        entities: data?.filter(s => s.type === 'entity') || [],
        queries: data?.filter(s => s.type === 'query') || [],
        pages: data?.filter(s => s.type === 'page') || [],
        isLoading,
        error,
        saveEntity,
        deleteSchema,
        mutate
    };
}
