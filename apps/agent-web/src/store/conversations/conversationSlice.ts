import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Conversation, ConversationUpdated } from '../../types/conversation';
import { MessageSenderType, type Message } from '../../types/message';

interface ConversationState {
    selectedConversationId: string | null;
    conversations: Conversation[];
    messages: Message[];
}

const initialState: ConversationState = {
    selectedConversationId: null,
    conversations: [],
    messages: [],
};

const conversationSlice = createSlice({
    name: 'conversations',
    initialState,
    reducers: {
        setSelectedConversationId(state, action: PayloadAction<string>) {
            state.selectedConversationId = action.payload;
        },

        clearSelectedConversation(state) {
            state.selectedConversationId = null;
        },

        setConversations(state, action: PayloadAction<Conversation[]>) {
            state.conversations = action.payload;
        },

        setMessages(state, action: PayloadAction<Message[]>) {
            state.messages = action.payload;
        },

       messageReceived(
            state,
            action: PayloadAction<Message>,
        ) {
            const message = action.payload;

            if (
                state.selectedConversationId !==
                message.conversationId
            ) {
                return;
            }

            const alreadyExists =
                state.messages.some(
                    m => m.id === message.id,
                );

            if (alreadyExists) {
                return;
            }

            state.messages.push(message);
        },

        markConversationRead: (
            state,
            action: PayloadAction<string>,
        ) => {
            const conversation =
                state.conversations.find(
                    c => c.id === action.payload,
                );

            if (conversation) {
                conversation.unreadCount = 0;
            }
        },

        incrementConversationUnread: (
            state,
            action: PayloadAction<string>,
        ) => {
            const conversation =
                state.conversations.find(
                    c => c.id === action.payload,
                );

            if (conversation) {
                conversation.unreadCount += 1;
            }
        },

        conversationUpdated(
            state,
            action: PayloadAction<ConversationUpdated>,
        ) {
            const update = action.payload;

            const conversation =
                state.conversations.find(
                    c =>
                        c.id ===
                        update.conversationId
                );

            if (!conversation) {
                return;
            }

            conversation.lastMessage =
                update.lastMessage;

            conversation.lastMessageAt =
                update.lastMessageAt;

            if (
                update.senderType ===
                    MessageSenderType.Customer &&
                state.selectedConversationId !==
                    update.conversationId
            ) {
                conversation.unreadCount += 1;
            }
        }
    }
})

export const {
    setSelectedConversationId,
    clearSelectedConversation,
    setConversations,
    setMessages,
    markConversationRead,
    incrementConversationUnread,
    conversationUpdated,
    messageReceived
} = conversationSlice.actions;


export default conversationSlice.reducer;