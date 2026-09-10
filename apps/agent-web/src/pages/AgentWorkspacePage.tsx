import { useEffect, useState } from "react";

import ConversationList
    from "../components/conversations/ConversationList";

import type { Conversation }
    from "../types/conversation";
import ChatPanel from "../components/chat/ChatPanel";
import type { Message } from "../types/message";
import { getConversations, getMessages } from "../api/conversationApi";

function AgentWorkspacePage() {

    const [
        conversations,
        setConversations,
    ] = useState<Conversation[]>([]);

    const [
        messages,
        setMessages,
    ] = useState<Message[]>([]);

    const [
        selectedConversationId,
        setSelectedConversationId,
    ] = useState<string | null>(null);

    const [
        isLoadingConversations,
        setIsLoadingConversations,
    ] = useState(false);

    const [
        isLoadingMessages,
        setIsLoadingMessages,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    useEffect(() => {

        async function loadConversations() {
            setIsLoadingConversations(true);
            setError(null);

            try {
                const data =
                    await getConversations();

                setConversations(data);
            }
            catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                }
                else {
                    setError(
                        "Failed to load conversations."
                    );
                }
            }
            finally {
                setIsLoadingConversations(false);
            }
        }

        loadConversations();

    }, []);

    useEffect(() => {

        if (selectedConversationId === null) {
            setMessages([]);
            return;
        }

        const conversationId = selectedConversationId;

        async function loadMessages() {
            setIsLoadingMessages(true);
            setError(null);

            try {
                const data =
                    await getMessages(
                        conversationId
                    );

                setMessages(data);
            }
            catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                }
                else {
                    setError(
                        "Failed to load messages."
                    );
                }
            }
            finally {
                setIsLoadingMessages(false);
            }
        }

        loadMessages();

    }, [selectedConversationId]);

    const selectedConversation =
    conversations.find(
        (conversation) =>
            conversation.id === selectedConversationId
    );

    return (
        <div>
            <h1>OmniDesk</h1>

            {error && (
                <p>{error}</p>
            )}

            {isLoadingConversations ? (
                <p>Loading conversations...</p>
            ) : (
                <ConversationList
                    conversations={conversations}
                    selectedConversationId={
                        selectedConversationId
                    }
                    onSelectConversation={
                        setSelectedConversationId
                    }
                />
            )}

            {isLoadingMessages ? (
                <p>Loading messages...</p>
            ) : (
                <ChatPanel
                    conversation={selectedConversation}
                    messages={messages} onSendMessage={function (content: string): void {
                        throw new Error("Function not implemented.");
                    }} />
            )}
        </div>
    );
}

export default AgentWorkspacePage;