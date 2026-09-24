import { ModelInfo, Agent, ToolType } from "./models.js";

export const DEFAULT_MODEL = "grok-3";
export const SUPPORTED_MODELS: Record<string, ModelInfo> = {
  "grok-3": {
    id: "grok-3",
    name: "Grok 3",
    description: "Most capable model for complex reasoning and coding",
    supportsReasoning: true,
    supportsTools: ["web_search", "x_search", "code_execution", "remote_mcp", "deep_research"],
    maxTokens: 8192,
    contextWindow: 131072
  },
  "grok-3-mini": {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    description: "Fast and efficient for everyday tasks",
    supportsReasoning: true,
    supportsTools: ["web_search", "x_search", "code_execution"],
    maxTokens: 8192,
    contextWindow: 131072
  },
  "grok-2": {
    id: "grok-2",
    name: "Grok 2",
    description: "Previous generation model",
    supportsReasoning: false,
    supportsTools: ["web_search", "x_search", "code_execution"],
    maxTokens: 4096,
    contextWindow: 8192
  }
};

export const STARTER_AGENTS: Omit<Agent, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "General",
    icon: "sparkles",
    description: "Balanced assistant for everyday tasks",
    instructions: "You are a helpful, harmless, and honest AI assistant. Provide clear, accurate, and concise responses.",
    model: "grok-3",
    reasoningEffort: "medium",
    enabledTools: ["web_search", "x_search", "code_execution"],
    attachedFileIds: [],
    mcpServerIds: []
  },
  {
    name: "Researcher",
    icon: "search",
    description: "Deep research and analysis specialist",
    instructions: "You are a research specialist. Conduct thorough investigations, cite sources, and synthesize findings. Use web search and X search extensively.",
    model: "grok-3",
    reasoningEffort: "high",
    enabledTools: ["web_search", "x_search", "deep_research"],
    attachedFileIds: [],
    mcpServerIds: []
  },
  {
    name: "Coder",
    icon: "code",
    description: "Software development and debugging expert",
    instructions: "You are an expert software engineer. Write clean, maintainable code. Explain your reasoning. Use code execution for verification.",
    model: "grok-3",
    reasoningEffort: "medium",
    enabledTools: ["code_execution", "web_search"],
    attachedFileIds: [],
    mcpServerIds: []
  },
  {
    name: "Analyst",
    icon: "bar-chart",
    description: "Data analysis and visualization specialist",
    instructions: "You are a data analyst. Process data, create visualizations, and provide actionable insights. Use code execution for computations.",
    model: "grok-3",
    reasoningEffort: "medium",
    enabledTools: ["code_execution", "web_search"],
    attachedFileIds: [],
    mcpServerIds: []
  }
];

export const SUPPORTED_ATTACHMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
  "text/javascript",
  "text/typescript",
  "text/python",
  "text/html",
  "text/css",
  "application/xml",
  "application/yaml",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
];

export const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

export const PRIVACY_MODES = {
  STRICT: "strict",
  BALANCED: "balanced",
  PERMISSIVE: "permissive"
} as const;

export type PrivacyMode = (typeof PRIVACY_MODES)[keyof typeof PRIVACY_MODES];