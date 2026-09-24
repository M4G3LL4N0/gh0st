# Security Audit

**Last Updated**: 2024-01-15
**Version**: 1.0.0

## Executive Summary

This document summarizes the security posture of gh0st v1.0.0, including threat model, cryptographic implementation, key storage, ZDR verification, localhost security, external tool boundaries, and remaining risks.

## Threat Model

See [THREAT_MODEL.md](../THREAT_MODEL.md) for complete threat model.

### Protected Against

| Threat | Mitigation |
|--------|------------|
| Casual filesystem inspection | AES-256-GCM encryption at rest |
| Stolen app data (without unlock) | Vault locked by default, Argon2id passphrase |
| Accidental plaintext backups | Encrypted export default, no auto-sync |
| Provider-side persistence | `store:false` + ZDR header verification |
| Application logging | No sensitive content in logs |
| Analytics/telemetry leakage | No analytics SDKs, opt-in only |
| gh0st server compromise | No gh0st conversation server exists |
| Encrypted export access | Passphrase-protected, authenticated encryption |

### Not Protected Against

| Threat | Reason |
|--------|--------|
| Fully compromised OS/malware | Cannot protect against root/admin on unlocked device |
| xAI seeing plaintext during inference | Required for AI to function |
| Network metadata (ISP/VPN) | TLS hides content, not destination |
| xAI account/billing metadata | xAI retains account info |
| External MCP servers | User explicitly enables, data sent intentionally |
| Screenshots/shoulder surfing | Visual rendering on screen |

## Cryptography

See [CRYPTOGRAPHY.md](../CRYPTOGRAPHY.md) for complete details.

### Primitives

| Component | Implementation |
|-----------|----------------|
| Symmetric encryption | AES-256-GCM via Web Crypto API |
| Key derivation | HKDF-SHA-256 |
| Passphrase derivation | Argon2id (64MB, 3 iterations, 4 parallelism) |
| Nonce generation | 12-byte random via `crypto.getRandomValues()` |

### Key Hierarchy

```
Master Secret (256-bit random)
    │
    ├── HKDF → Conversations Key
    ├── HKDF → Attachments Key
    ├── HKDF → Agents Key
    ├── HKDF → Preferences Key
    ├── HKDF → MCP Credentials Key
    └── HKDF → Export Key
```

### Ciphertext Format

```json
{
  "v": 1,
  "alg": "AES-256-GCM",
  "nonce": "base64url(12 bytes)",
  "ciphertext": "base64url(ciphertext + tag)",
  "salt": "base64url(16 bytes)",
  "purpose": "conversations"
}
```

### Security Properties

| Property | Verified |
|----------|----------|
| Round-trip encryption/decryption | ✅ |
| Wrong key rejection | ✅ |
| Tampering detection | ✅ |
| Nonce uniqueness | ✅ |
| Version migration support | ✅ |
| Corrupted ciphertext handling | ✅ |

## Key Storage

### Browser (IndexedDB)

| Data | Protection |
|------|------------|
| Vault master key | Never stored (derived from passphrase) |
| Derived keys | Memory only, wiped on lock |
| Conversations | AES-256-GCM encrypted |
| Attachments | AES-256-GCM encrypted |
| MCP credentials | AES-256-GCM encrypted |

### macOS/iOS (Tauri)

| Data | Protection |
|------|------------|
| Vault master key | iOS Keychain / macOS Keychain (Secure Enclave when available) |
| Passphrase | Never stored, used to unlock keychain item |
| Biometric unlock | Face ID / Touch ID via Keychain ACL |

### CLI

| Data | Protection |
|------|------------|
| Vault master key | Keychain (macOS) / Encrypted file (Linux/Windows) |
| Passphrase | Never stored, interactive entry |

## ZDR Verification

See [ZDR.md](../ZDR.md) for complete details.

### Implementation

```typescript
async function verifyZDR(apiKey: string, baseUrl: string): Promise<ZDRResult> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Store": "false"
    },
    body: JSON.stringify({
      model: "grok-3",
      messages: [{ role: "user", content: "ZDR test" }],
      max_tokens: 1,
      store: false
    })
  });

  const headerValue = response.headers.get("x-zero-data-retention");
  return {
    verified: headerValue === "true",
    headerValue: headerValue || undefined,
    timestamp: Date.now()
  };
}
```

### Enforcement

