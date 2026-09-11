import { getAccessToken } from "../auth/tokenStore";

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAccessToken();

    const headers = new Headers(options.headers);

    headers.set("Accept", "application/json");

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    const response = await fetch(
        `/api${path}`,
        {
            ...options,
            headers,
        }
    );

    if (!response.ok) {
        throw new Error(
            `Request failed with status ${response.status}`
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const data: T = await response.json();

    return data;
}