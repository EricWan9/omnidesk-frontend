import type { Conversation } from "../../types/conversation";
import ConversationItem from "./ConversationItem";

interface ConversationListProps {
    conversations: Conversation[];
    selectedConversationId: string | null;
    onSelectConversation: (id: string) => void;
}

function ConversationList({
    conversations,
    selectedConversationId,
    onSelectConversation,
}: ConversationListProps) {
    return (
        <div>
            <h2>Conversations</h2>

            {conversations.map((conversation) => (
                <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={
                        conversation.id ===
                        selectedConversationId
                    }
                    onSelect={onSelectConversation}
                />
            ))}
        </div>
    );
}

export default ConversationList;