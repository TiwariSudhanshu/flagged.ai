import { tryGetDb } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { company, phones, emails, upis, domains, notes, source } = body || {};
  if (!company && !phones?.length && !emails?.length && !upis?.length && !domains?.length) {
    return Response.json(
      { error: "at least one identifier (company, phone, email, upi, domain) is required" },
      { status: 400 },
    );
  }

  const db = await tryGetDb();
  if (!db) {
    return Response.json({ error: "database unavailable" }, { status: 503 });
  }

  const doc = {
    company: company ?? null,
    phones: dedupe(phones),
    emails: dedupe(emails).map((e) => e.toLowerCase()),
    upis: dedupe(upis),
    domains: dedupe(domains).map((d) => d.toLowerCase().replace(/^www\./, "")),
    notes: typeof notes === "string" ? notes.slice(0, 2000) : null,
    source: source || "user-report",
    reportedAt: new Date().toISOString().slice(0, 10),
  };

  const result = await db.collection("scams").insertOne(doc);
  return Response.json({ ok: true, id: result.insertedId });
}

function dedupe(arr) {
  if (!Array.isArray(arr)) return [];
  return Array.from(new Set(arr.filter((v) => typeof v === "string" && v.trim()))).slice(0, 20);
}
