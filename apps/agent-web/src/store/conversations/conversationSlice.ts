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

        messageReceived(state, action: PayloadAction<Message>) {
            const message = action.payload;

            if (state.selectedConversationId !== message.conversationId) {
                return;
            }

            const alreadyExists = state.messages.some(
                m => m.id === message.id
            );

            if (alreadyExists) {
                return;
            }

            state.messages.push(message);
        },
    }
})

export const {
    setSelectedConversationId,
    clearSelectedConversation,
    setConversations,
    setMessages,
    messageReceived
} = conversationSlice.actions;


export default conversationSlice.reducer;