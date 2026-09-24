import { FileIndexer, ProcessedFile, SearchResult } from "./types.js";
export declare class LexicalFileIndexer implements FileIndexer {
    private fileIndex;
    index(file: ProcessedFile): Promise<void>;
    search(query: string, options?: {
        fileIds?: string[];
        limit?: number;
    }): Promise<SearchResult[]>;
    remove(fileId: string): Promise<void>;
    clear(): Promise<void>;
    getIndexedFileIds(): string[];
    getIndexedFileCount(): number;
}
export declare function createFileIndexer(): FileIndexer;
//# sourceMappingURL=indexer.d.ts.map