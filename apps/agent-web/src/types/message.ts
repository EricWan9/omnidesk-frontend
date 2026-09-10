export type MessageSenderType =
    | "customer"
    | "agent";

export interface Message {
    id: string;
    conversationId: string;
    senderType: number;
    senderUserId: string | null;
    content: string;
    createdAt: string;
}