import styles from "./AgentWorkspacePage.module.css";

import { useEffect, useRef, useState } from "react";

import ConversationList
    from "../components/conversations/ConversationList";

import ChatPanel from "../components/chat/ChatPanel";
import { getConversations, getMessages, markConversationAsRead, sendMessage } from "../api/conversationApi";

import {
    useAppDispatch,
    useAppSelector,
} from "../store/hooks";

import {
    setSelectedConversationId,
    clearSelectedConversation,
    setConversations,
    setMessages,
    messageReceived,
    markConversationRead,
    conversationUpdated
} from "../store/conversations/conversationSlice";
import { createConversationHubConnection } from "../realtime/conversationHub";
import type { HubConnection } from "@microsoft/signalr";
import type { Message } from "../types/message";
import type { ConversationUpdated } from "../types/conversation";

function AgentWorkspacePage() {

    const [isLoadingConversations, setIsLoadingConversations] = useState(false);

    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const selectedConversationId = useAppSelector(
        state => state.conversations.selectedConversationId
    );

    const selectedConversationIdRef = useRef<string | null>(null);

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
        selectedConversationIdRef.current = selectedConversationId;
    }, [selectedConversationId]);

    useEffect(() => {

        const connection = createConversationHubConnection();

        connectionRef.current = connection;

        connection.on(
            "MessageSent",
            (message: Message) => {
                dispatch(messageReceived(message));
            }
        );

        connection.on(
            "ConversationUpdated",
            (update: ConversationUpdated) => {
                dispatch(conversationUpdated(update));
            }
        );

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
        if (!selectedConversationId) {
            return;
        }

        async function loadConversation() {
            try {
                const messages =
                    await getMessages(
                        selectedConversationId!,
                    );

                dispatch(
                    setMessages(messages),
                );

                await markConversationAsRead(
                    selectedConversationId!,
                );

                dispatch(
                    markConversationRead(
                        selectedConversationId!,
                    ),
                );
            } catch (error) {
                console.error(
                    "Failed to load conversation.",
                    error,
                );
            }
        }

        void loadConversation();
    }, [
        selectedConversationId,
        dispatch,
    ]);

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

    async function handleSendMessage(
        content: string,
        files: File[]
    ): Promise<void> {

        if (selectedConversationId === null) {
            return;
        }

        if (
            !content.trim() &&
            files.length === 0
        ) {
            return;
        }

        try {
            await sendMessage(
                selectedConversationId,
                content,
                files
            );
        }
        catch (error) {
            console.error(
                "Failed to send message.",
                error
            );
        }
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.logo}>
                        OmniDesk
                    </h1>
                </div>

                <div className={styles.headerRight}>
                    Agent Workspace
                </div>
            </header>

            <main
                className={styles.workspace}
                data-chat-selected={
                    selectedConversationId !== null
                }
            >
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h2>Conversations</h2>
                    </div>

                    {error && (
                        <p className={styles.error}>
                            {error}
                        </p>
                    )}

                    {isLoadingConversations ? (
                        <p className={styles.state}>
                            Loading conversations...
                        </p>
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            selectedConversationId={
                                selectedConversationId
                            }
                            onSelectConversation={
                                (conversationId) => {
                                    dispatch(
                                        setSelectedConversationId(
                                            conversationId
                                        )
                                    );
                                }
                            }
                        />
                    )}
                </aside>

                <section className={styles.chat}>
                    {isLoadingMessages ? (
                        <p className={styles.state}>
                            Loading messages...
                        </p>
                    ) : (
                        <ChatPanel
                            conversation={selectedConversation}
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            onBack={() =>
                                dispatch(
                                    clearSelectedConversation()
                                )
                            }
                        />
                    )}
                </section>
            </main>
        </div>
    );
}

export default AgentWorkspacePage;