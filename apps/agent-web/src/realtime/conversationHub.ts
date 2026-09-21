import {
    HubConnectionBuilder,
    LogLevel,
    type HubConnection,
} from "@microsoft/signalr";

import {
    getAccessToken,
} from "../auth/tokenStore";


const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL
        ?.replace(/\/+$/, "");


if (!API_BASE_URL) {
    throw new Error(
        "VITE_API_BASE_URL is not configured."
    );
}


export function createConversationHubConnection():
    HubConnection {

    return new HubConnectionBuilder()
        .withUrl(
            `${API_BASE_URL}/hubs/conversations`,
            {
                accessTokenFactory: () =>
                    getAccessToken() ?? "",
            }
        )
        .withAutomaticReconnect()
        .configureLogging(
            LogLevel.Information
        )
        .build();
}