import useSWR from "swr";
import { fullCmsApiUrl } from "../configs";
import { decodeError, fetcher, swrConfig } from "../../utils/apiUtils";
import { XEntity } from "../../types/xEntity";
import { ENDPOINTS } from "@cms/shared";

export function useSchema(schemaName: string | undefined) {
    const url = schemaName ? fullCmsApiUrl(ENDPOINTS.SCHEMA.GET_ENTITY.replace(':entityName', schemaName)) : null;
    let { data, error, isLoading } = useSWR<XEntity>(url, fetcher, swrConfig)
    if (error) {
        error = decodeError(error)
    }
    return { data, isLoading, error }
}