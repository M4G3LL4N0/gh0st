# Reference Research

## Projects Analyzed

### assistant-ui
- **Repo**: YousefED/assistant-ui
- **Strengths**: Streaming, message rendering, tool visualization, accessibility
- **Used**: Architecture patterns for message/components, streaming hooks
- **License**: MIT

### khattaksd/zdrchat
- **Repo**: khattaksd/zdrchat
- **Strengths**: ZDR focus, privacy-first, local storage
- **Used**: ZDR verification patterns, privacy UI concepts
- **License**: MIT

### ChatGPTNextWeb/NextChat
- **Repo**: ChatGPTNextWeb/NextChat
- **Strengths**: Polish, multi-platform, prompt library
- **Used**: UI/UX reference, conversation management
- **License**: MIT

### vercel/chatbot
- **Repo**: vercel/chatbot
- **Strengths**: Vercel AI SDK integration, streaming
- **Used**: Streaming patterns, AI SDK concepts
- **License**: MIT

### danny-avila/LibreChat
- **Repo**: danny-avila/LibreChat
- **Strengths**: Multi-provider, agents, tools, file handling
- **Used**: Agent/tool architecture, file processing
- **License**: MIT

### open-webui/open-webui
- **Repo**: open-webui/open-webui
- **Strengths**: RAG, model management, community features
- **Used**: File indexing concepts, model selection
- **License**: MIT

### u14app/neo-chat
- **Repo**: u14app/neo-chat
- **Strengths**: Clean UI, Tauri native, privacy-focused
- **Used**: Tauri patterns, native integration
- **License**: MIT

### lobehub/lobe-chat
- **Repo**: lobehub/lobe-chat
- **Strengths**: Plugin system, agents, branching, polish
- **Used**: Agent design, conversation branching
- **License**: MIT

### tauri-apps/tauri
- **Repo**: tauri-apps/tauri
- **Strengths**: Native Rust backend, secure IPC, small binaries
- **Used**: Native architecture, security patterns
- **License**: MIT/Apache-2.0

### signalapp/libsignal
- **Repo**: signalapp/libsignal
- **Strengths**: Double Ratchet, X3DH, Sesame, post-quantum
- **Used**: Future device-to-device E2EE design reference
- **License**: GPLv3

## Key Architectural Lessons

### 1. Streaming First
All modern chat UIs prioritize streaming. HTTP SSE works everywhere; WebSocket adds complexity. Implement HTTP streaming first, add WebSocket as enhancement.

### 2. Message as Source of Truth
Messages contain: content parts, tool calls, citations, usage, errors, continuation refs. Don't split across stores.

### 3. Local-First Storage
IndexedDB (Dexie) works well for browser. Encrypt at application layer, not storage layer. Version schemas from day one.

### 4. Tool Visualization
Users need to see: tool name, args, status, output, errors. Render as structured cards, not raw JSON.

### 5. Agent = Preset, Not Framework
Starter agents are just: name, icon, instructions, model, tools, files. Don't build AgentOS.

### 6. Privacy UI Must Be Visible
ZDR status, vault state, active tools, MCP destinations — all in header/status bar. No hidden privacy.

### 7. CLI Is Not Afterthought
Real users live in terminal. Marked terminal rendering, readline, Ctrl-C cancellation, streaming output.

### 8. Native ≠ Electron
Tauri 2: Rust backend, WebView frontend, 3-5MB binaries, system WebView. Perfect for this use case.

### 9. Crypto Abstraction
Single `CryptoProvider` interface. Web Crypto for browser/Node, native bindings for Tauri. Enables future PQC/libsignal.

### 10. Configuration Precedence
CLI flags → Env vars → Encrypted config → Defaults. Never plaintext secrets in config files.

## Patterns Adopted

| Pattern | Source | Adaptation |
|---------|--------|------------|
| Message parts array | assistant-ui | Added encrypted continuation ref |
| Streaming hook | vercel/chatbot | Custom for xAI transport |
| Agent presets | lobe-chat | Simplified to 4 starters |
| File processing | open-webui | Local-only, no vector DB |
| Tauri security | tauri-apps/tauri | Stronghold/keychain integration |
| ZDR verification | zdrchat | Preflight + caching + UI |
| Threat model doc | Signal | Honest boundaries |

## Patterns Rejected

| Pattern | Reason |
|---------|--------|
| Multi-provider abstraction | xAI only for V1, YAGNI |
| Centralized sync server | Violates local-first |
| Vector DB / embeddings | Heavy, not needed for lexical |
| Plugin system | Complexity, V2+ |
| Hosted analytics | Privacy violation |
| Auto-update from gh0st server | Supply chain risk |
| Social features | Not core to AI client |

## License Compliance

All referenced projects use MIT/Apache-2.0 except libsignal (GPLv3).
- libsignal used for **design reference only** — no code copied
- Future device sync will use compatible license or clean-room implementation

## Ongoing Research

- [ ] xAI WebSocket API stabilization
- [ ] Tauri 2 Stronghold integration maturity
- [ ] Web Crypto vs native crypto performance
- [ ] Argon2id WASM bundle size
- [ ] IndexedDB encryption performance at scale