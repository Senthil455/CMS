import useSWR from 'swr';
import { type User, type LoginRequest } from '@cms/shared';
import { getApiClient } from '@cms/sdk';

export function useAuth() {
    const { data, error, mutate } = useSWR<User>(
        'api/me',
        () => getApiClient().getMe(),
        {
            shouldRetryOnError: false,
            revalidateOnFocus: false,
        }
    );

    const { data: systemReadyData, mutate: checkSystemStatus } = useSWR(
        'api/system/is-ready',
        () => getApiClient().getSystemStatus()
    );

    const login = async (usernameOrEmail: string, password: string) => {
        try {
            await getApiClient().login({ usernameOrEmail, password } as LoginRequest);
            await checkSystemStatus();
            return await mutate();
        } catch (error: any) {
            // catchClient returns { error, errorDetail } or we use raw client which throws.
            // getApiClient().login() returns Promise<User> and throws on error (via axios).
            // cms-client.ts threw logic: if (error.response?.data) throw error.response.data;
            // But CmsApiClient.login implementation: await this.axios.post(...)
            // Axios throws. 
            // CmsApiClient doesn't catch.
            // So here we catch axios error.
            return error.response?.data || { success: false, error: 'Login failed' };
        }
    };

    const logout = async () => {
        try {
            await getApiClient().logout();
        } catch (error) {
            console.error('Logout failed', error);
        }
        mutate();
        window.location.href = '/app/login';
    };

    return {
        user: data,
        isLoading: !error && !data,
        isError: !!error,
        login,
        logout,
        checkSystemStatus,
        databaseReady: systemReadyData?.databaseReady,
        hasSuperAdmin: systemReadyData?.hasSuperAdmin,
    };
}
