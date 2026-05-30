import "./env.mjs";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { GridFSBucket, ObjectId } from "mongodb";
import path from "node:path";
import { Readable } from "node:stream";
import { getAllowedOrigins, isAuthBypassed } from "./env.mjs";
import { getDb } from "./db.mjs";
import { isValidUploadToken } from "./upload-token.mjs";
import {
  addEventMedia,
  addComment,
  deleteEvent,
  getEventBySlug,
  incrementMediaLike,
  listComments,
  listEvents,
  upsertEvent
} from "./events-store.mjs";
import { getAnalyticsSummary, recordVisit } from "./analytics-store.mjs";
import { commentSchema, eventSchema, visitSchema } from "./validators.mjs";

const port = Number(process.env.PORT || 8787);
const uploadsDir = path.resolve("uploads");
const allowedOrigins = getAllowedOrigins();
const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 750);
const maxUploadSizeBytes = maxUploadSizeMb * 1024 * 1024;
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

createServer(async (request, response) => {
  try {
    setCorsHeaders(request, response);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, service: "pgs-eventi-live-backend" });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/analytics") {
      if (!requireTrustedWrite(request, response)) return;
      const eventSlug = url.searchParams.get("eventSlug") || "";

      if (!eventSlug) {
        sendJson(response, 400, { message: "Missing eventSlug" });
        return;
      }

      sendJson(response, 200, await getAnalyticsSummary(eventSlug));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/analytics/visit") {
      const parsed = visitSchema.safeParse(await readJson(request));

      if (!parsed.success) {
        sendJson(response, 400, { message: "Invalid visit" });
        return;
      }

      sendJson(response, 200, await recordVisit(parsed.data));
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/uploads/")) {
      await serveUpload(url.pathname, response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/events") {
      const includeDrafts = await authorizeDraftRead(request, response, url);
      if (includeDrafts === null) return;
      sendJson(response, 200, await listEvents(includeDrafts));
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/events/")) {
      const slug = decodeURIComponent(url.pathname.slice("/api/events/".length));
      const includeDrafts = await authorizeDraftRead(request, response, url);
      if (includeDrafts === null) return;
      const event = await getEventBySlug(slug, includeDrafts);

      if (!event) {
        sendJson(response, 404, { message: "Event not found" });
        return;
      }

      sendJson(response, 200, event);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/events") {
      if (!requireTrustedWrite(request, response)) return;
      const parsed = eventSchema.safeParse(await readJson(request));

      if (!parsed.success) {
        sendJson(response, 400, { message: "Invalid event", issues: parsed.error.flatten() });
        return;
      }

      sendJson(response, 200, await upsertEvent(parsed.data));
      return;
    }

    if (request.method === "POST" && url.pathname.match(/^\/api\/events\/[^/]+\/media$/)) {
      if (!requireTrustedUpload(request, response)) return;
      const slug = decodeURIComponent(url.pathname.split("/")[3]);
      await handleEventMediaUpload(request, response, slug);
      return;
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/api/events/")) {
      if (!requireTrustedWrite(request, response)) return;
      const id = decodeURIComponent(url.pathname.slice("/api/events/".length));
      await deleteEvent(id);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/comments") {
      const eventId = url.searchParams.get("eventId") || "";

      if (!eventId) {
        sendJson(response, 200, []);
        return;
      }

      sendJson(response, 200, await listComments(
        eventId,
        url.searchParams.get("targetType") || undefined,
        url.searchParams.get("targetId") || undefined
      ));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/comments") {
      if (!requireTrustedWrite(request, response)) return;
      const parsed = commentSchema.safeParse(await readJson(request));

      if (!parsed.success) {
        sendJson(response, 400, { message: "Invalid comment" });
        return;
      }

      const author = resolveCommentAuthor(parsed.data);

      if (!author) {
        sendJson(response, 401, { message: "Sign in required" });
        return;
      }

      sendJson(response, 200, await addComment({ ...parsed.data, ...author }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/media/likes") {
      const body = await readJson(request);
      const eventSlug = typeof body.eventSlug === "string" ? body.eventSlug : "";
      const mediaId = typeof body.mediaId === "string" ? body.mediaId : "";

      if (!eventSlug || !mediaId) {
        sendJson(response, 400, { message: "Missing media reference" });
        return;
      }

      const likes = await incrementMediaLike(eventSlug, mediaId);

      if (likes === null) {
        sendJson(response, 404, { message: "Media not found" });
        return;
      }

      sendJson(response, 200, { likes });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/uploads") {
      if (!requireTrustedUpload(request, response)) return;
      await handleUploads(request, response);
      return;
    }

    sendJson(response, 404, { message: "Route not found" });
  } catch (error) {
    console.error(error);
    const status = Number.isInteger(error?.status) ? error.status : 500;
    sendJson(response, status, { message: error instanceof Error ? error.message : "Backend request failed" });
  }
}).listen(port, () => {
  console.log(`PGS backend listening on http://127.0.0.1:${port}`);
});

