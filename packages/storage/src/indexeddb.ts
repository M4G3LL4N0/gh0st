import { openDB, DBSchema, IDBPDatabase, IDBPCursorWithValue } from "idb";
import {
  Conversation,
  Message,
  Attachment,
  Agent,
  ToolEvent,
  UsageRecord,
  EncryptedContinuation,
  PrivacyState,
  ExportPackage
} from "@gh0st/core";
import {
  StorageAdapter,
  ConversationStorage,
  MessageStorage,
  AttachmentStorage,
  AgentStorage,
  ToolEventStorage,
  UsageStorage,
  ContinuationStorage,
  PrivacyStorage,
  ExportImportStorage,
  Storage,
  STORAGE_VERSION,
  STORAGE_NAME,
  SchemaVersion
} from "./types.js";

type Gh0stDB = {
  conversations: {
    key: string;
    value: Conversation;
    indexes: { "by-updated": number; "by-archived": boolean };
  };
  messages: {
    key: string;
    value: Message;
    indexes: { "by-conversation": string; "by-created": number };
  };
  attachments: {
    key: string;
    value: Attachment;
    indexes: { "by-conversation": string; "by-message": string };
  };
  agents: {
    key: string;
    value: Agent;
    indexes: { "by-updated": number };
  };
  toolEvents: {
    key: string;
    value: ToolEvent;
    indexes: { "by-conversation": string; "by-message": string };
  };
  usage: {
    key: string;
    value: UsageRecord;
    indexes: { "by-conversation": string; "by-timestamp": number };
  };
  continuations: {
    key: string;
    value: EncryptedContinuation;
    indexes: { "by-conversation": string; "by-message": string };
  };
  privacy: {
    key: string;
    value: PrivacyState;
  };
  schema: {
    key: string;
    value: SchemaVersion;
  };
};

const DB_NAME = STORAGE_NAME;

class IndexedDBConversationStorage implements ConversationStorage {
  constructor(private db: IDBPDatabase<Gh0stDB>) {}

  async initialize(): Promise<void> {}

  async create(conversation: Conversation): Promise<void> {
    await this.db.add("conversations", conversation);
  }

  async get(id: string): Promise<Conversation | null> {
    return (await this.db.get("conversations", id)) ?? null;
  }

