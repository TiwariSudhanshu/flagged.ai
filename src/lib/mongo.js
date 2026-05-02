import { MongoClient } from "mongodb";
import { readFile } from "node:fs/promises";
import path from "node:path";

const URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "flagged_ai";

let clientPromise;
let seedPromise;

function connect() {
  if (!clientPromise) {
    const client = new MongoClient(URI, { serverSelectionTimeoutMS: 4000 });
    clientPromise = client.connect().catch((err) => {
      clientPromise = undefined;
      throw err;
    });
  }
  return clientPromise;
}

export async function getDb() {
  const client = await connect();
  const db = client.db(DB_NAME);
  if (!seedPromise) seedPromise = seedScams(db);
  await seedPromise;
  return db;
}

export async function tryGetDb() {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

async function seedScams(db) {
  const col = db.collection("scams");
  await Promise.all([
    col.createIndex({ phones: 1 }),
    col.createIndex({ emails: 1 }),
    col.createIndex({ upis: 1 }),
    col.createIndex({ domains: 1 }),
    col.createIndex({ company: "text" }),
  ]);
  if ((await col.estimatedDocumentCount()) > 0) return;
  try {
    const file = path.join(process.cwd(), "src", "data", "seed-scams.json");
    const raw = await readFile(file, "utf8");
    const docs = JSON.parse(raw);
    if (Array.isArray(docs) && docs.length) {
      await col.insertMany(docs);
    }
  } catch {
    // No seed file yet — fine.
  }
}
