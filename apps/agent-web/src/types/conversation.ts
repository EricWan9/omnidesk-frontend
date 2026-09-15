import type { MessageSenderType } from "./message";

export type ConversationStatus =
    | "waiting"
    | "open"
    | "resolved";

export interface Conversation {
    id: string;
    customerName: string | null;
    customerEmail: string | null;
    status: number;
    assignedUserId: string | null;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadMessageCount: number;
    updatedAt: string;
    unreadCount: number;
    rowVersion: string;
}

export interface ConversationUpdated {
    conversationId: string;
    senderType: MessageSenderType;
    lastMessage: string;
    lastMessageAt: string;
}