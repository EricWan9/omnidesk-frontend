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

const conversationSlice = createSlice ({
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
        }
    }
})

export const { 
    setSelectedConversationId, 
    clearSelectedConversation,
    setConversations,
    setMessages
} = conversationSlice.actions;


export default conversationSlice.reducer;