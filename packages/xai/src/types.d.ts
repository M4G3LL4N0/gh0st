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
    image_url?: {
        url: string;
        detail?: "low" | "high" | "auto";
    };
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
    web_search?: {
        max_results?: number;
        search_depth?: "basic" | "deep";
    };
    x_search?: {
        max_results?: number;
    };
    code_execution?: {
        timeout?: number;
    };
    remote_mcp?: {
        server_url: string;
        headers?: Record<string, string>;
    };
    deep_research?: {
        max_depth?: number;
        max_breadth?: number;
    };
}
export interface XAIRequest {
    model: string;
    messages: XAIMessage[];
    tools?: XAITool[];
    tool_choice?: "auto" | "none" | {
        type: "function";
        function: {
            name: string;
        };
    };
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
    prompt_tokens_details?: {
        cached_tokens?: number;
    };
    completion_tokens_details?: {
        reasoning_tokens?: number;
    };
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
export declare const XAI_BASE_URL = "https://api.x.ai/v1";
export declare const XAI_WS_URL = "wss://api.x.ai/v1";
//# sourceMappingURL=types.d.ts.map