// LLM client — uses OpenRouter (OpenAI-compatible) API
const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1";

if (!API_KEY) console.warn("[LLM] ⚠ LLM_API_KEY is not set!");

export const FAST_MODEL = process.env.LLM_MODEL_FAST || "openai/gpt-oss-120b";
export const REASON_MODEL = process.env.LLM_MODEL_REASON || "openai/gpt-oss-120b";

const CALL_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const BASE_RETRY_WAIT = 5_000;

export async function generateJson({ model, system, prompt, schema, temperature = 0.2 }) {
  const tag = `[LLM:${model}]`;

  const result = await _callWithRetry({ model, system, prompt, schema, temperature, tag });
  if (result !== null) return result;

  throw new Error("LLM API rate limit hit. Please wait a minute and try again.");
}

async function _callWithRetry({ model, system, prompt, schema, temperature, tag }) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await _call({ model, system, prompt, schema, temperature, tag, attempt });
    if (result.ok) return result.data;

    if (result.rateLimited && attempt < MAX_RETRIES) {
      const serverWait = result.retryMs || 0;
      const backoffWait = BASE_RETRY_WAIT * Math.pow(2, attempt - 1);
      const wait = Math.min(Math.max(serverWait, backoffWait), 60_000);
      console.warn(`${tag} ⚠ Rate limited (attempt ${attempt}/${MAX_RETRIES}). Waiting ${Math.ceil(wait / 1000)}s…`);
      await sleep(wait);
      continue;
    }

    if (!result.rateLimited) throw new Error(result.error);
    return null;
  }
  return null;
}

async function _call({ model, system, prompt, schema, temperature, tag, attempt }) {
  console.log(`${tag} Attempt ${attempt}/${MAX_RETRIES}…`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

  // Build the system prompt — embed the JSON schema so the model knows the shape
  const fullSystem = schema
    ? `${system}\n\nYou MUST return valid JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`
    : system;

  const body = {
    model,
    messages: [
      { role: "system", content: fullSystem },
      { role: "user", content: prompt },
    ],
    temperature,
    response_format: { type: "json_object" },
    max_tokens: 4096,
  };

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text();
      let msg;
      try { msg = JSON.parse(errBody)?.error?.message || errBody; } catch { msg = errBody; }
      const isRateLimit = res.status === 429 || msg.includes("quota") || msg.includes("rate");
      if (isRateLimit) {
        const m = msg.match(/retry\s*(?:in|after|Delay['":\s]*)(\d+(?:\.\d+)?)\s*s/i);
        const retryMs = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1000 : BASE_RETRY_WAIT;
        return { ok: false, rateLimited: true, retryMs, error: msg.slice(0, 300) };
      }
      return { ok: false, rateLimited: false, error: `HTTP ${res.status}: ${msg.slice(0, 300)}` };
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? "";

    if (!text) {
      return { ok: false, rateLimited: false, error: "Empty response from LLM" };
    }

    try {
      const parsed = JSON.parse(text);
      console.log(`${tag} ✓ Done`);
      return { ok: true, data: parsed };
    } catch (e) {
      return { ok: false, rateLimited: false, error: "Failed to parse JSON: " + e.message + " | Raw: " + text.slice(0, 200) };
    }
  } catch (err) {
    clearTimeout(timer);

    if (err.name === "AbortError") {
      return { ok: false, rateLimited: false, error: `LLM timed out after ${CALL_TIMEOUT_MS / 1000}s` };
    }

    return { ok: false, rateLimited: false, error: err.message || String(err) };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
