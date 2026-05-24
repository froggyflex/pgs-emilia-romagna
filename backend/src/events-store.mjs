import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";
import { getDb } from "./db.mjs";
import { seedComments, seedEvents } from "./seed-data.mjs";

const EVENTS = "events";
const COMMENTS = "comments";
const PUBLIC_EVENT_STATUSES = ["published", "updating"];
const memoryStore = globalThis;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getMemoryEvents() {
  if (!memoryStore.__PGS_EVENTS__) {
    memoryStore.__PGS_EVENTS__ = clone(seedEvents);
  }

  return memoryStore.__PGS_EVENTS__;
}

function getMemoryComments() {
  if (!memoryStore.__PGS_COMMENTS__) {
    memoryStore.__PGS_COMMENTS__ = clone(seedComments);
  }

  return memoryStore.__PGS_COMMENTS__;
}

export async function listEvents(includeDrafts = false) {
  const db = await getDb();

  if (!db) {
    const events = getMemoryEvents();
    return includeDrafts ? events : events.filter((event) => PUBLIC_EVENT_STATUSES.includes(event.status));
  }

  const query = includeDrafts ? {} : { status: { $in: PUBLIC_EVENT_STATUSES } };
  const events = await db.collection(EVENTS).find(query).sort({ startsAt: 1 }).toArray();

  return events.map(serializeEvent);
}

export async function getEventBySlug(slug, includeDrafts = false) {
  const db = await getDb();

  if (!db) {
    return getMemoryEvents().find((event) => event.slug === slug && (includeDrafts || PUBLIC_EVENT_STATUSES.includes(event.status))) || null;
  }

  const query = includeDrafts ? { slug } : { slug, status: { $in: PUBLIC_EVENT_STATUSES } };
  const event = await db.collection(EVENTS).findOne(query);
  return event ? serializeEvent(event) : null;
}

export async function upsertEvent(event) {
  const db = await getDb();
  const updatedAt = new Date().toISOString();
  const payload = { ...event, updatedAt };

  if (!db) {
    const events = getMemoryEvents();
    const existingIndex = events.findIndex((item) => item._id === payload._id || item.slug === payload.slug);
    const saved = {
      ...payload,
      _id: payload._id || `local-${randomUUID()}`,
      createdAt: payload.createdAt || updatedAt
    };

    if (existingIndex >= 0) {
      events[existingIndex] = saved;
    } else {
      events.unshift(saved);
    }

    memoryStore.__PGS_EVENTS__ = events;
    return saved;
  }

  if (event._id) {
    const { _id, ...rest } = payload;
    await db.collection(EVENTS).updateOne({ _id: new ObjectId(_id) }, { $set: rest });
    return payload;
  }

  const createdAt = event.createdAt || updatedAt;
  const { _id, ...insertable } = { ...payload, createdAt };
  const result = await db.collection(EVENTS).insertOne(insertable);
  return { ...insertable, _id: result.insertedId.toString() };
}

export async function deleteEvent(id) {
  const db = await getDb();

  if (!db) {
    memoryStore.__PGS_EVENTS__ = getMemoryEvents().filter((event) => event._id !== id && event.slug !== id);
    return;
  }

  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { slug: id };
  await db.collection(EVENTS).deleteOne(query);
}

export async function incrementMediaLike(eventSlug, mediaId) {
  const db = await getDb();

  if (!db) {
    const event = getMemoryEvents().find((item) => item.slug === eventSlug);
    const media = event?.media.find((item) => item.id === mediaId);

    if (!media) {
      return null;
    }

    media.likes = (media.likes || 0) + 1;
    return media.likes;
  }

  await db.collection(EVENTS).updateOne(
    { slug: eventSlug, "media.id": mediaId },
    { $inc: { "media.$.likes": 1 } }
  );

  const event = await db.collection(EVENTS).findOne({ slug: eventSlug, "media.id": mediaId });
  const media = event?.media?.find((item) => item.id === mediaId);
  return typeof media?.likes === "number" ? media.likes : null;
}

export async function addEventMedia(eventSlug, mediaItems) {
  const db = await getDb();

  if (!db) {
    const event = getMemoryEvents().find((item) => item.slug === eventSlug && item.status === "published");

    if (!event) {
      return null;
    }

    event.media = [...mediaItems, ...event.media];
    event.updatedAt = new Date().toISOString();
    return mediaItems;
  }

  const result = await db.collection(EVENTS).updateOne(
    { slug: eventSlug, status: "published" },
    {
      $push: { media: { $each: mediaItems, $position: 0 } },
      $set: { updatedAt: new Date().toISOString() }
    }
  );

  return result.matchedCount ? mediaItems : null;
}

export async function listComments(eventId, targetType, targetId) {
  const db = await getDb();

  if (!db) {
    return getMemoryComments()
      .filter((comment) => {
        if (comment.eventId !== eventId || comment.hidden) return false;
        if (targetType && comment.targetType !== targetType) return false;
        if (targetId && comment.targetId !== targetId) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const query = { eventId, hidden: false };
  if (targetType) query.targetType = targetType;
  if (targetId) query.targetId = targetId;

  const comments = await db.collection(COMMENTS).find(query).sort({ createdAt: -1 }).limit(100).toArray();
  return comments.map(serializeComment);
}

export async function addComment(comment) {
  const db = await getDb();
  const payload = {
    ...comment,
    id: randomUUID(),
    hidden: false,
    createdAt: new Date().toISOString()
  };

  if (!db) {
    const comments = getMemoryComments();
    comments.unshift(payload);
    memoryStore.__PGS_COMMENTS__ = comments;
    return payload;
  }

  await db.collection(COMMENTS).insertOne(payload);
  return payload;
}

function serializeEvent(event) {
  const { _id, ...rest } = event;
  return { ...rest, _id: _id?.toString() };
}

function serializeComment(comment) {
  const { _id, ...rest } = comment;
  return { ...rest, id: rest.id || _id?.toString() };
}
