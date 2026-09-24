import { FileStorage, ProcessedFile } from "./types.js";
export declare class IndexedDBFileStorage implements FileStorage {
    private db;
    initialize(): Promise<void>;
    save(file: ProcessedFile): Promise<void>;
    get(fileId: string): Promise<ProcessedFile | null>;
    getAll(): Promise<ProcessedFile[]>;
    delete(fileId: string): Promise<void>;
    close(): Promise<void>;
}
export declare function createFileStorage(): Promise<IndexedDBFileStorage>;
//# sourceMappingURL=storage.d.ts.map