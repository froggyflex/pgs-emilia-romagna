const defaultApiUrl = "http://127.0.0.1:8787/api";

export function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\//, "");

  return new URL(normalizedPath, normalizedBase).toString();
}
