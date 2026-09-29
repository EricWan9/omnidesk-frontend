import { ApiError, apiFetch } from "./apiClient";

import type {
    AssignmentFilter,
    Conversation,
    ConversationStatusFilter,
    GetConversationsResult,
} from "../types/conversation";

import type { Message }
    from "../types/message";

async function apiFetchWithFallback<T>(
    candidates: string[],
    options: RequestInit = {}
): Promise<T> {
    let lastError: unknown = null;

    for (const path of candidates) {
        try {
            return await apiFetch<T>(path, options);
        } catch (error) {
            lastError = error;

            if (!(error instanceof ApiError) || error.status !== 404) {
                throw error;
            }
        }
    }

    throw lastError ?? new Error("Request failed.");
}

export async function getConversations(
    page: number = 1,
    pageSize: number = 50,
    statusFilter: ConversationStatusFilter = "all",
    assignmentFilter: AssignmentFilter = "all",
    search?: string
): Promise<GetConversationsResult> {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    if (statusFilter !== "all") {
        params.set(
            "status",
            statusFilter === "open" ? "Open" : "Closed"
        );
    }

    if (assignmentFilter !== "all") {
        params.set(
            "assignment",
            assignmentFilter === "mine" ? "Mine" : "Unassigned"
        );
    }

    const trimmedSearch = search?.trim();

    if (trimmedSearch) {
        params.set("search", trimmedSearch);
    }

    return apiFetch<GetConversationsResult>(
        `/workspace/conversations?${params.toString()}`
    );
}

export async function getConversation(
    conversationId: string
): Promise<Conversation> {

    return apiFetch<Conversation>(
        `/workspace/conversations/${conversationId}`
    );
}

export async function getMessages(
    conversationId: string,
    pageSize: number = 50
): Promise<Message[]> {

    const messages = await apiFetch<Message[]>(
        `/workspace/conversations/${conversationId}/messages?pageSize=${pageSize}`
    );

    return [...messages].sort(
        (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
    );
}

export async function sendMessage(
    conversationId: string,
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

    return apiFetch<Message>(
        `/workspace/conversations/${conversationId}/messages`,
        {
            method: "POST",
            body: formData,
        }
    );
}

export async function markConversationAsRead(
    conversationId: string,
): Promise<void> {
    await apiFetch<void>(
        `/workspace/conversations/${conversationId}/read`,
        {
            method: "POST",
        },
    );
}

export async function closeConversation(
    conversationId: string
): Promise<void> {
    await apiFetchWithFallback<void>([
        `/workspace/conversations/${conversationId}/close`,
        `/workspace/conversations/${conversationId}/status/close`,
    ], {
        method: "POST",
    });
}

export async function reopenConversation(
    conversationId: string
): Promise<void> {
    await apiFetchWithFallback<void>([
        `/workspace/conversations/${conversationId}/reopen`,
        `/workspace/conversations/${conversationId}/status/reopen`,
    ], {
        method: "POST",
    });
}

export async function assignConversationToMe(
    conversationId: string
): Promise<void> {
    await apiFetchWithFallback<void>([
        `/workspace/conversations/${conversationId}/assign-to-me`,
        `/workspace/conversations/${conversationId}/assign/me`,
        `/workspace/conversations/${conversationId}/assign`,
    ], {
        method: "POST",
    });
}

export async function unassignConversation(
    conversationId: string
): Promise<void> {
    await apiFetchWithFallback<void>([
        `/workspace/conversations/${conversationId}/unassign`,
        `/workspace/conversations/${conversationId}/assign/unassign`,
    ], {
        method: "POST",
    });
}