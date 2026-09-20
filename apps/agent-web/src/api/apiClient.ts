import { getAccessToken } from "../auth/tokenStore";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "";

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAccessToken();

    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
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

    const response = await fetch(`${API_BASE_URL}/api${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(
            `Request failed: ${response.status}`
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return await response.json() as T;
}

export async function apiFetchBlob(
    url: string,
    options: RequestInit = {}
): Promise<Blob> {

    const token = getAccessToken();

    const headers =
        new Headers(options.headers);

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    const response =
        await fetch(
            `${API_BASE_URL}${url}`,
            {
                ...options,
                headers,
            }
        );

    if (!response.ok) {
        throw new Error(
            `Request failed: ${response.status}`
        );
    }

    return await response.blob();
}