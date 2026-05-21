import { apiUrl } from "./api-url";

export function backendServiceHeaders(headers: HeadersInit = {}) {
  const token = process.env.BACKEND_SERVICE_TOKEN;

  return {
    ...headers,
    ...(token ? { "x-backend-service-token": token } : {})
  };
}

export async function forwardBackendResponse(response: Response) {
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json"
    }
  });
}

export async function fetchBackend(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), {
    cache: "no-store",
    ...init,
    headers: backendServiceHeaders(init?.headers)
  });
}
