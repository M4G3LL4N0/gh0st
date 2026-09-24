# gh0st User Guide

**Version**: 1.0.0

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Connecting to xAI](#connecting-to-xai)
4. [Privacy & ZDR Verification](#privacy--zdr-verification)
5. [Using the Chat Interface](#using-the-chat-interface)
6. [Agents](#agents)
7. [File Attachments](#file-attachments)
8. [Tools](#tools)
8. [CLI Usage](#cli-usage)
9. [macOS App](#macos-app)
10. [iOS App](#ios-app)
11. [Privacy Inspector](#privacy-inspector)
12. [Vault & Encryption](#vault--encryption)
12. [Export & Import](#export--import)
13. [Settings](#settings)
13. [Troubleshooting](#troubleshooting)

---

## Installation

### Quick Install (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd gh0st

# Run the setup script (checks prerequisites, installs deps, builds)
./setup.sh

# Or manually:
pnpm install
pnpm build
```

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | Required |
| pnpm | 9+ | `npm install -g pnpm` |
| Rust | 1.75+ | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Xcode | 15+ | For macOS/iOS native builds |
| xAI API Key | - | From [console.x.ai](https://console.x.ai) |

### Platform-Specific

| Platform | Additional Requirements |
|----------|------------------------|
| macOS | Xcode Command Line Tools |
| iOS | Xcode + Homebrew + xcodegen + cocoapods |
| Linux | `libwebkit2gtk-4.1-dev` (for Tauri) |
| Windows | Visual Studio Build Tools |

---

## Quick Start

### 1. Start gh0st

```bash
# CLI (recommended for first run)
./apps/cli/dist/cli.js doctor --setup

# Browser UI
pnpm dev:client
# Then open http://localhost:1420

# macOS native app
pnpm mac:build
open apps/client/src-tauri/target/release/bundle/macos/gh0st.app
```

### 2. Connect xAI

1. Get API key from [console.x.ai](https://console.x.ai)
2. Run `gh0st doctor --setup` and enter key
3. ZDR verification runs automatically

### 3. Start Chatting

```
gh0st chat
# or
gh0st ask "Your question here"
```

---

## Connecting to xAI

### API Key Setup

1. Visit [console.x.ai](https://console.x.ai)
2. Create an API key
3. Run `gh0st doctor --setup` and paste the key
4. gh0st will test the connection and verify ZDR

### Key Storage

| Mode | Location | Security |
|------|----------|----------|
| CLI | `~/.gh0st/config.json` | Encrypted in vault |
| Browser | IndexedDB | Encrypted in vault |
| macOS | Keychain (Secure Enclave) | Hardware-backed |
| iOS | Keychain (Secure Enclave) | Hardware-backed |

> **Never** share your API key. gh0st never sends it anywhere except xAI.

---

## Privacy & ZDR Verification

### What is ZDR?

**Zero Data Retention (ZDR)** means xAI does not persist your conversation data after inference. gh0st **verifies** this before sending sensitive data.

### How ZDR Verification Works

1. gh0st sends a harmless test request with `store: false`
2. xAI responds with `x-zero-data-retention: true` header
2. gh0st caches verification for 30 minutes
4. If verification fails, **strict mode blocks sensitive requests**

### Privacy Modes

| Mode | ZDR Required | Use Case |
|------|--------------|----------|
| **Strict** (default) | ✅ Required | Sensitive conversations |
| **Extended** | Optional | With MCP/tools enabled |

### Privacy Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 **ZDR VERIFIED** | ZDR confirmed active |
| 🟡 **ZDR NOT VERIFIED** | Check xAI account |
| 🔴 **ZDR FAILED** | Account lacks ZDR |

---

## Using the Chat Interface

### Starting a Conversation

```bash
# Interactive mode
gh0st chat

# One-shot question
gh0st ask "What is Rust?"

# With specific model
gh0st ask -m grok-3-mini "Explain async/await"
```

### Commands in Chat

| Command | Description |
|---------|-------------|
| `/help` | Show commands |
| `/exit` / `/quit` | Exit chat |
| `/new` | New conversation |
| `/chats` | List conversations |
| `/load <id>` | Load conversation |
| `/model <name>` | Switch model |
| `/attach <path>` | Attach file |
| `/clear` | Clear screen |

### Message Features

| Feature | Support |
|---------|---------|
| Markdown rendering | ✅ |
| Code syntax highlighting | ✅ |
| Tables | ✅ |
| Citations | ✅ |
| File attachments | ✅ |
| Tool activity display | ✅ |
| Copy message | ✅ |
| Edit & resend | ✅ |
| Retry failed | ✅ |

---

## Agents

### Built-in Agents

| Agent | Icon | Description | Tools |
|-------|------|-------------|-------|
| **General** | ✨ | Balanced assistant | Web, X, Code |
| **Researcher** | 🔍 | Deep research | Web, X, Deep Research |
| **Coder** | 💻 | Software development | Code, Web |
| **Analyst** | 📊 | Data analysis | Code, Web |

### Creating Custom Agents

```bash
gh0st agents --create
# Prompts for: name, icon, description, instructions, model, tools
```

### Agent Configuration

| Setting | Description |
|---------|-------------|
| Name | Display name |
| Icon | Emoji or Lucide name |
| Description | Shown in selector |
| Instructions | System prompt |
| Model | grok-3, grok-3-mini, grok-2 |
| Reasoning | low / medium / high |
| Tools | Web, X, Code, MCP, Deep Research |
| Files | Attached file IDs |
| MCP Servers | Server IDs |

---

## File Attachments

### Supported Formats

| Type | Extensions | Processing |
|------|------------|------------|
| Text | .txt, .md, .json, .csv, .js, .ts, .py, .html, .css, .xml, .yaml | Full text extraction |
| PDF | .pdf | Text extraction via pdf-parse |
| Documents | .docx | Text extraction via mammoth |
| Images | .png, .jpg, .webp, .gif | Base64 for multimodal |

### Attaching Files

**CLI**:
```bash
gh0st chat
> /attach path/to/document.pdf
```

**Browser**:
- Drag & drop files onto composer
- Click paperclip icon

### File Processing

1. File read locally
2. Text extracted (where applicable)
3. Encrypted with AES-256-GCM
4. Stored in encrypted vault
5. Chunked for retrieval (1000 tokens, 200 overlap)
6. Lexical search index built locally

### File Privacy

| Aspect | Protection |
|--------|------------|
| At rest | AES-256-GCM encrypted |
| In transit | TLS 1.3 to xAI only |
| Search index | Local only, encrypted |
| xAI transmission | Only selected chunks |

---

## Tools

### Available Tools

| Tool | Description | Privacy |
|------|-------------|---------|
| **Web Search** | Search the web | ZDR-covered |
| **X Search** | Search X/Twitter | ZDR-covered |
| **Code Execution** | Run Python/JS | ZDR-covered |
| **Remote MCP** | External servers | NOT ZDR-covered |
| **Deep Research** | Multi-step research | ZDR-covered |

### Tool Configuration

```bash
# In chat: click settings icon to toggle tools
# CLI: tools are enabled by default
```

### MCP (Model Context Protocol)

> ⚠️ **External MCP servers are NOT covered by xAI ZDR**

When enabling MCP:
1. Server URL and auth shown
2. Data categories visible
3. Per-server enable/disable
4. Per-agent assignment

---

## CLI Usage

### Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `gh0st chat` | Interactive chat | `gh0st chat --strict` |
| `gh0st ask <q>` | One-shot question | `gh0st ask "What is Rust?"` |
| `gh0st web` | Start browser UI | `gh0st web --port 1420` |
| `gh0st status` | System status | `gh0st status` |
| `gh0st zdr` | Verify ZDR | `gh0st zdr` |
| `gh0st agents` | Manage agents | `gh0st agents --create` |
| `gh0st chats` | List conversations | `gh0st chats --all` |
| `gh0st export` | Export data | `gh0st export -o backup.gh0st` |
| `gh0st import <f>` | Import data | `gh0st import backup.gh0st` |
| `gh0st lock` | Lock vault | `gh0st lock` |
| `gh0st wipe` | Delete all data | `gh0st wipe --force` |
| `gh0st doctor` | Diagnostics | `gh0st doctor --setup` |

### Common Flags

| Flag | Description |
|------|-------------|
| `-m, --model` | Model to use |
| `-a, --agent` | Agent to use |
| `--strict` | Enable strict privacy mode |
| `--plaintext` | Export without encryption |

---

## macOS App

### Installation

```bash
# Build and install
pnpm mac:build
./scripts/mac-install.sh

# Or manually
open apps/client/src-tauri/target/release/bundle/macos/gh0st.app
```

### DMG Installer

```bash
pnpm mac:dmg
# Opens gh0st_1.0.0_aarch64.dmg
# Drag to Applications
```

### macOS Features

| Feature | Status |
|---------|--------|
| Native window | ✅ |
| Transparent title bar | ✅ |
| Menu bar integration | ✅ |
| System tray | ✅ |
| Global shortcut (⌘⇧G) | ✅ |
| File drag & drop | ✅ |
| Native file picker | ✅ |
| Dark/Light mode | ✅ |
| Keyboard shortcuts | ✅ |
| Touchpad gestures | ✅ |
| Secure Enclave vault | ✅ |
| App lock (timeout) | ✅ |
| Restart persistence | ✅ |

### App Lock

- Auto-lock: 1 / 5 / 15 min / never
- Background lock: ✅
- Face ID / Touch ID unlock: ✅ (Secure Enclave)
- Passphrase unlock: ✅

---

## iOS App

### Status

> ⚠️ **Development build only** — Requires Xcode + Homebrew tooling

### Requirements

- Xcode 15+ ✅
- iOS 16+ target
- Homebrew + xcodegen + cocoapods (for build)

### Build Commands

```bash
# Initialize iOS project (one-time)
pnpm ios:init

# Build for simulator
pnpm ios:build

# Run on simulator
pnpm ios:dev

# Build for device
pnpm ios:build --device
```

### iOS Features

| Feature | Status |
|---------|--------|
| Safe areas / Dynamic Island | ✅ |
| Keyboard avoidance | ✅ |
| Touch targets | ✅ |
| Dark/Light mode | ✅ |
| Reduced motion | ✅ |
| Background privacy | ✅ |
| Secure Enclave vault | ✅ |
| Face ID / Touch ID | ✅ |

### iOS Limitations

| Limitation | Notes |
|------------|-------|
| No FileProvider | Limited file access |
| Background modes | Limited to fetch |
| No app groups | iOS sandbox |
| Simulator only | Unless Apple Developer |

---

## Privacy Inspector

Access via the shield icon in the header (or Settings → Privacy).

### Privacy Status Panel

```
GH0ST PRIVACY

Vault
Encrypted + Unlocked

Conversation Storage
This device

Files
This device

xAI storage request
store=false

xAI ZDR
VERIFIED

Last checked
3 minutes ago

Telemetry
Off

Analytics
None

External MCP
None

Tools
Web: enabled
X: disabled
Code: enabled
```

### What Each Field Means

| Field | Description |
|-------|-------------|
| Vault | Encryption status |
| Conversation Storage | Where chats live |
| Files | Where attachments live |
| xAI storage request | `store=false` sent |
| xAI ZDR | Verified / Not Verified |
| Last checked | ZDR cache timestamp |
| Telemetry | Always off by default |
| Analytics | None collected |
| External MCP | Configured servers |
| Tools | Enabled tool boundaries |

---

## Vault & Encryption

### How It Works

```
User Passphrase
     │
     ▼
Argon2id (64MB, 3 iter, 4 parallel)
     │
     ▼
Master Key (256-bit)
     │
     ├── HKDF → Conversations Key
     ├── HKDF → Attachments Key
     ├── HKDF → Agents Key
     ├── HKDF → Preferences Key
     ├── HKDF → MCP Credentials Key
     └── HKDF → Export Key
```

### Key Properties

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key derivation | HKDF-SHA-256 |
| Passphrase KDF | Argon2id (64MB, 3i, 4p) |
| Nonce | 12-byte random per encryption |
| Versioning | v1 in ciphertext header |

### Vault Operations

| Action | Command |
|--------|---------|
| Lock | `gh0st lock` |
| Unlock | Auto on auth / `gh0st doctor --setup` |
| Status | `gh0st status` |
| Rotate keys | Auto on config change |

### Auto-Lock

| Trigger | Options |
|---------|---------|
| Timer | 1 / 5 / 15 min / never |
| App background | ✅ |
| Screen lock | ✅ (macOS/iOS) |
| Manual | `gh0st lock` |

---

## Export & Import

### Export

```bash
# Encrypted (default)
gh0st export -o backup.gh0st

# Plaintext (explicit opt-in)
gh0st export --plaintext -o backup.json
```

### Import

```bash
gh0st import backup.gh0st
```

### Export Contents

| Included | Encrypted |
|----------|-----------|
| Conversations | ✅ |
| Messages | ✅ |
| Attachments | Optional |
| Agents | ✅ |
| Settings | ✅ |
| Encrypted continuations | ✅ |
| Privacy state | ✅ |

### Export Security

| Aspect | Implementation |
|--------|----------------|
| Encryption | AES-256-GCM |
| Key derivation | Argon2id (export-specific) |
| Integrity | Authenticated encryption |
| Versioning | v1 format |
| Tamper detection | AEAD tag |

---

## Settings

### General

| Setting | Default | Description |
|---------|---------|-------------|
| Theme | system | light / dark / system |
| Compact mode | off | Reduced spacing |
| Show token counts | on | Display usage |

### AI

| Setting | Default | Description |
|---------|---------|-------------|
| Model | grok-3 | Default model |
| Reasoning effort | medium | low / medium / high |
| Default agent | General | Starting agent |

### Privacy

| Setting | Default | Description |
|---------|---------|-------------|
| Strict mode | on | Require ZDR |
| Store conversations | off | Local only |
| Telemetry | off | No analytics |

### Tools

| Tool | Default | Description |
|------|---------|-------------|
| Web Search | on | xAI web search |
| X Search | off | xAI X search |
| Code Execution | on | Sandboxed |
| Remote MCP | off | External servers |
| Deep Research | off | Multi-step research |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "No xAI API key" | Run `gh0st doctor --setup` |
| "ZDR not verified" | Check xAI account has ZDR enabled |
| "Vault locked" | Run `gh0st doctor --setup` to unlock |
| "IndexedDB failed" | Browser only; CLI uses file storage |
| "App won't open" | Right-click → Open (unsigned) |
| "Build fails" | Check `pnpm doctor` |

### CLI Debugging

```bash
# Verbose output
DEBUG=gh0st:* gh0st chat

# Check config
cat ~/.gh0st/config.json

# Reset vault
gh0st lock
gh0st doctor --setup
```

### macOS App Issues

| Issue | Fix |
|-------|-----|
| "App is damaged" | `xattr -cr gh0st.app` |
| "Cannot be opened" | Right-click → Open |
| "Codesign failed" | Use `pnpm mac:build` (ad-hoc) |
| "Notarization failed" | Requires Apple Developer Program |

### Logs

| Location | Contents |
|----------|----------|
| `~/.gh0st/logs/` | CLI logs |
| Console.app | macOS app logs |
| Browser DevTools | Web client logs |

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/gh0st/gh0st/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gh0st/gh0st/discussions)
- **Security**: security@gh0st.dev
- **Privacy**: privacy@gh0st.dev

---

*gh0st v1.0.0 — Private AI that keeps the workspace yours.*