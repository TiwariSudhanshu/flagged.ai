import { tryGetDb } from "./mongo.js";
import { ObjectId } from "mongodb";

export const CREDITS_PER_CALL = 10;

export const RECHARGE_PACKS = [
  { credits: 100, price: "$1.00", label: "Starter", popular: false },
  { credits: 500, price: "$5.00", label: "Growth", popular: true },
  { credits: 1000, price: "$10.00", label: "Pro", popular: false },
  { credits: 5000, price: "$50.00", label: "Scale", popular: false },
];

export async function recharge(keyId, credits) {
  const db = await tryGetDb();
  if (!db) throw new Error("Database unavailable");

  const oid = typeof keyId === "string" ? new ObjectId(keyId) : keyId;
  const key = await db.collection("api_keys").findOneAndUpdate(
    { _id: oid, active: true },
    { $inc: { credits: Number(credits) } },
    { returnDocument: "after" }
  );
  if (!key) throw new Error("Key not found or revoked");

  await db.collection("transactions").insertOne({
    keyId: oid,
    keyName: key.name,
    type: "recharge",
    credits: Number(credits),
    balanceAfter: key.credits,
    createdAt: new Date(),
  });

  return { balanceAfter: key.credits };
}

export async function deductForCall(keyId) {
  const db = await tryGetDb();
  if (!db) return { ok: true };

  const oid = typeof keyId === "string" ? new ObjectId(keyId) : keyId;
  const key = await db.collection("api_keys").findOneAndUpdate(
    { _id: oid, active: true, credits: { $gte: CREDITS_PER_CALL } },
    { $inc: { credits: -CREDITS_PER_CALL } },
    { returnDocument: "after" }
  );

  if (!key) {
    const exists = await db.collection("api_keys").findOne({ _id: oid, active: true });
    return { ok: false, reason: exists ? "insufficient_credits" : "invalid_key" };
  }

  await db.collection("transactions").insertOne({
    keyId: oid,
    keyName: key.name,
    type: "debit",
    credits: -CREDITS_PER_CALL,
    balanceAfter: key.credits,
    createdAt: new Date(),
  });

  return { ok: true, balanceAfter: key.credits };
}

export async function getWalletSummary() {
  const db = await tryGetDb();
  if (!db) return { totalCredits: 0, keys: [], transactions: [] };

  const keys = await db.collection("api_keys")
    .find({ active: true })
    .sort({ createdAt: -1 })
    .toArray();

  const totalCredits = keys.reduce((s, k) => s + (k.credits || 0), 0);

  const transactions = await db.collection("transactions")
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return { totalCredits, keys, transactions };
}
