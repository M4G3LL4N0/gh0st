import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  WebCryptoProvider,
  Vault,
  bytesToBase64,
  base64ToBytes,
  bytesToHex,
  hexToBytes,
  constantTimeEqual,
  secureWipe,
  createEncryptedPayload,
  parseEncryptedPayload,
  KEY_PURPOSES,
  CRYPTO_VERSION,
  ALGORITHM
} from "./index.js";

const TEST_PLAINTEXT = new TextEncoder().encode("THIS_MUST_NEVER_APPEAR_IN_LOGS");
const TEST_PLAINTEXT_STR = "THIS_MUST_NEVER_APPEAR_IN_LOGS";

describe("WebCryptoProvider", () => {
  let provider: WebCryptoProvider;

  beforeEach(() => {
    provider = new WebCryptoProvider();
  });

  it("should generate a valid key", async () => {
    const key = await provider.generateKey();
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(32);
  });

  it("should generate unique nonces", () => {
    const nonce1 = provider.generateNonce();
    const nonce2 = provider.generateNonce();
    expect(nonce1).not.toEqual(nonce2);
    expect(nonce1.length).toBe(12);
  });

  it("should encrypt and decrypt round-trip", async () => {
    const key = await provider.generateKey();
    const nonce = provider.generateNonce();

    const ciphertext = await provider.encrypt(TEST_PLAINTEXT, key, nonce);
    expect(ciphertext).not.toEqual(TEST_PLAINTEXT);
    expect(ciphertext.length).toBeGreaterThan(TEST_PLAINTEXT.length);

    const decrypted = await provider.decrypt(ciphertext, key, nonce);
    expect(decrypted).toEqual(TEST_PLAINTEXT);
  });

  it("should reject wrong key", async () => {
    const key1 = await provider.generateKey();
    const key2 = await provider.generateKey();
    const nonce = provider.generateNonce();

    const ciphertext = await provider.encrypt(TEST_PLAINTEXT, key1, nonce);
    await expect(provider.decrypt(ciphertext, key2, nonce)).rejects.toThrow();
  });

  it("should reject tampered ciphertext", async () => {
    const key = await provider.generateKey();
    const nonce = provider.generateNonce();

    const ciphertext = await provider.encrypt(TEST_PLAINTEXT, key, nonce);
    ciphertext[0] ^= 0xff;

    await expect(provider.decrypt(ciphertext, key, nonce)).rejects.toThrow();
  });

  it("should reject wrong nonce", async () => {
    const key = await provider.generateKey();
    const nonce1 = provider.generateNonce();
    const nonce2 = provider.generateNonce();

    const ciphertext = await provider.encrypt(TEST_PLAINTEXT, key, nonce1);
    await expect(provider.decrypt(ciphertext, key, nonce2)).rejects.toThrow();
  });

  it("should derive different keys for different purposes", async () => {
    const masterKey = await provider.generateKey();
    const salt = provider.randomBytes(16);

    const key1 = await provider.deriveKey(masterKey, KEY_PURPOSES.CONVERSATIONS, salt);
    const key2 = await provider.deriveKey(masterKey, KEY_PURPOSES.ATTACHMENTS, salt);

    expect(key1).not.toEqual(key2);
  });

  it("should derive same key for same purpose and salt", async () => {
    const masterKey = await provider.generateKey();
    const salt = provider.randomBytes(16);

    const key1 = await provider.deriveKey(masterKey, KEY_PURPOSES.CONVERSATIONS, salt);
    const key2 = await provider.deriveKey(masterKey, KEY_PURPOSES.CONVERSATIONS, salt);

    expect(key1).toEqual(key2);
  });

  it("should produce different keys with different salts", async () => {
    const masterKey = await provider.generateKey();
    const salt1 = provider.randomBytes(16);
    const salt2 = provider.randomBytes(16);

    const key1 = await provider.deriveKey(masterKey, KEY_PURPOSES.CONVERSATIONS, salt1);
    const key2 = await provider.deriveKey(masterKey, KEY_PURPOSES.CONVERSATIONS, salt2);

    expect(key1).not.toEqual(key2);
  });
});

