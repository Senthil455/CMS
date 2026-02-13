import useSWR from "swr";
import { decodeError, fetcher, swrConfig } from "../../utils/apiUtils";
import { fullSubUrl } from "../config";
import { Price } from "../types/price";
import { ENDPOINTS } from "@cms/shared";

export function useSubscriptionPrices() {
    let res = useSWR<Price[]>(
        fullSubUrl(ENDPOINTS.SUBSCRIPTIONS.PRICES), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}