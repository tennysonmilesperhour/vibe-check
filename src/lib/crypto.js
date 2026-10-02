// Real encryption for data exports: PBKDF2 (SHA-256, 100k) -> AES-256-GCM.
// Replaces the old export "password protection" that just wrote
// password_protected: true into plain JSON.

const enc = new TextEncoder();
const dec = new TextDecoder();

// In chunks: one call with every byte of a large buffer throws once it
// passes the engine's argument limit, a few hundred kilobytes. apply and the
// plain loop below are several times faster than spreading or mapping.
const toB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const fromB64 = (str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt any JSON-serializable value. Returns a self-describing envelope. */
export async function encryptJson(value, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)));
  return { v: 1, kdf: 'PBKDF2-SHA256-100k', cipher: 'AES-256-GCM', salt: toB64(salt), iv: toB64(iv), data: toB64(ciphertext) };
}

/** Decrypt an envelope produced by encryptJson. Throws on wrong password or tampering. */
export async function decryptJson(envelope, password) {
  const key = await deriveKey(password, fromB64(envelope.salt));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(envelope.iv) }, key, fromB64(envelope.data));
  return JSON.parse(dec.decode(plain));
}

/** Fetch every page of an entity list, pageSize rows per request. */
export async function fetchAllPages(listFn, pageSize = 100) {
  const all = [];
  let offset = 0;
  for (;;) {
    const page = await listFn(pageSize, offset);
    all.push(...page);
    if (page.length < pageSize) return all;
    offset += pageSize;
  }
}
