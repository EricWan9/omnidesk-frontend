import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Conversation } from '../../types/conversation';
import type { Message } from '../../types/message';

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

        upsertConversation(
            state,
            action: PayloadAction<Conversation>,
        ) {
            const latestConversation = action.payload;
            const conversationToStore = 
                state.selectedConversationId === latestConversation.id
                ? {
                    ...latestConversation,
                    unreadCount: 0,
                }
                : latestConversation;

            const index = state.conversations.findIndex(
                c => c.id === latestConversation.id
            );

            if (index === -1) {
                state.conversations.push(conversationToStore);
            } else {
                state.conversations[index] = conversationToStore;
            }

            state.conversations.sort(
                (a, b) =>
                    Date.parse(b.updatedAt) -
                    Date.parse(a.updatedAt)
            );
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
    upsertConversation,
    messageReceived
} = conversationSlice.actions;


export default conversationSlice.reducer;