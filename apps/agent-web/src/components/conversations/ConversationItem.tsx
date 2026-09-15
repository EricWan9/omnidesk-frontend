import type { Conversation } from "../../types/conversation";

interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

function ConversationItem({
    conversation,
    isSelected,
    onSelect,
}: ConversationItemProps) {
    return (
        <button
            type="button"
            onClick={() => onSelect(conversation.id)}
        >
            <div>
                {isSelected ? "> " : ""}
                {conversation.customerName || "Anonymous"}
            </div>

            <div>
                {conversation.lastMessage}
            </div>

            {conversation.unreadMessageCount > 0 && (
                <div>
                    Unread: {conversation.unreadMessageCount}
                </div>
            )}
        </button>
    );
}

export default ConversationItem;