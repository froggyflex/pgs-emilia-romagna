import { randomUUID } from "node:crypto";
import { getDb } from "./db.mjs";

const ANALYTICS = "analytics_visits";
const memoryStore = globalThis;

function getMemoryVisits() {
  if (!memoryStore.__PGS_ANALYTICS_VISITS__) {
    memoryStore.__PGS_ANALYTICS_VISITS__ = [];
  }

  return memoryStore.__PGS_ANALYTICS_VISITS__;
}

export async function recordVisit(visit) {
  const payload = normalizeVisit(visit);
  const db = await getDb();

  if (!db) {
    getMemoryVisits().push(payload);
    return { ok: true };
  }

  await db.collection(ANALYTICS).insertOne(payload);
  return { ok: true };
}

export async function getAnalyticsSummary(eventSlug) {
  const db = await getDb();
  const visits = db
    ? await db.collection(ANALYTICS).find({ eventSlug }).sort({ createdAt: -1 }).limit(5000).toArray()
    : getMemoryVisits().filter((visit) => visit.eventSlug === eventSlug).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return summarizeVisits(visits);
}

function normalizeVisit(visit) {
  const now = new Date().toISOString();
  const userAgent = cleanText(visit.userAgent, 500);

  return {
    id: randomUUID(),
    eventSlug: cleanText(visit.eventSlug, 120),
    sectionSlug: cleanText(visit.sectionSlug, 120),
    path: cleanText(visit.path, 300),
    referrer: cleanText(visit.referrer, 500),
    country: normalizeGeo(visit.country, "Sconosciuto"),
    region: normalizeGeo(visit.region, ""),
    city: normalizeGeo(visit.city, ""),
    device: detectDevice(userAgent),
    userAgent: summarizeUserAgent(userAgent),
    createdAt: now
  };
}

function summarizeVisits(visits) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalVisits = visits.length;
  const visitsToday = visits.filter((visit) => new Date(visit.createdAt) >= startOfToday).length;
  const visitsLast7Days = visits.filter((visit) => new Date(visit.createdAt) >= last7Days).length;

  return {
    totalVisits,
    visitsToday,
    visitsLast7Days,
    generatedAt: now.toISOString(),
    countries: groupCounts(visits, (visit) => visit.country || "Sconosciuto", totalVisits),
    regions: groupCounts(visits, (visit) => locationLabel(visit.region, visit.country), totalVisits),
    cities: groupCounts(visits, (visit) => locationLabel(visit.city, visit.country), totalVisits),
    paths: groupCounts(visits, (visit) => visit.path || "/", totalVisits),
    devices: groupCounts(visits, (visit) => visit.device || "Altro", totalVisits),
    recent: visits.slice(0, 20).map((visit) => ({
      id: visit.id,
      path: visit.path,
      country: visit.country,
      region: visit.region,
      city: visit.city,
      device: visit.device,
      createdAt: visit.createdAt
    }))
  };
}

function groupCounts(items, getKey, total) {
  const counts = new Map();

  for (const item of items) {
    const key = getKey(item) || "Sconosciuto";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "it"))
    .slice(0, 12);
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeGeo(value, fallback) {
  const decoded = decodeURIComponent(String(value || "").trim()).replace(/\+/g, " ");
  return decoded || fallback;
}

function locationLabel(value, country) {
  const location = String(value || "").trim();
  if (!location) return country || "Sconosciuto";
  return country ? `${location}, ${country}` : location;
}

function detectDevice(userAgent) {
  const normalized = userAgent.toLowerCase();
  if (/bot|crawler|spider|preview|facebookexternalhit|whatsapp/.test(normalized)) return "Bot / anteprima";
  if (/tablet|ipad/.test(normalized)) return "Tablet";
  if (/mobile|iphone|android/.test(normalized)) return "Mobile";
  return "Desktop";
}

function summarizeUserAgent(userAgent) {
  if (!userAgent) return "";
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/chrome\//i.test(userAgent)) return "Chrome";
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return "Safari";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  return "Altro";
}
