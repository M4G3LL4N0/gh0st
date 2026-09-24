# gh0st Screenshots & Assets

This directory contains visual assets for the gh0st README and documentation.

## Required Screenshots

| File | Description | Dimensions |
|------|-------------|------------|
| `hero.png` | Hero section showing main chat interface | 1200x800 |
| `chat-main.png` | Main chat window with conversation | 1200x800 |
| `privacy-inspector.png` | Privacy Inspector panel | 800x600 |
| `agents.png` | Agent selector with built-in agents | 800x600 |
| `files.png` | File attachment and local search | 800x600 |
| `cli.png` | Terminal showing CLI commands | 1200x800 |
| `macos-app.png` | macOS native app window | 1200x800 |
| `architecture.png` | Architecture diagram (SVG preferred) | 1200x800 |

## Guidelines

1. **No sensitive data** - Use demo conversations only
2. **No API keys** - Redact or use placeholder values
3. **Clean UI** - Hide personal info, use consistent theme
4. **Compressed** - Optimize PNGs (target <200KB each)
5. **Consistent styling** - Use system dark/light mode appropriately

## How to Capture

```bash
# macOS: Cmd+Shift+4 for selection, Cmd+Shift+5 for recording
# CLI: Use asciinema or script for terminal recordings
# Browser: Use devtools device toolbar for responsive views
```

## Architecture Diagram

The architecture diagram should visually represent:

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

Create as SVG for scalability, or high-res PNG.

## Placeholder Assets

Until real screenshots are available, the README uses badge-based visual indicators.
See `../README.md` for current implementation.

---

**Note**: This directory is tracked in git. Add actual screenshots before major releases.