async function handleUploads(request, response) {
  const formData = await readFormData(request);
  const files = formData.getAll("file").filter((file) => file instanceof File);

  if (files.length === 0) {
    sendJson(response, 400, { message: "No media received" });
    return;
  }

  await mkdir(uploadsDir, { recursive: true });
  const uploaded = [];

  for (const file of files) {
    if (!allowedTypes.has(file.type)) {
      sendJson(response, 400, { message: `Unsupported media type: ${file.type}` });
      return;
    }

    if (file.size > maxUploadSizeBytes) {
      sendJson(response, 400, { message: `${file.name} supera il limite di ${maxUploadSizeMb} MB` });
      return;
    }

    const storedPath = await storeUpload(file);
    uploaded.push({
      url: `${requestOrigin(request)}/uploads/${storedPath}`,
      type: file.type.startsWith("video/") ? "video" : "photo",
      name: file.name
    });
  }

  sendJson(response, 200, { files: uploaded, url: uploaded[0]?.url });
}

async function handleEventMediaUpload(request, response, eventSlug) {
  const formData = await readFormData(request);
  const authorName = String(formData.get("authorName") || "").trim();
  const authorEmail = String(formData.get("authorEmail") || "").trim();
  const authorImage = String(formData.get("authorImage") || "").trim();
  const caption = String(formData.get("caption") || "").trim().slice(0, 500);
  const files = formData.getAll("file").filter((file) => file instanceof File);

  if (!authorName || !authorEmail) {
    sendJson(response, 401, { message: "Signed-in author required" });
    return;
  }

  if (files.length === 0) {
    sendJson(response, 400, { message: "No media received" });
    return;
  }

  const now = new Date().toISOString();
  const mediaItems = [];

  for (const file of files) {
    if (!allowedTypes.has(file.type)) {
      sendJson(response, 400, { message: `Unsupported media type: ${file.type}` });
      return;
    }

    if (file.size > maxUploadSizeBytes) {
      sendJson(response, 400, { message: `${file.name} supera il limite di ${maxUploadSizeMb} MB` });
      return;
    }

    const storedPath = await storeUpload(file);
    mediaItems.push({
      id: randomUUID(),
      type: file.type.startsWith("video/") ? "video" : "photo",
      title: file.name.replace(/\.[^.]+$/, ""),
      url: `${requestOrigin(request)}/uploads/${storedPath}`,
      caption,
      commentsEnabled: true,
      likes: 0,
      authorName,
      authorEmail,
      ...(authorImage ? { authorImage } : {}),
      createdAt: now
    });
  }

  const saved = await addEventMedia(eventSlug, mediaItems);

  if (!saved) {
    sendJson(response, 404, { message: "Published event not found" });
    return;
  }

  sendJson(response, 200, { media: saved });
}

