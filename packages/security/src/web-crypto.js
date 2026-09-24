import { CRYPTO_VERSION, NONCE_LENGTH, SALT_LENGTH, bytesToBase64, base64ToBytes, createEncryptedPayload, parseEncryptedPayload, secureWipe } from "./types.js";
const SUBTLE = crypto.subtle;
async function importAesKey(key) {
    return SUBTLE.importKey("raw", key, { name: "AES-GCM" }, false, [
        "encrypt",
        "decrypt"
    ]);
}
async function deriveKeyHKDF(masterKey, purpose, salt) {
    const baseKey = await SUBTLE.importKey("raw", masterKey, { name: "HKDF" }, false, ["deriveBits"]);
    const info = new TextEncoder().encode(`gh0st:${purpose}`);
    const derivedBits = await SUBTLE.deriveBits({
        name: "HKDF",
        hash: "SHA-256",
        salt: salt,
        info
    }, baseKey, 256);
    return new Uint8Array(derivedBits);
}
export class WebCryptoProvider {
    async encrypt(plaintext, key, nonce) {
        const cryptoKey = await importAesKey(key);
        const ciphertext = await SUBTLE.encrypt({ name: "AES-GCM", iv: nonce, tagLength: 128 }, cryptoKey, plaintext);
        return new Uint8Array(ciphertext);
    }
    async decrypt(ciphertext, key, nonce) {
        const cryptoKey = await importAesKey(key);
        try {
            const plaintext = await SUBTLE.decrypt({ name: "AES-GCM", iv: nonce, tagLength: 128 }, cryptoKey, ciphertext);
            return new Uint8Array(plaintext);
        }
        catch (e) {
            throw new Error("Decryption failed: invalid key or tampered data");
        }
    }
    async generateKey() {
        const key = await SUBTLE.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
        const raw = await SUBTLE.exportKey("raw", key);
        return new Uint8Array(raw);
    }
    generateNonce() {
        return crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
    }
    async deriveKey(masterKey, purpose, salt) {
        return deriveKeyHKDF(masterKey, purpose, salt);
    }
    randomBytes(length) {
        return crypto.getRandomValues(new Uint8Array(length));
    }
}
export class Vault {
    provider;
    masterKey = null;
    derivedKeys = new Map();
    locked = true;
    constructor(provider = new WebCryptoProvider()) {
        this.provider = provider;
    }
    isLocked() {
        return this.locked;
    }
    async initialize(masterKey) {
        if (masterKey) {
            this.masterKey = masterKey;
        }
        else {
            this.masterKey = await this.provider.generateKey();
        }
        this.locked = false;
        return {
            key: this.masterKey,
            version: CRYPTO_VERSION,
            createdAt: Date.now()
        };
    }
    unlock(masterKey) {
        this.masterKey = masterKey;
        this.locked = false;
    }
    lock() {
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
    getDerivedKeyCacheKey(purpose, salt) {
        return `${purpose}:${bytesToBase64(salt)}`;
    }
    async getKey(purpose, salt) {
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
        return key;
    }
    async encrypt(plaintext, purpose, salt) {
        const key = await this.getKey(purpose, salt);
        const nonce = this.provider.generateNonce();
        const ciphertext = await this.provider.encrypt(plaintext, key, nonce);
        return createEncryptedPayload(ciphertext, nonce, purpose, salt);
    }
    async decrypt(payload, purpose) {
        const { nonce, ciphertext, salt } = parseEncryptedPayload(payload);
        const key = await this.getKey(purpose, salt);
        return this.provider.decrypt(ciphertext, key, nonce);
    }
    async encryptString(plaintext, purpose, salt) {
        const encoder = new TextEncoder();
        return this.encrypt(encoder.encode(plaintext), purpose, salt);
    }
    async decryptString(payload, purpose) {
        const bytes = await this.decrypt(payload, purpose);
        return new TextDecoder().decode(bytes);
    }
    async rotateMasterKey(newMasterKey) {
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
    exportMasterKey() {
        if (this.locked || !this.masterKey)
            return null;
        return this.masterKey.slice();
    }
    clearDerivedKeys() {
        for (const key of this.derivedKeys.values()) {
            secureWipe(key);
        }
        this.derivedKeys.clear();
    }
}
export const cryptoProvider = new WebCryptoProvider();
export const vault = new Vault(cryptoProvider);
//# sourceMappingURL=web-crypto.js.map