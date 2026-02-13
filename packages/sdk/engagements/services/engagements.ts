import useSWR from "swr";
import { catchResponse, decodeError, fetcher, swrConfig } from "../../utils/apiUtils";
import { ListResponse } from "../../types/listResponse";
import { fullActivityUrl } from "../config";
import axios from "axios";
import { PageVisitCount } from "../types/pageVisitCount";
import { DailyEngagementCount } from "../types/dailyEngagementCount";
import { ENDPOINTS } from "@cms/shared";

export function useActivities(type: string, qs: string) {
    let res = useSWR<ListResponse>(
        fullActivityUrl(`${ENDPOINTS.ENGAGEMENTS.LIST.replace(':type', type)}?${qs}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function deleteActivity(id: number) {
    return catchResponse(() => axios.post(fullActivityUrl(ENDPOINTS.ENGAGEMENTS.DELETE.replace(':id', id.toString()))))
}

export function usePageVisitCount(topN: number) {
    let res = useSWR<PageVisitCount[]>(
        fullActivityUrl(`${ENDPOINTS.ENGAGEMENTS.PAGE_COUNTS}?n=${topN}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useVisitCounts(n: number, authed: boolean) {
    let res = useSWR<DailyEngagementCount[]>(
        fullActivityUrl(`${ENDPOINTS.ENGAGEMENTS.VISIT_COUNTS}?n=${n}&authed=${authed}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useActivityCounts(n: number) {
    let res = useSWR<DailyEngagementCount[]>(
        fullActivityUrl(`${ENDPOINTS.ENGAGEMENTS.COUNTS}?n=${n}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}