async function serveUpload(requestPath, response) {
  const uploadId = path.basename(requestPath);

  if (ObjectId.isValid(uploadId) && await serveGridFsUpload(uploadId, response)) {
    return;
  }

  const filePath = path.join(uploadsDir, uploadId);
  const info = await stat(filePath);

  response.writeHead(200, {
    "Content-Length": info.size,
    "Content-Type": contentTypeForPath(filePath)
  });
  createReadStream(filePath).pipe(response);
}

async function storeUpload(file) {
  const db = await getDb();

  if (db) {
    const bucket = new GridFSBucket(db, { bucketName: "uploads" });
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: { contentType: file.type }
    });

    await new Promise((resolve, reject) => {
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
      Readable.fromWeb(file.stream()).pipe(uploadStream);
    });

    return uploadStream.id.toString();
  }

  const fileName = `${randomUUID()}${extensionForType(file.type)}`;
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, fileName), Buffer.from(await file.arrayBuffer()));
  return fileName;
}

async function serveGridFsUpload(uploadId, response) {
  const db = await getDb();

  if (!db) {
    return false;
  }

  const id = new ObjectId(uploadId);
  const storedFile = await db.collection("uploads.files").findOne({ _id: id });

  if (!storedFile) {
    return false;
  }

  response.writeHead(200, {
    "Content-Length": storedFile.length,
    "Content-Type": storedFile.metadata?.contentType || "application/octet-stream"
  });

  new GridFSBucket(db, { bucketName: "uploads" }).openDownloadStream(id).pipe(response);
  return true;
}

async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function readFormData(request) {
  const webRequest = new Request(requestOrigin(request) + (request.url || "/"), {
    method: request.method,
    headers: request.headers,
    body: Readable.toWeb(request),
    duplex: "half"
  });

  return await webRequest.formData();
}

function sendJson(response, status, body) {
  if (response.writableEnded) return;
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function setCorsHeaders(request, response) {
  const origin = request.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Headers", "Content-Type,x-backend-service-token,x-upload-token");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
}

async function authorizeDraftRead(request, response, url) {
  const requested = url.searchParams.get("includeDrafts") === "true";

  if (!requested) {
    return false;
  }

  if (isTrustedRequest(request)) {
    return true;
  }

  sendJson(response, 401, { message: "Draft event access requires the frontend service token" });
  return null;
}

function requireTrustedWrite(request, response) {
  if (isTrustedRequest(request)) {
    return true;
  }

  sendJson(response, 401, { message: "Backend write requires the frontend service token" });
  return false;
}

function requireTrustedUpload(request, response) {
  if (isTrustedRequest(request) || isTrustedUploadRequest(request)) {
    return true;
  }

  sendJson(response, 401, { message: "Upload authorization required" });
  return false;
}

function resolveCommentAuthor(comment) {
  if (isAuthBypassed()) {
    return {
      authorName: "Admin test",
      authorEmail: "local-admin@example.com",
      authorImage: undefined
    };
  }

  if (comment.authorName && comment.authorEmail) {
    return {
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      authorImage: comment.authorImage
    };
  }

  return null;
}

function isTrustedRequest(request) {
  if (isAuthBypassed()) {
    return true;
  }

  const configured = process.env.BACKEND_SERVICE_TOKEN;
  const received = request.headers["x-backend-service-token"];

  return Boolean(configured && typeof received === "string" && received === configured);
}

function isTrustedUploadRequest(request) {
  const token = request.headers["x-upload-token"];
  return isValidUploadToken(token, process.env.BACKEND_SERVICE_TOKEN);
}

function requestOrigin(request) {
  const rawProtocol = request.headers["x-forwarded-proto"];
  const protocol = typeof rawProtocol === "string" ? rawProtocol.split(",")[0] : "http";
  return `${protocol}://${request.headers.host || `127.0.0.1:${port}`}`;
}

function extensionForType(type) {
  switch (type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "video/mp4":
      return ".mp4";
    case "video/webm":
      return ".webm";
    case "video/quicktime":
      return ".mov";
    default:
      return ".jpg";
  }
}

function contentTypeForPath(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    default:
      return "image/jpeg";
  }
}
