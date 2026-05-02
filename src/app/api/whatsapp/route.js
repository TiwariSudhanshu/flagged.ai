import { after } from "next/server";
import { run } from "@/lib/pipeline";
import { formatWhatsApp } from "@/lib/formatWhatsApp";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const maxDuration = 300; // after() runs inside this window — needs 30-60s for full pipeline

/*
  Twilio Sandbox setup:
  1. Go to console.twilio.com → Messaging → Try it out → Send a WhatsApp message
  2. Follow sandbox join instructions (user sends "join <word>-<word>" to +14155238886)
  3. Set Sandbox webhook URL to: https://<your-ngrok>.ngrok.io/api/whatsapp
     Method: HTTP POST
  4. Add to .env.local:
       TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
       TWILIO_AUTH_TOKEN=your_auth_token_here
       TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
  5. Run ngrok: npx ngrok http 3000
*/

export async function POST(request) {
  let body = "";
  let from = "";

  try {
    const form = await request.formData();
    body = (form.get("Body") ?? "").toString().trim();
    from = (form.get("From") ?? "").toString().trim(); // e.g. "whatsapp:+919876543210"
  } catch {
    return twiml();
  }

  if (!body || !from) return twiml();

  // Minimum length guard — greet on short/accidental pings
  if (body.length < 10) {
    return twiml("👋 *Flagged AI* here.\n\nForward any suspicious job offer, recruiter message, or LinkedIn DM and I'll check it for scam signals. Paste the full text for best results.");
  }

  // Immediately acknowledge — user sees this while analysis runs in background
  after(async () => {
    try {
      console.log(`[WhatsApp] Analysing message from ${from} (${body.length} chars)`);
      const result = await run(body, {});
      const messages = formatWhatsApp(result);
      for (const msg of messages) {
        await sendWhatsApp(from, msg);
      }
      console.log(`[WhatsApp] Replied with ${messages.length} message(s) to ${from}`);
    } catch (err) {
      const msg = err?.message ?? String(err);
      console.error("[WhatsApp] Analysis error:", msg);
      await sendWhatsApp(from, `⚠️ *Flagged AI — Debug Error*\n\n\`${msg.slice(0, 300)}\``);
    }
  });

  return twiml("🔍 *Flagged AI* is analysing your message across 6 sources. Results in ~30 seconds…");
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function twiml(message = "") {
  const body = message
    ? `<Message>${message.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</Message>`
    : "";
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`,
    { headers: { "Content-Type": "text/xml; charset=utf-8" } }
  );
}

async function sendWhatsApp(to, body) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  if (!sid || !token) {
    console.error("[WhatsApp] TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set");
    return;
  }

  const url    = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams({ From: from, To: to, Body: body });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[WhatsApp] Twilio error ${res.status}:`, text.slice(0, 300));
  }
}
