import useSWR from "swr";
import { fullCmsApiUrl } from "../configs";
import { catchResponse, decodeError, fetcher, swrConfig } from "../../utils/apiUtils";
import axios from "axios";
import { XEntity } from "../../types/xEntity";
import { ListResponse } from "../../types/listResponse";
import { ENDPOINTS } from "@cms/shared";

export function useTaskEntity() {
    let res = useSWR<XEntity>(fullCmsApiUrl(ENDPOINTS.TASKS.ENTITY), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}
export function useTasks(qs: string) {
    let res = useSWR<ListResponse>(fullCmsApiUrl(`${ENDPOINTS.TASKS.ALL}?${qs}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function addExportTask() {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.TASKS.EXPORT)));
}

export function addEmitMessageTask(data: any) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.TASKS.EMIT), data));
}

export function importDemoData() {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.TASKS.IMPORT_DEMO)));
}
export function archiveExportTask(id: number) {
    return catchResponse(() => axios.post(fullCmsApiUrl(ENDPOINTS.TASKS.ARCHIVE.replace(':id', id.toString())), {}));
}

export function getExportTaskDownloadFileLink(id: number) {
    return fullCmsApiUrl(ENDPOINTS.TASKS.DOWNLOAD.replace(':id', id.toString()));
}

export function getAddImportTaskUploadUrl() {
    return fullCmsApiUrl(ENDPOINTS.TASKS.IMPORT);
}