export async function widgetApiFetch<T>(
    url: string,
    accessToken: string | null,
    options: RequestInit = {}
): Promise<T> {
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

    const response = await fetch(
        url,
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

    if (response.status === 204) {
        return undefined as T;
    }

    return await response.json() as T;
}

async function readErrorMessage(
    response: Response
): Promise<string> {
    try {
        const data = await response.json();

        if (
            typeof data === "object" &&
            data !== null &&
            "detail" in data &&
            typeof data.detail === "string"
        ) {
            return data.detail;
        }
    }
    catch {
        // Ignore invalid / empty JSON response.
    }

    return `Request failed with status ${response.status}.`;
}