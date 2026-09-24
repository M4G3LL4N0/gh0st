import { openDB, DBSchema, IDBPDatabase } from "idb";
import { FileStorage, ProcessedFile } from "./types.js";

interface FileDB extends DBSchema {
  files: {
    key: string;
    value: ProcessedFile;
    indexes: { "by-name": string; "by-extracted": number };
  };
}

const DB_NAME = "gh0st-files";

export class IndexedDBFileStorage implements FileStorage {
  private db: IDBPDatabase<FileDB> | null = null;

  async initialize(): Promise<void> {
    this.db = await openDB<FileDB>(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore("files", { keyPath: "id" });
        store.createIndex("by-name", "fileName");
        store.createIndex("by-extracted", "extractedAt");
      }
    });
  }

  async save(file: ProcessedFile): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.put("files", file);
  }

  async get(fileId: string): Promise<ProcessedFile | null> {
    if (!this.db) await this.initialize();
    const result = await this.db!.get("files", fileId);
    return result ?? null;
  }

  async getAll(): Promise<ProcessedFile[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAll("files");
  }

  async delete(fileId: string): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.delete("files", fileId);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export async function createFileStorage(): Promise<IndexedDBFileStorage> {
  const storage = new IndexedDBFileStorage();
  await storage.initialize();
  return storage;
}