export type MessageRole = "user" | "assistant" | "tool" | "system";

export interface MessageContentPart {
  type: "text" | "image" | "file" | "tool_call" | "tool_result" | "citation";
  text?: string;
  imageUrl?: string;
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  toolCallId?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  citation?: Citation;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  snippet: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: MessageContentPart[];
  createdAt: number;
  updatedAt: number;
  model?: string;
  usage?: UsageRecord;
  error?: string;
  encryptedContinuationRef?: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  agentId?: string;
  archived: boolean;
  pinned: boolean;
  messageCount: number;
  lastMessagePreview?: string;
}

export interface Attachment {
  id: string;
  conversationId: string;
  messageId?: string;
  fileName: string;
  mimeType: string;
  size: number;
  encryptedPayload: string;
  extractedText?: string;
  createdAt: number;
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  instructions: string;
  model: string;
  reasoningEffort?: "low" | "medium" | "high";
  enabledTools: ToolType[];
  attachedFileIds: string[];
  mcpServerIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type ToolType =
  | "web_search"
  | "x_search"
  | "code_execution"
  | "remote_mcp"
  | "deep_research";

export interface ToolEvent {
  id: string;
  conversationId: string;
  messageId: string;
  toolType: ToolType;
  status: "pending" | "running" | "completed" | "failed";
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface UsageRecord {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd?: number;
  model: string;
  timestamp: number;
  conversationId?: string;
}

export interface EncryptedContinuation {
  id: string;
  conversationId: string;
  messageId: string;
  encryptedPayload: string;
  createdAt: number;
}

export interface PrivacyState {
  requestedStore: boolean;
  zdrVerified: boolean;
  zdrVerifiedAt?: number;
  zdrHeaderValue?: string;
  localVaultLocked: boolean;
  telemetryEnabled: boolean;
  activeMcpDestinations: string[];
  remoteToolsEnabled: boolean;
  runtimeMode: "browser" | "native" | "cli";
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  supportsReasoning: boolean;
  supportsTools: ToolType[];
  maxTokens: number;
  contextWindow: number;
}

export interface XAIAPIConfig {
  apiKey: string;
  baseUrl: string;
  organizationId?: string;
  timeout: number;
}

export interface AppConfig {
  xai: XAIAPIConfig;
  privacy: {
    strictMode: boolean;
    storeConversations: boolean;
    telemetryEnabled: boolean;
  };
  ui: {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
    showTokenCounts: boolean;
  };
  storage: {
    encryptAttachments: boolean;
    maxAttachmentSize: number;
  };
  model: string;
  models: Record<string, ModelInfo>;
}

export interface ExportPackage {
  version: number;
  exportedAt: number;
  conversations: Conversation[];
  messages: Message[];
  attachments: Attachment[];
  agents: Agent[];
  encryptedContinuations: EncryptedContinuation[];
  privacyState: PrivacyState;
}