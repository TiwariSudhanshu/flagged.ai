const KEY = process.env.GEMINI_API_KEY;

export const FAST_MODEL = process.env.GEMINI_MODEL_FAST || "gemini-2.5-flash";
export const REASON_MODEL = process.env.GEMINI_MODEL_REASON || "gemini-2.5-flash";

const CALL_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;

export async function generateJson({ model, system, prompt, schema, temperature = 0.2 }) {
  const tag = `[Gemini:${model}]`;

  const result = await _callWithRetry({ model, system, prompt, schema, temperature, tag });
  if (result !== null) return result;

  if (model !== FAST_MODEL) {
    const fbTag = `[Gemini:${FAST_MODEL}:fallback]`;
    console.warn(`${tag} Falling back to ${FAST_MODEL}…`);
    const fallback = await _callWithRetry({
      model: FAST_MODEL, system, prompt, schema, temperature, tag: fbTag,
    });
    if (fallback !== null) return fallback;
  }

  throw new Error("Gemini API rate limit hit. Please wait a minute and try again.");
}

async function _callWithRetry({ model, system, prompt, schema, temperature, tag }) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await _call({ model, system, prompt, schema, temperature, tag, attempt });
    if (result.ok) return result.data;

    if (result.retryMs && attempt < MAX_RETRIES) {
      const wait = Math.min(result.retryMs, 30_000);
      console.warn(`${tag} ⚠ Rate limited (attempt ${attempt}/${MAX_RETRIES}). Waiting ${Math.ceil(wait / 1000)}s…`);
      await sleep(wait);
      continue;
    }

    if (!result.rateLimited) throw new Error(result.error);
    return null;
  }
  return null;
}

import https from "https";

async function _call({ model, system, prompt, schema, temperature, tag, attempt }) {
  console.log(`${tag} Attempt ${attempt}/${MAX_RETRIES}…`);
  
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${KEY}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: CALL_TIMEOUT_MS, // Node.js native socket timeout
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);

          if (res.statusCode < 200 || res.statusCode >= 300) {
            const msg = json.error?.message || JSON.stringify(json);
            const isRateLimit = res.statusCode === 429 || msg.includes("quota");
            if (isRateLimit) {
              const m = msg.match(/retry\s*(?:in|Delay['":\s]*)(\d+(?:\.\d+)?)\s*s/i);
              const retryMs = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1000 : 5000;
              return resolve({ ok: false, rateLimited: true, retryMs, error: msg });
            }
            return resolve({ ok: false, rateLimited: false, error: msg });
          }

          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const parsed = JSON.parse(text);
          console.log(`${tag} ✓ Done`);
          resolve({ ok: true, data: parsed });
        } catch (e) {
          resolve({ ok: false, rateLimited: false, error: "Failed to parse response: " + e.message });
        }
      });
    });

    req.on("error", (e) => {
      resolve({ ok: false, rateLimited: false, error: e.message });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, rateLimited: false, error: `Gemini API timed out after ${CALL_TIMEOUT_MS / 1000}s` });
    });

    req.write(payload);
    req.end();
  });
}

function cleanMsg(msg) {
  try {
    const m = msg.match(/\{[\s\S]*\}/);
    if (m) {
      const p = JSON.parse(m[0]);
      return p?.error?.message?.split("\n")[0] || msg.slice(0, 150);
    }
  } catch {}
  return msg.slice(0, 150);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
