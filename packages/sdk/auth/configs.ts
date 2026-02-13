import axios from 'axios';
import { CmsApiClient } from '@cms/shared';

let apiBaseURL = "";
let client: CmsApiClient = new CmsApiClient(axios.create({ baseURL: apiBaseURL, withCredentials: true }));

export function setAuthApiBaseUrl(v: string) {
    apiBaseURL = v;
    client = new CmsApiClient(axios.create({ baseURL: v, withCredentials: true }));
}
export function fullAuthApiUrl(subPath: string) {
    return apiBaseURL + subPath
}

export function getApiClient() {
    return client;
}