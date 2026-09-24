import { CryptoProvider, EncryptedPayload, VaultMasterKey, KeyPurpose } from "./types.js";
export declare class WebCryptoProvider implements CryptoProvider {
    encrypt(plaintext: Uint8Array, key: Uint8Array, nonce: Uint8Array): Promise<Uint8Array>;
    decrypt(ciphertext: Uint8Array, key: Uint8Array, nonce: Uint8Array): Promise<Uint8Array>;
    generateKey(): Promise<Uint8Array>;
    generateNonce(): Uint8Array;
    deriveKey(masterKey: Uint8Array, purpose: string, salt: Uint8Array): Promise<Uint8Array>;
    randomBytes(length: number): Uint8Array;
}
export declare class Vault {
    private provider;
    private masterKey;
    private derivedKeys;
    private locked;
    constructor(provider?: CryptoProvider);
    isLocked(): boolean;
    initialize(masterKey?: Uint8Array): Promise<VaultMasterKey>;
    unlock(masterKey: Uint8Array): void;
    lock(): void;
    private getDerivedKeyCacheKey;
    getKey(purpose: KeyPurpose, salt?: Uint8Array): Promise<Uint8Array>;
    encrypt(plaintext: Uint8Array, purpose: KeyPurpose, salt?: Uint8Array): Promise<EncryptedPayload>;
    decrypt(payload: EncryptedPayload, purpose: KeyPurpose): Promise<Uint8Array>;
    encryptString(plaintext: string, purpose: KeyPurpose, salt?: Uint8Array): Promise<EncryptedPayload>;
    decryptString(payload: EncryptedPayload, purpose: KeyPurpose): Promise<string>;
    rotateMasterKey(newMasterKey?: Uint8Array): Promise<VaultMasterKey>;
    exportMasterKey(): Uint8Array | null;
    clearDerivedKeys(): void;
}
export declare const cryptoProvider: WebCryptoProvider;
export declare const vault: Vault;
//# sourceMappingURL=web-crypto.d.ts.map