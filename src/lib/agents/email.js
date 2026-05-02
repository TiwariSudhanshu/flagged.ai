import dns from "dns/promises";
import * as whois from "../tools/whois.js";
import { generateJson, FAST_MODEL } from "../gemini.js";

const SYSTEM = `You are the Email Agent of Flagged AI. You assess whether recruiter email addresses are consistent with a legitimate Indian employer.

Reason about:
- Free / personal email providers (Gmail, Yahoo, Rediffmail, Hotmail, etc.) for a corporate recruiter are a yellow-to-red flag depending on context. A small startup using Gmail is normal; "HR at Infosys" using Gmail is not.
- Disposable / throwaway email services (Mailinator, Guerrilla Mail, Temp-mail, etc.) are a major red flag regardless of context.
- Missing MX records mean the domain cannot receive email — the address is almost certainly fake.
- Domain too new (under 30 days) combined with a corporate-sounding name is suspicious.
- Lookalike domains (infosys-hr.com, tcs-careers.in) impersonating a known company are a major red flag.
- Multiple different email domains for the same recruiter or company is suspicious.

If no email was found, report no signals.

Return strict JSON.`;

const SCHEMA = {
  type: "object",
  properties: {
    suspicious: { type: "boolean" },
    redFlags: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
  },
  required: ["suspicious", "redFlags", "notes"],
};

const FREE_MAIL = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.in", "yahoo.co.in",
  "outlook.com", "hotmail.com", "live.com",
  "rediffmail.com", "rediff.com",
  "protonmail.com", "proton.me",
  "icloud.com", "me.com",
  "aol.com", "yandex.com", "yandex.ru",
]);

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.info",
  "guerrillamail.biz", "guerrillamail.de", "guerrillamail.net",
  "guerrillamail.org", "tempmail.com", "temp-mail.org",
  "throwam.com", "sharklasers.com", "grr.la", "spam4.me",
  "trashmail.com", "trashmail.me", "trashmail.net",
  "yopmail.com", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf",
  "maildrop.cc", "dispostable.com", "mailnull.com",
  "discard.email", "fakeinbox.com", "mt2015.com",
  "spamgourmet.com", "spamobox.com", "spamgourmet.net",
]);

export async function analyze(pre) {
  const emails = pre.contacts?.emails ?? [];
  if (emails.length === 0) {
    return { source: "emailAgent", status: "skipped", reason: "no email addresses found" };
  }

  const checks = await Promise.all(emails.map((e) => checkEmail(e, pre.company)));

  let reasoning = null;
  try {
    reasoning = await generateJson({
      model: FAST_MODEL,
      system: SYSTEM,
      prompt: buildPrompt({ pre, checks }),
      schema: SCHEMA,
      temperature: 0.2,
    });
  } catch (err) {
    return {
      source: "emailAgent",
      status: "error",
      reason: err.message,
      data: { checks },
    };
  }

  return {
    source: "emailAgent",
    status: "ok",
    data: { checks, reasoning },
  };
}

async function checkEmail(email, company) {
  const m = email.match(/@([^\s>@,]+)/);
  if (!m) return { email, domain: null, error: "unparseable" };

  const domain = m[1].toLowerCase().trim();
  const isFreemail = FREE_MAIL.has(domain);
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);
  const isLookalike = company ? looksLike(domain, company) : false;

  let mxRecords = null;
  let mxAvailable = false;
  let mxError = null;
  try {
    mxRecords = await dns.resolveMx(domain);
    mxAvailable = mxRecords.length > 0;
  } catch (err) {
    mxError = err.code || err.message;
  }

  // Only do WHOIS for non-freemail (free domains are well-known, no need)
  let whoisResult = null;
  if (!isFreemail && !isDisposable) {
    whoisResult = await whois.lookup(domain);
  }

  return {
    email,
    domain,
    isFreemail,
    isDisposable,
    isLookalike,
    mx: { available: mxAvailable, records: mxRecords?.map((r) => r.exchange) ?? [], error: mxError },
    whois: whoisResult?.status === "ok" ? whoisResult.data : (whoisResult ? { unavailable: true, reason: whoisResult.reason } : null),
  };
}

function looksLike(domain, company) {
  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!slug || slug.length < 3) return false;
  const root = domain.split(".")[0];
  if (root === slug) return false; // exact match = legit
  return root.includes(slug) || slug.includes(root);
}

function buildPrompt({ pre, checks }) {
  return [
    "Job context:",
    JSON.stringify({ company: pre.company, role: pre.role, recruiterName: pre.recruiterName }, null, 2),
    "",
    "Email checks:",
    JSON.stringify(checks, null, 2),
    "",
    "Assess whether these email addresses raise red flags.",
  ].join("\n");
}
