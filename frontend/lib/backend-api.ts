import type { Comment, EventRecord } from "./types";
import { apiUrl } from "./api-url";
import { backendServiceHeaders } from "./backend-service";

export async function listEvents(includeDrafts = false): Promise<EventRecord[]> {
  return fetchJson<EventRecord[]>(`/events${includeDrafts ? "?includeDrafts=true" : ""}`, includeDrafts);
}

export async function getEventBySlug(slug: string, includeDrafts = false): Promise<EventRecord | null> {
  const response = await fetch(apiUrl(`/events/${encodeURIComponent(slug)}${includeDrafts ? "?includeDrafts=true" : ""}`), {
    cache: "no-store",
    headers: includeDrafts ? backendServiceHeaders() : undefined
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Backend event request failed with ${response.status}`);
  }

  return await response.json() as EventRecord;
}

export async function listComments(eventId: string): Promise<Comment[]> {
  return fetchJson<Comment[]>(`/comments?eventId=${encodeURIComponent(eventId)}`);
}

async function fetchJson<T>(path: string, privileged = false): Promise<T> {
  const response = await fetch(apiUrl(path), {
    cache: "no-store",
    headers: privileged ? backendServiceHeaders() : undefined
  });

  if (!response.ok) {
    throw new Error(`Backend request failed with ${response.status}`);
  }

  return await response.json() as T;
}
