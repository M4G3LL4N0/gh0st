# Threat Model

## Overview

This document explicitly defines what gh0st protects against and what it does not. We believe honest threat modeling builds more trust than vague privacy claims.

## What gh0st Protects Against

### ✅ Casual Filesystem Inspection
**Protection**: All sensitive data encrypted at rest with AES-256-GCM. Vault master key never stored in plaintext. IndexedDB contains only ciphertext and non-sensitive metadata.

### ✅ Stolen Application Data Directory (Without Unlock Material)
**Protection**: 
- Vault locked by default
- Master key derived from user passphrase via Argon2id (or OS keychain on native)
- Wrong passphrase = no decryption
- Secure key wiping on lock

### ✅ Accidental Plaintext Backups
**Protection**: 
- Export is encrypted by default
- Plaintext export requires explicit `--plaintext` flag with warning
- No automatic cloud sync
- Time Machine/backups see only ciphertext

### ✅ Accidental Provider-Side Persistent Conversation State
**Protection**: 
- Strict mode sends `store:false` to xAI
- ZDR preflight verifies `x-zero-data-retention: true` header
- Blocks sensitive requests if verification fails
- No gh0st server stores conversations

### ✅ Accidental Application Logging
**Protection**: 
- Development diagnostics scrub sensitive content
- Test fixtures use `THIS_MUST_NEVER_APPEAR_IN_LOGS` markers
- No structured logging of prompts/responses in production

### ✅ Accidental Analytics/Telemetry Leakage
**Protection**: 
- No analytics SDKs
- No telemetry by default
- No crash reporting by default
- Opt-in only, clearly labeled

### ✅ Remote gh0st-Server Compromise
**Protection**: 
- **No gh0st conversation server exists**
- No central database to compromise
- No API keys stored on gh0st infrastructure

### ✅ Unauthorized Access to Exported Backups
**Protection**: 
- Exports encrypted with vault master key
- Passphrase required for import
- Versioned format with integrity checks

## What gh0st Does NOT Protect Against

### ❌ Fully Compromised/Unlocked Operating System
**Reality**: If attacker has root/admin on unlocked device, they can:
- Read memory (extract vault keys)
- Keylog passphrases
- Screenshot conversations
- Install malicious browser extensions

**Mitigation**: Use OS security features (FileVault, TPM, Secure Enclave). gh0st cannot protect against compromised host.

### ❌ Malware with Memory Access
**Reality**: Process memory contains decrypted keys during active session.
**Mitigation**: Lock vault when not in use (`gh0st lock` or auto-lock).

### ❌ Screenshots Taken by User or OS
**Reality**: Visual content rendered on screen can be captured.
**Mitigation**: OS-level screenshot protection (limited), user awareness.

### ❌ Keyboard Compromise
**Reality**: Hardware keyloggers, malicious keyboard firmware, OS keyloggers.
**Mitigation**: None at application level.

### ❌ xAI Seeing Plaintext During Inference
**Reality**: **Required for AI to work**. xAI receives message content temporarily for inference.
**Mitigation**: 
- ZDR verified before sensitive requests
- No persistent storage on xAI side (when ZDR active)
- User controls what gets sent

### ❌ Network Metadata (ISP/VPN/DNS)
**Reality**: Destination IP (api.x.ai) visible to network observers.
**Mitigation**: Use VPN/Tor if metadata sensitivity requires it.

### ❌ xAI Account/Billing Metadata
**Reality**: xAI knows which API key made requests, usage volumes, billing info.
**Mitigation**: Use separate API keys per identity if needed.

### ❌ External MCP Servers Seeing Intentionally Sent Information
**Reality**: When you enable MCP, data flows to that server.
**Mitigation**: 
- MCP disabled by default
- Destination shown before enable
- Per-conversation control

### ❌ Remote Web Pages Accessed by Model Tools
**Reality**: Web search/X search fetch external content.
**Mitigation**: 
- Tools opt-in
- User sees tool activity
- No automatic browsing

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                     USER TRUST BOUNDARY                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   gh0st      │  │   OS/Kernel  │  │   Hardware       │  │
│  │   Client     │  │   (trusted)  │  │   (trusted)      │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                     │           │
│         ▼                 ▼                     ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            ENCRYPTED VAULT (AES-256-GCM)            │   │
│  │  Keys derived from passphrase / OS keychain         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NETWORK BOUNDARY                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TLS 1.3 to api.x.ai                                │   │
│  │  store:false + ZDR header verification              │   │
│  │  No gh0st infrastructure in path                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    xAI TRUST BOUNDARY                        │
│  • Temporary inference only (ZDR)                           │
│  • No persistent conversation storage                       │
│  • Account/billing metadata retained                        │
│  • External tools: user-controlled destinations             │
└─────────────────────────────────────────────────────────────┘
```

## Security Controls Summary

| Control | Implementation |
|---------|---------------|
| Encryption at Rest | AES-256-GCM, per-purpose keys |
| Encryption in Transit | TLS 1.3 to xAI |
| Key Management | Vault with Argon2id / OS keychain |
| Authentication | Passphrase / biometric (native) |
| Authorization | Per-conversation tool/agent control |
| Audit | Open source, reproducible builds |
| Incident Response | `gh0st wipe`, vault lock, key rotation |

## Verification

Run security tests:
```bash
pnpm test:security
```

Checks:
- Encrypted payload not plaintext
- Ciphertext modification fails
- Wrong key fails
- Deleted/locked vault returns no plaintext
- Logs contain no secrets
- Browser proxy rejects unexpected origins
- ZDR parser requires actual header
- Strict mode blocks before preflight
- API key never in exported state
- MCP disabled by default