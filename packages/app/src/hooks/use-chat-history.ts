import { useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import axios from 'axios';
import { type ChatMessage, ENDPOINTS, type ApiResponse } from '@cms/shared';

const fetcher = (url: string) =>
    axios.get(url, { withCredentials: true })
        .then(res => res.data)
        .catch(err => {
            console.error('Fetch error:', err.response?.data || err.message);
            throw err;
        });

export function useChatHistory() {
    const getKey = (pageIndex: number, previousPageData: ApiResponse<ChatMessage[]>) => {
        // reached the end
        if (previousPageData && (previousPageData.data === undefined || previousPageData.data.length === 0)) return null;

        // first page, we don't have `beforeId`
        if (pageIndex === 0) return `${''}${ENDPOINTS.CHAT.HISTORY}?limit=10`;

        // add `beforeId` to the query, using the oldest id of the previous page
        const firstMessage = previousPageData.data![0];
        return `${''}${ENDPOINTS.CHAT.HISTORY}?limit=10&beforeId=${firstMessage.id}`;
    };

    const { data, error, size, setSize, mutate, isValidating } = useSWRInfinite<ApiResponse<ChatMessage[]>>(
        getKey,
        fetcher,
        {
            revalidateFirstPage: false,
            persistSize: true,
            shouldRetryOnError: false,
            revalidateOnFocus: false,
        }
    );

    // usage of useMemo is necessary to prevent infinite loops in useEffect dependencies
    const history = useMemo(() => {
        return data ? [...data].reverse().flatMap(page => page.data || []) : [];
    }, [data]);
    const isLoading = !error && !data;
    const isEmpty = data?.[0]?.data?.length === 0;
    const isReachingEnd = isEmpty || (data && (data[data.length - 1]?.data?.length || 0) < 10);

    return {
        history,
        isLoading,
        isFetchingMore: isValidating && size > 1,
        isError: error,
        mutate,
        size,
        setSize,
        isReachingEnd,
    };
}
