import type { Conversation }
    from "../../types/conversation";

import styles
    from "./ConversationList.module.css";

interface Props {
    conversations: Conversation[];

    selectedConversationId:
        string | null;

    onSelectConversation:
        (conversationId: string) => void;
}

function formatTime(
    value: string | null | undefined
): string {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function getInitials(
    name: string
): string {
    const parts =
        name.trim().split(/\s+/);

    return parts
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

function ConversationList({
    conversations,
    selectedConversationId,
    onSelectConversation,
}: Props) {

    if (conversations.length === 0) {
        return (
            <div className={styles.empty}>
                No conversations yet.
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {conversations.map(
                conversation => {

                    const selected =
                        conversation.id ===
                        selectedConversationId;

                    return (
                        <button
                            key={conversation.id}
                            type="button"
                            className={
                                selected
                                    ? styles.itemSelected
                                    : styles.item
                            }
                            onClick={() =>
                                onSelectConversation(
                                    conversation.id
                                )
                            }
                        >
                            <div
                                className={
                                    styles.avatar
                                }
                            >
                                {getInitials(
                                    conversation.customerName || "Anonymous"
                                )}
                            </div>

                            <div
                                className={
                                    styles.content
                                }
                            >
                                <div
                                    className={
                                        styles.topRow
                                    }
                                >
                                    <span
                                        className={
                                            styles.name
                                        }
                                    >
                                        {
                                            conversation.customerName || "Anonymous"
                                        }
                                    </span>

                                    <span
                                        className={
                                            styles.time
                                        }
                                    >
                                        {formatTime(
                                            conversation.lastMessageAt ??
                                            conversation.updatedAt
                                        )}
                                    </span>
                                </div>

                                <div
                                    className={
                                        styles.preview
                                    }
                                >
                                    {
                                        conversation.lastMessage ??
                                        "No messages yet"
                                    }
                                </div>
                            </div>

                            {conversation.unreadCount > 0 && (
                                <span className={styles.unreadBadge}>
                                    {conversation.unreadCount > 99
                                        ? "99+"
                                        : conversation.unreadCount}
                                </span>
                            )}
                            
                        </button>
                    );
                }
            )}
        </div>
    );
}

export default ConversationList;