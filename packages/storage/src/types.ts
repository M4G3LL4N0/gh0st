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

export interface StorageAdapter {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isReady(): boolean;
}

export interface ConversationStorage {
  initialize(): Promise<void>;
  create(conversation: Conversation): Promise<void>;
  get(id: string): Promise<Conversation | null>;
  getAll(options?: { archived?: boolean; limit?: number; offset?: number }): Promise<Conversation[]>;
  update(id: string, updates: Partial<Conversation>): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: string, options?: { limit?: number }): Promise<Conversation[]>;
  getCount(archived?: boolean): Promise<number>;
}

export interface MessageStorage {
  initialize(): Promise<void>;
  create(message: Message): Promise<void>;
  get(id: string): Promise<Message | null>;
  getByConversation(conversationId: string, options?: { limit?: number; before?: number; after?: number }): Promise<Message[]>;
  update(id: string, updates: Partial<Message>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByConversation(conversationId: string): Promise<void>;
  search(conversationId: string, query: string, options?: { limit?: number }): Promise<Message[]>;
}

export interface AttachmentStorage {
  initialize(): Promise<void>;
  create(attachment: Attachment): Promise<void>;
  get(id: string): Promise<Attachment | null>;
  getByConversation(conversationId: string): Promise<Attachment[]>;
  getByMessage(messageId: string): Promise<Attachment[]>;
  update(id: string, updates: Partial<Attachment>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByConversation(conversationId: string): Promise<void>;
}

export interface AgentStorage {
  initialize(): Promise<void>;
  create(agent: Omit<Agent, "id" | "createdAt" | "updatedAt">): Promise<Agent>;
  get(id: string): Promise<Agent | null>;
  getAll(): Promise<Agent[]>;
  update(id: string, updates: Partial<Agent>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ToolEventStorage {
  initialize(): Promise<void>;
  create(event: ToolEvent): Promise<void>;
  get(id: string): Promise<ToolEvent | null>;
  getByConversation(conversationId: string): Promise<ToolEvent[]>;
  getByMessage(messageId: string): Promise<ToolEvent[]>;
  update(id: string, updates: Partial<ToolEvent>): Promise<void>;
  deleteByConversation(conversationId: string): Promise<void>;
}

export interface UsageStorage {
  initialize(): Promise<void>;
  record(usage: UsageRecord): Promise<void>;
  getByConversation(conversationId: string): Promise<UsageRecord[]>;
  getTotal(): Promise<UsageRecord>;
  getByDateRange(start: number, end: number): Promise<UsageRecord[]>;
}

export interface ContinuationStorage {
  initialize(): Promise<void>;
  create(continuation: EncryptedContinuation): Promise<void>;
  get(id: string): Promise<EncryptedContinuation | null>;
  getByConversation(conversationId: string): Promise<EncryptedContinuation[]>;
  getByMessage(messageId: string): Promise<EncryptedContinuation | null>;
  delete(id: string): Promise<void>;
  deleteByConversation(conversationId: string): Promise<void>;
}

export interface PrivacyStorage {
  initialize(): Promise<void>;
  get(): Promise<PrivacyState | null>;
  set(state: PrivacyState): Promise<void>;
  update(updates: Partial<PrivacyState>): Promise<void>;
}

export interface ExportImportStorage {
  initialize(): Promise<void>;
  export(): Promise<ExportPackage>;
  import(data: ExportPackage): Promise<void>;
}

export interface Storage extends StorageAdapter {
  conversations: ConversationStorage;
  messages: MessageStorage;
  attachments: AttachmentStorage;
  agents: AgentStorage;
  toolEvents: ToolEventStorage;
  usage: UsageStorage;
  continuations: ContinuationStorage;
  privacy: PrivacyStorage;
  exportImport: ExportImportStorage;
}

export const STORAGE_VERSION = 1;
export const STORAGE_NAME = "gh0st-vault";

export interface SchemaVersion {
  version: number;
  migratedAt: number;
}