  async getAll(options?: { archived?: boolean; limit?: number; offset?: number }): Promise<Conversation[]> {
    const results: Conversation[] = [];
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

  async update(id: string, updates: Partial<Conversation>): Promise<void> {
    const existing = await this.db.get("conversations", id);
    if (!existing) throw new Error(`Conversation ${id} not found`);
    await this.db.put("conversations", { ...existing, ...updates, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete("conversations", id);
  }

  async search(query: string, options?: { limit?: number }): Promise<Conversation[]> {
    const { limit = 20 } = options || {};
    const all = await this.getAll({ limit: 1000 });
    const lower = query.toLowerCase();
    return all
      .filter((c) => c.title.toLowerCase().includes(lower))
      .slice(0, limit);
  }

  async getCount(archived?: boolean): Promise<number> {
    if (archived !== undefined) {
      return this.db.countFromIndex("conversations", "by-archived", archived ? 1 : 0);
    }
    return this.db.count("conversations");
  }
}

class IndexedDBMessageStorage implements MessageStorage {
  constructor(private db: IDBPDatabase<Gh0stDB>) {}

  async initialize(): Promise<void> {}

  async create(message: Message): Promise<void> {
    await this.db.add("messages", message);
  }

  async get(id: string): Promise<Message | null> {
    return (await this.db.get("messages", id)) ?? null;
  }

  async getByConversation(
    conversationId: string,
    options?: { limit?: number; before?: number; after?: number }
  ): Promise<Message[]> {
    const { limit = 100, before, after } = options || {};
    const index = this.db.transaction("messages").store.index("by-conversation");
    let range: IDBKeyRange | undefined;

    if (before && after) {
      range = IDBKeyRange.bound([conversationId, after], [conversationId, before]);
    } else if (before) {
      range = IDBKeyRange.upperBound([conversationId, before]);
    } else if (after) {
      range = IDBKeyRange.lowerBound([conversationId, after]);
    } else {
      range = IDBKeyRange.only(conversationId);
    }

    const cursor = await index.openCursor(range, "prev");
    const results: Message[] = [];
    let cursorMsg = cursor;
    while (cursorMsg && results.length < limit) {
      results.push(cursorMsg.value);
      cursorMsg = await cursorMsg.continue();
    }
    return results;
  }

  async update(id: string, updates: Partial<Message>): Promise<void> {
    const existing = await this.db.get("messages", id);
    if (!existing) throw new Error(`Message ${id} not found`);
    await this.db.put("messages", { ...existing, ...updates, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete("messages", id);
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    const tx = this.db.transaction("messages", "readwrite");
    const index = tx.store.index("by-conversation");
    let cursor = await index.openCursor(IDBKeyRange.only(conversationId));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  async search(conversationId: string, query: string, options?: { limit?: number }): Promise<Message[]> {
    const { limit = 20 } = options || {};
    const messages = await this.getByConversation(conversationId, { limit: 1000 });
    const lower = query.toLowerCase();
    return messages
      .filter((m) => m.content.some((p) => p.text?.toLowerCase().includes(lower)))
      .slice(0, limit);
  }
}

class IndexedDBAttachmentStorage implements AttachmentStorage {
  constructor(private db: IDBPDatabase<Gh0stDB>) {}

  async initialize(): Promise<void> {}

  async create(attachment: Attachment): Promise<void> {
    await this.db.add("attachments", attachment);
  }

  async get(id: string): Promise<Attachment | null> {
    return (await this.db.get("attachments", id)) ?? null;
  }

  async getByConversation(conversationId: string): Promise<Attachment[]> {
    const index = this.db.transaction("attachments").store.index("by-conversation");
    return index.getAll(IDBKeyRange.only(conversationId));
  }

  async getByMessage(messageId: string): Promise<Attachment[]> {
    const index = this.db.transaction("attachments").store.index("by-message");
    return index.getAll(IDBKeyRange.only(messageId));
  }

  async update(id: string, updates: Partial<Attachment>): Promise<void> {
    const existing = await this.db.get("attachments", id);
    if (!existing) throw new Error(`Attachment ${id} not found`);
    await this.db.put("attachments", { ...existing, ...updates });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete("attachments", id);
  }

  async deleteByConversation(conversationId: string): Promise<void> {
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

class IndexedDBAgentStorage implements AgentStorage {
  constructor(private db: IDBPDatabase<Gh0stDB>) {}

  async initialize(): Promise<void> {}

  async create(agent: Omit<Agent, "id" | "createdAt" | "updatedAt">): Promise<Agent> {
    const now = Date.now();
    const fullAgent: Agent = {
      ...agent,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await this.db.add("agents", fullAgent);
    return fullAgent;
  }

  async get(id: string): Promise<Agent | null> {
    return (await this.db.get("agents", id)) ?? null;
  }

  async getAll(): Promise<Agent[]> {
    const index = this.db.transaction("agents").store.index("by-updated");
    const cursor = await index.openCursor(null, "prev");
    const results: Agent[] = [];
    let cursorAgent = cursor;
    while (cursorAgent) {
      results.push(cursorAgent.value);
      cursorAgent = await cursorAgent.continue();
    }
    return results;
  }

  async update(id: string, updates: Partial<Agent>): Promise<void> {
    const existing = await this.db.get("agents", id);
    if (!existing) throw new Error(`Agent ${id} not found`);
    await this.db.put("agents", { ...existing, ...updates, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete("agents", id);
  }
}

class IndexedDBToolEventStorage implements ToolEventStorage {
  constructor(private db: IDBPDatabase<Gh0stDB>) {}

  async initialize(): Promise<void> {}

  async create(event: ToolEvent): Promise<void> {
    await this.db.add("toolEvents", event);
  }

  async get(id: string): Promise<ToolEvent | null> {
    return (await this.db.get("toolEvents", id)) ?? null;
  }

  async getByConversation(conversationId: string): Promise<ToolEvent[]> {
    const index = this.db.transaction("toolEvents").store.index("by-conversation");
    return index.getAll(IDBKeyRange.only(conversationId));
  }

  async getByMessage(messageId: string): Promise<ToolEvent[]> {
    const index = this.db.transaction("toolEvents").store.index("by-message");
    return index.getAll(IDBKeyRange.only(messageId));
  }

  async update(id: string, updates: Partial<ToolEvent>): Promise<void> {
    const existing = await this.db.get("toolEvents", id);
    if (!existing) throw new Error(`ToolEvent ${id} not found`);
    await this.db.put("toolEvents", { ...existing, ...updates });
  }

  async deleteByConversation(conversationId: string): Promise<void> {
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

class IndexedDBUsageStorage implements UsageStorage {
  constructor(private db: IDBPDatabase<Gh0stDB>) {}

  async initialize(): Promise<void> {}

  async record(usage: UsageRecord): Promise<void> {
    await this.db.add("usage", usage);
  }

  async getByConversation(conversationId: string): Promise<UsageRecord[]> {
    const index = this.db.transaction("usage").store.index("by-conversation");
    return index.getAll(IDBKeyRange.only(conversationId));
  }

  async getTotal(): Promise<UsageRecord> {
    const all = await this.db.getAll("usage");
    return all.reduce(
      (acc, u) => ({
        inputTokens: acc.inputTokens + u.inputTokens,
        outputTokens: acc.outputTokens + u.outputTokens,
        totalTokens: acc.totalTokens + u.totalTokens,
        costUsd: (acc.costUsd || 0) + (u.costUsd || 0),
        model: "total",
        timestamp: Date.now()
      }),
      { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, model: "total", timestamp: Date.now() }
    );
  }

  async getByDateRange(start: number, end: number): Promise<UsageRecord[]> {
    const index = this.db.transaction("usage").store.index("by-timestamp");
    return index.getAll(IDBKeyRange.bound(start, end));
  }
}

class IndexedDBContinuationStorage implements ContinuationStorage {
  constructor(private db: IDBPDatabase<Gh0stDB>) {}

  async initialize(): Promise<void> {}

  async create(continuation: EncryptedContinuation): Promise<void> {
    await this.db.add("continuations", continuation);
  }

  async get(id: string): Promise<EncryptedContinuation | null> {
    return (await this.db.get("continuations", id)) ?? null;
  }

  async getByConversation(conversationId: string): Promise<EncryptedContinuation[]> {
    const index = this.db.transaction("continuations").store.index("by-conversation");
    return index.getAll(IDBKeyRange.only(conversationId));
  }

  async getByMessage(messageId: string): Promise<EncryptedContinuation | null> {
    const index = this.db.transaction("continuations").store.index("by-message");
    const results = await index.getAll(IDBKeyRange.only(messageId));
    return results[0] || null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete("continuations", id);
  }

  async deleteByConversation(conversationId: string): Promise<void> {
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

class IndexedDBPrivacyStorage implements PrivacyStorage {
  constructor(private db: IDBPDatabase<Gh0stDB>) {}

  async initialize(): Promise<void> {}

  private readonly KEY = "global";

  async get(): Promise<PrivacyState | null> {
    return (await this.db.get("privacy", this.KEY)) ?? null;
  }

  async set(state: PrivacyState): Promise<void> {
    await this.db.put("privacy", state, this.KEY);
  }

  async update(updates: Partial<PrivacyState>): Promise<void> {
    const existing = await this.get();
    if (existing) {
      await this.set({ ...existing, ...updates });
    } else {
      await this.set(updates as PrivacyState);
    }
  }
}

class IndexedDBExportImportStorage implements ExportImportStorage {
  constructor(
    private db: IDBPDatabase<Gh0stDB>,
    private conversations: ConversationStorage,
    private messages: MessageStorage,
    private attachments: AttachmentStorage,
    private agents: AgentStorage,
    private continuations: ContinuationStorage,
    private privacy: PrivacyStorage
  ) {}

  async initialize(): Promise<void> {}

  async export(): Promise<ExportPackage> {
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

  async import(data: ExportPackage): Promise<void> {
    const tx = this.db!.transaction(
      ["conversations", "messages", "attachments", "agents", "continuations", "privacy"],
      "readwrite"
    );

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

  private async getAllMessages(): Promise<Message[]> {
    return this.db.getAll("messages");
  }

  private async getAllAttachments(): Promise<Attachment[]> {
    return this.db.getAll("attachments");
  }

  private async getAllContinuations(): Promise<EncryptedContinuation[]> {
    return this.db.getAll("continuations");
  }
}

export class IndexedDBStorage implements Storage {
  public conversations!: ConversationStorage;
  public messages!: MessageStorage;
  public attachments!: AttachmentStorage;
  public agents!: AgentStorage;
  public toolEvents!: ToolEventStorage;
  public usage!: UsageStorage;
  public continuations!: ContinuationStorage;
  public privacy!: PrivacyStorage;
  public exportImport!: ExportImportStorage;

  private db: IDBPDatabase<Gh0stDB> | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.db = await openDB<Gh0stDB>(DB_NAME, STORAGE_VERSION, {
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
    this.exportImport = new IndexedDBExportImportStorage(
      this.db,
      this.conversations,
      this.messages,
      this.attachments,
      this.agents,
      this.continuations,
      this.privacy
    );

    await this.ensureSchemaVersion();
    this.initialized = true;
  }

  private async ensureSchemaVersion(): Promise<void> {
    const existing = await this.db!.get("schema", STORAGE_VERSION.toString());
    if (!existing) {
      await this.db!.put("schema", { version: STORAGE_VERSION, migratedAt: Date.now() }, STORAGE_VERSION.toString());
    }
  }

  isReady(): boolean {
    return this.initialized && this.db !== null;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

export async function createIndexedDBStorage(): Promise<IndexedDBStorage> {
  const storage = new IndexedDBStorage();
  await storage.initialize();
  return storage;
}