const ALG = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

function getKeyMaterial(): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error("ENCRYPTION_SECRET env var not set");
  return secret;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("cf-studio-salt"), iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: ALG, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

function fromBase64(str: string): ArrayBuffer {
  return Buffer.from(str, "base64").buffer.slice(0) as ArrayBuffer;
}

export async function encryptToken(plainText: string): Promise<string> {
  const key = await deriveKey(getKeyMaterial());
  const ivArray = new ArrayBuffer(IV_LENGTH);
  crypto.getRandomValues(new Uint8Array(ivArray));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALG, iv: ivArray },
    key,
    enc.encode(plainText)
  );
  return `${toBase64(ivArray)}:${toBase64(ciphertext)}`;
}

export async function decryptToken(stored: string): Promise<string> {
  const [ivB64, ctB64] = stored.split(":");
  const key = await deriveKey(getKeyMaterial());
  const dec = new TextDecoder();
  const plainBuf = await crypto.subtle.decrypt(
    { name: ALG, iv: fromBase64(ivB64) },
    key,
    fromBase64(ctB64)
  );
  return dec.decode(plainBuf);
}
