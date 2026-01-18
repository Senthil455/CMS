export const config = {
    API_BASE_URL: typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL : '',
    CMS_BASE_URL: typeof import.meta.env.VITE_CMS_URL === 'string' ? import.meta.env.VITE_CMS_URL : '',
};
