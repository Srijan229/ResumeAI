import crypto from "crypto";

export type EncryptedSecret = {
  encryptedValue: string;
  iv: string;
  authTag: string;
};

function getEncryptionKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is required");
  }

  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const decoded = Buffer.from(raw, "base64");
  if (decoded.length === 32) {
    return decoded;
  }

  throw new Error("ENCRYPTION_KEY must be 32 bytes as base64 or 64 hex characters");
}

export function encryptSecret(secret: string): EncryptedSecret {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedValue: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptSecret(encryptedSecret: EncryptedSecret): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(encryptedSecret.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encryptedSecret.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedSecret.encryptedValue, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSecret(secret: string): string {
  if (secret.length <= 8) {
    return `${secret.slice(0, 2)}********`;
  }

  return `${secret.slice(0, 4)}************${secret.slice(-4)}`;
}
