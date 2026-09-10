import { apiFetch } from "./apiClient";

import type { Conversation }
    from "../types/conversation";

import type { Message }
    from "../types/message";

export async function getConversations():
    Promise<Conversation[]> {

    return apiFetch<Conversation[]>(
        "/conversations"
    );
}

export async function getMessages(
    conversationId: string,
    pageSize: number = 50
): Promise<Message[]> {

    return apiFetch<Message[]>(
        `/conversations/${conversationId}/messages?pageSize=${pageSize}`
    );
}