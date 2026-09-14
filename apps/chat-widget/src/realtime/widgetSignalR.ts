import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

export function createWidgetSignalRConnection(
  accessToken: string,
): HubConnection {
  return new HubConnectionBuilder()
    .withUrl("/hubs/conversations", {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect([
      0,
      2000,
      5000,
      10000,
    ])
    .configureLogging(LogLevel.Warning)
    .build();
}