import type { Comment, EventRecord } from "./types";
import { apiUrl } from "./api-url";
import { backendServiceHeaders } from "./backend-service";

export async function listEvents(includeDrafts = false): Promise<EventRecord[]> {
  try {
    return await fetchJson<EventRecord[]>(`/events${includeDrafts ? "?includeDrafts=true" : ""}`, includeDrafts);
  } catch (error) {
    console.error("Backend event list request failed.", error);
    return [];
  }
}

export async function getEventBySlug(slug: string, includeDrafts = false): Promise<EventRecord | null> {
  try {
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
  } catch (error) {
    console.error(`Backend event request failed for slug "${slug}".`, error);
    return null;
  }
}

export async function listComments(eventId: string): Promise<Comment[]> {
  try {
    return await fetchJson<Comment[]>(`/comments?eventId=${encodeURIComponent(eventId)}`);
  } catch (error) {
    console.error(`Backend comment list request failed for event "${eventId}".`, error);
    return [];
  }
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
