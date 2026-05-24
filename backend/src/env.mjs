import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const candidates = [
  ".env.local",
  ".env",
  path.join("..", ".env.local")
];

for (const candidate of candidates) {
  if (existsSync(candidate)) {
    loadEnvFile(candidate);
  }
}

export function isAuthBypassed() {
  return process.env.NODE_ENV !== "production" && process.env.BYPASS_AUTH === "true";
}

export function getAllowedOrigins() {
  const configured = (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    ...configured
  ]);
}

function loadEnvFile(filePath) {
  const file = readFileSync(filePath, "utf8");

  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
