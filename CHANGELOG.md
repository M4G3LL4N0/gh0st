# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of gh0st
- Local-first encrypted conversation storage
- xAI/Grok integration with streaming
- Zero Data Retention verification
- Built-in agents (General, Researcher, Coder, Analyst)
- Web search, X search, code execution tools
- File attachment with local extraction and search
- CLI with chat, ask, web, status, zdr commands
- Browser-based local web UI
- macOS native app via Tauri
- iOS native app via Tauri
- Encrypted export/import
- Privacy status dashboard
- Threat model documentation
- Security-focused architecture

### Security
- AES-256-GCM encryption via Web Crypto API
- HKDF-SHA-256 key derivation
- Argon2id passphrase derivation
- Secure vault with automatic locking
- ZDR preflight verification
- No analytics/telemetry by default