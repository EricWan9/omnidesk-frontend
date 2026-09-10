import { useState, type FormEvent } from "react";

interface MessageInputProps {
    onSendMessage: (content: string) => void;
}

function MessageInput({
    onSendMessage,
}: MessageInputProps) {
    const [text, setText] = useState("");

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const trimmedText = text.trim();

        if (!trimmedText) {
            return;
        }

        onSendMessage(trimmedText);

        setText("");
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(event) =>
                    setText(event.target.value)
                }
            />

            <button type="submit">
                Send
            </button>
        </form>
    );
}

export default MessageInput;