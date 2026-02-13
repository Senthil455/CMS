import useSWR from "swr";
import { fullActivityUrl } from "../config";
import { catchResponse, decodeError, fetcher, swrConfig } from "../../utils/apiUtils";
import { BookmarkFolder } from "../types/bookmarkFolder";
import { ListResponse } from "../../types/listResponse";
import axios from "axios";
import { ENDPOINTS } from "@cms/shared";

export function useBookmarkFolders() {
    let res = useSWR<BookmarkFolder[]>(
        fullActivityUrl(ENDPOINTS.BOOKMARKS.FOLDERS), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function useBookmarks(folderId: number, qs: string) {
    let res = useSWR<ListResponse>(
        fullActivityUrl(`${ENDPOINTS.BOOKMARKS.LIST.replace(':folderId', folderId.toString())}?${qs}`), fetcher, swrConfig);
    return { ...res, error: decodeError(res.error) }
}

export function updateBookmarkFolder(id: number, folder: BookmarkFolder) {
    return catchResponse(() => axios.post(fullActivityUrl(ENDPOINTS.BOOKMARKS.UPDATE_FOLDER.replace(':id', id.toString())), folder))
}

export function deleteBookmarkFolder(id: number) {
    return catchResponse(() => axios.post(fullActivityUrl(ENDPOINTS.BOOKMARKS.DELETE_FOLDER.replace(':id', id.toString()))))
}

export function deleteBookmark(id: number) {
    return catchResponse(() => axios.post(fullActivityUrl(ENDPOINTS.BOOKMARKS.DELETE.replace(':id', id.toString()))))
}