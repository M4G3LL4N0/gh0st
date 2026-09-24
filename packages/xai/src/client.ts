import {
  XAITransport,
  XAIRequest,
  XAIResponse,
  XAIStreamChunk,
  XAIMessage,
  XAITool,
  ZDRVerificationResult,
  TransportCapabilities,
  TransportType
} from "./types.js";
import { HTTPTransport } from "./http-transport.js";
import { WebSocketTransport } from "./ws-transport.js";

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
  toolChoice?: "auto" | "none" | { type: "function"; function: { name: string } };
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

export class XAIClient {
  private transport: XAITransport;
  private defaultModel: string;
  private defaultStore: boolean;
  private zdrVerified = false;
  private zdrVerifiedAt: number | null = null;
  private zdrHeaderValue: string | null = null;
  private zdrCheckInterval = 30 * 60 * 1000;

  constructor(options: XAIClientOptions) {
    this.defaultModel = options.defaultModel || "grok-3";
    this.defaultStore = options.defaultStore ?? false;

    if (options.transportType === "websocket") {
      this.transport = new WebSocketTransport(options.apiKey, options.baseUrl);
    } else {
      this.transport = new HTTPTransport(options.apiKey, options.baseUrl);
    }
  }

  getTransport(): XAITransport {
    return this.transport;
  }

  async verifyZDR(): Promise<ZDRVerificationResult> {
    const result = await this.transport.verifyZDR(
      (this.transport as HTTPTransport | WebSocketTransport).constructor.name === "HTTPTransport"
        ? ""
        : "",
      ""
    );
    this.zdrVerified = result.verified;
    this.zdrVerifiedAt = result.timestamp;
    this.zdrHeaderValue = result.headerValue || null;
    return result;
  }

  isZDRVerified(): boolean {
    if (!this.zdrVerified || !this.zdrVerifiedAt) return false;
    return Date.now() - this.zdrVerifiedAt < this.zdrCheckInterval;
  }

  getZDRState(): { verified: boolean; verifiedAt: number | null; headerValue: string | null } {
    return {
      verified: this.isZDRVerified(),
      verifiedAt: this.zdrVerifiedAt,
      headerValue: this.zdrHeaderValue
    };
  }

  async chat(options: ChatOptions): Promise<ChatResult> {
    const store = options.store ?? this.defaultStore;

    if (store === false && !this.isZDRVerified()) {
      const verification = await this.verifyZDR();
      if (!verification.verified) {
        throw new Error("ZDR verification failed. Cannot send request with store=false.");
      }
    }

    const request: XAIRequest = {
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

    let response: XAIResponse;

    if (options.stream) {
      const chunks: XAIStreamChunk[] = [];
      for await (const chunk of this.transport.streamRequest(request)) {
        chunks.push(chunk);
      }
      response = this.assembleStreamResponse(chunks);
    } else {
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

  async *streamChat(options: ChatOptions): AsyncIterable<XAIStreamChunk> {
    const store = options.store ?? this.defaultStore;

    if (store === false && !this.isZDRVerified()) {
      const verification = await this.verifyZDR();
      if (!verification.verified) {
        throw new Error("ZDR verification failed. Cannot send request with store=false.");
      }
    }

    const request: XAIRequest = {
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

  private assembleStreamResponse(chunks: XAIStreamChunk[]): XAIResponse {
    if (chunks.length === 0) {
      throw new Error("Empty stream response");
    }

    const firstChunk = chunks[0];
    let content = "";
    const toolCalls: XAIStreamChunk["choices"][0]["delta"]["tool_calls"] = [];
    let finishReason: XAIStreamChunk["choices"][0]["finish_reason"] = null;

    for (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) content += delta.content;
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = toolCalls.find((t) => t.id === tc.id);
          if (existing) {
            existing.function.arguments += tc.function.arguments || "";
          } else {
            toolCalls.push({ ...tc });
          }
        }
      }
      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0].finish_reason!;
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

  getCapabilities(): TransportCapabilities {
    return this.transport.getCapabilities();
  }

  async close(): Promise<void> {
    await this.transport.close();
  }
}

export function createXAIClient(options: XAIClientOptions): XAIClient {
  return new XAIClient(options);
}