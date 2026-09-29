import styles from "./AgentWorkspacePage.module.css";

import { useCallback, useEffect, useRef, useState } from "react";

import ConversationList
    from "../components/conversations/ConversationList";

import ChatPanel from "../components/chat/ChatPanel";
import {
    assignConversationToMe,
    closeConversation,
    getConversation,
    getConversations,
    getMessages,
    markConversationAsRead,
    reopenConversation,
    sendMessage,
    unassignConversation,
} from "../api/conversationApi";

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
    upsertConversation,
} from "../store/conversations/conversationSlice";
import { createConversationHubConnection } from "../realtime/conversationHub";
import type { HubConnection } from "@microsoft/signalr";
import type { Message } from "../types/message";
import type {
    AssignmentFilter,
    ConversationStatusFilter,
    ConversationUpdated,
} from "../types/conversation";

const PAGE_SIZE = 50;

function AgentWorkspacePage() {
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<ConversationStatusFilter>("open");
    const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [isSignalRConnected, setIsSignalRConnected] = useState(false);
    const [realtimeStatus, setRealtimeStatus] = useState<"connected" | "reconnecting" | "offline">("offline");
    const [isActionPending, setIsActionPending] = useState(false);

    const selectedConversationId = useAppSelector(
        state => state.conversations.selectedConversationId
    );

    const selectedConversationIdRef = useRef<string | null>(null);
    const statusFilterRef = useRef<ConversationStatusFilter>(statusFilter);
    const assignmentFilterRef = useRef<AssignmentFilter>(assignmentFilter);
    const searchTermRef = useRef<string>(searchTerm);
    const pageRef = useRef<number>(page);

    const conversations = useAppSelector(
        state => state.conversations.conversations
    );

    const messages = useAppSelector(
        state => state.conversations.messages
    );

    const dispatch = useAppDispatch();
    const connectionRef = useRef<HubConnection | null>(null);

    useEffect(() => {
        selectedConversationIdRef.current = selectedConversationId;
    }, [selectedConversationId]);

    useEffect(() => {
        statusFilterRef.current = statusFilter;
    }, [statusFilter]);

    useEffect(() => {
        assignmentFilterRef.current = assignmentFilter;
    }, [assignmentFilter]);

    useEffect(() => {
        searchTermRef.current = searchTerm;
    }, [searchTerm]);

    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 400);

        return () => window.clearTimeout(timeoutId);
    }, [searchInput]);

    const refreshCurrentPage = useCallback(
        async (targetPage: number = pageRef.current): Promise<void> => {
            setIsLoadingConversations(true);
            setError(null);

            try {
                const result = await getConversations(
                    targetPage,
                    PAGE_SIZE,
                    statusFilterRef.current,
                    assignmentFilterRef.current,
                    searchTermRef.current
                );

                dispatch(setConversations(result.conversations));
                setPage(result.page);
                pageRef.current = result.page;

                if (
                    selectedConversationIdRef.current &&
                    !result.conversations.some(
                        conversation => conversation.id === selectedConversationIdRef.current
                    )
                ) {
                    dispatch(clearSelectedConversation());
                    dispatch(setMessages([]));
                }
            } catch (error) {
                console.error("Failed to refresh conversations.", error);

                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("Failed to load conversations.");
                }
            } finally {
                setIsLoadingConversations(false);
            }
        },
        [dispatch]
    );

    useEffect(() => {
        const loadCurrentPage = async () => {
            await refreshCurrentPage(1);
        };

        void loadCurrentPage();
    }, [statusFilter, assignmentFilter, searchTerm, refreshCurrentPage]);

    useEffect(() => {
        const connection = createConversationHubConnection();

        connectionRef.current = connection;

        connection.on(
            "MessageSent",
            async (message: Message) => {
                dispatch(messageReceived(message));

                const selectedId = selectedConversationIdRef.current;
                if (selectedId === message.conversationId) {
                    dispatch(markConversationRead(selectedId));

                    try {
                        await markConversationAsRead(selectedId);
                    } catch (error) {
                        console.error("Failed to mark conversation as read.", error);
                    }
                }
            }
        );

        connection.on(
            "ConversationUpdated",
            async (update: ConversationUpdated) => {
                try {
                    const latestConversation = await getConversation(update.conversationId);
                    dispatch(upsertConversation(latestConversation));
                    await refreshCurrentPage(pageRef.current);
                } catch (error) {
                    console.error("Failed to refresh conversation.", error);
                }
            }
        );

        let disposed = false;

        async function resyncAfterReconnect() {
            try {
                const result = await getConversations(
                    pageRef.current,
                    PAGE_SIZE,
                    statusFilterRef.current,
                    assignmentFilterRef.current,
                    searchTermRef.current
                );

                if (!disposed) {
                    dispatch(setConversations(result.conversations));
                    setPage(result.page);
                    pageRef.current = result.page;
                }
            } catch (error) {
                console.error("Failed to resync conversations.", error);
            }

            const selectedId = selectedConversationIdRef.current;

            if (!selectedId) {
                return;
            }

            try {
                const latestMessages = await getMessages(selectedId);

                if (
                    disposed ||
                    selectedConversationIdRef.current !== selectedId
                ) {
                    return;
                }

                dispatch(setMessages(latestMessages));
                dispatch(markConversationRead(selectedId));

                try {
                    await markConversationAsRead(selectedId);
                } catch (error) {
                    console.error("Failed to persist read state after reconnect.", error);
                }
            } catch (error) {
                console.error("Failed to resync current conversation.", error);
            }
        }

        connection.onreconnecting(error => {
            if (disposed) {
                return;
            }

            setIsSignalRConnected(false);
            setRealtimeStatus("reconnecting");
            console.warn("SignalR reconnecting.", error);
        });

        connection.onreconnected(() => {
            if (disposed) {
                return;
            }

            setIsSignalRConnected(true);
            setRealtimeStatus("connected");
            console.log("SignalR reconnected.");
            void resyncAfterReconnect();
        });

        connection.onclose(error => {
            if (disposed) {
                return;
            }

            setIsSignalRConnected(false);
            setRealtimeStatus("offline");
            console.error("SignalR connection closed.", error);
        });

        async function startConnection() {
            try {
                await connection.start();
                setIsSignalRConnected(true);
                setRealtimeStatus("connected");
                console.log("SignalR connected.");
            } catch (error) {
                console.error("Failed to connect to SignalR.", error);
            }
        }

        void startConnection();

        return () => {
            disposed = true;
            connection.stop();
        };
    }, [dispatch, refreshCurrentPage]);

    useEffect(() => {
        if (!isSignalRConnected || selectedConversationId === null) {
            return;
        }

        const connection = connectionRef.current;

        if (connection === null) {
            return;
        }

        const conversationId = selectedConversationId;
        const currentConnection = connection;

        async function joinConversation() {
            try {
                if (currentConnection.state !== "Connected") {
                    return;
                }

                await currentConnection.invoke("SubscribeConversation", conversationId);
                console.log(`Joined conversation ${conversationId}`);
            } catch (error) {
                console.error("Failed to join conversation.", error);
            }
        }

        void joinConversation();

        return () => {
            if (currentConnection.state === "Connected") {
                void currentConnection.invoke("UnsubscribeConversation", conversationId);
            }
        };
    }, [selectedConversationId, isSignalRConnected]);

    useEffect(() => {
        if (selectedConversationId === null) {
            dispatch(setMessages([]));
            return;
        }

        const conversationId = selectedConversationId;
        let cancelled = false;

        async function loadConversation() {
            setIsLoadingMessages(true);
            setError(null);

            try {
                const latestMessages = await getMessages(conversationId);

                if (cancelled) {
                    return;
                }

                dispatch(setMessages(latestMessages));
                dispatch(markConversationRead(conversationId));

                try {
                    await markConversationAsRead(conversationId);
                } catch (error) {
                    console.error("Failed to persist read state.", error);
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("Failed to load messages.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingMessages(false);
                }
            }
        }

        void loadConversation();

        return () => {
            cancelled = true;
        };
    }, [selectedConversationId, dispatch]);

    const selectedConversation = conversations.find(
        conversation => conversation.id === selectedConversationId
    );

    const handleStatusFilterChange = (value: ConversationStatusFilter) => {
        setStatusFilter(value);
        setPage(1);
        pageRef.current = 1;
    };

    const handleAssignmentFilterChange = (value: AssignmentFilter) => {
        setAssignmentFilter(value);
        setPage(1);
        pageRef.current = 1;
    };

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        setPage(1);
        pageRef.current = 1;
    };

    async function handleSendMessage(content: string, files: File[]): Promise<void> {
        if (selectedConversationId === null) {
            return;
        }

        if (!content.trim() && files.length === 0) {
            return;
        }

        try {
            const response = await sendMessage(selectedConversationId, content, files);
            dispatch(messageReceived(response));
        } catch (error) {
            console.error("Failed to send message.", error);
        }
    }

    async function handleCloseConversation() {
        if (!selectedConversationId) {
            return;
        }

        setIsActionPending(true);

        try {
            await closeConversation(selectedConversationId);
            await refreshCurrentPage(pageRef.current);
        } catch (error) {
            console.error("Failed to close conversation.", error);
        } finally {
            setIsActionPending(false);
        }
    }

    async function handleReopenConversation() {
        if (!selectedConversationId) {
            return;
        }

        setIsActionPending(true);

        try {
            await reopenConversation(selectedConversationId);
            await refreshCurrentPage(pageRef.current);
        } catch (error) {
            console.error("Failed to reopen conversation.", error);
        } finally {
            setIsActionPending(false);
        }
    }

    async function handleAssignToMe() {
        if (!selectedConversationId) {
            return;
        }

        setIsActionPending(true);

        try {
            await assignConversationToMe(selectedConversationId);
            await refreshCurrentPage(pageRef.current);
        } catch (error) {
            console.error("Failed to assign conversation to current agent.", error);
        } finally {
            setIsActionPending(false);
        }
    }

    async function handleUnassignConversation() {
        if (!selectedConversationId) {
            return;
        }

        setIsActionPending(true);

        try {
            await unassignConversation(selectedConversationId);
            await refreshCurrentPage(pageRef.current);
        } catch (error) {
            console.error("Failed to unassign conversation.", error);
        } finally {
            setIsActionPending(false);
        }
    }

    const connectionLabel =
        realtimeStatus === "connected"
            ? "Connected"
            : realtimeStatus === "reconnecting"
                ? "Reconnecting…"
                : "Offline";

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <div className={styles.brandMark}>O</div>
                    <div>
                        <div className={styles.brandName}>OmniDesk</div>
                        <div className={styles.brandDescription}>Agent Workspace</div>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.connectionStatus}>
                        <span
                            className={
                                realtimeStatus === "connected"
                                    ? styles.connectionDotOnline
                                    : styles.connectionDotOffline
                            }
                        />
                        <span>{connectionLabel}</span>
                    </div>
                    <div className={styles.agentBadge}>Agent</div>
                </div>
            </header>

            <main
                className={styles.workspace}
                data-chat-selected={selectedConversationId !== null}
            >
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h2>Conversations</h2>
                    </div>

                    <div className={styles.sidebarContent}>
                        {error && <p className={styles.error}>{error}</p>}

                        <ConversationList
                            conversations={conversations}
                            selectedConversationId={selectedConversationId}
                            onSelectConversation={conversationId => {
                                dispatch(setSelectedConversationId(conversationId));
                            }}
                            statusFilter={statusFilter}
                            assignmentFilter={assignmentFilter}
                            searchValue={searchInput}
                            onStatusFilterChange={handleStatusFilterChange}
                            onAssignmentFilterChange={handleAssignmentFilterChange}
                            onSearchChange={handleSearchChange}
                            isLoading={isLoadingConversations}
                        />
                    </div>
                </aside>

                <section className={styles.chat}>
                    {isLoadingMessages ? (
                        <p className={styles.state}>Loading messages...</p>
                    ) : (
                        <ChatPanel
                            conversation={selectedConversation}
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            onBack={() => dispatch(clearSelectedConversation())}
                            onCloseConversation={handleCloseConversation}
                            onReopenConversation={handleReopenConversation}
                            onAssignToMe={handleAssignToMe}
                            onUnassignConversation={handleUnassignConversation}
                            isActionPending={isActionPending}
                        />
                    )}
                </section>
            </main>
        </div>
    );
}

export default AgentWorkspacePage;