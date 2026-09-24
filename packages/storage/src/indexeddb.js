import { openDB } from "idb";
import { STORAGE_VERSION, STORAGE_NAME } from "./types.js";
const DB_NAME = STORAGE_NAME;
class IndexedDBConversationStorage {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(conversation) {
        await this.db.add("conversations", conversation);
    }
    async get(id) {
        return (await this.db.get("conversations", id)) ?? null;
    }
    async getAll(options) {
        const results = [];
        const { archived, limit = 100, offset = 0 } = options || {};
        let cursor = archived !== undefined
            ? await this.db.transaction("conversations").store.index("by-archived").openCursor(IDBKeyRange.only(archived ? 1 : 0), "prev")
            : await this.db.transaction("conversations").store.index("by-updated").openCursor(null, "prev");
        let skipped = 0;
        while (cursor && results.length < limit) {
            if (skipped >= offset) {
                results.push(cursor.value);
            }
            skipped++;
            cursor = await cursor.continue();
        }
        return results;
    }
    async update(id, updates) {
        const existing = await this.db.get("conversations", id);
        if (!existing)
            throw new Error(`Conversation ${id} not found`);
        await this.db.put("conversations", { ...existing, ...updates, updatedAt: Date.now() });
    }
    async delete(id) {
        await this.db.delete("conversations", id);
    }
    async search(query, options) {
        const { limit = 20 } = options || {};
        const all = await this.getAll({ limit: 1000 });
        const lower = query.toLowerCase();
        return all
            .filter((c) => c.title.toLowerCase().includes(lower))
            .slice(0, limit);
    }
    async getCount(archived) {
        if (archived !== undefined) {
            return this.db.countFromIndex("conversations", "by-archived", archived ? 1 : 0);
        }
        return this.db.count("conversations");
    }
}
class IndexedDBMessageStorage {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(message) {
        await this.db.add("messages", message);
    }
    async get(id) {
        return (await this.db.get("messages", id)) ?? null;
    }
    async getByConversation(conversationId, options) {
        const { limit = 100, before, after } = options || {};
        const index = this.db.transaction("messages").store.index("by-conversation");
        let range;
        if (before && after) {
            range = IDBKeyRange.bound([conversationId, after], [conversationId, before]);
        }
        else if (before) {
            range = IDBKeyRange.upperBound([conversationId, before]);
        }
        else if (after) {
            range = IDBKeyRange.lowerBound([conversationId, after]);
        }
        else {
            range = IDBKeyRange.only(conversationId);
        }
        const cursor = await index.openCursor(range, "prev");
        const results = [];
        let cursorMsg = cursor;
        while (cursorMsg && results.length < limit) {
            results.push(cursorMsg.value);
            cursorMsg = await cursorMsg.continue();
        }
        return results;
    }
    async update(id, updates) {
        const existing = await this.db.get("messages", id);
        if (!existing)
            throw new Error(`Message ${id} not found`);
        await this.db.put("messages", { ...existing, ...updates, updatedAt: Date.now() });
    }
    async delete(id) {
        await this.db.delete("messages", id);
    }
    async deleteByConversation(conversationId) {
        const tx = this.db.transaction("messages", "readwrite");
        const index = tx.store.index("by-conversation");
        let cursor = await index.openCursor(IDBKeyRange.only(conversationId));
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }
        await tx.done;
    }
    async search(conversationId, query, options) {
        const { limit = 20 } = options || {};
        const messages = await this.getByConversation(conversationId, { limit: 1000 });
        const lower = query.toLowerCase();
        return messages
            .filter((m) => m.content.some((p) => p.text?.toLowerCase().includes(lower)))
            .slice(0, limit);
    }
}
class IndexedDBAttachmentStorage {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(attachment) {
        await this.db.add("attachments", attachment);
    }
    async get(id) {
        return (await this.db.get("attachments", id)) ?? null;
    }
    async getByConversation(conversationId) {
        const index = this.db.transaction("attachments").store.index("by-conversation");
        return index.getAll(IDBKeyRange.only(conversationId));
    }
    async getByMessage(messageId) {
        const index = this.db.transaction("attachments").store.index("by-message");
        return index.getAll(IDBKeyRange.only(messageId));
    }
    async update(id, updates) {
        const existing = await this.db.get("attachments", id);
        if (!existing)
            throw new Error(`Attachment ${id} not found`);
        await this.db.put("attachments", { ...existing, ...updates });
    }
    async delete(id) {
        await this.db.delete("attachments", id);
    }
    async deleteByConversation(conversationId) {
        const tx = this.db.transaction("attachments", "readwrite");
        const index = tx.store.index("by-conversation");
        let cursor = await index.openCursor(IDBKeyRange.only(conversationId));
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }
        await tx.done;
    }
}
class IndexedDBAgentStorage {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(agent) {
        const now = Date.now();
        const fullAgent = {
            ...agent,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        };
        await this.db.add("agents", fullAgent);
        return fullAgent;
    }
    async get(id) {
        return (await this.db.get("agents", id)) ?? null;
    }
    async getAll() {
        const index = this.db.transaction("agents").store.index("by-updated");
        const cursor = await index.openCursor(null, "prev");
        const results = [];
        let cursorAgent = cursor;
        while (cursorAgent) {
            results.push(cursorAgent.value);
            cursorAgent = await cursorAgent.continue();
        }
        return results;
    }
    async update(id, updates) {
        const existing = await this.db.get("agents", id);
        if (!existing)
            throw new Error(`Agent ${id} not found`);
        await this.db.put("agents", { ...existing, ...updates, updatedAt: Date.now() });
    }
    async delete(id) {
        await this.db.delete("agents", id);
    }
}
class IndexedDBToolEventStorage {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(event) {
        await this.db.add("toolEvents", event);
    }
    async get(id) {
        return (await this.db.get("toolEvents", id)) ?? null;
    }
    async getByConversation(conversationId) {
        const index = this.db.transaction("toolEvents").store.index("by-conversation");
        return index.getAll(IDBKeyRange.only(conversationId));
    }
    async getByMessage(messageId) {
        const index = this.db.transaction("toolEvents").store.index("by-message");
        return index.getAll(IDBKeyRange.only(messageId));
    }
    async update(id, updates) {
        const existing = await this.db.get("toolEvents", id);
        if (!existing)
            throw new Error(`ToolEvent ${id} not found`);
        await this.db.put("toolEvents", { ...existing, ...updates });
    }
    async deleteByConversation(conversationId) {
        const tx = this.db.transaction("toolEvents", "readwrite");
        const index = tx.store.index("by-conversation");
        let cursor = await index.openCursor(IDBKeyRange.only(conversationId));
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }
        await tx.done;
    }
}
class IndexedDBUsageStorage {
    db;
    constructor(db) {
        this.db = db;
    }
    async record(usage) {
        await this.db.add("usage", usage);
    }
    async getByConversation(conversationId) {
        const index = this.db.transaction("usage").store.index("by-conversation");
        return index.getAll(IDBKeyRange.only(conversationId));
    }
    async getTotal() {
        const all = await this.db.getAll("usage");
        return all.reduce((acc, u) => ({
            inputTokens: acc.inputTokens + u.inputTokens,
            outputTokens: acc.outputTokens + u.outputTokens,
            totalTokens: acc.totalTokens + u.totalTokens,
            costUsd: (acc.costUsd || 0) + (u.costUsd || 0),
            model: "total",
            timestamp: Date.now()
        }), { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, model: "total", timestamp: Date.now() });
    }
    async getByDateRange(start, end) {
        const index = this.db.transaction("usage").store.index("by-timestamp");
        return index.getAll(IDBKeyRange.bound(start, end));
    }
}
class IndexedDBContinuationStorage {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(continuation) {
        await this.db.add("continuations", continuation);
    }
    async get(id) {
        return (await this.db.get("continuations", id)) ?? null;
    }
    async getByConversation(conversationId) {
        const index = this.db.transaction("continuations").store.index("by-conversation");
        return index.getAll(IDBKeyRange.only(conversationId));
    }
    async getByMessage(messageId) {
        const index = this.db.transaction("continuations").store.index("by-message");
        const results = await index.getAll(IDBKeyRange.only(messageId));
        return results[0] || null;
    }
    async delete(id) {
        await this.db.delete("continuations", id);
    }
    async deleteByConversation(conversationId) {
        const tx = this.db.transaction("continuations", "readwrite");
        const index = tx.store.index("by-conversation");
        let cursor = await index.openCursor(IDBKeyRange.only(conversationId));
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }
        await tx.done;
    }
}
class IndexedDBPrivacyStorage {
    db;
    constructor(db) {
        this.db = db;
    }
    KEY = "global";
    async get() {
        return (await this.db.get("privacy", this.KEY)) ?? null;
    }
    async set(state) {
        await this.db.put("privacy", state, this.KEY);
    }
    async update(updates) {
        const existing = await this.get();
        if (existing) {
            await this.set({ ...existing, ...updates });
        }
        else {
            await this.set(updates);
        }
    }
}
class IndexedDBExportImportStorage {
    db;
    conversations;
    messages;
    attachments;
    agents;
    continuations;
    privacy;
    constructor(db, conversations, messages, attachments, agents, continuations, privacy) {
        this.db = db;
        this.conversations = conversations;
        this.messages = messages;
        this.attachments = attachments;
        this.agents = agents;
        this.continuations = continuations;
        this.privacy = privacy;
    }
    async export() {
        const [conversations, messages, attachments, agents, continuations, privacyState] = await Promise.all([
            this.conversations.getAll({ archived: false }),
            this.getAllMessages(),
            this.getAllAttachments(),
            this.agents.getAll(),
            this.getAllContinuations(),
            this.privacy.get()
        ]);
        return {
            version: STORAGE_VERSION,
            exportedAt: Date.now(),
            conversations,
            messages,
            attachments,
            agents,
            encryptedContinuations: continuations,
            privacyState: privacyState || {
                requestedStore: false,
                zdrVerified: false,
                localVaultLocked: true,
                telemetryEnabled: false,
                activeMcpDestinations: [],
                remoteToolsEnabled: false,
                runtimeMode: "browser"
            }
        };
    }
    async import(data) {
        const tx = this.db.transaction(["conversations", "messages", "attachments", "agents", "continuations", "privacy"], "readwrite");
        const convStore = tx.objectStore("conversations");
        const msgStore = tx.objectStore("messages");
        const attStore = tx.objectStore("attachments");
        const agentStore = tx.objectStore("agents");
        const contStore = tx.objectStore("continuations");
        const privacyStore = tx.objectStore("privacy");
        for (const c of data.conversations) {
            await convStore.put(c);
        }
        for (const m of data.messages) {
            await msgStore.put(m);
        }
        for (const a of data.attachments) {
            await attStore.put(a);
        }
        for (const a of data.agents) {
            await agentStore.put(a);
        }
        for (const c of data.encryptedContinuations) {
            await contStore.put(c);
        }
        if (data.privacyState) {
            await privacyStore.put(data.privacyState, "global");
        }
        await tx.done;
    }
    async getAllMessages() {
        return this.db.getAll("messages");
    }
    async getAllAttachments() {
        return this.db.getAll("attachments");
    }
    async getAllContinuations() {
        return this.db.getAll("continuations");
    }
}
export class IndexedDBStorage {
    conversations;
    messages;
    attachments;
    agents;
    toolEvents;
    usage;
    continuations;
    privacy;
    exportImport;
    db = null;
    initialized = false;
    async initialize() {
        if (this.initialized)
            return;
        this.db = await openDB(DB_NAME, STORAGE_VERSION, {
            upgrade(db, oldVersion) {
                if (oldVersion < 1) {
                    const convStore = db.createObjectStore("conversations", { keyPath: "id" });
                    convStore.createIndex("by-updated", "updatedAt");
                    convStore.createIndex("by-archived", "archived");
                    const msgStore = db.createObjectStore("messages", { keyPath: "id" });
                    msgStore.createIndex("by-conversation", ["conversationId", "createdAt"]);
                    msgStore.createIndex("by-created", "createdAt");
                    const attStore = db.createObjectStore("attachments", { keyPath: "id" });
                    attStore.createIndex("by-conversation", "conversationId");
                    attStore.createIndex("by-message", "messageId");
                    const agentStore = db.createObjectStore("agents", { keyPath: "id" });
                    agentStore.createIndex("by-updated", "updatedAt");
                    const toolStore = db.createObjectStore("toolEvents", { keyPath: "id" });
                    toolStore.createIndex("by-conversation", "conversationId");
                    toolStore.createIndex("by-message", "messageId");
                    const usageStore = db.createObjectStore("usage", { keyPath: "id" });
                    usageStore.createIndex("by-conversation", "conversationId");
                    usageStore.createIndex("by-timestamp", "timestamp");
                    const contStore = db.createObjectStore("continuations", { keyPath: "id" });
                    contStore.createIndex("by-conversation", "conversationId");
                    contStore.createIndex("by-message", "messageId");
                    db.createObjectStore("privacy", { keyPath: "id" });
                    db.createObjectStore("schema", { keyPath: "version" });
                }
            }
        });
        this.conversations = new IndexedDBConversationStorage(this.db);
        this.messages = new IndexedDBMessageStorage(this.db);
        this.attachments = new IndexedDBAttachmentStorage(this.db);
        this.agents = new IndexedDBAgentStorage(this.db);
        this.toolEvents = new IndexedDBToolEventStorage(this.db);
        this.usage = new IndexedDBUsageStorage(this.db);
        this.continuations = new IndexedDBContinuationStorage(this.db);
        this.privacy = new IndexedDBPrivacyStorage(this.db);
        this.exportImport = new IndexedDBExportImportStorage(this.db, this.conversations, this.messages, this.attachments, this.agents, this.continuations, this.privacy);
        await this.ensureSchemaVersion();
        this.initialized = true;
    }
    async ensureSchemaVersion() {
        const existing = await this.db.get("schema", STORAGE_VERSION.toString());
        if (!existing) {
            await this.db.put("schema", { version: STORAGE_VERSION, migratedAt: Date.now() }, STORAGE_VERSION.toString());
        }
    }
    isReady() {
        return this.initialized && this.db !== null;
    }
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initialized = false;
        }
    }
}
export async function createIndexedDBStorage() {
    const storage = new IndexedDBStorage();
    await storage.initialize();
    return storage;
}
//# sourceMappingURL=indexeddb.js.map