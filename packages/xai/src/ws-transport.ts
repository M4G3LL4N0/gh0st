import {
  XAITransport,
  XAIRequest,
  XAIResponse,
  XAIStreamChunk,
  ZDRVerificationResult,
  TransportCapabilities,
  XAI_WS_URL
} from "./types.js";

declare const WebSocket: {
  new (url: string, options?: { headers?: Record<string, string> }): WebSocket;
  readonly OPEN: number;
  readonly CLOSED: number;
};

interface WebSocket {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
}

interface MessageEvent {
  data: string;
}

interface CloseEvent {
  code: number;
  reason: string;
}

interface Event {}

interface EventTarget {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

type EventListener = (event: Event) => void;

interface Event {
  type: string;
  target: EventTarget;
}

interface CloseEvent extends Event {
  code: number;
  reason: string;
}

interface MessageEvent extends Event {
  data: string;
}

export class WebSocketTransport implements XAITransport {
  private baseUrl: string;
  private apiKey: string;
  private ws: WebSocket | null = null;
  private pendingRequests: Map<string, { resolve: (value: XAIStreamChunk) => void; reject: (error: Error) => void }> = new Map();
  private requestId = 0;
  private connected = false;

  constructor(apiKey: string, baseUrl: string = "wss://api.x.ai/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(`${this.baseUrl}/responses`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        }
      });

      this.ws.onopen = () => {
        this.connected = true;
        resolve();
      };

      this.ws.onerror = (event: Event) => {
        this.connected = false;
        reject(new Error(`WebSocket connection failed: ${event}`));
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.ws = null;
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as XAIStreamChunk & { request_id?: string };
          if (data.request_id) {
            const pending = this.pendingRequests.get(data.request_id);
            if (pending) {
              if (data.choices[0]?.finish_reason) {
                this.pendingRequests.delete(data.request_id);
              }
              pending.resolve(data);
            }
          }
        } catch {
        }
      };
    });
  }

  async request(req: XAIRequest): Promise<XAIResponse> {
    await this.connect();
    const id = `req_${++this.requestId}`;
    const { stream: _stream, store, ...requestBody } = req;

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

      this.ws!.send(JSON.stringify({
        ...requestBody,
        stream: false,
        store: store ?? false,
        request_id: id
      }));
    });
  }

  async *streamRequest(req: XAIRequest): AsyncIterable<XAIStreamChunk> {
    await this.connect();
    const id = `req_${++this.requestId}`;
    const { store: _store, ...requestBody } = req;

    const queue: XAIStreamChunk[] = [];
    let finished = false;
    let streamError: Error | null = null;
    let resolver: ((value: IteratorResult<XAIStreamChunk>) => void) | null = null;
    const resolverRef: { current: ((value: IteratorResult<XAIStreamChunk>) => void) | null } = { current: resolver };

    const pending = {
      resolve: (chunk: XAIStreamChunk) => {
        queue.push(chunk);
        const cb = resolverRef.current;
        if (cb) {
          cb({ value: queue.shift()!, done: false });
          resolverRef.current = null;
        }
        if (chunk.choices[0]?.finish_reason) {
          this.pendingRequests.delete(id);
          finished = true;
          const cb2 = resolverRef.current;
          if (cb2) {
            cb2({ value: undefined, done: true });
            resolverRef.current = null;
          }
        }
      },
      reject: (error: Error) => {
        streamError = error;
        finished = true;
        this.pendingRequests.delete(id);
        const cb = resolverRef.current;
        if (cb) {
          cb({ value: undefined, done: true });
          resolverRef.current = null;
        }
      }
    };

    this.pendingRequests.set(id, pending);

    this.ws!.send(JSON.stringify({
      ...requestBody,
      stream: true,
      store: _store ?? false,
      request_id: id
    }));

    while (true) {
      if (queue.length > 0) {
        yield queue.shift()!;
        continue;
      }

      if (finished) {
        if (streamError) throw streamError;
        break;
      }

      await new Promise<void>((resolve) => {
        resolverRef.current = (result) => {
          if (!result.done && result.value) {
            queue.push(result.value);
          }
          resolve();
        };
      });
    }

    this.pendingRequests.delete(id);
  }

  async verifyZDR(apiKey: string, baseUrl: string): Promise<ZDRVerificationResult> {
    const httpUrl = baseUrl.replace("wss://", "https://").replace("ws://", "http://");
    const response = await fetch(`${httpUrl}/responses`, {
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

  getCapabilities(): TransportCapabilities {
    return {
      httpStreaming: false,
      websocketStreaming: true,
      zdrVerification: true,
      continuationSupport: true
    };
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

export function createWebSocketTransport(apiKey: string, baseUrl?: string): WebSocketTransport {
  return new WebSocketTransport(apiKey, baseUrl);
}
