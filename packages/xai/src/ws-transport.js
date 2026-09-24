import { XAI_WS_URL } from "./types.js";
export class WebSocketTransport {
    baseUrl;
    apiKey;
    ws = null;
    pendingRequests = new Map();
    requestId = 0;
    connected = false;
    constructor(apiKey, baseUrl = XAI_WS_URL) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }
    connect() {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }
            this.ws = new WebSocket(`${this.baseUrl}/chat/completions`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`
                }
            });
            this.ws.onopen = () => {
                this.connected = true;
                resolve();
            };
            this.ws.onerror = (event) => {
                this.connected = false;
                reject(new Error(`WebSocket connection failed: ${event}`));
            };
            this.ws.onclose = () => {
                this.connected = false;
                this.ws = null;
            };
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.request_id) {
                        const pending = this.pendingRequests.get(data.request_id);
                        if (pending) {
                            if (data.choices[0]?.finish_reason) {
                                this.pendingRequests.delete(data.request_id);
                            }
                            pending.resolve(data);
                        }
                    }
                }
                catch {
                    // Ignore parse errors
                }
            };
        });
    }
    async request(req) {
        await this.connect();
        const id = `req_${++this.requestId}`;
        const { stream, store, ...requestBody } = req;
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error("Request timeout"));
            }, 60000);
            this.pendingRequests.set(id, {
                resolve: (chunk) => {
                    clearTimeout(timeout);
                    if (chunk.choices[0]?.finish_reason) {
                        resolve({
                            id: chunk.id,
                            object: "chat.completion",
                            created: chunk.created,
                            model: chunk.model,
                            choices: [{
                                    index: 0,
                                    message: {
                                        role: "assistant",
                                        content: chunk.choices[0]?.delta?.content || "",
                                        tool_calls: chunk.choices[0]?.delta?.tool_calls
                                    },
                                    finish_reason: chunk.choices[0]?.finish_reason || "stop"
                                }],
                            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                            continuation: chunk.continuation
                        });
                    }
                },
                reject
            });
            this.ws.send(JSON.stringify({
                ...requestBody,
                stream: false,
                store: store ?? false,
                request_id: id
            }));
        });
    }
    async *streamRequest(req) {
        await this.connect();
        const id = `req_${++this.requestId}`;
        const { store, ...requestBody } = req;
        const queue = [];
        let resolver = null;
        let finished = false;
        let streamError = null;
        const pending = {
            resolve: (chunk) => {
                queue.push(chunk);
                if (resolver) {
                    const r = resolver;
                    resolver = null;
                    r({ value: queue.shift(), done: false });
                }
                if (chunk.choices[0]?.finish_reason) {
                    finished = true;
                    if (resolver) {
                        const r = resolver;
                        resolver = null;
                        r({ value: undefined, done: true });
                    }
                }
            },
            reject: (error) => {
                streamError = error;
                finished = true;
                if (resolver) {
                    const r = resolver;
                    resolver = null;
                    r({ value: undefined, done: true });
                }
            }
        };
        this.pendingRequests.set(id, pending);
        this.ws.send(JSON.stringify({
            ...requestBody,
            stream: true,
            store: store ?? false,
            request_id: id
        }));
        try {
            while (!finished || queue.length > 0) {
                if (queue.length > 0) {
                    yield queue.shift();
                }
                else {
                    await new Promise((resolve) => {
                        resolver = resolve;
                    });
                }
                if (streamError)
                    throw streamError;
            }
        }
        finally {
            this.pendingRequests.delete(id);
        }
    }
    async verifyZDR(apiKey, baseUrl) {
        const httpUrl = baseUrl.replace("wss://", "https://").replace("ws://", "http://");
        const response = await fetch(`${httpUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "X-Store": "false"
            },
            body: JSON.stringify({
                model: "grok-3",
                messages: [{ role: "user", content: "ZDR test" }],
                max_tokens: 1,
                store: false
            })
        });
        const headerValue = response.headers.get("x-zero-data-retention");
        const verified = headerValue === "true";
        return {
            verified,
            headerValue: headerValue || undefined,
            timestamp: Date.now(),
            error: verified ? undefined : `ZDR header: ${headerValue || "missing"}`
        };
    }
    async close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        for (const pending of this.pendingRequests.values()) {
            pending.reject(new Error("Transport closed"));
        }
        this.pendingRequests.clear();
    }
    getCapabilities() {
        return {
            httpStreaming: false,
            websocketStreaming: true,
            zdrVerification: true,
            continuationSupport: true
        };
    }
    isConnected() {
        return this.connected && this.ws?.readyState === WebSocket.OPEN;
    }
}
export function createWebSocketTransport(apiKey, baseUrl) {
    return new WebSocketTransport(apiKey, baseUrl);
}
//# sourceMappingURL=ws-transport.js.map