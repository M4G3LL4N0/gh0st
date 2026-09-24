# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public GitHub issue
2. Email security@gh0st.dev with details
3. Include steps to reproduce if possible
4. Allow 90 days for remediation before public disclosure

We will acknowledge receipt within 48 hours and provide a timeline for fix.

## Security Features

- **Encryption**: AES-256-GCM via Web Crypto API
- **Key Derivation**: HKDF-SHA-256 for purpose-separated keys
- **Passphrase Protection**: Argon2id for key encryption
- **ZDR Verification**: Runtime verification of xAI Zero Data Retention
- **Local-First**: No conversation data leaves your device unencrypted
- **Minimal Attack Surface**: No backend server, no analytics, no telemetry

## Threat Model

See [THREAT_MODEL.md](./THREAT_MODEL.md) for detailed threat model and security boundaries.

## Cryptography

See [CRYPTOGRAPHY.md](./CRYPTOGRAPHY.md) for cryptographic design details.

## ZDR Verification

See [ZDR.md](./ZDR.md) for Zero Data Retention verification implementation.