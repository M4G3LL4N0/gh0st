export interface XAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | XAIContentPart[];
  tool_calls?: XAIToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface XAIContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string; detail?: "low" | "high" | "auto" };
}

export interface XAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface XAITool {
  type: "function" | "web_search" | "x_search" | "code_execution" | "remote_mcp" | "deep_research";
  function?: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
  web_search?: { max_results?: number; search_depth?: "basic" | "deep" };
  x_search?: { max_results?: number };
  code_execution?: { timeout?: number };
  remote_mcp?: { server_url: string; headers?: Record<string, string> };
  deep_research?: { max_depth?: number; max_breadth?: number };
}

export interface XAIResponseInput {
  role: "system" | "user" | "assistant" | "tool";
  content: string | XAIContentPart[];
  tool_calls?: XAIToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface XAITool {
  type: "function" | "web_search" | "x_search" | "code_execution" | "remote_mcp" | "deep_research";
  function?: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
  web_search?: { max_results?: number; search_depth?: "basic" | "deep" };
  x_search?: { max_results?: number };
  code_execution?: { timeout?: number };
  remote_mcp?: { server_url: string; headers?: Record<string, string> };
  deep_research?: { max_depth?: number; max_breadth?: number };
}

export interface XAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface XAIResponsesRequest {
  model: string;
  input: string | XAIResponseInput[];
  tools?: XAITool[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
  temperature?: number;
  max_output_tokens?: number;
  top_p?: number;
  stream?: boolean;
  store?: boolean;
  reasoning?: { effort?: "low" | "medium" | "high" };
  text?: { format?: { type: "text" | "json_object" } };
  metadata?: Record<string, unknown>;
  previous_response_id?: string;
}

export interface XAIResponsesResponse {
  id: string;
  object: "response";
  created: number;
  model: string;
  output: XAIResponsesOutput[];
  usage: XAIUsage;
  text?: XAIResponseText;
}

export interface XAIResponsesOutput {
  type: "message" | "function_call" | "reasoning" | "tool_call";
  id?: string;
  role?: "assistant";
  content?: string | XAIContentPart[];
  tool_calls?: XAIToolCall[];
  name?: string;
  arguments?: string;
  reasoning?: { effort?: "low" | "medium" | "high"; summary?: string };
  status?: "in_progress" | "completed" | "incomplete";
}

export interface XAIResponseText {
  format?: { type: "text" | "json_object" };
  value?: string;
}

export interface XAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: { cached_tokens?: number };
  completion_tokens_details?: { reasoning_tokens?: number };
}

export interface XAIStreamChunk {
  type: "response.created" | "response.in_progress" | "response.completed" | "response.failed" | "response.output_text.delta" | "response.output_text.done" | "response.content_part.added" | "response.content_part.done" | "response.reasoning.delta" | "response.reasoning.done";
  sequence_number: number;
  response?: XAIResponsesResponse;
  delta?: Partial<XAIResponsesOutput>;
  text?: { value: string };
  error?: { message: string; type: string; code?: string };
}

export interface XAIRequest {
  model: string;
  messages: XAIMessage[];
  tools?: XAITool[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  store?: boolean;
  reasoning_effort?: "low" | "medium" | "high";
  continuation?: string;
  metadata?: Record<string, unknown>;
}

export interface XAIResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: XAIChoice[];
  usage: XAIUsage;
  system_fingerprint?: string;
  continuation?: string;
}

export interface XAIChoice {
  index: number;
  message: XAIMessage;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
}

export interface XAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: { cached_tokens?: number };
  completion_tokens_details?: { reasoning_tokens?: number };
}

export interface XAIStreamChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: XAIStreamChoice[];
  system_fingerprint?: string;
  continuation?: string;
}

export interface XAIStreamChoice {
  index: number;
  delta: {
    role?: "assistant";
    content?: string;
    tool_calls?: XAIToolCall[];
    reasoning?: string;
  };
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
}

export interface XAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

export interface ZDRVerificationResult {
  verified: boolean;
  headerValue?: string;
  timestamp: number;
  error?: string;
}

export interface XAITransport {
  request(req: XAIRequest): Promise<XAIResponse>;
  streamRequest(req: XAIRequest): AsyncIterable<XAIStreamChunk>;
  verifyZDR(apiKey: string, baseUrl: string): Promise<ZDRVerificationResult>;
  close(): Promise<void>;
  getCapabilities(): TransportCapabilities;
}

export type TransportType = "http" | "websocket";

export interface TransportCapabilities {
  httpStreaming: boolean;
  websocketStreaming: boolean;
  zdrVerification: boolean;
  continuationSupport: boolean;
}

export const XAI_BASE_URL = "https://api.x.ai/v1";
export const XAI_WS_URL = "wss://api.x.ai/v1";