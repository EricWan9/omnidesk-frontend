import type { MessageSenderType } from "./message";

export type ConversationStatus =
    | "waiting"
    | "open"
    | "resolved";

export type ConversationStatusFilter =
    | "all"
    | "open"
    | "closed";

export type AssignmentFilter =
    | "all"
    | "mine"
    | "unassigned";

export interface GetConversationsResult {
    conversations: Conversation[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface Conversation {
    id: string;
    customerName: string | null;
    customerEmail: string | null;
    status: number | string;
    assignedUserId: string | null;
    assignedUserName?: string | null;
    assignedUserEmail?: string | null;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadMessageCount: number;
    updatedAt: string;
    createdAt?: string;
    unreadCount: number;
    rowVersion: string;
}

export interface ConversationUpdated {
    conversationId: string;
    senderType: MessageSenderType;
    lastMessage: string;
    lastMessageAt: string;
}

export function mapConversationStatus(
    value: number | string | null | undefined
): "open" | "closed" {
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (normalized.includes("closed") || normalized.includes("resolved")) {
            return "closed";
        }

        if (normalized.includes("open") || normalized.includes("waiting")) {
            return "open";
        }

        return "open";
    }

    if (typeof value === "number") {
        if (value === 1) {
            return "closed";
        }

        return "open";
    }

    return "open";
}

export function isConversationClosed(
    value: number | string | null | undefined
): boolean {
    return mapConversationStatus(value) === "closed";
}

export function getConversationStatusLabel(
    value: number | string | null | undefined
): "Open" | "Closed" {
    return isConversationClosed(value) ? "Closed" : "Open";
}