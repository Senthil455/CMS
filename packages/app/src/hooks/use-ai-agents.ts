import useSWR from 'swr';
import axios from 'axios';
import { ENDPOINTS, type ApiResponse } from '@cms/shared';

const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);

export function useAIProviders() {
    const { data, error, isLoading } = useSWR<ApiResponse<string[]>>(
        `${''}${ENDPOINTS.AI.PROVIDERS}`,
        fetcher,
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        }
    );

    return {
        providers: data?.data || [],
        isLoading,
        isError: !!error || (data && !data.success),
    };
}
