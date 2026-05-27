import { MongoClient } from "mongodb";
import { existsSync, readFileSync } from "node:fs";
import { seedComments, seedEvents } from "../src/seed-data.mjs";

loadLocalEnv();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "pgs-eventi-live";
const shouldSeed = process.argv.includes("--seed");

if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

const client = new MongoClient(uri);
const eventValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["slug", "title", "status", "startsAt", "endsAt", "location", "media", "matches", "rankings", "feed"],
    properties: {
      slug: { bsonType: "string" },
      title: { bsonType: "string" },
      status: { enum: ["draft", "updating", "published", "archived"] },
      sections: { bsonType: ["array", "null"] },
      matches: { bsonType: "array" },
      rankingColumns: { bsonType: ["array", "null"] },
      rankings: { bsonType: "array" },
      media: { bsonType: "array" },
      feed: { bsonType: "array" }
    }
  }
};

try {
  await client.connect();
  const db = client.db(dbName);

  await ensureCollections(db);
  await ensureIndexes(db);

  if (shouldSeed) {
    await seedDatabase(db);
  }

  console.log(`Atlas setup completed for database "${dbName}".`);
} finally {
  await client.close();
}

async function ensureCollections(db) {
  const existing = await db.listCollections().toArray();
  const names = new Set(existing.map((collection) => collection.name));

  if (!names.has("events")) {
    await db.createCollection("events", {
      validator: eventValidator,
      validationLevel: "moderate"
    });
  } else {
    await db.command({
      collMod: "events",
      validator: eventValidator,
      validationLevel: "moderate"
    });
  }

  if (!names.has("comments")) {
    await db.createCollection("comments", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["eventId", "targetType", "targetId", "authorName", "authorEmail", "body", "hidden", "createdAt"],
          properties: {
            eventId: { bsonType: "string" },
            targetType: { enum: ["event", "feed", "media"] },
            targetId: { bsonType: "string" },
            authorName: { bsonType: "string" },
            authorEmail: { bsonType: "string" },
            body: { bsonType: "string" },
            hidden: { bsonType: "bool" },
            createdAt: { bsonType: "string" }
          }
        }
      },
      validationLevel: "moderate"
    });
  }

  if (!names.has("analytics_visits")) {
    await db.createCollection("analytics_visits", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["eventSlug", "path", "country", "device", "createdAt"],
          properties: {
            eventSlug: { bsonType: "string" },
            sectionSlug: { bsonType: "string" },
            path: { bsonType: "string" },
            referrer: { bsonType: "string" },
            country: { bsonType: "string" },
            region: { bsonType: "string" },
            city: { bsonType: "string" },
            device: { bsonType: "string" },
            userAgent: { bsonType: "string" },
            createdAt: { bsonType: "string" }
          }
        }
      },
      validationLevel: "moderate"
    });
  }
}

async function ensureIndexes(db) {
  await db.collection("events").createIndex({ slug: 1 }, { unique: true, name: "unique_slug" });
  await db.collection("events").createIndex({ status: 1, startsAt: 1 }, { name: "status_startsAt" });
  await db.collection("events").createIndex({ "matches.status": 1 }, { name: "match_status" });
  await db.collection("events").createIndex({ "media.id": 1 }, { name: "media_id" });

  await db.collection("comments").createIndex(
    { eventId: 1, targetType: 1, targetId: 1, hidden: 1, createdAt: -1 },
    { name: "comments_by_target" }
  );
  await db.collection("comments").createIndex({ eventId: 1, createdAt: -1 }, { name: "comments_by_event" });

  await db.collection("analytics_visits").createIndex(
    { eventSlug: 1, createdAt: -1 },
    { name: "analytics_by_event_date" }
  );
  await db.collection("analytics_visits").createIndex(
    { eventSlug: 1, country: 1 },
    { name: "analytics_by_event_country" }
  );
}

async function seedDatabase(db) {
  for (const event of seedEvents) {
    await db.collection("events").updateOne(
      { slug: event.slug },
      { $set: event },
      { upsert: true }
    );
  }

  for (const comment of seedComments) {
    await db.collection("comments").updateOne(
      { id: comment.id },
      { $set: comment },
      { upsert: true }
    );
  }

  console.log(`Seeded ${seedEvents.length} events and ${seedComments.length} comments.`);
}

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env", "../.env.local"]) {
    if (!existsSync(fileName)) continue;

    const file = readFileSync(fileName, "utf8");
    for (const line of file.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}
