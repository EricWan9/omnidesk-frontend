export interface WidgetSession {
  conversationId: string;
  accessToken: string;
}

export interface StartWidgetConversationResponse {
  conversationId: string;
  accessToken: string;
}

export const MessageSenderType = {
    Agent: 0,
    Customer: 1,
    Ai: 2,
    System: 3,
} as const;

export type MessageSenderType =
    typeof MessageSenderType[
        keyof typeof MessageSenderType
    ];

export interface MessageSender {
    type: MessageSenderType;
    id: string | null;
}

export interface Message {
    id: string;
    conversationId: string;
    messageSender: MessageSender;
    content: string;
    createdAt: string;
}