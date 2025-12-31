import useSWR from 'swr';
import axios from 'axios';
import { ENDPOINTS, type ApiResponse } from '@cms/shared';
import { config } from '../config';

const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);

export function useAIAgents() {
    const { data, error, isLoading } = useSWR<ApiResponse<string[]>>(
        `${config.API_BASE_URL}${ENDPOINTS.AI.AGENTS}`,
        fetcher,
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        }
    );

    return {
        agents: data?.data || [],
        isLoading,
        isError: !!error || (data && !data.success),
    };
}
