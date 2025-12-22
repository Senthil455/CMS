import useSWR from 'swr';
import { type ChatMessage, ENDPOINTS, type ApiResponse } from '@cms/shared';
import { config } from '../config';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

export function useChatHistory() {
    const { data, error, mutate } = useSWR<ApiResponse<ChatMessage[]>>(
        `${config.API_BASE_URL}${ENDPOINTS.CHAT.HISTORY}`,
        fetcher
    );

    return {
        history: data?.data,
        isLoading: !error && !data,
        isError: error || (data && !data.success),
        mutate,
    };
}
