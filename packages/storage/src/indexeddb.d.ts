import { ConversationStorage, MessageStorage, AttachmentStorage, AgentStorage, ToolEventStorage, UsageStorage, ContinuationStorage, PrivacyStorage, ExportImportStorage, Storage } from "./types.js";
export declare class IndexedDBStorage implements Storage {
    conversations: ConversationStorage;
    messages: MessageStorage;
    attachments: AttachmentStorage;
    agents: AgentStorage;
    toolEvents: ToolEventStorage;
    usage: UsageStorage;
    continuations: ContinuationStorage;
    privacy: PrivacyStorage;
    exportImport: ExportImportStorage;
    private db;
    private initialized;
    initialize(): Promise<void>;
    private ensureSchemaVersion;
    isReady(): boolean;
    close(): Promise<void>;
}
export declare function createIndexedDBStorage(): Promise<IndexedDBStorage>;
//# sourceMappingURL=indexeddb.d.ts.map