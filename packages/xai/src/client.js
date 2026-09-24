import { HTTPTransport } from "./http-transport.js";
import { WebSocketTransport } from "./ws-transport.js";
export class XAIClient {
    transport;
    defaultModel;
    defaultStore;
    zdrVerified = false;
    zdrVerifiedAt = null;
    zdrHeaderValue = null;
    zdrCheckInterval = 30 * 60 * 1000;
    constructor(options) {
        this.defaultModel = options.defaultModel || "grok-3";
        this.defaultStore = options.defaultStore ?? false;
        if (options.transportType === "websocket") {
            this.transport = new WebSocketTransport(options.apiKey, options.baseUrl);
        }
        else {
            this.transport = new HTTPTransport(options.apiKey, options.baseUrl);
        }
    }
    getTransport() {
        return this.transport;
    }
    async verifyZDR() {
        const result = await this.transport.verifyZDR(this.transport.constructor.name === "HTTPTransport"
            ? ""
            : "", "");
        this.zdrVerified = result.verified;
        this.zdrVerifiedAt = result.timestamp;
        this.zdrHeaderValue = result.headerValue || null;
        return result;
    }
    isZDRVerified() {
        if (!this.zdrVerified || !this.zdrVerifiedAt)
            return false;
        return Date.now() - this.zdrVerifiedAt < this.zdrCheckInterval;
    }
    getZDRState() {
        return {
            verified: this.isZDRVerified(),
            verifiedAt: this.zdrVerifiedAt,
            headerValue: this.zdrHeaderValue
        };
    }
    async chat(options) {
        const store = options.store ?? this.defaultStore;
        if (store === false && !this.isZDRVerified()) {
            const verification = await this.verifyZDR();
            if (!verification.verified) {
                throw new Error("ZDR verification failed. Cannot send request with store=false.");
            }
        }
        const request = {
            model: options.model || this.defaultModel,
            messages: options.messages,
            tools: options.tools,
            tool_choice: options.toolChoice,
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            top_p: options.topP,
            reasoning_effort: options.reasoningEffort,
            continuation: options.continuation,
            store,
            stream: options.stream ?? false,
            metadata: options.metadata
        };
        let response;
        if (options.stream) {
            const chunks = [];
            for await (const chunk of this.transport.streamRequest(request)) {
                chunks.push(chunk);
            }
            response = this.assembleStreamResponse(chunks);
        }
        else {
            response = await this.transport.request(request);
        }
        const zdrState = this.getZDRState();
        return {
            response,
            zdrVerified: zdrState.verified,
            privacyState: {
                requestedStore: store,
                zdrHeaderValue: zdrState.headerValue || undefined,
                verifiedAt: zdrState.verifiedAt || undefined
            }
        };
    }
    async *streamChat(options) {
        const store = options.store ?? this.defaultStore;
        if (store === false && !this.isZDRVerified()) {
            const verification = await this.verifyZDR();
            if (!verification.verified) {
                throw new Error("ZDR verification failed. Cannot send request with store=false.");
            }
        }
        const request = {
            model: options.model || this.defaultModel,
            messages: options.messages,
            tools: options.tools,
            tool_choice: options.toolChoice,
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            top_p: options.topP,
            reasoning_effort: options.reasoningEffort,
            continuation: options.continuation,
            store,
            stream: true,
            metadata: options.metadata
        };
        for await (const chunk of this.transport.streamRequest(request)) {
            yield chunk;
        }
    }
    assembleStreamResponse(chunks) {
        if (chunks.length === 0) {
            throw new Error("Empty stream response");
        }
        const firstChunk = chunks[0];
        let content = "";
        const toolCalls = [];
        let finishReason = null;
        for (const chunk of chunks) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content)
                content += delta.content;
            if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                    const existing = toolCalls.find((t) => t.id === tc.id);
                    if (existing) {
                        existing.function.arguments += tc.function.arguments || "";
                    }
                    else {
                        toolCalls.push({ ...tc });
                    }
                }
            }
            if (chunk.choices[0]?.finish_reason) {
                finishReason = chunk.choices[0].finish_reason;
            }
        }
        return {
            id: firstChunk.id,
            object: "chat.completion",
            created: firstChunk.created,
            model: firstChunk.model,
            choices: [{
                    index: 0,
                    message: {
                        role: "assistant",
                        content,
                        tool_calls: toolCalls.length > 0 ? toolCalls : undefined
                    },
                    finish_reason: finishReason
                }],
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            continuation: chunks[chunks.length - 1]?.continuation
        };
    }
    getCapabilities() {
        return this.transport.getCapabilities();
    }
    async close() {
        await this.transport.close();
    }
}
export function createXAIClient(options) {
    return new XAIClient(options);
}
//# sourceMappingURL=client.js.map