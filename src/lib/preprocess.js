import { generateJson, FAST_MODEL } from "./gemini.js";
import { PreprocessResult } from "./schemas.js";

const SYSTEM = `You are the intake stage of Flagged AI, a tool that detects Indian job scams.
You receive a raw message — a forwarded WhatsApp text, an offer-letter screenshot transcribed by OCR, a recruiter URL, or a user describing an offer to you.
Extract a clean, structured fact sheet. Stick to what the text actually says — do not infer beyond it.

Pay special attention to:
- Money flowing FROM the candidate TO the company. Registration fee, training fee, laptop deposit, ID-card charge, security deposit, kit fee. Set paymentAsk=true and copy the amount exactly (₹2,000, Rs. 5500, etc.).
- Urgency phrases ("limited seats", "respond in 2 hours", "immediate joining"), vague roles ("form filling", "online work", "typing"), unrealistic salary-to-effort claims, WhatsApp-only or personal-Gmail contact.
- Detect Indian phone numbers (+91…, 10-digit), UPI IDs (handle@bank), and email addresses. Pull URLs as-is.
- userIntent: set to "recovery" only if the user explicitly says they already paid, sent money, transferred, applied, or are asking for help after the fact. Otherwise "detect".

Return strict JSON matching the provided schema.`;

const SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["text", "url", "image"] },
    userIntent: { type: "string", enum: ["detect", "recovery"] },
    company: { type: "string", nullable: true },
    role: { type: "string", nullable: true },
    salaryClaimed: { type: "string", nullable: true },
    contacts: {
      type: "object",
      properties: {
        phones: { type: "array", items: { type: "string" } },
        emails: { type: "array", items: { type: "string" } },
        upis: { type: "array", items: { type: "string" } },
      },
      required: ["phones", "emails", "upis"],
    },
    urls: { type: "array", items: { type: "string" } },
    paymentAsk: { type: "boolean" },
    paymentAmount: { type: "string", nullable: true },
    recruiterName: { type: "string", nullable: true },
    redFlagPhrases: { type: "array", items: { type: "string" } },
    rawSummary: { type: "string" },
  },
  required: [
    "type",
    "userIntent",
    "contacts",
    "urls",
    "paymentAsk",
    "redFlagPhrases",
    "rawSummary",
  ],
};

export async function preprocess(input) {
  const data = await generateJson({
    model: FAST_MODEL,
    system: SYSTEM,
    prompt: `Raw user input:\n\n${input}\n\nExtract the fact sheet now.`,
    schema: SCHEMA,
    temperature: 0,
  });
  return PreprocessResult.parse(data);
}
