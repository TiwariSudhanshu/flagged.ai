import { generateJson, REASON_MODEL } from "./gemini.js";
import { Verdict } from "./schemas.js";

const SYSTEM = `You are the orchestrator agent of Flagged AI. You receive (a) a structured fact sheet about a job posting, and (b) signals from independent tools and agents that have inspected the company, domain, registry data, and scam database.

Produce a final verdict the user can act on in 30 seconds. Be honest, calibrated, and explain your reasoning.

NON-NEGOTIABLE RULES (apply BEFORE any other reasoning):
- If the candidate is asked to pay ANY money to the employer (registration fee, training, deposit, ID, kit, etc.), score >= 70 and verdict is at minimum "suspicious". This is the #1 indicator of fraud in the Indian job market.
- If the scam-DB tool returns an exact match on phone, email, UPI, or domain, score >= 95 and verdict = "scam".
- If domain age is under 14 days AND MCA registration is missing or under 90 days old, score >= 85.
- If GST is missing, role is vague ("form filling", "online work", "data entry, no experience"), AND urgency phrases are present, score >= 75.
- A legitimate company with one weak red flag (personal Gmail contact, slightly off domain) is 40–55, flagged but not condemned. Do not over-call.

CALIBRATION:
- "scam" = 80–100. "suspicious" = 50–79. "likely_legit" = 0–49.
- When signals are unavailable (no API key, site down, rate limited), do NOT default to safe or to scam. Note the missing signal in your reasoning and lower confidence accordingly.
- Cite specific signals in keyFindings — do not say "the system flagged it". Say "Domain registered 9 days ago" or "Scam DB matched on phone +91…".

OUTPUT:
- headline: one short, punchy sentence the user reads first ("Strong scam — ₹2,000 registration fee is the giveaway.").
- reasoning: 2–4 sentences walking through the call.
- keyFindings: 3–6 entries, weighted high/medium/low.
- recommendedAction: concrete next step. Examples: "Do not pay. Block the number and report at cybercrime.gov.in." Or "Looks legit but verify by emailing careers@<company> directly."

Return strict JSON matching the schema.`;

const SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    verdict: { type: "string", enum: ["scam", "suspicious", "likely_legit"] },
    headline: { type: "string" },
    reasoning: { type: "string" },
    keyFindings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          signal: { type: "string" },
          weight: { type: "string", enum: ["high", "medium", "low"] },
          explanation: { type: "string" },
        },
        required: ["signal", "weight", "explanation"],
      },
    },
    recommendedAction: { type: "string" },
  },
  required: ["score", "verdict", "headline", "reasoning", "keyFindings", "recommendedAction"],
};

export async function orchestrate({ pre, signals }) {
  const prompt = buildPrompt(pre, signals);
  const data = await generateJson({
    model: REASON_MODEL,
    system: SYSTEM,
    prompt,
    schema: SCHEMA,
    temperature: 0.3,
  });
  return Verdict.parse(data);
}

function buildPrompt(pre, signals) {
  return [
    "FACT SHEET (from preprocessing):",
    JSON.stringify(pre, null, 2),
    "",
    "SIGNALS (from tools and agents):",
    JSON.stringify(signals, null, 2),
    "",
    "Produce the final verdict.",
  ].join("\n");
}
