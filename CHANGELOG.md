# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc.1] - 2026-09-24

First public release candidate.

### Available

- macOS Apple Silicon native application build
- Local CLI workflow
- Local browser UI
- Encrypted local conversations, files, agents, and preferences
- xAI Responses API integration with `store=false`
- ZDR-aware runtime verification when enabled for the user's xAI team
- Web, X, Code, and optional MCP tools
- Privacy Inspector, encrypted export/import, and local diagnostics

### Privacy and security

- AES-256-GCM encrypted application state
- HKDF-SHA-256 key derivation
- Argon2id passphrase derivation
- No gh0st cloud required for ordinary use
- No analytics
- No telemetry by default
- External MCP services remain a separate privacy boundary

### Known limitations

- macOS release artifacts are ad-hoc signed, not Developer ID signed or notarized
- iOS remains in development and is not publicly downloadable
- Live ZDR verification depends on xAI team configuration
- Auto-update is not enabled until signed updater artifacts are configured

## [1.0.0] - Internal development baseline

- Initial local development implementation
- Local-first encrypted conversation storage
- xAI/Grok integration with streaming
- ZDR verification implementation
- Built-in agents and tools
- File attachment with local extraction and search
- CLI, browser client, and macOS Tauri application
