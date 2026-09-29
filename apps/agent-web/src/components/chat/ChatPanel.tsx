import {
    useEffect,
    useRef,
    useState,
} from "react";

import { getAccessToken } from "../../auth/tokenStore";
import type { Conversation } from "../../types/conversation";
import {
    getConversationStatusLabel,
    isConversationClosed,
} from "../../types/conversation";

import {
    MessageSenderType,
    type Message,
} from "../../types/message";

import MessageAttachments
    from "./MessageAttachments";

import styles
    from "./ChatPanel.module.css";

interface Props {
    conversation: Conversation | undefined;
    messages: Message[];
    onSendMessage: (content: string, files: File[]) => Promise<void>;
    onBack?: () => void;
    onCloseConversation?: () => Promise<void> | void;
    onReopenConversation?: () => Promise<void> | void;
    onAssignToMe?: () => Promise<void> | void;
    onUnassignConversation?: () => Promise<void> | void;
    isActionPending?: boolean;
}

const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
]);

function formatMessageTime(value: string): string {
    return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function getCurrentUserId(): string | null {
    const token = getAccessToken();

    if (!token) {
        return null;
    }

    try {
        const payload = JSON.parse(
            atob(token.split(".")[1] ?? "")
        ) as Record<string, string | undefined>;

        return (
            payload.sub ??
            payload.userId ??
            payload.nameid ??
            null
        );
    } catch {
        return null;
    }
}

function ChatPanel({
    conversation,
    messages,
    onSendMessage,
    onBack,
    onCloseConversation,
    onReopenConversation,
    onAssignToMe,
    onUnassignConversation,
    isActionPending = false,
}: Props) {
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const isClosedConversation = conversation ? isConversationClosed(conversation.status) : false;
    const currentUserId = getCurrentUserId();

    const assignmentLabel = conversation?.assignedUserId
        ? conversation.assignedUserId === currentUserId
            ? "Assigned to you"
            : conversation.assignedUserName ?? conversation.assignedUserEmail ?? "Assigned"
        : "Unassigned";

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const incoming = Array.from(event.target.files ?? []);
        event.target.value = "";

        if (incoming.length === 0) {
            return;
        }

        const invalidType = incoming.find(file => !ALLOWED_FILE_TYPES.has(file.type));

        if (invalidType) {
            setFileError(`Unsupported file type: ${invalidType.name}`);
            return;
        }

        const tooLarge = incoming.find(file => file.size > MAX_FILE_SIZE);

        if (tooLarge) {
            setFileError(`${tooLarge.name} exceeds 10 MB.`);
            return;
        }

        const emptyFile = incoming.find(file => file.size <= 0);

        if (emptyFile) {
            setFileError(`${emptyFile.name} is empty.`);
            return;
        }

        setFileError(null);

        setSelectedFiles(current => {
            const combined = [...current, ...incoming];

            if (combined.length > MAX_FILE_COUNT) {
                setFileError("Maximum 5 attachments per message.");
            }

            return combined.slice(0, MAX_FILE_COUNT);
        });
    }

    function removeSelectedFile(index: number) {
        setSelectedFiles(current => current.filter((_, currentIndex) => currentIndex !== index));
        setFileError(null);
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!conversation || isClosedConversation) {
            return;
        }

        const value = content.trim();

        if ((value.length === 0 && selectedFiles.length === 0) || isSending) {
            return;
        }

        try {
            setIsSending(true);
            await onSendMessage(value, selectedFiles);
            setContent("");
            setSelectedFiles([]);
            setFileError(null);
        } catch (error) {
            console.error("Failed to send message.", error);
        } finally {
            setIsSending(false);
        }
    }

    if (!conversation) {
        return (
            <div className={styles.noSelection}>
                <div className={styles.noSelectionIcon}>💬</div>
                <h2>Select a conversation</h2>
                <p>Choose a conversation from the list to view messages.</p>
            </div>
        );
    }

    return (
        <div className={styles.panel} key={conversation.id}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        className={styles.mobileBackButton}
                        type="button"
                        aria-label="Back to conversations"
                        onClick={onBack}
                    >
                        ←
                    </button>

                    <div>
                        <h2>{conversation.customerName || "Anonymous"}</h2>
                        <p>{conversation.customerEmail || "No email provided"}</p>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <span
                        className={
                            isClosedConversation
                                ? `${styles.status} ${styles.statusClosed}`
                                : `${styles.status} ${styles.statusOpen}`
                        }
                    >
                        {getConversationStatusLabel(conversation.status)}
                    </span>
                </div>
            </header>

            <div className={styles.profileCard}>
                <div className={styles.profileGrid}>
                    <div className={styles.profileRow}>
                        <span className={styles.profileLabel}>Customer</span>
                        <span className={styles.profileValue}>{conversation.customerName || "Anonymous"}</span>
                    </div>
                    <div className={styles.profileRow}>
                        <span className={styles.profileLabel}>Email</span>
                        <span className={styles.profileValue}>{conversation.customerEmail || "No email provided"}</span>
                    </div>
                    <div className={styles.profileRow}>
                        <span className={styles.profileLabel}>Status</span>
                        <span className={styles.profileValue}>{getConversationStatusLabel(conversation.status)}</span>
                    </div>
                    <div className={styles.profileRow}>
                        <span className={styles.profileLabel}>Assignment</span>
                        <span className={styles.profileValue}>{assignmentLabel}</span>
                    </div>
                    <div className={styles.profileRow}>
                        <span className={styles.profileLabel}>Started</span>
                        <span className={styles.profileValue}>{formatDateTime(conversation.createdAt ?? conversation.updatedAt)}</span>
                    </div>
                    <div className={styles.profileRow}>
                        <span className={styles.profileLabel}>Last activity</span>
                        <span className={styles.profileValue}>{formatDateTime(conversation.lastMessageAt ?? conversation.updatedAt)}</span>
                    </div>
                </div>

                <div className={styles.actionButtons}>
                    {isClosedConversation ? (
                        <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionPrimary}`}
                            onClick={onReopenConversation}
                            disabled={isActionPending}
                        >
                            Reopen conversation
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionPrimary}`}
                            onClick={onCloseConversation}
                            disabled={isActionPending}
                        >
                            Close conversation
                        </button>
                    )}

                    {!conversation.assignedUserId ? (
                        <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionSecondary}`}
                            onClick={onAssignToMe}
                            disabled={isActionPending}
                        >
                            Assign to me
                        </button>
                    ) : (
                        <>
                            {conversation.assignedUserId !== currentUserId && (
                                <button
                                    type="button"
                                    className={`${styles.actionButton} ${styles.actionSecondary}`}
                                    onClick={onAssignToMe}
                                    disabled={isActionPending}
                                >
                                    Assign to me
                                </button>
                            )}

                            <button
                                type="button"
                                className={`${styles.actionButton} ${styles.actionTertiary}`}
                                onClick={onUnassignConversation}
                                disabled={isActionPending}
                            >
                                Unassign
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.messages}>
                {messages.length === 0 ? (
                    <div className={styles.empty}>No messages yet.</div>
                ) : (
                    messages.map(message => {
                        const isAgent = message.messageSender.type === MessageSenderType.Agent;

                        return (
                            <div
                                key={message.id}
                                className={
                                    isAgent ? styles.messageRowAgent : styles.messageRowCustomer
                                }
                            >
                                <div
                                    className={
                                        isAgent ? styles.messageAgent : styles.messageCustomer
                                    }
                                >
                                    <div className={styles.sender}>
                                        {isAgent ? "You" : conversation.customerName || "Anonymous"}
                                    </div>

                                    {message.content && (
                                        <div className={styles.messageContent}>{message.content}</div>
                                    )}

                                    <MessageAttachments attachments={message.attachments} />

                                    <div className={styles.messageTime}>
                                        {formatMessageTime(message.createdAt)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                <div ref={bottomRef} />
            </div>

            {isClosedConversation && (
                <div className={styles.closedNotice}>This conversation is closed.</div>
            )}

            {selectedFiles.length > 0 && (
                <div className={styles.attachmentsBar}>
                    {selectedFiles.map((file, index) => (
                        <div key={`${file.name}-${file.size}-${index}`} className={styles.attachmentChip}>
                            <span>{file.name}</span>
                            <button
                                type="button"
                                disabled={isSending || isClosedConversation}
                                onClick={() => removeSelectedFile(index)}
                                aria-label={`Remove ${file.name}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {fileError && <div className={styles.error}>{fileError}</div>}

            <form className={styles.composer} onSubmit={handleSubmit}>
                <input
                    className={styles.input}
                    value={content}
                    onChange={event => setContent(event.target.value)}
                    placeholder={isClosedConversation ? "This conversation is closed." : "Type a message..."}
                    disabled={isSending || isClosedConversation}
                />

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    disabled={isSending || isClosedConversation}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                />

                <button
                    type="button"
                    disabled={isSending || isClosedConversation}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach files"
                    className={styles.attachButton}
                >
                    📎
                </button>

                <button
                    className={styles.sendButton}
                    type="submit"
                    disabled={
                        isSending ||
                        isClosedConversation ||
                        (content.trim().length === 0 && selectedFiles.length === 0)
                    }
                >
                    {isSending ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
}

export default ChatPanel;