import { seedEvent } from "./seed";
import type { EventRecord } from "./types";

export function createDraftEvent(): EventRecord {
  const now = new Date().toISOString();
  const timestamp = Date.now();

  return {
    ...JSON.parse(JSON.stringify(seedEvent)),
    _id: undefined,
    slug: `evento-${timestamp}`,
    title: "Nuovo evento",
    subtitle: "Sottotitolo evento",
    description: "Descrizione della manifestazione.",
    status: "draft",
    startsAt: now,
    endsAt: now,
    streamUrl: "",
    categories: ["Under 14", "Under 16"],
    teams: [],
    matches: [],
    rankings: [],
    media: [],
    feed: [],
    createdAt: now,
    updatedAt: now
  };
}
