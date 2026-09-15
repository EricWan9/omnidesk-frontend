import { apiFetchBlob }
    from "./apiClient";

export async function getAttachmentBlob(
    attachmentId: string,
    signal?: AbortSignal
): Promise<Blob> {

    return apiFetchBlob(
        `/api/attachments/${attachmentId}`,
        {
            signal,
        }
    );
}