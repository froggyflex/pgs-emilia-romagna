import { createHmac, timingSafeEqual } from "node:crypto";

const uploadTokenTtlMs = 10 * 60 * 1000;

export function isValidUploadToken(token, secret) {
  if (!secret || typeof token !== "string") {
    return false;
  }

  const [expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt) || !signature || Date.now() > expiresAt) {
    return false;
  }

  const expected = signUploadExpiry(expiresAtRaw, secret);

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function createUploadToken(secret) {
  if (!secret) {
    return "";
  }

  const expiresAt = String(Date.now() + uploadTokenTtlMs);
  return `${expiresAt}.${signUploadExpiry(expiresAt, secret)}`;
}

function signUploadExpiry(expiresAt, secret) {
  return createHmac("sha256", secret).update(expiresAt).digest("hex");
}
