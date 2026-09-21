import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
    ?.replace(/\/+$/, "");


if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not configured.",
  );
}


export function createWidgetSignalRConnection(
  accessToken: string,
): HubConnection {

  return new HubConnectionBuilder()

    .withUrl(
      `${API_BASE_URL}/hubs/conversations`,
      {
        accessTokenFactory:
          () => accessToken,
      },
    )

    .withAutomaticReconnect([
      0,
      2000,
      5000,
      10000,
    ])

    .configureLogging(
      LogLevel.Warning,
    )

    .build();
}