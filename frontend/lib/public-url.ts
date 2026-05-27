import { headers } from "next/headers";

const fallbackProductionUrl = "https://eventilive.pgsemiliaromagna.org";

export async function getPublicBaseUrl() {
  const configuredUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const requestUrl = await getRequestBaseUrl();

  if (configuredUrl && (!isLocalUrl(configuredUrl) || isLocalUrl(requestUrl))) {
    return configuredUrl;
  }

  return requestUrl || configuredUrl || fallbackProductionUrl;
}

function normalizeUrl(value?: string) {
  return value?.trim().replace(/\/+$/, "") || "";
}

async function getRequestBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "";

  if (!host) return "";

  const protocol = headerList.get("x-forwarded-proto") || (isLocalHost(host) ? "http" : "https");
  return `${protocol}://${host}`;
}

function isLocalUrl(value: string) {
  if (!value) return false;

  try {
    return isLocalHost(new URL(value).host);
  } catch {
    return false;
  }
}

function isLocalHost(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.") || host.startsWith("[::1]");
}
