import useSWR from "swr";
import { fullCmsApiUrl } from "../configs";
import axios from "axios";
import { catchResponse, decodeError, fetcher, swrConfig } from "../../utils/apiUtils";
import { LookupListResponse } from "../types/lookupListResponse";
import { ListResponse } from "../../types/listResponse";
import { ENDPOINTS } from "@cms/shared";

export function useListData(schemaName: string | undefined, qs: string) {
    const url = fullCmsApiUrl(`${ENDPOINTS.ENTITIES.LIST.replace(':schemaName', schemaName || '')}?${qs}`);
    let res = useSWR<ListResponse>(url, fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useTreeData(schemaName: string | undefined) {
    let res = useSWR<any[]>(fullCmsApiUrl(ENDPOINTS.ENTITIES.TREE.replace(':schemaName', schemaName || '')), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}
export function useItemData(schemaName: string, id: any) {
    var url = id ? fullCmsApiUrl(ENDPOINTS.ENTITIES.ITEM.replace(':schemaName', schemaName).replace(':id', id)) : null;
    let res = useSWR(url, fetcher, swrConfig)
    return { ...res, error: decodeError(res.error) }
}

export async function updateItem(schemaName: string, item: any) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ENTITIES.UPDATE.replace(':schemaName', schemaName)), item))
}

export async function addItem(schemaName: string, item: any) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ENTITIES.INSERT.replace(':schemaName', schemaName)), item))
}

export async function deleteItem(schemaName: string, item: any) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ENTITIES.DELETE.replace(':schemaName', schemaName)), item))
}

export async function savePublicationSettings(schemaName: string, item: any) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ENTITIES.PUBLICATION.replace(':schemaName', schemaName)), item))
}

export function useJunctionIds(schemaName: string, id: any, field: string) {
    const url = fullCmsApiUrl(ENDPOINTS.ENTITIES.JUNCTION_IDS.replace(':schemaName', schemaName).replace(':id', id).replace(':field', field));
    let res = useSWR<any[]>(schemaName && id && field ? url : null, fetcher, swrConfig)
    return { ...res, error: decodeError(res.error) }
}
export function useJunctionData(schemaName: string, id: any, field: string, exclude: boolean, qs: string) {
    const url = fullCmsApiUrl(`${ENDPOINTS.ENTITIES.JUNCTION_DATA.replace(':schemaName', schemaName).replace(':id', id).replace(':field', field)}?exclude=${exclude}&${qs}`);
    let res = useSWR<ListResponse>(schemaName && id && field ? url : null, fetcher, swrConfig)
    return { ...res, error: decodeError(res.error) }
}

export async function saveJunctionItems(schemaName: string, id: any, field: string, items: any) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ENTITIES.JUNCTION_SAVE.replace(':schemaName', schemaName).replace(':id', id).replace(':field', field)), items))
}

export async function deleteJunctionItems(schemaName: string, id: any, field: string, items: any) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ENTITIES.JUNCTION_DELETE.replace(':schemaName', schemaName).replace(':id', id).replace(':field', field)), items))
}

export function useCollectionData(schemaName: string, id: any, field: string, qs: string) {
    const url = fullCmsApiUrl(`${ENDPOINTS.ENTITIES.COLLECTION.replace(':schemaName', schemaName).replace(':id', id).replace(':field', field)}?${qs}`);
    let res = useSWR(schemaName && id && field ? url : null, fetcher, swrConfig)
    return { ...res, error: decodeError(res.error) }
}

export async function addCollectionItem(schemaName: string, id: any, field: string, item: any) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ENTITIES.COLLECTION_INSERT.replace(':schemaName', schemaName).replace(':id', id).replace(':field', field)), item))
}

export function getLookupData(schemaName: string, query: string) {
    return catchResponse(() => axios.get<LookupListResponse>(fullCmsApiUrl(`${ENDPOINTS.ENTITIES.LOOKUP.replace(':schemaName', schemaName)}?query=${encodeURIComponent(query)}`)))
}

export function useLookupData(schemaName: string, query: string) {
    let res = useSWR<LookupListResponse>(fullCmsApiUrl(`${ENDPOINTS.ENTITIES.LOOKUP.replace(':schemaName', schemaName)}?query=${encodeURIComponent(query)}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}