describe("Vault", () => {
  let vault: Vault;

  beforeEach(() => {
    vault = new Vault(new WebCryptoProvider());
  });

  afterEach(() => {
    vault.lock();
  });

  it("should initialize with generated master key", async () => {
    const masterKey = await vault.initialize();
    expect(masterKey.key).toBeInstanceOf(Uint8Array);
    expect(masterKey.key.length).toBe(32);
    expect(masterKey.version).toBe(CRYPTO_VERSION);
    expect(vault.isLocked()).toBe(false);
  });

  it("should initialize with provided master key", async () => {
    const provider = new WebCryptoProvider();
    const key = await provider.generateKey();
    const masterKey = await vault.initialize(key);
    expect(masterKey.key).toEqual(key);
  });

  it("should lock and unlock", async () => {
    await vault.initialize();
    expect(vault.isLocked()).toBe(false);

    vault.lock();
    expect(vault.isLocked()).toBe(true);

    const key = vault.exportMasterKey();
    expect(key).toBeNull();
  });

  it("should encrypt and decrypt string round-trip", async () => {
    await vault.initialize();

    const encrypted = await vault.encryptString(TEST_PLAINTEXT_STR, KEY_PURPOSES.CONVERSATIONS);
    expect(encrypted.v).toBe(CRYPTO_VERSION);
    expect(encrypted.alg).toBe(ALGORITHM);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.nonce).toBeDefined();

    const decrypted = await vault.decryptString(encrypted, KEY_PURPOSES.CONVERSATIONS);
    expect(decrypted).toBe(TEST_PLAINTEXT_STR);
  });

  it("should encrypt and decrypt bytes round-trip", async () => {
    await vault.initialize();

    const encrypted = await vault.encrypt(TEST_PLAINTEXT, KEY_PURPOSES.ATTACHMENTS);
    const decrypted = await vault.decrypt(encrypted, KEY_PURPOSES.ATTACHMENTS);
    expect(decrypted).toEqual(TEST_PLAINTEXT);
  });

  it("should use different keys for different purposes", async () => {
    await vault.initialize();

    const encryptedConv = await vault.encryptString(TEST_PLAINTEXT_STR, KEY_PURPOSES.CONVERSATIONS);
    const encryptedAttach = await vault.encryptString(TEST_PLAINTEXT_STR, KEY_PURPOSES.ATTACHMENTS);

    expect(encryptedConv.ciphertext).not.toBe(encryptedAttach.ciphertext);

    const decryptedConv = await vault.decryptString(encryptedConv, KEY_PURPOSES.CONVERSATIONS);
    const decryptedAttach = await vault.decryptString(encryptedAttach, KEY_PURPOSES.ATTACHMENTS);

    expect(decryptedConv).toBe(TEST_PLAINTEXT_STR);
    expect(decryptedAttach).toBe(TEST_PLAINTEXT_STR);
  });

  it("should reject decryption with wrong purpose", async () => {
    await vault.initialize();

    const encrypted = await vault.encryptString(TEST_PLAINTEXT_STR, KEY_PURPOSES.CONVERSATIONS);
    await expect(vault.decryptString(encrypted, KEY_PURPOSES.ATTACHMENTS)).rejects.toThrow();
  });

  it("should reject operations when locked", async () => {
    await vault.initialize();
    vault.lock();

    await expect(
      vault.encryptString(TEST_PLAINTEXT_STR, KEY_PURPOSES.CONVERSATIONS)
    ).rejects.toThrow("Vault is locked");

    await expect(vault.getKey(KEY_PURPOSES.CONVERSATIONS)).rejects.toThrow(
      "Vault is locked"
    );
  });

  it("should rotate master key and re-derive keys", async () => {
    await vault.initialize();
    const originalKey = vault.exportMasterKey();
    expect(originalKey).not.toBeNull();

    // Encrypt some data before rotation
    const encrypted = await vault.encryptString(TEST_PLAINTEXT_STR, KEY_PURPOSES.CONVERSATIONS);

    await vault.rotateMasterKey();
    const newKey = vault.exportMasterKey();
    expect(newKey).not.toEqual(originalKey);

    // After rotation, old ciphertext cannot be decrypted with new keys
    // (This is expected behavior - key rotation requires re-encryption of data)
    await expect(vault.decryptString(encrypted, KEY_PURPOSES.CONVERSATIONS)).rejects.toThrow();

    // But new encryptions should work with the new keys
    const newEncrypted = await vault.encryptString(TEST_PLAINTEXT_STR, KEY_PURPOSES.CONVERSATIONS);
    const decrypted = await vault.decryptString(newEncrypted, KEY_PURPOSES.CONVERSATIONS);
    expect(decrypted).toBe(TEST_PLAINTEXT_STR);
  });

  it("should clear derived keys", async () => {
    await vault.initialize();
    await vault.getKey(KEY_PURPOSES.CONVERSATIONS);
    expect(vault["derivedKeys"].size).toBeGreaterThan(0);

    vault.clearDerivedKeys();
    expect(vault["derivedKeys"].size).toBe(0);
  });
});

