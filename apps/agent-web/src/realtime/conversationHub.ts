import {
    HubConnectionBuilder,
    LogLevel,
    type HubConnection,
} from "@microsoft/signalr";

import {
    getAccessToken,
} from "../auth/tokenStore";

export function createConversationHubConnection(): HubConnection {

    return new HubConnectionBuilder()
        .withUrl("/hubs/conversations", {
            accessTokenFactory: () =>
                getAccessToken() ?? "",
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();
}