import { MongoClient } from "mongodb";

let client;
let clientPromise;
let connectionWarningShown = false;

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

  const connected = await promise;

  if (!connected) {
    return undefined;
  }

  return connected.db(process.env.MONGODB_DB || "pgs-eventi-live");
}
