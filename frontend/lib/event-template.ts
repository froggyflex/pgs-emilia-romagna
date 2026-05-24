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
    sections: [
      {
        id: crypto.randomUUID(),
        slug: "campionato",
        type: "campionato",
        title: "Campionato",
        subtitle: "Partite, risultati e classifiche",
        description: "Sezione sportiva con calendario, classifiche e aggiornamenti live.",
        startsAt: now,
        endsAt: now,
        location: "Luogo evento",
        heroImage: "/assets/finali-nazionali-u14-u16.jpeg"
      }
    ],
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
