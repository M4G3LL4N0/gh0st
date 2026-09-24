import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";
import {
  Conversation,
  Message,
  Attachment,
  Agent,
  ToolEvent,
  UsageRecord,
  EncryptedContinuation,
  PrivacyState,
  ExportPackage,
  ToolType
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
  STORAGE_NAME
} from "../types.js";

const GHOST_DIR = join(homedir(), ".gh0st");
const STORAGE_DIR = join(GHOST_DIR, "storage");
const CONVERSATIONS_DIR = join(STORAGE_DIR, "conversations");
const MESSAGES_DIR = join(STORAGE_DIR, "messages");
const ATTACHMENTS_DIR = join(STORAGE_DIR, "attachments");
const AGENTS_DIR = join(STORAGE_DIR, "agents");
const TOOL_EVENTS_DIR = join(STORAGE_DIR, "tool-events");
const USAGE_DIR = join(STORAGE_DIR, "usage");
const CONTINUATIONS_DIR = join(STORAGE_DIR, "continuations");
const PRIVACY_FILE = join(STORAGE_DIR, "privacy.json");
const SCHEMA_FILE = join(STORAGE_DIR, "schema.json");

async function ensureDirs(): Promise<void> {
  await fs.mkdir(GHOST_DIR, { recursive: true });
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
  await fs.mkdir(MESSAGES_DIR, { recursive: true });
  await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
  await fs.mkdir(AGENTS_DIR, { recursive: true });
  await fs.mkdir(TOOL_EVENTS_DIR, { recursive: true });
  await fs.mkdir(USAGE_DIR, { recursive: true });
  await fs.mkdir(CONTINUATIONS_DIR, { recursive: true });
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function listJsonFiles(dir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    return files.filter(f => f.endsWith(".json"));
  } catch {
    return [];
  }
}

class FileConversationStorage implements ConversationStorage {
  async initialize(): Promise<void> {
    await ensureDirs();
  }

  async create(conversation: Conversation): Promise<void> {
    await ensureDirs();
    await fs.writeFile(join(CONVERSATIONS_DIR, `${conversation.id}.json`), JSON.stringify(conversation, null, 2), "utf-8");
  }

  async get(id: string): Promise<Conversation | null> {
    return readJson<Conversation>(join(CONVERSATIONS_DIR, `${id}.json`));
  }

  async getAll(options?: { archived?: boolean; limit?: number; offset?: number }): Promise<Conversation[]> {
    const files = await listJsonFiles(CONVERSATIONS_DIR);
    const conversations: Conversation[] = [];
    for (const file of files) {
      const conv = await readJson<Conversation>(join(CONVERSATIONS_DIR, file));
      if (conv) conversations.push(conv);
    }
    conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    let filtered = conversations;
    if (options?.archived !== undefined) {
      filtered = filtered.filter(c => c.archived === options.archived);
    }
    if (options?.offset) {
      filtered = filtered.slice(options.offset);
    }
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    return filtered;
  }

