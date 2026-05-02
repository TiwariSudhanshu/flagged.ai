import { revokeKey } from "@/lib/apiKeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const ok = await revokeKey(id);
    if (!ok) return Response.json({ error: "key not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