describe("Utility functions", () => {
  it("should convert bytes to base64 and back", () => {
    const b64 = bytesToBase64(TEST_PLAINTEXT);
    const bytes = base64ToBytes(b64);
    expect(bytes).toEqual(TEST_PLAINTEXT);
  });

  it("should convert bytes to hex and back", () => {
    const hex = bytesToHex(TEST_PLAINTEXT);
    const bytes = hexToBytes(hex);
    expect(bytes).toEqual(TEST_PLAINTEXT);
  });

  it("should constant-time compare equal arrays", () => {
    expect(constantTimeEqual(TEST_PLAINTEXT, TEST_PLAINTEXT)).toBe(true);
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
  });

  it("should constant-time compare different arrays", () => {
    expect(constantTimeEqual(TEST_PLAINTEXT, new Uint8Array([1, 2, 3]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
  });

  it("should securely wipe buffer", () => {
    const buffer = new Uint8Array([1, 2, 3, 4, 5]);
    secureWipe(buffer);
    expect(buffer.every((b) => b === 0)).toBe(true);
  });

  it("should create and parse encrypted payload", () => {
    const ciphertext = new Uint8Array([1, 2, 3, 4, 5]);
    const nonce = new Uint8Array(12).fill(7);
    const salt = new Uint8Array(16).fill(9);

    const payload = createEncryptedPayload(ciphertext, nonce, KEY_PURPOSES.CONVERSATIONS, salt);
    expect(payload.v).toBe(CRYPTO_VERSION);
    expect(payload.alg).toBe(ALGORITHM);
    expect(payload.purpose).toBe(KEY_PURPOSES.CONVERSATIONS);

    const parsed = parseEncryptedPayload(payload);
    expect(parsed.nonce).toEqual(nonce);
    expect(parsed.ciphertext).toEqual(ciphertext);
    expect(parsed.salt).toEqual(salt);
  });

  it("should reject unsupported version", () => {
    const payload = createEncryptedPayload(new Uint8Array(), new Uint8Array(12));
    payload.v = 999;
    expect(() => parseEncryptedPayload(payload)).toThrow("Unsupported crypto version");
  });

  it("should reject unsupported algorithm", () => {
    const payload = createEncryptedPayload(new Uint8Array(), new Uint8Array(12));
    payload.alg = "INVALID";
    expect(() => parseEncryptedPayload(payload)).toThrow("Unsupported algorithm");
  });
});