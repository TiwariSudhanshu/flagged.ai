import { randomBytes } from "crypto";
import { tryGetDb } from "./mongo.js";

const COL = "api_keys";

export function generateKey() {
  return "fai_" + randomBytes(24).toString("hex");
}

export async function createKey({ name }) {
  const db = await tryGetDb();
  if (!db) throw new Error("Database unavailable");

  const key = generateKey();
  const doc = {
    key,
    name: name.trim().slice(0, 80),
    createdAt: new Date(),
    lastUsedAt: null,
    requests: 0,
    credits: 0,
    active: true,
  };
  await db.collection(COL).insertOne(doc);
  return doc;
}

export async function listKeys() {
  const db = await tryGetDb();
  if (!db) return [];
  return db.collection(COL).find({}).sort({ createdAt: -1 }).toArray();
}

export async function revokeKey(id) {
  const db = await tryGetDb();
  if (!db) throw new Error("Database unavailable");
  const { ObjectId } = await import("mongodb");
  const result = await db.collection(COL).updateOne(
    { _id: new ObjectId(id) },
    { $set: { active: false } },
  );
  return result.modifiedCount > 0;
}

// Returns the key doc if valid and active, null otherwise.
// Also updates lastUsedAt and increments requests.
export async function validateAndTrack(rawKey) {
  if (!rawKey) return null;
  const db = await tryGetDb();
  if (!db) return null;
  const doc = await db.collection(COL).findOneAndUpdate(
    { key: rawKey, active: true },
    { $inc: { requests: 1 }, $set: { lastUsedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ?? null;
}
