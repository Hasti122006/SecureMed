// Real Web Crypto API implementations for MedGuard

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

// ─── AES-256-GCM Encryption ───
export async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function encryptFileAES(file: ArrayBuffer, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, file);
  return { encrypted, iv: arrayBufferToBase64(iv.buffer) };
}

export async function decryptFileAES(encrypted: ArrayBuffer, key: CryptoKey, ivBase64: string): Promise<ArrayBuffer> {
  const iv = base64ToArrayBuffer(ivBase64);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
}

export async function exportAESKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(raw);
}

export async function importAESKey(keyBase64: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(keyBase64);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

// ─── SHA-256 Hashing ───
export async function hashFileSHA256(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hash);
}

// ─── ECDSA Digital Signatures ───
export async function generateECDSAKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
}

export async function signDataECDSA(privateKey: CryptoKey, data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, encoded);
  return arrayBufferToBase64(signature);
}

export async function verifySignatureECDSA(publicKeyBase64: string, signatureBase64: string, data: string): Promise<boolean> {
  const publicKey = await crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(publicKeyBase64),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
  const encoded = new TextEncoder().encode(data);
  return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, publicKey, base64ToArrayBuffer(signatureBase64), encoded);
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exported);
}

// ─── ECDH Key Exchange ───
export async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
}

export async function deriveSharedAESKey(privateKey: CryptoKey, publicKeyBase64: string): Promise<CryptoKey> {
  const publicKey = await crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(publicKeyBase64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
