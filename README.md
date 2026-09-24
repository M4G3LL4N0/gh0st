# gh0st

[![CI](https://github.com/M4G3LL4N0/gh0st/actions/workflows/ci.yml/badge.svg)](https://github.com/M4G3LL4N0/gh0st/actions/workflows/ci.yml)
[![Security](https://github.com/M4G3LL4N0/gh0st/actions/workflows/security.yml/badge.svg)](https://github.com/M4G3LL4N0/gh0st/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/github/v/release/M4G3LL4N0/gh0st?include_prereleases)](https://github.com/M4G3LL4N0/gh0st/releases)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Browser%20%7C%20CLI-lightgrey)]()
[![Local-First](https://img.shields.io/badge/Local--First-✓-brightgreen)]()
[![No Telemetry](https://img.shields.io/badge/Telemetry-None-brightgreen)]()

**Private AI that keeps the workspace yours.**

gh0st is a local-first encrypted interface for xAI/Grok. Conversations, files, agents and local state stay on your device while xAI performs inference using `store=false` and, when enabled for your xAI team, verifiable Zero Data Retention.

---

## What Makes gh0st Different

| Typical Hosted AI | gh0st |
|-------------------|-------|
| Provider stores your conversation history | **Your device stores application state** |
| Provider controls your data | **xAI performs inference only** |
| Retention policies opaque | **ZDR verified dynamically from xAI response** |
| Cloud account required | **No gh0st account, no cloud** |

---

## Platform Status

| Platform | Status | Notes |
|----------|--------|-------|
| **CLI** | ✅ Available | Full 12-command interface |
| **Browser** | ✅ Available | Local dev server + production build |
| **macOS** | ✅ Available | Native `.app` + DMG installer (ad-hoc signed) |
| **iOS** | 🟡 In Development | Code complete, simulator build pending xcodegen/cocoapods |

---

## Quick Start

### For Users (macOS)

1. **Download** the latest DMG from [GitHub Releases](https://github.com/M4G3LL4N0/gh0st/releases)
2. **Install** by dragging to Applications (or run `./scripts/mac-install.sh` from source)
3. **Launch** gh0st and enter your xAI API key on first run

### For Developers / Source Build

```bash
# Clone the repository
git clone https://github.com/M4G3LL4N0/gh0st.git
cd gh0st

# Bootstrap (checks prerequisites, installs deps, builds)
./setup.sh

# Or manually:
pnpm install
pnpm build

# Run diagnostics
./apps/cli/dist/cli.js doctor

# Configure xAI (requires API key from https://console.x.ai)
./apps/cli/dist/cli.js doctor --setup

# Start using gh0st
./apps/cli/dist/cli.js chat          # Interactive chat
./apps/cli/dist/cli.js ask "..."     # One-shot question
./apps/cli/dist/cli.js web           # Browser UI at http://localhost:1420
./apps/cli/dist/cli.js zdr           # Verify ZDR status
```

### Browser Development

```bash
pnpm dev:client    # Starts Vite dev server at http://localhost:1420
```

---

## Privacy Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER DEVICE                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ gh0st                                                    │   │
│  │ ├─ Encrypted conversations (AES-256-GCM)                │   │
│  │ ├─ Encrypted files & attachments                        │   │
│  │ ├─ Agents & preferences                                 │   │
│  │ ├─ Local memory & search index                          │   │
│  │ └─ Secure credentials (Keychain/Secure Enclave)         │   │
│  └──────────────┬──────────────────────────────────────────┘   │
│                 │ Selected inference context                   │
│                 ▼                                              │
└─────────────────┼──────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      xAI / Grok                                 │
│  ├─ Inference (prompts, tool calls, code execution)            │
│  ├─ Web Search / X Search / Deep Research                      │
│  ├─ store=false  ──► No retention by xAI                       │
│  └─ x-zero-data-retention: true  ──► Verified ZDR              │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- xAI sees inference content **while processing it** — this is required for the model to respond
- ZDR is about **retention after processing** — not invisibility during inference
- gh0st sends `store=false` on all requests and verifies `x-zero-data-retention: true` header
- **Strict mode** (default) blocks sensitive requests until ZDR is verified for your xAI team

---

## Features

### Conversations & Streaming
- Real-time streaming responses with token-by-token display
- Conversation history with branching (local only)
- Markdown rendering with syntax highlighting

### Encrypted Local Storage
- **CLI**: File-based JSON storage in `~/.gh0st/storage/`
- **Browser**: IndexedDB via Dexie with encryption
- **macOS/iOS**: Keychain / Secure Enclave backed vault
- AES-256-GCM encryption with Argon2id key derivation (64MB, 3 iterations, 4 parallel)

### Agents & Tools
| Agent | Tools |
|-------|-------|
| General | Web, X, Code |
| Researcher | Web, X, Deep Research |
| Coder | Code, Web |
| Analyst | Code, Web |
| Custom | Any combination |

### Files & Local Search
- Drag & drop: PDF, DOCX, text, code, images
- Local text extraction (pdf-parse, mammoth)
- Lexical search index built locally
- Encrypted chunked retrieval (1000 tokens, 200 overlap)

### CLI (12 Commands)
```
gh0st chat       # Interactive session
gh0st ask "..."  # One-shot
gh0st web        # Browser UI
gh0st zdr        # Verify ZDR
gh0st agents     # Manage agents
gh0st chats      # List conversations
gh0st export     # Encrypted backup
gh0st import     # Restore backup
gh0st lock       # Lock vault
gh0st wipe       # Secure delete
gh0st status     # System status
gh0st doctor     # Diagnostics
```

### Privacy Inspector
Real-time dashboard showing:
- Vault encryption status
- Conversation & file storage location
- xAI `store=false` confirmation
- ZDR verification status & timestamp
- Tool & MCP privacy boundaries

---

## ZDR Verification

gh0st **dynamically verifies** Zero Data Retention:

1. Sends harmless preflight request with `store: false`
2. Checks response header `x-zero-data-retention: true`
3. Caches result for 30 minutes
4. **Strict mode blocks** sensitive requests if ZDR unverified

> **ZDR is account/team-specific.** gh0st verifies it at runtime — it does not assume every xAI account has ZDR enabled.

---

## Security

- **Encryption**: AES-256-GCM (Web Crypto API / Ring)
- **Key Derivation**: HKDF-SHA-256 (purpose-separated keys)
- **Passphrase KDF**: Argon2id (64MB, 3i, 4p)
- **Nonce**: 12-byte random per encryption
- **Storage**: Encrypted at rest, TLS 1.3 in transit to xAI

See [SECURITY.md](SECURITY.md) for vulnerability reporting and [THREAT_MODEL.md](docs/THREAT_MODEL.md) for threat model.

---

## Documentation

| Document | Description |
|----------|-------------|
| [User Guide](docs/USER_GUIDE.md) | Complete usage documentation |
| [Privacy](docs/PRIVACY.md) | Privacy policy & data handling |
| [Security](SECURITY.md) | Security policy & reporting |
| [ZDR](docs/ZDR.md) | Zero Data Retention details |
| [Cryptography](docs/CRYPTOGRAPHY.md) | Encryption implementation |
| [Architecture](docs/ARCHITECTURE.md) | System architecture |
| [Development](docs/DEVELOPMENT.md) | Contributor guide |
| [Roadmap](ROADMAP.md) | Future milestones |

---

## Development

```bash
# Install dependencies
pnpm install

# Run all checks
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# Security tests (27 tests)
pnpm test:security

# Run doctor diagnostics
./apps/cli/dist/cli.js doctor
```

### Project Structure

```
gh0st/
├── apps/
│   ├── cli/           # Node.js CLI (12 commands)
│   ├── client/        # React + Vite + Tauri 2
│   │   └── src-tauri/ # Native config (macOS/iOS)
│   └── site/          # Static documentation site
├── packages/
│   ├── core/          # Domain models
│   ├── security/      # Crypto + vault (27 tests)
│   ├── storage/       # File + IndexedDB
│   ├── xai/           # xAI HTTP/WS client
│   ├── files/         # File processing & search
│   └── ui/            # React primitives
├── docs/              # Documentation (18 files)
└── scripts/           # Build/install helpers
```

---

## Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| pnpm | 9+ | Package manager |
| Rust | 1.75+ | Tauri native |
| Xcode | 15+ | macOS/iOS builds |
| xAI API Key | — | Inference (from console.x.ai) |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Security issues: **security@gh0st.dev** (private disclosure)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Links

- **Repository**: https://github.com/M4G3LL4N0/gh0st
- **Issues**: https://github.com/M4G3LL4N0/gh0st/issues
- **Discussions**: https://github.com/M4G3LL4N0/gh0st/discussions
- **Releases**: https://github.com/M4G3LL4N0/gh0st/releases
- **Security**: https://github.com/M4G3LL4N0/gh0st/security/advisories

---

*gh0st — Private AI that keeps the workspace yours.*