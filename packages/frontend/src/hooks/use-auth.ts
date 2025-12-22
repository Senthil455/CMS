import useSWR from 'swr';
import { type User, ENDPOINTS, type ApiResponse, type LoginRequest } from '@cms/shared';
import { config } from '../config';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

export function useAuth() {
    const { data, error, mutate } = useSWR<ApiResponse<User>>(
        `${config.API_BASE_URL}${ENDPOINTS.AUTH.ME}`,
        fetcher,
        {
            shouldRetryOnError: false,
            revalidateOnFocus: false,
        }
    );

    const login = async (usernameOrEmail: string, password: string) => {
        const response = await fetch(`${config.API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail, password } as LoginRequest),
            credentials: 'include',
        });

        const result: ApiResponse<User> = await response.json();
        if (result.success) {
            mutate(result);
        }
        return result;
    };

    const logout = async () => {
        await fetch(`${config.API_BASE_URL}${ENDPOINTS.AUTH.LOGOUT}`, {
            method: 'POST',
            credentials: 'include',
        });
        mutate({ success: false }, false);
    };

    return {
        user: data?.data,
        isLoading: !error && !data,
        isError: !!error || (data && !data.success),
        login,
        logout,
    };
}
