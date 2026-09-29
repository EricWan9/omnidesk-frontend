import type {
    AssignmentFilter,
    Conversation,
    ConversationStatusFilter,
} from "../../types/conversation";

import styles
    from "./ConversationList.module.css";

interface Props {
    conversations: Conversation[];
    selectedConversationId: string | null;
    onSelectConversation: (conversationId: string) => void;
    statusFilter: ConversationStatusFilter;
    assignmentFilter: AssignmentFilter;
    searchValue: string;
    onStatusFilterChange: (value: ConversationStatusFilter) => void;
    onAssignmentFilterChange: (value: AssignmentFilter) => void;
    onSearchChange: (value: string) => void;
    isLoading?: boolean;
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
    statusFilter,
    assignmentFilter,
    searchValue,
    onStatusFilterChange,
    onAssignmentFilterChange,
    onSearchChange,
    isLoading = false,
}: Props) {
    const statusOptions: { value: ConversationStatusFilter; label: string }[] = [
        { value: "open", label: "Open" },
        { value: "closed", label: "Closed" },
        { value: "all", label: "All" },
    ];

    const assignmentOptions: { value: AssignmentFilter; label: string }[] = [
        { value: "all", label: "All" },
        { value: "mine", label: "Mine" },
        { value: "unassigned", label: "Unassigned" },
    ];

    return (
        <div className={styles.wrapper}>
            <div className={styles.filters}>
                <div className={styles.filterSection}>
                    <span className={styles.filterLabel}>Status</span>
                    <div className={styles.filterGroup}>
                        {statusOptions.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                className={
                                    statusFilter === option.value
                                        ? `${styles.filterButton} ${styles.filterButtonActive}`
                                        : styles.filterButton
                                }
                                onClick={() => onStatusFilterChange(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <span className={styles.filterLabel}>Assigned</span>
                    <div className={styles.filterGroup}>
                        {assignmentOptions.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                className={
                                    assignmentFilter === option.value
                                        ? `${styles.filterButton} ${styles.filterButtonActive}`
                                        : styles.filterButton
                                }
                                onClick={() => onAssignmentFilterChange(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.searchBox}>
                <input
                    className={styles.searchInput}
                    type="search"
                    value={searchValue}
                    onChange={event => onSearchChange(event.target.value)}
                    placeholder="Search customer name or email"
                    aria-label="Search conversations"
                />
            </div>

            {isLoading ? (
                <div className={styles.empty}>Loading conversations...</div>
            ) : conversations.length === 0 ? (
                <div className={styles.empty}>
                    No conversations match the current filters.
                </div>
            ) : (
                <div className={styles.list}>
                    {conversations.map(conversation => {
                        const selected = conversation.id === selectedConversationId;

                        return (
                            <button
                                key={conversation.id}
                                type="button"
                                className={selected ? styles.itemSelected : styles.item}
                                onClick={() => onSelectConversation(conversation.id)}
                            >
                                <div className={styles.avatar}>
                                    {getInitials(conversation.customerName || "Anonymous")}
                                </div>

                                <div className={styles.content}>
                                    <div className={styles.topRow}>
                                        <span className={styles.name}>
                                            {conversation.customerName || "Anonymous"}
                                        </span>

                                        <span className={styles.time}>
                                            {formatTime(
                                                conversation.lastMessageAt ?? conversation.updatedAt
                                            )}
                                        </span>
                                    </div>

                                    <div className={styles.preview}>
                                        {conversation.lastMessage ?? "No messages yet"}
                                    </div>
                                </div>

                                {conversation.unreadCount > 0 && (
                                    <span className={styles.unreadBadge}>
                                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ConversationList;