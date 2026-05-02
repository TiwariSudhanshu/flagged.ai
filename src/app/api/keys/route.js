import { listKeys, createKey } from "@/lib/apiKeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const keys = await listKeys();
    // Never return the raw key in list — only masked form
    const safe = keys.map(({ _id, key, name, createdAt, lastUsedAt, requests, active }) => ({
      id: _id.toString(),
      name,
      preview: key.slice(0, 10) + "••••••••" + key.slice(-4),
      createdAt,
      lastUsedAt,
      requests,
      active,
    }));
    return Response.json(safe);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const name = (body?.name ?? "").toString().trim();
  if (!name) return Response.json({ error: "name is required" }, { status: 400 });

  try {
    const doc = await createKey({ name });
    // Full key returned only here — client must save it
    return Response.json({
      id: doc._id.toString(),
      name: doc.name,
      key: doc.key,           // shown once
      createdAt: doc.createdAt,
      requests: 0,
      active: true,
    }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
