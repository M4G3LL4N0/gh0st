import { XAITransport, XAIRequest, XAIResponse, XAIStreamChunk, ZDRVerificationResult, TransportCapabilities } from "./types.js";
export declare class HTTPTransport implements XAITransport {
    private baseUrl;
    private apiKey;
    private abortController;
    constructor(apiKey: string, baseUrl?: string);
    private getHeaders;
    request(req: XAIRequest): Promise<XAIResponse>;
    streamRequest(req: XAIRequest): AsyncIterable<XAIStreamChunk>;
    verifyZDR(apiKey: string, baseUrl: string): Promise<ZDRVerificationResult>;
    close(): Promise<void>;
    getCapabilities(): TransportCapabilities;
    cancel(): void;
}
export declare function createHTTPTransport(apiKey: string, baseUrl?: string): HTTPTransport;
//# sourceMappingURL=http-transport.d.ts.map