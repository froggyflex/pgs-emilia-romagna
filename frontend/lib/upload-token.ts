import { createHmac } from "node:crypto";

const uploadTokenTtlMs = 10 * 60 * 1000;

export function createUploadToken(secret?: string) {
  if (!secret) {
    return "";
  }

  const expiresAt = String(Date.now() + uploadTokenTtlMs);
  const signature = createHmac("sha256", secret).update(expiresAt).digest("hex");

  return `${expiresAt}.${signature}`;
}
