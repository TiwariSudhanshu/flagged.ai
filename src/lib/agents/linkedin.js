import * as proxycurl from "../tools/proxycurl.js";
import * as reverseImage from "../tools/reverseImage.js";
import { generateJson, FAST_MODEL } from "../gemini.js";

const SYSTEM = `You are the LinkedIn + Recruiter agent of Flagged AI. You assess whether the recruiter contacting the candidate is plausibly real.

Reason about:
- Profile age vs claimed seniority (a "Senior TA at Infosys" with 50 connections and a 2-week-old account is a major red flag).
- Email domain: company-domain (foo@infosys.com) is positive; personal Gmail/Yahoo for a senior recruiter is a yellow flag; "lookalike" domains (infosys-careers.info) are red.
- Photo: stolen stock photo or AI-generated face is a major red flag. Reverse-image-search results — if matches point to stock photo sites — flag it.
- Claimed employer mismatch: profile says they work at a different company than the one in the offer.

If LinkedIn data is unavailable, fall back to email-domain analysis only and lower confidence.

Return strict JSON.`;

const SCHEMA = {
  type: "object",
  properties: {
    plausibleRecruiter: { type: "boolean" },
    redFlags: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
  },
  required: ["plausibleRecruiter", "redFlags", "notes"],
};

export async function analyze(pre) {
  const { recruiterName, contacts, urls, company } = pre;
  const linkedinUrl = (urls || []).find((u) => /linkedin\.com\/(in|pub)\//i.test(u));

  if (!recruiterName && !linkedinUrl && !(contacts?.emails?.length)) {
    return {
      source: "linkedinAgent",
      status: "skipped",
      reason: "no recruiter name, profile URL, or email to investigate",
    };
  }

  const profile = linkedinUrl
    ? await proxycurl.lookupProfile({ url: linkedinUrl })
    : { source: "proxycurl", status: "skipped", reason: "no LinkedIn URL provided" };

  let photoCheck = { source: "reverseImage", status: "skipped", reason: "no profile photo" };
  if (profile?.status === "ok" && profile.data?.profilePicUrl) {
    photoCheck = await reverseImage.reverseImage({ imageUrl: profile.data.profilePicUrl });
  }

  const emailDomainAnalysis = analyzeEmails(contacts?.emails ?? [], company);

  let reasoning = null;
  try {
    reasoning = await generateJson({
      model: FAST_MODEL,
      system: SYSTEM,
      prompt: buildPrompt({ pre, profile, photoCheck, emailDomainAnalysis }),
      schema: SCHEMA,
      temperature: 0.2,
    });
  } catch (err) {
    return {
      source: "linkedinAgent",
      status: "error",
      reason: err.message,
      data: { profile, photoCheck, emailDomainAnalysis },
    };
  }

  return {
    source: "linkedinAgent",
    status: "ok",
    data: {
      recruiterName: recruiterName ?? null,
      profile: profile?.status === "ok" ? profile.data : { unavailable: true, reason: profile?.reason },
      photoCheck: photoCheck?.status === "ok" ? photoCheck.data : { unavailable: true, reason: photoCheck?.reason },
      emailDomainAnalysis,
      reasoning,
    },
  };
}

function analyzeEmails(emails, company) {
  const out = [];
  for (const email of emails) {
    const m = email.match(/@([^\s>]+)/);
    if (!m) continue;
    const domain = m[1].toLowerCase();
    out.push({
      email,
      domain,
      isFreemail: /^(gmail|yahoo|outlook|hotmail|protonmail|icloud|live|rediffmail|aol)\./.test(domain),
      isLookalike: company ? looksLike(domain, company) : false,
    });
  }
  return out;
}

function looksLike(domain, company) {
  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!slug) return false;
  const root = domain.split(".")[0];
  if (root === slug) return false; // exact = legit
  // contains slug but isn't the canonical, e.g. "infosys-careers" or "infosys-bpo"
  return root.includes(slug) || slug.includes(root);
}

function buildPrompt({ pre, profile, photoCheck, emailDomainAnalysis }) {
  return [
    "Job context:",
    JSON.stringify(
      {
        company: pre.company,
        role: pre.role,
        recruiterName: pre.recruiterName,
        salaryClaimed: pre.salaryClaimed,
      },
      null,
      2,
    ),
    "",
    "LinkedIn profile lookup:",
    JSON.stringify(profile, null, 2),
    "",
    "Reverse image search on profile photo:",
    JSON.stringify(photoCheck, null, 2),
    "",
    "Email domain analysis:",
    JSON.stringify(emailDomainAnalysis, null, 2),
    "",
    "Decide.",
  ].join("\n");
}
