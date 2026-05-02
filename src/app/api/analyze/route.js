import { run } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 5 minutes for the full pipeline (preprocess + agents + orchestrate)
export const maxDuration = 300;

export async function POST(request) {
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
        console.log("[API /analyze] Stream completed successfully");
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
