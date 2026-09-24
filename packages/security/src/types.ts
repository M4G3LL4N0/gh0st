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

export const CRYPTO_VERSION = 1;
export const ALGORITHM = "AES-256-GCM";
export const NONCE_LENGTH = 12;
export const KEY_LENGTH = 32;
export const SALT_LENGTH = 16;
export const TAG_LENGTH = 16;

export const KEY_PURPOSES = {
  VAULT_MASTER: "vault-master",
  CONVERSATIONS: "conversations",
  ATTACHMENTS: "attachments",
  AGENTS: "agents",
  PREFERENCES: "preferences",
  MCP_CREDENTIALS: "mcp-credentials",
  EXPORT: "export"
} as const;

export type KeyPurpose = (typeof KEY_PURPOSES)[keyof typeof KEY_PURPOSES];

export function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export function secureWipe(buffer: Uint8Array): void {
  if (buffer && buffer.length > 0) {
    crypto.getRandomValues(buffer);
    buffer.fill(0);
  }
}

export function createEncryptedPayload(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  purpose?: KeyPurpose,
  salt?: Uint8Array
): EncryptedPayload {
  return {
    v: CRYPTO_VERSION,
    alg: ALGORITHM,
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(ciphertext),
    purpose,
    salt: salt ? bytesToBase64(salt) : undefined
  };
}

export function parseEncryptedPayload(payload: EncryptedPayload): {
  nonce: Uint8Array;
  ciphertext: Uint8Array;
  salt?: Uint8Array;
} {
  if (payload.v !== CRYPTO_VERSION) {
    throw new Error(`Unsupported crypto version: ${payload.v}`);
  }
  if (payload.alg !== ALGORITHM) {
    throw new Error(`Unsupported algorithm: ${payload.alg}`);
  }
  return {
    nonce: base64ToBytes(payload.nonce),
    ciphertext: base64ToBytes(payload.ciphertext),
    salt: payload.salt ? base64ToBytes(payload.salt) : undefined
  };
}