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

function buildApiUrl(
    path: string
): string {
    return `${API_BASE_URL}/api${path}`;
}

function createHeaders(
    accessToken: string | null,
    options: RequestInit
): Headers {
    const headers =
        new Headers(options.headers);

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    if (accessToken) {
        headers.set(
            "Authorization",
            `Bearer ${accessToken}`
        );
    }

    return headers;
}

export async function widgetApiFetch<T>(
    path: string,
    accessToken: string | null,
    options: RequestInit = {}
): Promise<T> {
    const headers =
        createHeaders(
            accessToken,
            options
        );

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

export async function widgetApiFetchBlob(
    path: string,
    accessToken: string | null,
    signal?: AbortSignal
): Promise<Blob> {
    const headers =
        createHeaders(
            accessToken,
            {}
        );

    const response =
        await fetch(
            buildApiUrl(path),
            {
                method: "GET",
                headers,
                signal,
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