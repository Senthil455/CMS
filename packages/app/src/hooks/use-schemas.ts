import useSWR from 'swr';
import axios from 'axios';
import { ENDPOINTS, type SchemaDto, type SaveSchemaPayload } from '@cms/shared';

const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);

export function useSchemaHistory(schemaId: string | null) {
    const { data, error, isLoading } = useSWR<SchemaDto[]>(
        schemaId ? `${''}${ENDPOINTS.SCHEMA.HISTORY.replace(':schemaId', schemaId)}` : null,
        fetcher,
        {
            shouldRetryOnError: false,
            revalidateOnFocus: false,
        }
    );

    return {
        history: data || [],
        isLoading,
        error
    };
}

export function useSchemas() {
    const { data, error, isLoading, mutate } = useSWR<SchemaDto[]>(
        `${''}${ENDPOINTS.SCHEMA.ALL}`,
        fetcher,
        {
            shouldRetryOnError: false,
            revalidateOnFocus: false,
        }
    );

    const saveSchema = async (payload: SaveSchemaPayload) => {
        const resp = await axios.post(`${''}${ENDPOINTS.SCHEMA.SAVE}`, payload, {
            withCredentials: true
        });
        if (resp.status === 200) {
            await mutate();
            return resp.data;
        } else {
            throw new Error(resp.data.error || 'Failed to save entity');
        }
    };

    const defineEntity = async (payload: any) => {
        // payload is expected to be SaveSchemaPayload but the endpoint might just need { entity: entityDto }
        // Ideally we follow the payload structure. The user said "save entity define expect schemaDto". 
        // SaveSchemaPayload essentially wraps EntityDto.
        // Let's pass the payload directly as the user requested.
        const resp = await axios.post(`${''}${ENDPOINTS.SCHEMA.DEFINE}`, payload, {
            withCredentials: true
        });
        if (resp.status === 200 || resp.status === 201) {
            await mutate();
            return resp.data;
        } else {
            throw new Error(resp.data.error || 'Failed to define entity');
        }
    };

    const deleteSchema = async (id: number) => {
        // Replace :id parameter manually since it's simple
        const endpoint = ENDPOINTS.SCHEMA.DELETE.replace(':id', id.toString());
        const url = `${''}${endpoint}`;

        await axios.delete(url, {
            withCredentials: true
        });
        await mutate();
    };

    const publishSchema = async (id: number, schemaId: string) => {
        const url = `${''}${ENDPOINTS.SCHEMA.PUBLISH}`;
        const resp = await axios.post(url, { id: id.toString(), schemaId }, {
            withCredentials: true
        });
        if (resp.status === 200) {
            await mutate();
            return resp.data;
        } else {
            throw new Error(resp.data.error || 'Failed to publish schema');
        }
    };

    return {
        entities: data?.filter(s => s.type === 'entity') || [],
        queries: data?.filter(s => s.type === 'query') || [],
        pages: data?.filter(s => s.type === 'page') || [],
        isLoading,
        error,
        saveSchema,
        defineEntity,
        deleteSchema,
        publishSchema,
        mutate
    };
}
