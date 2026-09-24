import { Attachment } from "@gh0st/core";

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
  search(query: string, options?: { fileIds?: string[]; limit?: number }): Promise<SearchResult[]>;
  remove(fileId: string): Promise<void>;
  clear(): Promise<void>;
}

export interface FileStorage {
  save(file: ProcessedFile): Promise<void>;
  get(fileId: string): Promise<ProcessedFile | null>;
  getAll(): Promise<ProcessedFile[]>;
  delete(fileId: string): Promise<void>;
}

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
] as const;

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 200;
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function isSupportedFileType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.includes(mimeType as any);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

export function createFileChunks(fileId: string, text: string): FileChunk[] {
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