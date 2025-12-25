import useSWR from 'swr';
import { type ChatMessage, ENDPOINTS, type ApiResponse } from '@cms/shared';
import { config } from '../config';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

export function useChatHistory() {
    const { data, error, mutate } = useSWR<ApiResponse<ChatMessage[]>>(
        `${config.API_BASE_URL}${ENDPOINTS.CHAT.HISTORY}?limit=10`,
        fetcher
    );

    const loadMore = async (beforeId: number, limit: number = 10): Promise<ChatMessage[]> => {
        const url = `${config.API_BASE_URL}${ENDPOINTS.CHAT.HISTORY}?limit=${limit}&beforeId=${beforeId}`;
        const res: ApiResponse<ChatMessage[]> = await fetcher(url);
        return res.data || [];
    };

    return {
        history: data?.data,
        isLoading: !error && !data,
        isError: error || (data && !data.success),
        mutate,
        loadMore,
    };
}
