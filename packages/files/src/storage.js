import { openDB } from "idb";
const DB_NAME = "gh0st-files";
export class IndexedDBFileStorage {
    db = null;
    async initialize() {
        this.db = await openDB(DB_NAME, 1, {
            upgrade(db) {
                const store = db.createObjectStore("files", { keyPath: "id" });
                store.createIndex("by-name", "fileName");
                store.createIndex("by-extracted", "extractedAt");
            }
        });
    }
    async save(file) {
        if (!this.db)
            await this.initialize();
        await this.db.put("files", file);
    }
    async get(fileId) {
        if (!this.db)
            await this.initialize();
        const result = await this.db.get("files", fileId);
        return result ?? null;
    }
    async getAll() {
        if (!this.db)
            await this.initialize();
        return this.db.getAll("files");
    }
    async delete(fileId) {
        if (!this.db)
            await this.initialize();
        await this.db.delete("files", fileId);
    }
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
export async function createFileStorage() {
    const storage = new IndexedDBFileStorage();
    await storage.initialize();
    return storage;
}
//# sourceMappingURL=storage.js.map