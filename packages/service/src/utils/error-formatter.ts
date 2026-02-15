import axios from 'axios';

export function formatError(error: unknown): any {
    if (axios.isAxiosError(error)) {
        return {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method,
            data: error.response?.data, // Keep data but exclude request/response objects
        };
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
            name: error.name
        };
    }

    return error;
}
