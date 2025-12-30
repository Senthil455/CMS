import useSWR from 'swr';
import axios from 'axios';
import { ENDPOINTS, type SchemaDto, type SaveEntityPayload } from '@cms/shared';
import { config } from '../config';

const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data.data);

export function useSchemas() {
    const { data, error, isLoading, mutate } = useSWR<SchemaDto[]>(
        `${config.API_BASE_URL}${ENDPOINTS.SCHEMA.ALL}`,
        fetcher
    );

    const saveEntity = async (payload: SaveEntityPayload) => {
        const resp = await axios.post(`${config.API_BASE_URL}${ENDPOINTS.SCHEMA.SAVE}`, payload, {
            withCredentials: true
        });
        if (resp.data.success) {
            await mutate();
        } else {
            throw new Error(resp.data.error || 'Failed to save entity');
        }
    };

    return {
        entities: data?.filter(s => s.type === 'entity') || [],
        queries: data?.filter(s => s.type === 'query') || [],
        pages: data?.filter(s => s.type === 'page') || [],
        isLoading,
        error,
        saveEntity,
        mutate
    };
}
