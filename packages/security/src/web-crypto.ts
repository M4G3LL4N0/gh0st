import {
  CryptoProvider,
  EncryptedPayload,
  VaultMasterKey,
  KeyDerivationParams,
  KEY_PURPOSES,
  KeyPurpose,
  CRYPTO_VERSION,
  ALGORITHM,
  NONCE_LENGTH,
  KEY_LENGTH,
  SALT_LENGTH,
  bytesToBase64,
  base64ToBytes,
  createEncryptedPayload,
  parseEncryptedPayload,
  secureWipe
} from "./types.js";

const SUBTLE = crypto.subtle;

async function importAesKey(key: Uint8Array): Promise<CryptoKey> {
  return SUBTLE.importKey("raw", key as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt"
  ]);
}

async function deriveKeyHKDF(
  masterKey: Uint8Array,
  purpose: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const baseKey = await SUBTLE.importKey(
    "raw",
    masterKey as BufferSource,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const info = new TextEncoder().encode(`gh0st:${purpose}`);
  const derivedBits = await SUBTLE.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt as BufferSource,
      info
    },
    baseKey,
    256
  );

  return new Uint8Array(derivedBits);
}

export class WebCryptoProvider implements CryptoProvider {
  async encrypt(
    plaintext: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    const cryptoKey = await importAesKey(key);
    const ciphertext = await SUBTLE.encrypt(
      { name: "AES-GCM", iv: nonce as BufferSource, tagLength: 128 },
      cryptoKey,
      plaintext as BufferSource
    );
    return new Uint8Array(ciphertext);
  }

  async decrypt(
    ciphertext: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    const cryptoKey = await importAesKey(key);
    try {
      const plaintext = await SUBTLE.decrypt(
        { name: "AES-GCM", iv: nonce as BufferSource, tagLength: 128 },
        cryptoKey,
        ciphertext as BufferSource
      );
      return new Uint8Array(plaintext);
    } catch (e) {
      throw new Error("Decryption failed: invalid key or tampered data");
    }
  }

  async generateKey(): Promise<Uint8Array> {
    const key = await SUBTLE.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const raw = await SUBTLE.exportKey("raw", key);
    return new Uint8Array(raw);
  }

  generateNonce(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
  }

  async deriveKey(
    masterKey: Uint8Array,
    purpose: string,
    salt: Uint8Array
  ): Promise<Uint8Array> {
    return deriveKeyHKDF(masterKey, purpose, salt);
  }

  randomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }
}

export class Vault {
  private provider: CryptoProvider;
  private masterKey: Uint8Array | null = null;
  private derivedKeys: Map<string, Uint8Array> = new Map();
  private locked = true;

  constructor(provider: CryptoProvider = new WebCryptoProvider()) {
    this.provider = provider;
  }

  isLocked(): boolean {
    return this.locked;
  }

  async initialize(masterKey?: Uint8Array): Promise<VaultMasterKey> {
    if (masterKey) {
      this.masterKey = masterKey;
    } else {
      this.masterKey = await this.provider.generateKey();
    }
    this.locked = false;
    return {
      key: this.masterKey,
      version: CRYPTO_VERSION,
      createdAt: Date.now()
    };
  }

  unlock(masterKey: Uint8Array): void {
    this.masterKey = masterKey;
    this.locked = false;
  }

  lock(): void {
    if (this.masterKey) {
      secureWipe(this.masterKey);
      this.masterKey = null;
    }
    for (const key of this.derivedKeys.values()) {
      secureWipe(key);
    }
    this.derivedKeys.clear();
    this.locked = true;
  }

  private getDerivedKeyCacheKey(purpose: string, salt: Uint8Array): string {
    return `${purpose}:${bytesToBase64(salt)}`;
  }

  async getKey(purpose: KeyPurpose, salt?: Uint8Array): Promise<{ key: Uint8Array; salt: Uint8Array }> {
    if (this.locked || !this.masterKey) {
      throw new Error("Vault is locked");
    }

    const actualSalt = salt ?? this.provider.randomBytes(SALT_LENGTH);
    const cacheKey = this.getDerivedKeyCacheKey(purpose, actualSalt);

    let key = this.derivedKeys.get(cacheKey);
    if (!key) {
      key = await this.provider.deriveKey(this.masterKey, purpose, actualSalt);
      this.derivedKeys.set(cacheKey, key);
    }
    return { key, salt: actualSalt };
  }

  async encrypt(
    plaintext: Uint8Array,
    purpose: KeyPurpose,
    salt?: Uint8Array
  ): Promise<EncryptedPayload> {
    const { key, salt: actualSalt } = await this.getKey(purpose, salt);
    const nonce = this.provider.generateNonce();
    const ciphertext = await this.provider.encrypt(plaintext, key, nonce);
    return createEncryptedPayload(ciphertext, nonce, purpose, actualSalt);
  }

  async decrypt(payload: EncryptedPayload, purpose: KeyPurpose): Promise<Uint8Array> {
    const { nonce, ciphertext, salt } = parseEncryptedPayload(payload);
    const { key } = await this.getKey(purpose, salt);
    return this.provider.decrypt(ciphertext, key, nonce);
  }

  async encryptString(
    plaintext: string,
    purpose: KeyPurpose,
    salt?: Uint8Array
  ): Promise<EncryptedPayload> {
    const encoder = new TextEncoder();
    return this.encrypt(encoder.encode(plaintext), purpose, salt);
  }

  async decryptString(payload: EncryptedPayload, purpose: KeyPurpose): Promise<string> {
    const bytes = await this.decrypt(payload, purpose);
    return new TextDecoder().decode(bytes);
  }

  async rotateMasterKey(newMasterKey?: Uint8Array): Promise<VaultMasterKey> {
    if (this.locked || !this.masterKey) {
      throw new Error("Vault is locked");
    }

    const oldMasterKey = this.masterKey;
    const newKey = newMasterKey ?? (await this.provider.generateKey());

    for (const [cacheKey, derivedKey] of this.derivedKeys.entries()) {
      const [purpose, saltB64] = cacheKey.split(":");
      const salt = base64ToBytes(saltB64);
      const newDerivedKey = await this.provider.deriveKey(newKey, purpose, salt);
      secureWipe(derivedKey);
      this.derivedKeys.set(cacheKey, newDerivedKey);
    }

    secureWipe(oldMasterKey);
    this.masterKey = newKey;

    return {
      key: this.masterKey,
      version: CRYPTO_VERSION,
      createdAt: Date.now()
    };
  }

  exportMasterKey(): Uint8Array | null {
    if (this.locked || !this.masterKey) return null;
    return this.masterKey.slice();
  }

  clearDerivedKeys(): void {
    for (const key of this.derivedKeys.values()) {
      secureWipe(key);
    }
    this.derivedKeys.clear();
  }
}

export const cryptoProvider = new WebCryptoProvider();
export const vault = new Vault(cryptoProvider);