import type {
  Message,
  StartWidgetConversationResponse,
} from "../types/widget";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function ensureSuccess(
  response: Response,
  message: string,
): Promise<void> {
  if (!response.ok) {
    throw new ApiError(
      response.status,
      `${message}: ${response.status}`,
    );
  }
}

export async function startWidgetConversation(
  widgetKey: string,
): Promise<StartWidgetConversationResponse> {
  const response = await fetch(
    "/api/widget/conversations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        widgetKey,
      }),
    },
  );

  await ensureSuccess(
    response,
    "Failed to start conversation",
  );

  return response.json();
}

export async function getWidgetMessages(
  conversationId: string,
  accessToken: string,
): Promise<Message[]> {
  const response = await fetch(
    `/api/widget/conversations/${conversationId}/messages?pageSize=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  await ensureSuccess(
    response,
    "Failed to load messages",
  );

  return response.json();
}

export async function sendWidgetMessage(
  conversationId: string,
  accessToken: string,
  content: string,
): Promise<Message> {
  const response = await fetch(
    `/api/widget/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        content,
      }),
    },
  );

  await ensureSuccess(
    response,
    "Failed to send message",
  );

  return response.json();
}