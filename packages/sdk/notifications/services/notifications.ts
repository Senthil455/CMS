import useSWR from "swr";
import { decodeError, fetcher, swrConfig } from "../../utils/apiUtils";
import { ListResponse } from "../../types/listResponse";
import { fullNotificationUrl } from "../config";
import { ENDPOINTS } from "@cms/shared";

export function useNotifications(qs: string) {
    let res = useSWR<ListResponse>(
        fullNotificationUrl(`${ENDPOINTS.NOTIFICATIONS.BASE}?qs=${qs}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}