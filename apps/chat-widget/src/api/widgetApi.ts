import type {
  Message,
  StartWidgetConversationResponse,
} from "../types/widget";
import { widgetApiFetch } from "./apiClient";

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
    files: File[] = []
): Promise<Message> {
    const formData = new FormData();

    if (content.trim()) {
        formData.append("content", content);
    }

    for (const file of files) {
        formData.append("files", file);
    }

    return widgetApiFetch<Message>(
        `/api/widget/conversations/${conversationId}/messages`,
        accessToken,
        {
            method: "POST",
            body: formData,
        }
    );
}

export async function getWidgetAttachmentBlob(
    attachmentId: string,
    accessToken: string,
    signal?: AbortSignal
): Promise<Blob> {

    const response =
        await fetch(
            `/api/attachments/${attachmentId}`,
            {
                signal,
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,
                },
            }
        );

    if (!response.ok) {
        throw new Error(
            `Request failed: ${response.status}`
        );
    }

    return await response.blob();
}