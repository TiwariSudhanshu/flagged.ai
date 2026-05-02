import { run } from "@/lib/pipeline";
import { validateAndTrack } from "@/lib/apiKeys";
import { deductForCall } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request) {
  // API key auth — required when X-API-Key header is present (external callers).
  // Web app calls from the same origin don't send the header and are allowed through.
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader) {
    const keyDoc = await validateAndTrack(apiKeyHeader);
    if (!keyDoc) {
      return Response.json({ error: "Invalid or revoked API key" }, { status: 401 });
    }
    const deduct = await deductForCall(keyDoc._id);
    if (!deduct.ok) {
      return Response.json(
        { error: "Insufficient credits — visit /billing to recharge.", code: "insufficient_credits" },
        { status: 402 }
      );
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const input = (body?.input ?? "").toString().trim();
  if (!input) {
    return Response.json({ error: "input is required" }, { status: 400 });
  }
  if (input.length > 12000) {
    return Response.json({ error: "input too long (max 12000 chars)" }, { status: 413 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        await run(input, { onEvent: send });
      } catch (err) {
        console.error("[API /analyze] Pipeline error:", err?.message?.slice(0, 300) || err);
        send({ type: "error", message: err?.message || "unexpected failure" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
