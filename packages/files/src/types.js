export const SUPPORTED_MIME_TYPES = [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/json",
    "text/csv",
    "text/javascript",
    "text/typescript",
    "text/python",
    "text/html",
    "text/css",
    "application/xml",
    "application/yaml",
    "application/x-yaml",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif"
];
export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 200;
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export function isSupportedFileType(mimeType) {
    return SUPPORTED_MIME_TYPES.includes(mimeType);
}
export function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
export function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }
    return chunks;
}
export function createFileChunks(fileId, text) {
    const chunks = chunkText(text);
    return chunks.map((content, index) => {
        const startOffset = index * (CHUNK_SIZE - CHUNK_OVERLAP);
        return {
            id: `${fileId}-chunk-${index}`,
            fileId,
            content,
            startOffset,
            endOffset: startOffset + content.length,
            tokenCount: estimateTokens(content)
        };
    });
}
//# sourceMappingURL=types.js.map