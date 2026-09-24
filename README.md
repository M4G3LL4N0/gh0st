# gh0st

Private AI client — local-first, encrypted, xAI-powered.

## Overview

gh0st is a polished, open-source AI client that gives you a ChatGPT-class experience with zero compromise on privacy. Conversations stay on your device. Encrypted by default. Powered by Grok.

## Features

- **Local-First & Encrypted**: All conversations, attachments, and preferences encrypted on your device using AES-256-GCM
- **Zero Data Retention Verified**: Strict mode enforces xAI's ZDR and verifies the `x-zero-data-retention` header
- **Streaming & Real-time**: HTTP streaming with WebSocket support for instant responses
- **Agents & Tools**: Built-in agents with web search, X search, code execution, and MCP support
- **Files & Local Search**: Drag-and-drop files with local extraction and lexical retrieval
- **CLI + Browser + Native**: One codebase for terminal, web, macOS, and iOS
- **Transparent Privacy**: Real-time privacy status dashboard
- **Import/Export**: Encrypted backups with passphrase protection

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- xAI API key (get one at https://console.x.ai)

### Installation

```bash
# Clone the repository
git clone https://github.com/gh0st/gh0st.git
cd gh0st

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development server
pnpm dev:client
```

### CLI Usage

```bash
# Interactive chat
gh0st chat

# One-shot question
gh0st ask "What is Rust?"

# Start local web UI
gh0st web

# Verify ZDR
gh0st zdr

# Check status
gh0st status
```

## Configuration

gh0st stores configuration in `~/.gh0st/config.json`:

```json
{
  "xai": {
    "apiKey": "your-api-key",
    "baseUrl": "https://api.x.ai/v1"
  },
  "privacy": {
    "strictMode": true,
    "storeConversations": false,
    "telemetryEnabled": false
  },
  "ui": {
    "theme": "system",
    "compactMode": false
  }
}
```

## Privacy Model

gh0st is privacy-first by architecture:

- No gh0st cloud service required
- No analytics by default
- No telemetry by default
- No account required
- No hosted conversation database
- Encrypted local storage
- ZDR verified before sensitive requests

See [THREAT_MODEL.md](./THREAT_MODEL.md) for detailed threat model.

## Development

```bash
# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build for production
pnpm build
```

## License

MIT License — see [LICENSE](../LICENSE) for details.