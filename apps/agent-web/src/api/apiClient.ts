import { getAccessToken } from "../auth/tokenStore";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error(
        "VITE_API_BASE_URL is not configured."
    );
}

export class ApiError extends Error {
    public readonly status: number;

    constructor(
        status: number,
        message: string
    ) {
        super(message);

        this.name = "ApiError";
        this.status = status;
    }
}

function buildApiUrl(path: string): string {
    return `${API_BASE_URL}/api${path}`;
}

function createHeaders(
    options: RequestInit
): Headers {
    const headers =
        new Headers(options.headers);

    const token =
        getAccessToken();

    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    return headers;
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const headers =
        createHeaders(options);

    const response =
        await fetch(
            buildApiUrl(path),
            {
                ...options,
                headers,
            }
        );

    if (!response.ok) {
        throw new ApiError(
            response.status,
            `Request failed: ${response.status}`
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return await response.json() as T;
}

export async function apiFetchBlob(
    path: string,
    options: RequestInit = {}
): Promise<Blob> {
    const headers =
        createHeaders(options);

    const response =
        await fetch(
            buildApiUrl(path),
            {
                ...options,
                headers,
            }
        );

    if (!response.ok) {
        throw new ApiError(
            response.status,
            `Request failed: ${response.status}`
        );
    }

    return await response.blob();
}