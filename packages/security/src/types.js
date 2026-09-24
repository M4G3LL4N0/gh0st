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
};
export function bytesToBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
}
export function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
export function bytesToHex(bytes) {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}
export function constantTimeEqual(a, b) {
    if (a.length !== b.length)
        return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
    }
    return result === 0;
}
export function secureWipe(buffer) {
    if (buffer && buffer.length > 0) {
        crypto.getRandomValues(buffer);
        buffer.fill(0);
    }
}
export function createEncryptedPayload(ciphertext, nonce, purpose, salt) {
    return {
        v: CRYPTO_VERSION,
        alg: ALGORITHM,
        nonce: bytesToBase64(nonce),
        ciphertext: bytesToBase64(ciphertext),
        purpose,
        salt: salt ? bytesToBase64(salt) : undefined
    };
}
export function parseEncryptedPayload(payload) {
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
//# sourceMappingURL=types.js.map