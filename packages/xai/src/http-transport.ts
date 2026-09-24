import {
  XAITransport,
  XAIRequest,
  XAIResponse,
  XAIStreamChunk,
  XAIErrorResponse,
  ZDRVerificationResult,
  TransportCapabilities,
  XAI_BASE_URL,
  XAIResponsesRequest,
  XAIResponsesResponse,
  XAIToolCall
} from "./types.js";
import { randomUUID } from "crypto";

export class HTTPTransport implements XAITransport {
  private baseUrl: string;
  private apiKey: string;
  private abortController: AbortController | null = null;

  constructor(apiKey: string, baseUrl: string = "https://api.x.ai/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private getHeaders(store?: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`
    };
    if (store !== undefined) {
      headers["X-Store"] = store ? "true" : "false";
    }
    return headers;
  }

  async request(req: XAIRequest): Promise<XAIResponse> {
    this.abortController = new AbortController();
    const { stream: _stream1, store, ...requestBody } = req;

    const responsesRequest = this.convertToResponsesRequest(req);
    const { stream: _stream2, store: _store2, ...requestBody2 } = responsesRequest;

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: this.getHeaders(store),
      body: JSON.stringify({ ...requestBody2, stream: false }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      const error = (await response.json()) as XAIErrorResponse;
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const responsesResponse = (await response.json()) as XAIResponsesResponse;
    return this.convertResponsesToLegacy(responsesResponse);
  }

  async *streamRequest(req: XAIRequest): AsyncIterable<XAIStreamChunk> {
    this.abortController = new AbortController();
    const { store: _store, ...requestBody } = req;

    const responsesRequest = this.convertToResponsesRequest(req);
    const { stream: _stream2, store: _store2, ...requestBody2 } = responsesRequest;

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: this.getHeaders(_store),
      body: JSON.stringify({ ...requestBody2, stream: true }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      const error = (await response.json()) as XAIErrorResponse;
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
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const chunk = JSON.parse(trimmed.slice(6)) as XAIStreamChunk;
              yield chunk;
            } catch {
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async verifyZDR(apiKey: string, baseUrl: string): Promise<ZDRVerificationResult> {
    const testUrl = baseUrl.replace(/\/$/, "");
    const response = await fetch(`${testUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Store": "false"
      },
      body: JSON.stringify({
        model: "grok-3",
        input: "ZDR test",
        max_output_tokens: 1,
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

  async close(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  getCapabilities(): TransportCapabilities {
    return {
      httpStreaming: true,
      websocketStreaming: false,
      zdrVerification: true,
      continuationSupport: true
    };
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private convertToResponsesRequest(req: XAIRequest): XAIResponsesRequest {
    const { messages, tools, tool_choice, temperature, max_tokens, top_p, stream: _stream, store: _store, reasoning_effort, continuation, metadata, ...rest } = req;
    
    const input = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : msg.content.map(p => p.text || "").join("\n"),
      tool_calls: msg.tool_calls
    }));

    return {
      model: req.model,
      input,
      tools: req.tools,
      tool_choice: req.tool_choice,
      temperature: req.temperature,
      max_output_tokens: req.max_tokens,
      top_p: req.top_p,
      stream: req.stream,
      store: req.store,
      reasoning: req.reasoning_effort ? { effort: req.reasoning_effort } : undefined,
      metadata: req.metadata,
      previous_response_id: req.continuation
    };
  }

  private convertResponsesToLegacy(responsesResponse: XAIResponsesResponse): XAIResponse {
    let content = "";
    const toolCalls: XAIToolCall[] = [];
    
    if (responsesResponse.output) {
      for (const output of responsesResponse.output) {
        if (output.type === "message" && output.content) {
          if (typeof output.content === "string") {
            content += output.content;
          } else if (Array.isArray(output.content)) {
            for (const part of output.content) {
              if (part.type === "text" && part.text) {
                content += part.text;
              }
            }
          }
        }
        if (output.type === "function_call" || output.type === "tool_call") {
          toolCalls.push({
            id: output.id || randomUUID(),
            type: "function",
            function: {
              name: output.name || "",
              arguments: output.arguments || "{}"
            }
          });
        }
      }
    }

    return {
      id: responsesResponse.id,
      object: "chat.completion",
      created: responsesResponse.created,
      model: responsesResponse.model,
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content,
          tool_calls: toolCalls.length > 0 ? toolCalls : undefined
        },
        finish_reason: "stop"
      }],
      usage: responsesResponse.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      continuation: responsesResponse.output?.find(o => o.type === "message")?.id
    };
  }
}

export function createHTTPTransport(apiKey: string, baseUrl?: string): HTTPTransport {
  return new HTTPTransport(apiKey, baseUrl);
}