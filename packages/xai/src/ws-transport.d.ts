import { XAITransport, XAIRequest, XAIResponse, XAIStreamChunk, ZDRVerificationResult, TransportCapabilities } from "./types.js";
export declare class WebSocketTransport implements XAITransport {
    private baseUrl;
    private apiKey;
    private ws;
    private pendingRequests;
    private requestId;
    private connected;
    constructor(apiKey: string, baseUrl?: string);
    private connect;
    request(req: XAIRequest): Promise<XAIResponse>;
    streamRequest(req: XAIRequest): AsyncIterable<XAIStreamChunk>;
    verifyZDR(apiKey: string, baseUrl: string): Promise<ZDRVerificationResult>;
    close(): Promise<void>;
    getCapabilities(): TransportCapabilities;
    isConnected(): boolean;
}
export declare function createWebSocketTransport(apiKey: string, baseUrl?: string): WebSocketTransport;
//# sourceMappingURL=ws-transport.d.ts.map