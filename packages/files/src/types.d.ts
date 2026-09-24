export interface ProcessedFile {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    textContent: string;
    chunks: FileChunk[];
    extractedAt: number;
}
export interface FileChunk {
    id: string;
    fileId: string;
    content: string;
    startOffset: number;
    endOffset: number;
    tokenCount: number;
}
export interface SearchResult {
    chunk: FileChunk;
    score: number;
    snippet: string;
}
export interface FileProcessor {
    canProcess(mimeType: string): boolean;
    process(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile>;
}
export interface FileIndexer {
    index(file: ProcessedFile): Promise<void>;
    search(query: string, options?: {
        fileIds?: string[];
        limit?: number;
    }): Promise<SearchResult[]>;
    remove(fileId: string): Promise<void>;
    clear(): Promise<void>;
}
export interface FileStorage {
    save(file: ProcessedFile): Promise<void>;
    get(fileId: string): Promise<ProcessedFile | null>;
    getAll(): Promise<ProcessedFile[]>;
    delete(fileId: string): Promise<void>;
}
export declare const SUPPORTED_MIME_TYPES: readonly ["application/pdf", "text/plain", "text/markdown", "application/json", "text/csv", "text/javascript", "text/typescript", "text/python", "text/html", "text/css", "application/xml", "application/yaml", "application/x-yaml", "image/png", "image/jpeg", "image/webp", "image/gif"];
export declare const CHUNK_SIZE = 1000;
export declare const CHUNK_OVERLAP = 200;
export declare const MAX_FILE_SIZE: number;
export declare function isSupportedFileType(mimeType: string): boolean;
export declare function estimateTokens(text: string): number;
export declare function chunkText(text: string, chunkSize?: number, overlap?: number): string[];
export declare function createFileChunks(fileId: string, text: string): FileChunk[];
//# sourceMappingURL=types.d.ts.map