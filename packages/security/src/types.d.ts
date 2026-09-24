export interface CryptoProvider {
    encrypt(plaintext: Uint8Array, key: Uint8Array, nonce: Uint8Array): Promise<Uint8Array>;
    decrypt(ciphertext: Uint8Array, key: Uint8Array, nonce: Uint8Array): Promise<Uint8Array>;
    generateKey(): Promise<Uint8Array>;
    generateNonce(): Uint8Array;
    deriveKey(masterKey: Uint8Array, purpose: string, salt: Uint8Array): Promise<Uint8Array>;
    randomBytes(length: number): Uint8Array;
}
export interface EncryptedPayload {
    v: number;
    alg: string;
    nonce: string;
    ciphertext: string;
    salt?: string;
    purpose?: string;
}
export interface VaultMasterKey {
    key: Uint8Array;
    version: number;
    createdAt: number;
}
export interface KeyDerivationParams {
    purpose: string;
    salt: Uint8Array;
    iterations?: number;
}
export declare const CRYPTO_VERSION = 1;
export declare const ALGORITHM = "AES-256-GCM";
export declare const NONCE_LENGTH = 12;
export declare const KEY_LENGTH = 32;
export declare const SALT_LENGTH = 16;
export declare const TAG_LENGTH = 16;
export declare const KEY_PURPOSES: {
    readonly VAULT_MASTER: "vault-master";
    readonly CONVERSATIONS: "conversations";
    readonly ATTACHMENTS: "attachments";
    readonly AGENTS: "agents";
    readonly PREFERENCES: "preferences";
    readonly MCP_CREDENTIALS: "mcp-credentials";
    readonly EXPORT: "export";
};
export type KeyPurpose = (typeof KEY_PURPOSES)[keyof typeof KEY_PURPOSES];
export declare function bytesToBase64(bytes: Uint8Array): string;
export declare function base64ToBytes(b64: string): Uint8Array;
export declare function bytesToHex(bytes: Uint8Array): string;
export declare function hexToBytes(hex: string): Uint8Array;
export declare function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean;
export declare function secureWipe(buffer: Uint8Array): void;
export declare function createEncryptedPayload(ciphertext: Uint8Array, nonce: Uint8Array, purpose?: KeyPurpose, salt?: Uint8Array): EncryptedPayload;
export declare function parseEncryptedPayload(payload: EncryptedPayload): {
    nonce: Uint8Array;
    ciphertext: Uint8Array;
    salt?: Uint8Array;
};
//# sourceMappingURL=types.d.ts.map