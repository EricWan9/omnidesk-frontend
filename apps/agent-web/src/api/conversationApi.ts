import { apiFetch } from "./apiClient";

import type { Conversation }
    from "../types/conversation";

import type { Message }
    from "../types/message";

export async function getConversations():
    Promise<Conversation[]> {

    return apiFetch<Conversation[]>(
        "/workspace/conversations"
    );
}

export async function getMessages(
    conversationId: string,
    pageSize: number = 50
): Promise<Message[]> {

    return apiFetch<Message[]>(
        `/workspace/conversations/${conversationId}/messages?pageSize=${pageSize}`
    );
}

export async function sendMessage(
    conversationId: string,
    content: string
): Promise<Message> {

    return apiFetch<Message>(
        `/workspace/conversations/${conversationId}/messages`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content,
            }),
        }
    );
}