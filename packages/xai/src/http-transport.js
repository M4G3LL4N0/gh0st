import { XAI_BASE_URL } from "./types.js";
export class HTTPTransport {
    baseUrl;
    apiKey;
    abortController = null;
    constructor(apiKey, baseUrl = XAI_BASE_URL) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }
    getHeaders(store) {
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`
        };
        if (store !== undefined) {
            headers["X-Store"] = store ? "true" : "false";
        }
        return headers;
    }
    async request(req) {
        this.abortController = new AbortController();
        const { stream, store, ...requestBody } = req;
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: this.getHeaders(store),
            body: JSON.stringify({ ...requestBody, stream: false }),
            signal: this.abortController.signal
        });
        if (!response.ok) {
            const error = (await response.json());
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }
        return (await response.json());
    }
    async *streamRequest(req) {
        this.abortController = new AbortController();
        const { store, ...requestBody } = req;
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: this.getHeaders(store),
            body: JSON.stringify({ ...requestBody, stream: true }),
            signal: this.abortController.signal
        });
        if (!response.ok) {
            const error = (await response.json());
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No response body");
        }
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === "data: [DONE]")
                        continue;
                    if (trimmed.startsWith("data: ")) {
                        try {
                            const chunk = JSON.parse(trimmed.slice(6));
                            yield chunk;
                        }
                        catch {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async verifyZDR(apiKey, baseUrl) {
        const testUrl = baseUrl.replace(/\/$/, "");
        const response = await fetch(`${testUrl}/chat/completions`, {
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
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
    getCapabilities() {
        return {
            httpStreaming: true,
            websocketStreaming: false,
            zdrVerification: true,
            continuationSupport: true
        };
    }
    cancel() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}
export function createHTTPTransport(apiKey, baseUrl) {
    return new HTTPTransport(apiKey, baseUrl);
}
//# sourceMappingURL=http-transport.js.map