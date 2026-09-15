import {
    useEffect,
    useState,
} from "react";

import type { MessageAttachment }
    from "../../types/message";

import { getAttachmentBlob }
    from "../../api/attachmentApi";

import styles
    from "./MessageAttachments.module.css";

interface Props {
    attachments: MessageAttachment[];
}

function formatFileSize(
    bytes: number
): string {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes / 1024 / 1024
    ).toFixed(1)} MB`;
}

function AttachmentItem({
    attachment,
}: {
    attachment: MessageAttachment;
}) {

    const isImage =
        attachment.contentType
            .startsWith("image/");

    const [imageUrl, setImageUrl] =
        useState<string | null>(null);

    const [isLoading, setIsLoading] =
        useState(isImage);

    const [loadFailed, setLoadFailed] =
        useState(false);

    useEffect(() => {

        if (!isImage) {
            return;
        }

        const controller =
            new AbortController();

        let objectUrl: string | null =
            null;

        async function loadImage() {
            try {
                setIsLoading(true);
                setLoadFailed(false);

                const blob =
                    await getAttachmentBlob(
                        attachment.id,
                        controller.signal
                    );

                objectUrl =
                    URL.createObjectURL(blob);

                setImageUrl(objectUrl);
            }
            catch (error) {

                if (
                    error instanceof DOMException &&
                    error.name === "AbortError"
                ) {
                    return;
                }

                console.error(
                    "Failed to load attachment.",
                    error
                );

                setLoadFailed(true);
            }
            finally {
                setIsLoading(false);
            }
        }

        void loadImage();

        return () => {
            controller.abort();

            if (objectUrl) {
                URL.revokeObjectURL(
                    objectUrl
                );
            }
        };

    }, [
        attachment.id,
        isImage,
    ]);

    async function handleDownload() {

        try {
            const blob =
                await getAttachmentBlob(
                    attachment.id
                );

            const url =
                URL.createObjectURL(blob);

            const anchor =
                document.createElement("a");

            anchor.href = url;

            anchor.download =
                attachment.fileName;

            document.body.appendChild(
                anchor
            );

            anchor.click();

            anchor.remove();

            window.setTimeout(
                () =>
                    URL.revokeObjectURL(
                        url
                    ),
                1000
            );
        }
        catch (error) {
            console.error(
                "Failed to download attachment.",
                error
            );
        }
    }

    if (isImage) {
        return (
            <div
                className={
                    styles.imageAttachment
                }
            >
                {isLoading && (
                    <div
                        className={
                            styles.loading
                        }
                    >
                        Loading image...
                    </div>
                )}

                {loadFailed && (
                    <button
                        type="button"
                        className={
                            styles.fileCard
                        }
                        onClick={
                            handleDownload
                        }
                    >
                        Failed to preview.
                        Download{" "}
                        {attachment.fileName}
                    </button>
                )}

                {imageUrl && (
                    <button
                        type="button"
                        className={
                            styles.imageButton
                        }
                        onClick={
                            handleDownload
                        }
                        title={
                            `Download ${attachment.fileName}`
                        }
                    >
                        <img
                            className={
                                styles.image
                            }
                            src={imageUrl}
                            alt={
                                attachment.fileName
                            }
                        />
                    </button>
                )}

                <div
                    className={
                        styles.fileMeta
                    }
                >
                    {attachment.fileName}
                    {" · "}
                    {formatFileSize(
                        attachment.size
                    )}
                </div>
            </div>
        );
    }

    return (
        <button
            type="button"
            className={styles.fileCard}
            onClick={handleDownload}
        >
            <span
                className={
                    styles.fileIcon
                }
            >
                📄
            </span>

            <span
                className={
                    styles.fileInfo
                }
            >
                <span
                    className={
                        styles.fileName
                    }
                >
                    {attachment.fileName}
                </span>

                <span
                    className={
                        styles.fileSize
                    }
                >
                    {formatFileSize(
                        attachment.size
                    )}
                </span>
            </span>
        </button>
    );
}

function MessageAttachments({
    attachments,
}: Props) {

    if (
        !attachments ||
        attachments.length === 0
    ) {
        return null;
    }

    return (
        <div
            className={
                styles.attachments
            }
        >
            {attachments.map(
                attachment => (
                    <AttachmentItem
                        key={
                            attachment.id
                        }
                        attachment={
                            attachment
                        }
                    />
                )
            )}
        </div>
    );
}

export default MessageAttachments;