  async update(id: string, updates: Partial<Conversation>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Conversation ${id} not found`);
    await fs.writeFile(join(CONVERSATIONS_DIR, `${id}.json`), JSON.stringify({ ...existing, ...updates, updatedAt: Date.now() }, null, 2), "utf-8");
  }

  async delete(id: string): Promise<void> {
    await fs.unlink(join(CONVERSATIONS_DIR, `${id}.json`)).catch(() => {});
  }

  async search(query: string, options?: { limit?: number }): Promise<Conversation[]> {
    const all = await this.getAll();
    const lower = query.toLowerCase();
    const filtered = all.filter(c => c.title.toLowerCase().includes(lower));
    return options?.limit ? filtered.slice(0, options.limit) : filtered;
  }

  async getCount(archived?: boolean): Promise<number> {
    const all = await this.getAll();
    if (archived !== undefined) {
      return all.filter(c => c.archived === archived).length;
    }
    return all.length;
  }
}

class FileMessageStorage implements MessageStorage {
  async initialize(): Promise<void> {
    await ensureDirs();
  }

  async create(message: Message): Promise<void> {
    await ensureDirs();
    await fs.writeFile(join(MESSAGES_DIR, `${message.id}.json`), JSON.stringify(message, null, 2), "utf-8");
  }

  async get(id: string): Promise<Message | null> {
    try {
      const data = await fs.readFile(join(MESSAGES_DIR, `${id}.json`), "utf-8");
      return JSON.parse(data) as Message;
    } catch {
      return null;
    }
  }

  async getByConversation(conversationId: string, options?: { limit?: number; before?: number; after?: number }): Promise<Message[]> {
    const files = await fs.readdir(MESSAGES_DIR).catch(() => []);
    const messages: Message[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const data = await fs.readFile(join(MESSAGES_DIR, file), "utf-8");
        const msg = JSON.parse(data) as Message;
        if (msg.conversationId === conversationId) {
          messages.push(msg);
        }
      } catch (_) {}
    }
    messages.sort((a, b) => b.createdAt - a.createdAt);
    let filtered = messages;
    if (options?.before) filtered = filtered.filter(m => m.createdAt < options.before!);
    if (options?.after) filtered = filtered.filter(m => m.createdAt > options.after!);
    if (options?.limit) filtered = filtered.slice(0, options.limit);
    return filtered;
  }

  async update(id: string, updates: Partial<Message>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Message ${id} not found`);
    await fs.writeFile(join(MESSAGES_DIR, `${id}.json`), JSON.stringify({ ...existing, ...updates, updatedAt: Date.now() }, null, 2), "utf-8");
  }

  async delete(id: string): Promise<void> {
    await fs.unlink(join(MESSAGES_DIR, `${id}.json`)).catch(() => {});
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    try {
      const files = await fs.readdir(MESSAGES_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = await fs.readFile(join(MESSAGES_DIR, file), "utf-8");
          if (!data) continue;
          const msg = JSON.parse(data) as Message;
          if (msg.conversationId === conversationId) {
            await fs.unlink(join(MESSAGES_DIR, file)).catch(() => {});
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  async search(conversationId: string, query: string, options?: { limit?: number }): Promise<Message[]> {
    const messages = await this.getByConversation(conversationId, { limit: 1000 });
    const lower = query.toLowerCase();
    const filtered = messages.filter(m => m.content.some(p => p.text?.toLowerCase().includes(lower)));
    return options?.limit ? filtered.slice(0, options.limit) : filtered;
  }
}

class FileAttachmentStorage implements AttachmentStorage {
  async initialize(): Promise<void> {
    await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
  }

  async create(attachment: Attachment): Promise<void> {
    await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
    await fs.writeFile(join(ATTACHMENTS_DIR, `${attachment.id}.json`), JSON.stringify(attachment, null, 2), "utf-8");
  }

  async get(id: string): Promise<Attachment | null> {
    try {
      const data = await fs.readFile(join(ATTACHMENTS_DIR, `${id}.json`), "utf-8");
      return JSON.parse(data) as Attachment;
    } catch {
      return null;
    }
  }

  async getByConversation(conversationId: string): Promise<Attachment[]> {
    try {
      const files = await fs.readdir(ATTACHMENTS_DIR);
      const attachments: Attachment[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = await fs.readFile(join(ATTACHMENTS_DIR, file), "utf-8");
          const att = JSON.parse(data) as Attachment;
          if (att.conversationId === conversationId) {
            attachments.push(att);
          }
        } catch (_) {}
      }
      return attachments;
    } catch {
      return [];
    }
  }

  async getByMessage(messageId: string): Promise<Attachment[]> {
    const files = await fs.readdir(ATTACHMENTS_DIR).catch(() => []);
    const attachments: Attachment[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const data = await fs.readFile(join(ATTACHMENTS_DIR, file), "utf-8");
        const att = JSON.parse(data) as Attachment;
        if (att.messageId === messageId) {
          attachments.push(att);
        }
      } catch (_) {}
    }
    return [];
  }

  async update(id: string, updates: Partial<Attachment>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Attachment ${id} not found`);
    await fs.writeFile(join(ATTACHMENTS_DIR, `${id}.json`), JSON.stringify({ ...existing, ...updates }, null, 2), "utf-8");
  }

  async delete(id: string): Promise<void> {
    await fs.unlink(join(ATTACHMENTS_DIR, `${id}.json`)).catch(() => {});
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    try {
      const files = await fs.readdir(ATTACHMENTS_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = await fs.readFile(join(ATTACHMENTS_DIR, file), "utf-8");
          if (!data) continue;
          const att = JSON.parse(data) as Attachment;
          if (att.conversationId === conversationId) {
            await fs.unlink(join(ATTACHMENTS_DIR, file)).catch(() => {});
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
}

class FileAgentStorage implements AgentStorage {
  async initialize(): Promise<void> {
    await fs.mkdir(AGENTS_DIR, { recursive: true });
  }

  async create(agent: Omit<Agent, "id" | "createdAt" | "updatedAt">): Promise<Agent> {
    await fs.mkdir(AGENTS_DIR, { recursive: true });
    const newAgent: Agent = {
      ...agent,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await fs.writeFile(join(AGENTS_DIR, `${newAgent.id}.json`), JSON.stringify(newAgent, null, 2), "utf-8");
    return newAgent;
  }

  async get(id: string): Promise<Agent | null> {
    try {
      const data = await fs.readFile(join(AGENTS_DIR, `${id}.json`), "utf-8");
      return JSON.parse(data) as Agent;
    } catch {
      return null;
    }
  }

  async getAll(): Promise<Agent[]> {
    const files = await fs.readdir(AGENTS_DIR).catch(() => []);
    const agents: Agent[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const data = await fs.readFile(join(AGENTS_DIR, file), "utf-8");
        const agent = JSON.parse(data) as Agent;
        agents.push(agent);
      } catch (_) {}
    }
    agents.sort((a, b) => b.updatedAt - a.updatedAt);
    return agents;
  }

  async update(id: string, updates: Partial<Agent>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Agent ${id} not found`);
    await fs.writeFile(join(AGENTS_DIR, `${id}.json`), JSON.stringify({ ...existing, ...updates, updatedAt: Date.now() }, null, 2), "utf-8");
  }

  async delete(id: string): Promise<void> {
    await fs.unlink(join(AGENTS_DIR, `${id}.json`)).catch(() => {});
  }
}

