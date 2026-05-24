import { MongoClient } from "mongodb";

let client;
let clientPromise;
let connectionWarningShown = false;
const DATABASE_TIMEOUT_MS = 6500;

export function getClientPromise() {
  if (!process.env.MONGODB_URI) {
    return undefined;
  }

  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 6000 });
    clientPromise = client.connect().catch((error) => {
      client = undefined;
      clientPromise = undefined;

      if (!connectionWarningShown) {
        console.warn(`MongoDB unavailable, using local seed data: ${error.message}`);
        connectionWarningShown = true;
      }

      return undefined;
    });
  }

  return clientPromise;
}

export async function getDb() {
  const promise = getClientPromise();

  if (!promise) {
    return undefined;
  }

  const connected = await withDatabaseTimeout(promise);

  if (!connected) {
    return undefined;
  }

  return connected.db(process.env.MONGODB_DB || "pgs-eventi-live");
}

async function withDatabaseTimeout(promise) {
  let timeout;

  const timeoutPromise = new Promise((resolve) => {
    timeout = setTimeout(() => {
      if (!connectionWarningShown) {
        console.warn("MongoDB connection timed out, using local seed data.");
        connectionWarningShown = true;
      }

      resolve(undefined);
    }, DATABASE_TIMEOUT_MS);
  });

  const connected = await Promise.race([promise, timeoutPromise]);
  clearTimeout(timeout);
  return connected;
}
