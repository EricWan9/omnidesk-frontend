import type {
    Message,
    StartWidgetConversationResponse,
} from "../types/widget";

import {
    widgetApiFetch,
    widgetApiFetchBlob,
} from "./apiClient";


export async function startWidgetConversation(
    widgetKey: string,
): Promise<StartWidgetConversationResponse> {
    return widgetApiFetch<StartWidgetConversationResponse>(
        "/widget/conversations",
        null,
        {
            method: "POST",
            body: JSON.stringify({
                widgetKey,
            }),
        }
    );
}


export async function getWidgetMessages(
    conversationId: string,
    accessToken: string,
): Promise<Message[]> {
    return widgetApiFetch<Message[]>(
        `/widget/conversations/${conversationId}/messages?pageSize=50`,
        accessToken,
        {
            method: "GET",
        }
    );
}


export async function sendWidgetMessage(
    conversationId: string,
    accessToken: string,
    content: string,
    files: File[] = []
): Promise<Message> {
    const formData =
        new FormData();

    if (content.trim()) {
        formData.append(
            "content",
            content
        );
    }

    for (const file of files) {
        formData.append(
            "files",
            file
        );
    }

    return widgetApiFetch<Message>(
        `/widget/conversations/${conversationId}/messages`,
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
    return widgetApiFetchBlob(
        `/attachments/${attachmentId}`,
        accessToken,
        signal
    );
}