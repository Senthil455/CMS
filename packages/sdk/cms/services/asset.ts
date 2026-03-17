import useSWR from "swr";
import { fullCmsApiUrl } from "../configs";
import { catchResponse, decodeError, fetcher, swrConfig } from "../../utils/apiUtils";
import axios from "axios";
import { Asset } from "../types/asset";
import { XEntity } from "../../types/xEntity";
import { ListResponse } from "../../types/listResponse";
import { ENDPOINTS } from "@cms/shared";

export function useSingleAsset(id: any) {
    let res = useSWR<Asset>(fullCmsApiUrl(ENDPOINTS.ASSETS.BY_ID.replace(':id', id)), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useSingleAssetByPath(path: any) {
    let url = path ? fullCmsApiUrl(`${ENDPOINTS.ASSETS.BY_PATH}?path=${path}`) : null;
    let res = useSWR<Asset>(url, fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}
export function useAssetEntityWithLink() {
    let res = useSWR<XEntity>(fullCmsApiUrl(`${ENDPOINTS.ASSETS.ENTITY}?linkCount=${true}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useAssetEntity() {
    let res = useSWR<XEntity>(fullCmsApiUrl(`${ENDPOINTS.ASSETS.ENTITY}?linkCount=${false}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}
export function useAssets(qs: string, withLinkCount: boolean) {
    let res = useSWR<ListResponse>(fullCmsApiUrl(`${ENDPOINTS.ASSETS.BASE}?linkCount=${withLinkCount}&${qs}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function getAssetReplaceUrl(id: number) {
    return fullCmsApiUrl(ENDPOINTS.ASSETS.BY_ID.replace(':id', id.toString()));
}

export function getFileUploadURL() {
    return fullCmsApiUrl(ENDPOINTS.ASSETS.BASE);
}

export function useGetCmsAssetsUrl() {
    const { data: assetBaseUrl } = useSWR<string>(fullCmsApiUrl(ENDPOINTS.ASSETS.INFO), fetcher, swrConfig);
    return (url: string) => {
        if (!url) return url;
        return url.startsWith('http') ? url : `${assetBaseUrl || ''}${url}`;
    }
}

export function deleteAsset(id: number) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ASSETS.DELETE.replace(':id', id.toString()))))
}

export function updateAssetMeta(asset: any) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ASSETS.META), asset))
}

export function downloadVideo(url: string) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ASSETS.VIDEO), { url }))
}

export function convertToMp3(id: number) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.ASSETS.CONVERT_MP3.replace(':id', id.toString()))))
}