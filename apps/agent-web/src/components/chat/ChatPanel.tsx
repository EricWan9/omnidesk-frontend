import {
    useEffect,
    useRef,
    useState,
} from "react";

import type { Conversation }
    from "../../types/conversation";

import type { Message }
    from "../../types/message";

import styles
    from "./ChatPanel.module.css";

interface Props {
    conversation:
    Conversation | undefined;

    messages:
    Message[];

    onSendMessage:
    (content: string) =>
        void | Promise<void>;

    onBack?: () => void;
}

function formatMessageTime(
    value: string
): string {
    return new Date(value)
        .toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
}

function ChatPanel({
    conversation,
    messages,
    onSendMessage,
    onBack,
}: Props) {

    const [
        content,
        setContent,
    ] = useState("");

    const [
        isSending,
        setIsSending,
    ] = useState(false);

    const bottomRef =
        useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    if (!conversation) {
        return (
            <div className={styles.noSelection}>
                <div
                    className={
                        styles.noSelectionIcon
                    }
                >
                    💬
                </div>

                <h2>
                    Select a conversation
                </h2>

                <p>
                    Choose a conversation from
                    the list to view messages.
                </p>
            </div>
        );
    }

    async function handleSubmit(
        event: React.FormEvent
    ) {
        event.preventDefault();

        const value =
            content.trim();

        if (
            value.length === 0 ||
            isSending
        ) {
            return;
        }

        try {
            setIsSending(true);

            await onSendMessage(value);

            setContent("");
        }
        finally {
            setIsSending(false);
        }
    }

    return (
        <div className={styles.panel}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        className={
                            styles.mobileBackButton
                        }
                        type="button"
                        aria-label="Back to conversations"
                        onClick={onBack}
                    >
                        ←
                    </button>

                    <div>
                        <h2>
                            {conversation.customerName}
                        </h2>

                        <p>
                            {conversation.customerEmail}
                        </p>
                    </div>
                </div>

                <div className={styles.status}>
                    Active
                </div>
            </header>

            <div className={styles.messages}>
                {messages.length === 0 ? (
                    <div className={styles.empty}>
                        No messages yet.
                    </div>
                ) : (
                    messages.map(message => {

                        const senderType =
                            String(
                                message.senderType
                            ).toLowerCase();

                        const isAgent =
                            senderType === "agent";

                        return (
                            <div
                                key={message.id}
                                className={
                                    isAgent
                                        ? styles.messageRowAgent
                                        : styles.messageRowCustomer
                                }
                            >
                                <div
                                    className={
                                        isAgent
                                            ? styles.messageAgent
                                            : styles.messageCustomer
                                    }
                                >
                                    <div
                                        className={
                                            styles.sender
                                        }
                                    >
                                        {isAgent
                                            ? "You"
                                            : conversation.customerName}
                                    </div>

                                    <div
                                        className={
                                            styles.messageContent
                                        }
                                    >
                                        {message.content}
                                    </div>

                                    <div
                                        className={
                                            styles.messageTime
                                        }
                                    >
                                        {formatMessageTime(
                                            message.createdAt
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                <div ref={bottomRef} />
            </div>

            <form
                className={styles.composer}
                onSubmit={handleSubmit}
            >
                <input
                    className={styles.input}
                    value={content}
                    onChange={
                        event =>
                            setContent(
                                event.target.value
                            )
                    }
                    placeholder="Type a message..."
                    disabled={isSending}
                />

                <button
                    className={styles.sendButton}
                    type="submit"
                    disabled={
                        isSending ||
                        content.trim().length === 0
                    }
                >
                    {isSending
                        ? "Sending..."
                        : "Send"}
                </button>
            </form>
        </div>
    );
}

export default ChatPanel;