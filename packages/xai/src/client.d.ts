import { XAITransport, XAIResponse, XAIStreamChunk, XAIMessage, XAITool, ZDRVerificationResult, TransportCapabilities, TransportType } from "./types.js";
export interface XAIClientOptions {
    apiKey: string;
    baseUrl?: string;
    transportType?: TransportType;
    defaultModel?: string;
    defaultStore?: boolean;
    timeout?: number;
}
export interface ChatOptions {
    model?: string;
    messages: XAIMessage[];
    tools?: XAITool[];
    toolChoice?: "auto" | "none" | {
        type: "function";
        function: {
            name: string;
        };
    };
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    reasoningEffort?: "low" | "medium" | "high";
    continuation?: string;
    store?: boolean;
    stream?: boolean;
    metadata?: Record<string, unknown>;
}
export interface ChatResult {
    response: XAIResponse;
    zdrVerified: boolean;
    privacyState: {
        requestedStore: boolean;
        zdrHeaderValue?: string;
        verifiedAt?: number;
    };
}
export declare class XAIClient {
    private transport;
    private defaultModel;
    private defaultStore;
    private zdrVerified;
    private zdrVerifiedAt;
    private zdrHeaderValue;
    private zdrCheckInterval;
    constructor(options: XAIClientOptions);
    getTransport(): XAITransport;
    verifyZDR(): Promise<ZDRVerificationResult>;
    isZDRVerified(): boolean;
    getZDRState(): {
        verified: boolean;
        verifiedAt: number | null;
        headerValue: string | null;
    };
    chat(options: ChatOptions): Promise<ChatResult>;
    streamChat(options: ChatOptions): AsyncIterable<XAIStreamChunk>;
    private assembleStreamResponse;
    getCapabilities(): TransportCapabilities;
    close(): Promise<void>;
}
export declare function createXAIClient(options: XAIClientOptions): XAIClient;
//# sourceMappingURL=client.d.ts.map