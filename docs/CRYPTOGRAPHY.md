# Cryptography

## Design Principles

1. **No Homemade Crypto**: Use established, audited primitives
2. **Purpose Separation**: Different keys for different data types
3. **Minimal Plaintext Lifetime**: Decrypt only when needed, wipe after
4. **Versioned Ciphertext**: Algorithm/version metadata for migration
5. **Authenticated Encryption**: AES-256-GCM (or XChaCha20-Poly1305)
6. **Secure Nonce Management**: Random 12-byte nonces, never reused

## Primitives

### Primary: AES-256-GCM (Web Crypto API)
- **Why**: Native in all target runtimes (browser, Node.js, Tauri)
- **Hardware Acceleration**: AES-NI on modern CPUs
- **Authenticated**: Built-in integrity verification
- **Standardized**: NIST FIPS 197, SP 800-38D

### Fallback: XChaCha20-Poly1305 (if needed)
- **When**: If Web Crypto unavailable or platform-specific issues
- **Library**: `@noble/ciphers` or similar audited implementation
- **Why**: No nonce reuse catastrophe, fast in software

## Key Hierarchy

```
Master Secret (256-bit random)
    │
    ├── HKDF-SHA-256 ──▶ Conversations Key
    ├── HKDF-SHA-256 ──▶ Attachments Key
    ├── HKDF-SHA-256 ──▶ Agents Key
    ├── HKDF-SHA-256 ──▶ Preferences Key
    ├── HKDF-SHA-256 ──▶ MCP Credentials Key
    └── HKDF-SHA-256 ──▶ Export Key
```

**HKDF Parameters**:
- Hash: SHA-256
- Salt: 16-byte random per purpose
- Info: `gh0st:<purpose>`
- Output: 256 bits

## Vault Architecture

### Initialization
1. Generate 256-bit master secret: `crypto.getRandomValues(32)`
2. Derive purpose keys on-demand via HKDF
3. Store master secret encrypted (passphrase/OS keychain)
4. Cache derived keys in memory only

### Lock/Unlock
- **Lock**: Wipe master key + all derived keys from memory
- **Unlock**: Decrypt master secret, re-derive as needed
- **Auto-lock**: Configurable timeout (default: 15 min)

### Key Rotation
1. Generate new master secret
2. Re-derive all purpose keys with new master
3. Re-encrypt all stored data (background)
4. Update version metadata

## Ciphertext Format

```json
{
  "v": 1,
  "alg": "AES-256-GCM",
  "nonce": "base64url(12 bytes)",
  "ciphertext": "base64url(ciphertext + tag)",
  "salt": "base64url(16 bytes)",      // for key derivation
  "purpose": "conversations"           // key purpose
}
```

**Versioning**: `v` field allows future algorithm migration

## Passphrase Handling

### Argon2id Parameters
- Memory: 64 MB (configurable)
- Iterations: 3
- Parallelism: 4
- Salt: 16-byte random
- Output: 256-bit key

### Native Platforms (macOS/iOS)
- Prefer OS keychain (Keychain Services, Secure Enclave)
- Passphrase unlocks keychain item, not used directly for crypto
- Fallback to Argon2id if keychain unavailable

## Secure Memory Practices

- `secureWipe()`: Overwrite with random then zero
- Applied to: master key, derived keys, plaintext buffers
- TypeScript: `Uint8Array.fill(0)` after `crypto.getRandomValues()`

## Nonce Generation

```typescript
generateNonce(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}
```
- 12 bytes (96 bits) per NIST SP 800-38D
- Random generation = negligible collision probability
- Stored with ciphertext

## Testing Vectors

### Round Trip
```
Plaintext → Encrypt → Ciphertext → Decrypt → Plaintext ✓
```

### Wrong Key Rejection
```
Encrypt(key1) → Decrypt(key2) → Error ✓
```

### Tampering Detection
```
Encrypt → Modify 1 bit → Decrypt → Error ✓
```

### Nonce Uniqueness
```
1M encryptions → 0 nonce collisions ✓
```

### Version Migration
```
v1 ciphertext → Decrypt with v2 code → Works ✓
```

### Corrupted Ciphertext
```
Truncated/extended ciphertext → Decrypt → Error ✓
```

## Future: Post-Quantum

- Hybrid KEM (ML-KEM + X25519) for key exchange
- AES-256-GCM remains secure (Grover's algorithm: 128-bit security)
- Monitor NIST PQC standardization
- Crypto provider abstraction enables swap

## References

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [NIST SP 800-38D](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [RFC 5869 (HKDF)](https://tools.ietf.org/html/rfc5869)
- [RFC 9106 (Argon2)](https://tools.ietf.org/html/rfc9106)
- [@noble/hashes](https://github.com/paulmillr/noble-hashes)