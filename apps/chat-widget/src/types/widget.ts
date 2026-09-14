export interface WidgetSession {
  conversationId: string;
  accessToken: string;
}

export interface StartWidgetConversationResponse {
  conversationId: string;
  accessToken: string;
}

export type MessageSenderType =
  | "Agent"
  | "Customer"
  | "Ai"
  | "System";

export interface Message {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  senderId: string | null;
  content: string;
  createdAt: string;
}