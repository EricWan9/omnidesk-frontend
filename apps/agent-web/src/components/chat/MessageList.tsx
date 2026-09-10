import type { Message } from "../../types/message";
import MessageItem from "./MessageItem";

interface MessageListProps {
    messages: Message[];
}

function MessageList({
    messages,
}: MessageListProps) {
    if (messages.length === 0) {
        return (
            <p>No messages yet.</p>
        );
    }

    return (
        <div>
            {messages.map((message) => (
                <MessageItem
                    key={message.id}
                    message={message}
                />
            ))}
        </div>
    );
}

export default MessageList;