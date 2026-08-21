import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function loadKey() {
  const hex = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error('CONNECTOR_ENCRYPTION_KEY is not set — required to store connector session cookies. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new Error('CONNECTOR_ENCRYPTION_KEY must be 64 hex characters (32 bytes).');
  }
  return key;
}

/** Encrypts a plaintext cookie value into a single storable blob: base64(iv || authTag || ciphertext). */
export function encryptCookie(plaintext) {
  const key = loadKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/** Reverses encryptCookie. Throws if the blob was tampered with or the key doesn't match. */
export function decryptCookie(blob) {
  const key = loadKey();
  const raw = Buffer.from(blob, 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = raw.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
