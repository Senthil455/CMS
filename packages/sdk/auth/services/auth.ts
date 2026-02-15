import useSWR from "swr";
import { catchClient, fetcher, swrConfig } from "../../utils/apiUtils";
import { fullAuthApiUrl, getApiClient } from "../configs";
import { type UserAccess, type ChangePasswordReq, type RegisterReq, type LoginRequest, ENDPOINTS } from "@cms/shared";

//login
export async function login(item: LoginRequest) {
    return catchClient(() => getApiClient().login(item));
}

export async function register(item: RegisterReq) {
    return catchClient(() => getApiClient().register(item));
}

export async function logout() {
    return catchClient(() => getApiClient().logout());
}

export function getBackendGithubUrl() {
    return fullAuthApiUrl(`/api/ext_login/GitHub/`);
}

//identity
export function useUserInfo() {
    return useSWR<UserAccess>(fullAuthApiUrl(ENDPOINTS.AUTH.ME), fetcher, swrConfig)
}

//profile
export async function changePassword(item: ChangePasswordReq) {
    return catchClient(() => getApiClient().changePassword(item));
}

export async function uploadAvatar(file: any) {
    return catchClient(() => getApiClient().uploadAvatar(file));
}