class FileToolEventStorage implements ToolEventStorage {
  async initialize(): Promise<void> {
    await fs.mkdir(TOOL_EVENTS_DIR, { recursive: true });
  }

  async create(event: ToolEvent): Promise<void> {
    await fs.mkdir(TOOL_EVENTS_DIR, { recursive: true });
    await fs.writeFile(join(TOOL_EVENTS_DIR, `${event.id}.json`), JSON.stringify(event, null, 2), "utf-8");
  }

  async get(id: string): Promise<ToolEvent | null> {
    try {
      const data = await fs.readFile(join(TOOL_EVENTS_DIR, `${id}.json`), "utf-8");
      return JSON.parse(data) as ToolEvent;
    } catch {
      return null;
    }
  }

  async getByConversation(conversationId: string): Promise<ToolEvent[]> {
    try {
      const files = await fs.readdir(TOOL_EVENTS_DIR);
      const events: ToolEvent[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = await fs.readFile(join(TOOL_EVENTS_DIR, file), "utf-8");
          const event = JSON.parse(data) as ToolEvent;
          if (event.conversationId === conversationId) {
            events.push(event);
          }
        } catch (_) {}
      }
      return events;
    } catch {
      return [];
    }
  }

  async getByMessage(messageId: string): Promise<ToolEvent[]> {
    try {
      const files = await fs.readdir(TOOL_EVENTS_DIR);
      const events: ToolEvent[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = await fs.readFile(join(TOOL_EVENTS_DIR, file), "utf-8");
          const event = JSON.parse(data) as ToolEvent;
          if (event.messageId === messageId) {
            events.push(event);
          }
        } catch (_) {}
      }
      return events;
    } catch {
      return [];
    }
  }

  async update(id: string, updates: Partial<ToolEvent>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`ToolEvent ${id} not found`);
    await fs.writeFile(join(TOOL_EVENTS_DIR, `${id}.json`), JSON.stringify({ ...existing, ...updates }, null, 2), "utf-8");
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    try {
      const files = await fs.readdir(TOOL_EVENTS_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = await fs.readFile(join(TOOL_EVENTS_DIR, file), "utf-8");
          if (!data) continue;
          const event = JSON.parse(data) as ToolEvent;
          if (event.conversationId === conversationId) {
            await fs.unlink(join(TOOL_EVENTS_DIR, file)).catch(() => {});
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
}

class FileUsageStorage implements UsageStorage {
  async initialize(): Promise<void> {
    await fs.mkdir(USAGE_DIR, { recursive: true });
  }

  async record(usage: UsageRecord): Promise<void> {
    await fs.mkdir(USAGE_DIR, { recursive: true });
    await fs.writeFile(join(USAGE_DIR, `${usage.timestamp}-${usage.conversationId}.json`), JSON.stringify(usage, null, 2), "utf-8");
  }

  async getByConversation(conversationId: string): Promise<UsageRecord[]> {
    try {
      const files = await fs.readdir(USAGE_DIR);
      const usages: UsageRecord[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const data = await fs.readFile(join(USAGE_DIR, file), "utf-8").catch(() => null);
        if (!data) continue;
        const usage = JSON.parse(data) as UsageRecord;
        if (usage.conversationId === conversationId) {
          usages.push(usage);
        }
      }
      return usages;
    } catch {
      return [];
    }
  }

  async getTotal(): Promise<UsageRecord> {
    try {
      const files = await fs.readdir(USAGE_DIR);
      const usages: UsageRecord[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const data = await fs.readFile(join(USAGE_DIR, file), "utf-8").catch(() => null);
        if (!data) continue;
        const usage = JSON.parse(data) as UsageRecord;
        usages.push(usage);
      }
      return usages.reduce(
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
    } catch {
      return { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, model: "total", timestamp: Date.now() };
    }
  }

  async getByDateRange(start: number, end: number): Promise<UsageRecord[]> {
    try {
      const files = await fs.readdir(USAGE_DIR);
      const usages: UsageRecord[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const data = await fs.readFile(join(USAGE_DIR, file), "utf-8").catch(() => null);
        if (!data) continue;
        const usage = JSON.parse(data) as UsageRecord;
        if (usage.timestamp >= start && usage.timestamp <= end) {
          usages.push(usage);
        }
      }
      return usages;
    } catch {
      return [];
    }
  }
}

class FileContinuationStorage implements ContinuationStorage {
  async initialize(): Promise<void> {
    await fs.mkdir(CONTINUATIONS_DIR, { recursive: true });
  }

  async create(continuation: EncryptedContinuation): Promise<void> {
    await fs.mkdir(CONTINUATIONS_DIR, { recursive: true });
    await fs.writeFile(join(CONTINUATIONS_DIR, `${continuation.id}.json`), JSON.stringify(continuation, null, 2), "utf-8");
  }

  async get(id: string): Promise<EncryptedContinuation | null> {
    try {
      const data = await fs.readFile(join(CONTINUATIONS_DIR, `${id}.json`), "utf-8");
      return JSON.parse(data) as EncryptedContinuation;
    } catch {
      return null;
    }
  }

  async getByConversation(conversationId: string): Promise<EncryptedContinuation[]> {
    try {
      const files = await fs.readdir(CONTINUATIONS_DIR);
      const continuations: EncryptedContinuation[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const data = await fs.readFile(join(CONTINUATIONS_DIR, file), "utf-8").catch(() => null);
        if (!data) continue;
        const cont = JSON.parse(data) as EncryptedContinuation;
        if (cont.conversationId === conversationId) {
          continuations.push(cont);
        }
      }
      return continuations;
    } catch {
      return [];
    }
  }

  async getByMessage(messageId: string): Promise<EncryptedContinuation | null> {
    try {
      const files = await fs.readdir(CONTINUATIONS_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const data = await fs.readFile(join(CONTINUATIONS_DIR, file), "utf-8").catch(() => null);
        if (!data) continue;
        const cont = JSON.parse(data) as EncryptedContinuation;
        if (cont.messageId === messageId) {
          return cont;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    await fs.unlink(join(CONTINUATIONS_DIR, `${id}.json`)).catch(() => {});
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    try {
      const files = await fs.readdir(CONTINUATIONS_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = await fs.readFile(join(CONTINUATIONS_DIR, file), "utf-8");
          if (!data) continue;
          const cont = JSON.parse(data) as EncryptedContinuation;
          if (cont.conversationId === conversationId) {
            await fs.unlink(join(CONTINUATIONS_DIR, file)).catch(() => {});
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
}

class FilePrivacyStorage implements PrivacyStorage {
  async initialize(): Promise<void> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }

  async get(): Promise<PrivacyState | null> {
    try {
      const data = await fs.readFile(PRIVACY_FILE, "utf-8");
      return JSON.parse(data) as PrivacyState;
    } catch {
      return null;
    }
  }

  async set(state: PrivacyState): Promise<void> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(PRIVACY_FILE, JSON.stringify(state, null, 2), "utf-8");
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

class FileExportImportStorage implements ExportImportStorage {
  async initialize(): Promise<void> {
    await Promise.all([
      fs.mkdir(CONVERSATIONS_DIR, { recursive: true }),
      fs.mkdir(MESSAGES_DIR, { recursive: true }),
      fs.mkdir(ATTACHMENTS_DIR, { recursive: true }),
      fs.mkdir(AGENTS_DIR, { recursive: true }),
      fs.mkdir(TOOL_EVENTS_DIR, { recursive: true }),
      fs.mkdir(USAGE_DIR, { recursive: true }),
      fs.mkdir(CONTINUATIONS_DIR, { recursive: true }),
      fs.mkdir(STORAGE_DIR, { recursive: true })
    ]);
  }

  async export(): Promise<ExportPackage> {
    const conversations = await new FileConversationStorage().getAll({ archived: false });
    const messages: Message[] = [];
    for (const conv of conversations) {
      const msgs = await new FileMessageStorage().getByConversation(conv.id);
      messages.push(...msgs);
    }
    const attachments: Attachment[] = [];
    for (const conv of conversations) {
      const atts = await new FileAttachmentStorage().getByConversation(conv.id);
      attachments.push(...atts);
    }
    const agents = await new FileAgentStorage().getAll();
    const continuations: EncryptedContinuation[] = [];
    for (const conv of conversations) {
      const conts = await new FileContinuationStorage().getByConversation(conv.id);
      continuations.push(...conts);
    }
    const privacyState = await new FilePrivacyStorage().get();

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
        runtimeMode: "cli"
      }
    };
  }

  async import(data: ExportPackage): Promise<void> {
    await Promise.all([
      fs.mkdir(CONVERSATIONS_DIR, { recursive: true }),
      fs.mkdir(MESSAGES_DIR, { recursive: true }),
      fs.mkdir(ATTACHMENTS_DIR, { recursive: true }),
      fs.mkdir(AGENTS_DIR, { recursive: true }),
      fs.mkdir(TOOL_EVENTS_DIR, { recursive: true }),
      fs.mkdir(CONTINUATIONS_DIR, { recursive: true }),
      fs.mkdir(STORAGE_DIR, { recursive: true })
    ]);

    for (const c of data.conversations) {
      await fs.writeFile(join(CONVERSATIONS_DIR, `${c.id}.json`), JSON.stringify(c, null, 2), "utf-8");
    }
    for (const m of data.messages) {
      await fs.writeFile(join(MESSAGES_DIR, `${m.id}.json`), JSON.stringify(m, null, 2), "utf-8");
    }
    for (const a of data.attachments) {
      await fs.writeFile(join(ATTACHMENTS_DIR, `${a.id}.json`), JSON.stringify(a, null, 2), "utf-8");
    }
    for (const a of data.agents) {
      await fs.writeFile(join(AGENTS_DIR, `${a.id}.json`), JSON.stringify(a, null, 2), "utf-8");
    }
    for (const c of data.encryptedContinuations) {
      await fs.writeFile(join(CONTINUATIONS_DIR, `${c.id}.json`), JSON.stringify(c, null, 2), "utf-8");
    }
    if (data.privacyState) {
      await fs.writeFile(PRIVACY_FILE, JSON.stringify(data.privacyState, null, 2), "utf-8");
    }
  }
}

export class FileStorage implements Storage {
  public conversations: ConversationStorage;
  public messages: MessageStorage;
  public attachments: AttachmentStorage;
  public agents: AgentStorage;
  public toolEvents: ToolEventStorage;
  public usage: UsageStorage;
  public continuations: ContinuationStorage;
  public privacy: PrivacyStorage;
  public exportImport: ExportImportStorage;

  private initialized = false;

  constructor() {
    this.conversations = new FileConversationStorage();
    this.messages = new FileMessageStorage();
    this.attachments = new FileAttachmentStorage();
    this.agents = new FileAgentStorage();
    this.toolEvents = new FileToolEventStorage();
    this.usage = new FileUsageStorage();
    this.continuations = new FileContinuationStorage();
    this.privacy = new FilePrivacyStorage();
    this.exportImport = new FileExportImportStorage();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await Promise.all([
      this.conversations.initialize(),
      this.messages.initialize(),
      this.attachments.initialize(),
      this.agents.initialize(),
      this.toolEvents.initialize(),
      this.usage.initialize(),
      this.continuations.initialize(),
      this.privacy.initialize(),
      this.exportImport.initialize()
    ]);
    this.initialized = true;
  }

  isReady(): boolean {
    return this.initialized;
  }

  async close(): Promise<void> {
    this.initialized = false;
  }
}

export async function createFileStorage(): Promise<FileStorage> {
  const storage = new FileStorage();
  await storage.initialize();
  return storage;
}