# Architecture

## Overview

gh0st follows a modular monorepo architecture with clear separation of concerns:

```
gh0st/
├── apps/
│   ├── client/          # React + Vite + Tauri (browser, macOS, iOS)
│   ├── cli/             # Node.js CLI + local web server
│   └── site/            # Static documentation site
├── packages/
│   ├── core/            # Domain models, types, constants
│   ├── security/        # Encryption, vault, crypto abstraction
│   ├── storage/         # Storage interfaces & implementations
│   ├── xai/             # xAI API client & transport
│   ├── files/           # File processing, indexing, search
│   └── ui/              # Shared React UI primitives
└── docs/                # Documentation
```

## Core Principles

1. **Local-First**: All user data stays on device
2. **Encrypted by Default**: AES-256-GCM for all sensitive data
3. **Minimal Dependencies**: Only what's necessary
4. **Single UI Codebase**: React shared across all platforms
5. **Security Auditable**: Clear crypto abstraction, no homemade crypto

## Data Flow

```
User Input
    │
    ▼
Composer (React)
    │
    ▼
Store (Zustand) ──▶ Vault (Encryption)
    │                    │
    ▼                    ▼
xAI Client ◀──────▶ HTTP/WebSocket Transport
    │                    │
    ▼                    ▼
Streaming Response ◀──▶ xAI API (store:false)
    │
    ▼
Message Bubble (React)
    │
    ▼
IndexedDB Storage (Encrypted)
```

## Packages

### @gh0st/core
Domain models: Conversation, Message, Attachment, Agent, ToolEvent, UsageRecord, PrivacyState, ExportPackage

### @gh0st/security
- `WebCryptoProvider`: AES-256-GCM via Web Crypto API
- `Vault`: Master key management, purpose-derived keys, encryption/decryption
- Key purposes: conversations, attachments, agents, preferences, MCP credentials, export

### @gh0st/storage
- `Storage` interface with adapters for conversations, messages, attachments, agents, tool events, usage, continuations, privacy
- `IndexedDBStorage`: Browser implementation using Dexie/idb
- Versioned schema with migrations

### @gh0st/xai
- `XAIClient`: High-level chat API with streaming
- `HTTPTransport`: REST + SSE streaming
- `WebSocketTransport`: WebSocket streaming (when available)
- ZDR verification via `x-zero-data-retention` header

### @gh0st/files
- Processors: Text, PDF, DOCX, Images
- Lexical indexer with token-based search
- IndexedDB file storage

### @gh0st/ui
- Primitives: Button, Input, Textarea, Card, Badge, Avatar, Dropdown, Tooltip, ScrollArea, Separator
- Tailwind CSS with custom design tokens
- Accessibility built-in

## Apps

### @gh0st/client
- React 18 + Vite + TypeScript
- Zustand for state management
- React Markdown with syntax highlighting
- Tauri 2 for native macOS/iOS
- Responsive design: desktop sidebar + mobile drawer

### @gh0st/cli
- Commander.js for CLI
- Interactive chat with readline
- Marked terminal rendering
- Local Express + WS server for browser UI
- Origin validation, session tokens

### @gh0st/site
- Vite + React static site
- Tailwind CSS
- Components: Hero, Features, Privacy, Docs, Footer

## Security Boundaries

```
┌─────────────────────────────────────────────┐
│                  User Device                │
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │   gh0st     │  │    Encrypted Vault  │  │
│  │   Client    │◀─▶│  (AES-256-GCM)     │  │
│  └──────┬──────┘  └─────────────────────┘  │
│         │                                   │
│         ▼                                   │
│  ┌─────────────────────┐                    │
│  │  xAI Transport      │                    │
│  │  (HTTPS/WSS)        │                    │
│  │  store:false        │                    │
│  │  ZDR Verified       │                    │
│  └──────────┬──────────┘                    │
└─────────────┼───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│              xAI Infrastructure             │
│  • No gh0st server                          │
│  • ZDR: no persistent conversation storage  │
│  • Temporary inference only                 │
└─────────────────────────────────────────────┘
```

## Future: Device-to-Device Sync

Interfaces defined but not implemented:
- `DeviceIdentity`, `DeviceLink`, `EncryptedEnvelope`, `CryptoProvider`
- Will enable Double Ratchet / libsignal for E2EE sync
- No central server required