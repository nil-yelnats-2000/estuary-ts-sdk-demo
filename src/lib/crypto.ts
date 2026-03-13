/**
 * AES-256-GCM encryption for sharing session configs.
 *
 * Two modes:
 *   v0 — Random key embedded in URL (no passphrase needed, one-click share)
 *   v1 — PBKDF2-derived key from a user passphrase (extra security)
 *
 * All operations use the Web Crypto API.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BYTES = 32; // AES-256

// ── Helpers ──────────────────────────────────────────────────────────

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const binary = atob(base64 + "=".repeat(pad));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function ab(u: Uint8Array): ArrayBuffer {
  return u.buffer as ArrayBuffer;
}

// ── v0: Auto-key (no passphrase) ────────────────────────────────────

export async function encryptAutoKey(plaintext: string): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can embed it
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ab(iv) },
    key,
    ab(encoded),
  );

  const rawKey = await crypto.subtle.exportKey("raw", key);

  return ["v0", toBase64Url(rawKey), toBase64Url(ab(iv)), toBase64Url(ciphertext)].join(".");
}

async function decryptAutoKey(parts: string[]): Promise<string> {
  const rawKey = fromBase64Url(parts[1]);
  const iv = fromBase64Url(parts[2]);
  const ciphertext = fromBase64Url(parts[3]);

  const key = await crypto.subtle.importKey(
    "raw",
    ab(rawKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ab(iv) },
    key,
    ab(ciphertext),
  );

  return new TextDecoder().decode(plaintext);
}

// ── v1: Passphrase-derived key ──────────────────────────────────────

export async function encryptWithPassphrase(plaintext: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    ab(new TextEncoder().encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: ab(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ab(iv) },
    key,
    ab(encoded),
  );

  return ["v1", toBase64Url(ab(salt)), toBase64Url(ab(iv)), toBase64Url(ciphertext)].join(".");
}

async function decryptWithPassphrase(parts: string[], passphrase: string): Promise<string> {
  const salt = fromBase64Url(parts[1]);
  const iv = fromBase64Url(parts[2]);
  const ciphertext = fromBase64Url(parts[3]);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    ab(new TextEncoder().encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: ab(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ab(iv) },
    key,
    ab(ciphertext),
  );

  return new TextDecoder().decode(plaintext);
}

// ── Unified decrypt ─────────────────────────────────────────────────

export type PayloadType = "auto" | "passphrase" | "legacy" | "unknown";

export function detectPayloadType(hash: string): PayloadType {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return "unknown";
  if (raw.startsWith("v0.")) return "auto";
  if (raw.startsWith("v1.")) return "passphrase";
  // Legacy base64 (no dots)
  if (!raw.includes(".")) {
    try { atob(raw); return "legacy"; } catch { return "unknown"; }
  }
  return "unknown";
}

/** Decrypt any supported payload format. Pass passphrase only for v1 payloads. */
export async function decryptPayload(hash: string, passphrase?: string): Promise<string> {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const parts = raw.split(".");

  if (parts[0] === "v0" && parts.length === 4) {
    return decryptAutoKey(parts);
  }
  if (parts[0] === "v1" && parts.length === 4) {
    if (!passphrase) throw new Error("Passphrase required for v1 payloads");
    return decryptWithPassphrase(parts, passphrase);
  }
  throw new Error("Unsupported payload format");
}
