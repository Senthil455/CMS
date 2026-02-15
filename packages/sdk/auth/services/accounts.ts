import useSWR from "swr";
import { catchResponse, decodeError, fetcher, swrConfig } from "../../utils/apiUtils";
import axios from "axios";
import { fullAuthApiUrl } from "../configs";
import { UserAccess } from "../types/userAccess";
import { RoleAccess } from "../types/roleAccess";

export function useUsers() {
    let res = useSWR<UserAccess[]>(fullAuthApiUrl(`/api/accounts/users`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useRoles() {
    let res = useSWR<string[]>(fullAuthApiUrl(`/api/accounts/roles`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useEntities() {
    let res = useSWR<string[]>(fullAuthApiUrl(`/api/accounts/entities`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useSingleUser(id: string) {
    let res = useSWR<UserAccess>(fullAuthApiUrl(`/api/accounts/users/${id}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useSingleRole(name: string) {
    let res = useSWR<RoleAccess>(!name ? null : fullAuthApiUrl(`/api/accounts/roles/${name}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function saveUser(formData: UserAccess) {
    return catchResponse(() => axios.post(fullAuthApiUrl(`/api/accounts/users`), formData))
}

export function deleteUser(id: string) {
    return catchResponse(() => axios.delete(fullAuthApiUrl(`/api/accounts/users/${id}`)))
}

export function saveRole(payload: RoleAccess) {
    return catchResponse(() => axios.post(fullAuthApiUrl(`/api/accounts/roles`), payload))
}

export function deleteRole(name: string) {
    return catchResponse(() => axios.delete(fullAuthApiUrl(`/api/accounts/roles/${name}`)))
}