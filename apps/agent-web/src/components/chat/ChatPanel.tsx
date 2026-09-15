import {
    useEffect,
    useRef,
    useState,
} from "react";

import type { Conversation }
    from "../../types/conversation";

import {
    MessageSenderType,
    type Message,
} from "../../types/message";

import MessageAttachments
    from "./MessageAttachments";

import styles
    from "./ChatPanel.module.css";

interface Props {
    conversation:
        Conversation | undefined;

    messages:
        Message[];

    onSendMessage: (
        content: string,
        files: File[]
    ) => Promise<void>;

    onBack?: () => void;
}

const MAX_FILE_COUNT = 5;

const MAX_FILE_SIZE =
    10 * 1024 * 1024;

const ALLOWED_FILE_TYPES =
    new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "text/plain",
    ]);

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

    const [content, setContent] =
        useState("");

    const [isSending, setIsSending] =
        useState(false);

    const [
        selectedFiles,
        setSelectedFiles,
    ] = useState<File[]>([]);

    const [
        fileError,
        setFileError,
    ] = useState<string | null>(
        null
    );

    const bottomRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const fileInputRef =
        useRef<HTMLInputElement>(
            null
        );

    useEffect(() => {
        bottomRef.current
            ?.scrollIntoView({
                behavior: "smooth",
            });
    }, [messages]);

    useEffect(() => {
        setContent("");
        setSelectedFiles([]);
        setFileError(null);
    }, [conversation?.id]);

    function handleFileChange(
        event:
            React.ChangeEvent<HTMLInputElement>
    ) {
        const incoming =
            Array.from(
                event.target.files ?? []
            );

        event.target.value = "";

        if (incoming.length === 0) {
            return;
        }

        const invalidType =
            incoming.find(
                file =>
                    !ALLOWED_FILE_TYPES
                        .has(file.type)
            );

        if (invalidType) {
            setFileError(
                `Unsupported file type: ${invalidType.name}`
            );
            return;
        }

        const tooLarge =
            incoming.find(
                file =>
                    file.size >
                    MAX_FILE_SIZE
            );

        if (tooLarge) {
            setFileError(
                `${tooLarge.name} exceeds 10 MB.`
            );
            return;
        }

        const emptyFile =
            incoming.find(
                file =>
                    file.size <= 0
            );

        if (emptyFile) {
            setFileError(
                `${emptyFile.name} is empty.`
            );
            return;
        }

        setFileError(null);

        setSelectedFiles(
            current => {

                const combined = [
                    ...current,
                    ...incoming,
                ];

                if (
                    combined.length >
                    MAX_FILE_COUNT
                ) {
                    setFileError(
                        "Maximum 5 attachments per message."
                    );
                }

                return combined.slice(
                    0,
                    MAX_FILE_COUNT
                );
            }
        );
    }

    function removeSelectedFile(
        index: number
    ) {
        setSelectedFiles(
            current =>
                current.filter(
                    (_, currentIndex) =>
                        currentIndex !==
                        index
                )
        );

        setFileError(null);
    }

    async function handleSubmit(
        event: React.FormEvent
    ) {
        event.preventDefault();

        const value =
            content.trim();

        if (
            (
                value.length === 0 &&
                selectedFiles.length === 0
            ) ||
            isSending
        ) {
            return;
        }

        try {
            setIsSending(true);

            await onSendMessage(
                value,
                selectedFiles
            );

            setContent("");
            setSelectedFiles([]);
            setFileError(null);
        }
        catch (error) {
            console.error(
                "Failed to send message.",
                error
            );
        }
        finally {
            setIsSending(false);
        }
    }

    if (!conversation) {
        return (
            <div
                className={
                    styles.noSelection
                }
            >
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

    return (
        <div className={styles.panel}>

            <header
                className={styles.header}
            >
                <div
                    className={
                        styles.headerLeft
                    }
                >
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
                            {
                                conversation
                                    .customerName ||
                                "Anonymous"
                            }
                        </h2>

                        <p>
                            {
                                conversation
                                    .customerEmail ||
                                "No email provided"
                            }
                        </p>
                    </div>
                </div>

                <div
                    className={
                        styles.status
                    }
                >
                    Active
                </div>
            </header>

            <div
                className={
                    styles.messages
                }
            >
                {messages.length === 0 ? (
                    <div
                        className={
                            styles.empty
                        }
                    >
                        No messages yet.
                    </div>
                ) : (
                    messages.map(
                        message => {

                            const isAgent =
                                message
                                    .messageSender
                                    .type ===
                                MessageSenderType
                                    .Agent;

                            return (
                                <div
                                    key={
                                        message.id
                                    }
                                    className={
                                        isAgent
                                            ? styles
                                                .messageRowAgent
                                            : styles
                                                .messageRowCustomer
                                    }
                                >
                                    <div
                                        className={
                                            isAgent
                                                ? styles
                                                    .messageAgent
                                                : styles
                                                    .messageCustomer
                                        }
                                    >
                                        <div
                                            className={
                                                styles.sender
                                            }
                                        >
                                            {
                                                isAgent
                                                    ? "You"
                                                    : conversation
                                                        .customerName ||
                                                      "Anonymous"
                                            }
                                        </div>

                                        {message.content && (
                                            <div
                                                className={
                                                    styles
                                                        .messageContent
                                                }
                                            >
                                                {
                                                    message
                                                        .content
                                                }
                                            </div>
                                        )}

                                        <MessageAttachments
                                            attachments={
                                                message
                                                    .attachments
                                            }
                                        />

                                        <div
                                            className={
                                                styles
                                                    .messageTime
                                            }
                                        >
                                            {
                                                formatMessageTime(
                                                    message
                                                        .createdAt
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    )
                )}

                <div ref={bottomRef} />
            </div>

            {selectedFiles.length > 0 && (
                <div>
                    {selectedFiles.map(
                        (
                            file,
                            index
                        ) => (
                            <div
                                key={
                                    `${file.name}-${file.size}-${index}`
                                }
                            >
                                <span>
                                    {
                                        file.name
                                    }
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        isSending
                                    }
                                    onClick={() =>
                                        removeSelectedFile(
                                            index
                                        )
                                    }
                                >
                                    ×
                                </button>
                            </div>
                        )
                    )}
                </div>
            )}

            {fileError && (
                <div
                    className={
                        styles.error
                    }
                >
                    {fileError}
                </div>
            )}

            <form
                className={
                    styles.composer
                }
                onSubmit={
                    handleSubmit
                }
            >
                <input
                    className={
                        styles.input
                    }
                    value={content}
                    onChange={
                        event =>
                            setContent(
                                event.target
                                    .value
                            )
                    }
                    placeholder={
                        "Type a message..."
                    }
                    disabled={
                        isSending
                    }
                />

                <input
                    ref={
                        fileInputRef
                    }
                    type="file"
                    multiple
                    hidden
                    disabled={
                        isSending
                    }
                    onChange={
                        handleFileChange
                    }
                    accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                />

                <button
                    type="button"
                    disabled={
                        isSending
                    }
                    onClick={() =>
                        fileInputRef
                            .current
                            ?.click()
                    }
                    aria-label={
                        "Attach files"
                    }
                >
                    📎
                </button>

                <button
                    className={
                        styles.sendButton
                    }
                    type="submit"
                    disabled={
                        isSending ||
                        (
                            content
                                .trim()
                                .length === 0 &&
                            selectedFiles
                                .length === 0
                        )
                    }
                >
                    {
                        isSending
                            ? "Sending..."
                            : "Send"
                    }
                </button>
            </form>
        </div>
    );
}

export default ChatPanel;