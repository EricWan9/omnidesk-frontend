import type { Conversation }
    from "../../types/conversation";
import type { Message } from "../../types/message";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";

interface ChatPanelProps {
    conversation: Conversation | undefined;
    messages: Message[];
    onSendMessage: (content: string) => void;
}

function ChatPanel({
    conversation,
    messages,
    onSendMessage,
}: ChatPanelProps) {
    if (!conversation) {
        return (
            <div>
                <p>
                    Select a conversation to start.
                </p>
            </div>
        );
    }

    return (
        <div>
            <h2>
                {conversation.customerName}
            </h2>

            <p>
                Status: {conversation.status}
            </p>

            <MessageList
                messages={messages}
            />

            <MessageInput
                onSendMessage={onSendMessage}
            />
        </div>
    );
}

export default ChatPanel;