| Scenario | Behavior |
|----------|----------|
| Strict mode + ZDR verified | ✅ Allow chat |
| Strict mode + ZDR not verified | ❌ Block with error |
| Strict mode + ZDR verification failed | ❌ Block with error |
| Extended mode | ✅ Allow (shows external boundaries) |

### Caching

- Verification cached for 30 minutes
- Re-validated on auth/config changes
- Manual re-verification available

## Localhost Security

### Browser Proxy Server

The `gh0st web` command starts a local Express + WebSocket server.

### Protections

| Protection | Implementation |
|------------|----------------|
| Bind address | `127.0.0.1` only (never `0.0.0.0`) |
| Origin validation | Only `127.0.0.1` and `localhost` allowed |
| CSRF protection | Random session token per session |
| CORS | Restricted to allowed origins |
| No public exposure | No port forwarding, no ngrok |

### Session Token

```typescript
const sessionToken = crypto.randomBytes(32).toString("hex");
// Sent via Authorization header or cookie
// Validated on every request
```

## External Tool Boundaries

### xAI Server Tools (ZDR-Covered)

| Tool | Data Sent | ZDR Status |
|------|-----------|------------|
| Web Search | Query only | ✅ Covered |
| X Search | Query only | ✅ Covered |
| Code Execution | Code + stdin | ✅ Covered |

### External MCP (NOT ZDR-Covered)

| Aspect | Implementation |
|--------|----------------|
| Default state | Disabled |
| Enable UI | Shows host, auth, data categories |
| Per-server toggle | Yes |
| Per-agent assignment | Yes |
| Boundary visibility | Explicit warning before use |

### Data Flow

```
User Message
    │
    ├── Local processing (files, context)
    │
    ├── xAI Request (store=false)
    │   ├── System prompt
    │   ├── Conversation history
    │   ├── User message
    │   └── Tool definitions
    │
    ├── xAI Response
    │   ├── Assistant message
    │   ├── Tool calls (if any)
    │   └── Continuation token
    │
    └── Local storage (encrypted)
```

## Remaining Risks

### High

| Risk | Impact | Mitigation |
|------|--------|------------|
| crates.io network failure | macOS/iOS builds fail | Document local build, retry logic |
| No Apple certs | Cannot distribute signed apps | Document local dev builds only |
| No xAI key in CI | Cannot verify live ZDR | Document manual verification |

### Medium

| Risk | Impact | Mitigation |
|------|--------|------------|
| IndexedDB not available in Node | CLI storage fails | Expected - CLI uses file-based vault |
| Web Crypto not in all environments | Encryption fails | Polyfill or native fallback needed |
| Stronghold password in config | Weak default | Must be set by user |

### Low

| Risk | Impact | Mitigation |
|------|--------|------------|
| Argon2id WASM size | Bundle size | Acceptable tradeoff |
| No hardware key support | Key in memory | Future: Secure Enclave integration |
| No forward secrecy in export | Old exports decryptable | Versioned exports, key rotation |

## Security Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Encryption round-trip | 3 | ✅ |
| Wrong key rejection | 2 | ✅ |
| Tampering detection | 2 | ✅ |
| Nonce uniqueness | 1 | ✅ |
| Key derivation separation | 3 | ✅ |
| Vault lock/unlock | 2 | ✅ |
| Key rotation | 1 | ✅ |
| ZDR verification | 2 | ✅ |
| Export/import encryption | 2 | ✅ |
| Utility functions | 7 | ✅ |

**Total**: 24 security-focused tests, all passing.

## Recommendations

### Immediate

1. **Enroll in Apple Developer Program** - Required for signed distribution
2. **Configure CI caching for crates.io** - Reduce network failures
3. **Add Apple signing certificates to CI secrets** - Enable notarized builds

### Short-term

1. **Add Secure Enclave support for iOS/macOS keys** - Hardware-backed key storage
2. **Implement forward secrecy for exports** - Ephemeral export keys
3. **Add rate limiting to localhost proxy** - Prevent abuse
3. **Add CSP headers to Tauri config** - Defense in depth

### Long-term

1. **Signal Protocol for device-to-device sync** - E2EE sync without server
2. **Post-quantum crypto migration path** - Hybrid KEM readiness
3. **Zero-knowledge proof for ZDR verification** - Client-side proof
4. **Formal verification of crypto implementation** - High assurance