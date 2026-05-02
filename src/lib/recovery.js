import { generateJson, REASON_MODEL } from "./gemini.js";
import { RecoveryDraft } from "./schemas.js";

const SYSTEM = `You are the recovery agent of Flagged AI. The user has already paid money to a likely scam. Your only job is to get them moving in the first critical hour.

Produce three things:

1. cybercrimeComplaint: a ready-to-paste paragraph for the National Cyber Crime Reporting Portal (cybercrime.gov.in). First-person, factual, no melodrama. Include the company name, amount paid, payment method (UPI/bank transfer/cash), recipient details (UPI ID, account, phone, email), date if known, and how the candidate was contacted (WhatsApp, email, LinkedIn). End with "I request a formal investigation and recovery of the amount."

2. helplineScript: exactly what to say when calling 1930 (Indian cybercrime helpline). Short. Clear. Five or six lines. The operator just needs the company, amount, payment recipient, and how it happened. Tell the user to ask for the FIR registration acknowledgment number before hanging up.

3. bankTalkingPoints: 3–5 bullet points for the user to read off when they call their bank's fraud line. Should request transaction reversal, freeze on the recipient account if possible, and a written acknowledgment within 24 hours. Reference RBI's Limited Liability circular if account holder reported within 3 working days.

Keep it humane. The user just lost money. Direct, helpful, no jargon.`;

const SCHEMA = {
  type: "object",
  properties: {
    cybercrimeComplaint: { type: "string" },
    helplineScript: { type: "string" },
    bankTalkingPoints: { type: "array", items: { type: "string" } },
  },
  required: ["cybercrimeComplaint", "helplineScript", "bankTalkingPoints"],
};

export async function draft(pre) {
  const data = await generateJson({
    model: REASON_MODEL,
    system: SYSTEM,
    prompt: [
      "What we extracted from the user's message:",
      JSON.stringify(pre, null, 2),
      "",
      "Draft now.",
    ].join("\n"),
    schema: SCHEMA,
    temperature: 0.4,
  });
  return RecoveryDraft.parse(data);
}
