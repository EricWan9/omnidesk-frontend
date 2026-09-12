export type MessageSenderType =
    | "customer"
    | "agent";

export interface Message {
    id: string;
    conversationId: string;
    senderType: MessageSenderType;
    senderId: string | null;
    content: string;
    createdAt: string;
}