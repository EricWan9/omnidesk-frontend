import { useEffect, useRef, useState } from "react";

import ConversationList
    from "../components/conversations/ConversationList";

import ChatPanel from "../components/chat/ChatPanel";
import { getConversations, getMessages } from "../api/conversationApi";

import {
    useAppDispatch,
    useAppSelector,
} from "../store/hooks";

import {
    setSelectedConversationId,
    setConversations,
    setMessages
} from "../store/conversations/conversationSlice";
import { createConversationHubConnection } from "../realtime/conversationHub";
import type { HubConnection } from "@microsoft/signalr";

function AgentWorkspacePage() {

    const [isLoadingConversations, setIsLoadingConversations] = useState(false);

    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const selectedConversationId = useAppSelector(
        state => state.conversations.selectedConversationId
    );

    const conversations = useAppSelector(
        state => state.conversations.conversations
    );

    const messages = useAppSelector(
        state => state.conversations.messages
    );

    const [isSignalRConnected, setIsSignalRConnected] = useState(false);

    const dispatch = useAppDispatch();

    const connectionRef = useRef<HubConnection | null>(null);

    useEffect(() => {

        const connection = createConversationHubConnection();
        connectionRef.current = connection;

        async function startConnection() {
            try {
                await connection.start();

                setIsSignalRConnected(true);

                console.log(
                    "SignalR connected."
                );
            }
            catch (error) {
                console.error(
                    "Failed to connect to SignalR.",
                    error
                );
            }
        }

        startConnection();

        return () => {
            connection.stop();
        };

    }, []);

    useEffect(() => {
        

        if (!isSignalRConnected || selectedConversationId === null) {
            return;
        }

        const connection = connectionRef.current;

        if (connection === null) {
            return;
        }

        const conversationId = selectedConversationId;

        async function joinConversation() {
            try {

                if (connection === null) {
                    return;
                }

                await connection.invoke(
                    "SubscribeConversation",
                    conversationId
                );

                console.log(
                    `Joined conversation ${conversationId}`
                );
            }
            catch (error) {
                console.error(
                    "Failed to join conversation.",
                    error
                );
            }
        }

        joinConversation();

        return () => {
            void connection.invoke(
                "UnsubscribeConversation",
                conversationId
            );
        };

    }, [
        selectedConversationId,
        isSignalRConnected
    ]);

    useEffect(() => {

        async function loadConversations() {
            setIsLoadingConversations(true);
            setError(null);

            try {
                const data =
                    await getConversations();

                dispatch(setConversations(data));
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

    }, [dispatch]);

    useEffect(() => {

        if (selectedConversationId === null) {
            dispatch(setMessages([]));
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

                dispatch(setMessages(data));
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
                    onSelectConversation={(conversationId) => {
                        dispatch(setSelectedConversationId(conversationId));
                    }}
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