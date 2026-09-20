import { MessageSenderType, type Message } from "../../types/message";

interface MessageItemProps {
    message: Message;
}

function MessageItem({
    message,
}: MessageItemProps) {
    return (
        <div>
            <strong>
                {message.messageSender.type === MessageSenderType.Agent
                    ? "Agent"
                    : "Customer"}
            </strong>

            <p>{message.content}</p>

            <small>
                {message.createdAt}
            </small>
        </div>
    );
}

export default MessageItem;