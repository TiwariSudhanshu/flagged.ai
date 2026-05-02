import * as scamDb from "./tools/scamDb.js";
import * as gst from "./tools/gst.js";
import * as mca from "./tools/mca.js";
import * as domainAgent from "./agents/domain.js";
import * as linkedinAgent from "./agents/linkedin.js";
import * as emailAgent from "./agents/email.js";

// ── Agent Registry ─────────────────────────────────────────────────────────────
// Single source of truth for agent metadata. Used by the pipeline planner AND
// the /agents UI page.

export const REGISTRY = [
  {
    id: "scamDb",
    label: "Scam Database",
    category: "Database",
    description: "Cross-references phones, emails, UPI IDs, and domains against a crowd-sourced scam database stored in MongoDB.",
    triggerLabel: "Always",
    triggerDetail: "Runs on every analysis — cheap MongoDB lookup.",
    envVars: [],
    free: true,
  },
  {
    id: "domainAgent",
    label: "Domain & Website",
    category: "Domain",
    description: "Fetches the company website, checks WHOIS / RDAP domain age, and uses an LLM to assess whether the site looks legitimate.",
    triggerLabel: "URL or company present",
    triggerDetail: "Runs when a URL is found in the posting, or a company name was extracted.",
    envVars: [
      {
        key: "WHOIS_API_KEY",
        label: "WhoisXML API",
        required: false,
        fallback: "Free RDAP protocol used automatically (no key needed)",
      },
    ],
    free: true,
  },
  {
    id: "gst",
    label: "GST Registry",
    category: "Company",
    description: "Verifies GST registration. Extracts GSTIN from the posting text and checks it against gst.gov.in for free. With a paid key, also does company-name lookup.",
    triggerLabel: "Company or GSTIN present",
    triggerDetail: "Runs when a company name is extracted or a 15-char GSTIN is found in the text.",
    envVars: [
      {
        key: "GST_API_KEY",
        label: "GST API (Surepass / KnowYourGST)",
        required: false,
        fallback: "Free GSTIN extraction from text + gst.gov.in verification if absent",
      },
    ],
    free: true,
  },
  {
    id: "mca",
    label: "MCA Registry",
    category: "Company",
    description: "Looks up company incorporation date, CIN, and status via OpenCorporates (free, 500 req/month) with Probe42 as a fallback.",
    triggerLabel: "Company name present",
    triggerDetail: "Runs when a company name was extracted from the posting.",
    envVars: [
      {
        key: "PROBE42_API_KEY",
        label: "Probe42",
        required: false,
        fallback: "OpenCorporates free tier used automatically (no key needed)",
      },
    ],
    free: true,
  },
  {
    id: "linkedinAgent",
    label: "Recruiter / LinkedIn",
    category: "Contact",
    description: "Assesses recruiter plausibility. Checks email domain vs company, LinkedIn profile age and connections, and reverse-image-searches the profile photo for stock/AI images.",
    triggerLabel: "Recruiter name, LinkedIn URL, or email present",
    triggerDetail: "Runs when a recruiter name, LinkedIn profile URL, or any email address is found.",
    envVars: [
      {
        key: "SCRAPIN_API_KEY",
        label: "Scrapin.io (LinkedIn scraper)",
        required: false,
        fallback: "Email domain analysis runs for free; LinkedIn profile skipped if absent",
      },
    ],
    free: true,
  },
  {
    id: "emailAgent",
    label: "Email Check",
    category: "Contact",
    description: "Checks every email address for freemail providers, disposable/throwaway domains, missing MX records, and lookalike corporate domains.",
    triggerLabel: "Email address present",
    triggerDetail: "Runs when one or more email addresses are found in the posting.",
    envVars: [],
    free: true,
  },
];

// ── Planner ────────────────────────────────────────────────────────────────────
// Returns tasks the pipeline should run for this specific `pre` object.
// Each task: { name, run: () => Promise<Signal>, reason }

export function plan(pre) {
  const tasks = [];
  const hasLinkedinUrl = (pre.urls ?? []).some((u) => /linkedin\.com/i.test(u));

  for (const agent of REGISTRY) {
    const task = makeTask(agent.id, pre);
    if (!task) continue;
    const reason = triggerReason(agent.id, pre, hasLinkedinUrl);
    tasks.push({ name: agent.id, run: task, reason });
  }

  return tasks;
}

function makeTask(id, pre) {
  const hasLinkedinUrl = (pre.urls ?? []).some((u) => /linkedin\.com/i.test(u));

  switch (id) {
    case "scamDb":
      return () => scamDb.lookup(pre);

    case "domainAgent":
      if ((pre.urls?.length ?? 0) > 0 || pre.company) {
        return () => domainAgent.analyze(pre);
      }
      return null;

    case "gst":
      if (pre.company || pre.rawSummary) {
        return () => gst.lookup({ company: pre.company, rawText: pre.rawSummary });
      }
      return null;

    case "mca":
      if (pre.company) return () => mca.lookup({ company: pre.company });
      return null;

    case "linkedinAgent":
      if (pre.recruiterName || hasLinkedinUrl || (pre.contacts?.emails?.length ?? 0) > 0) {
        return () => linkedinAgent.analyze(pre);
      }
      return null;

    case "emailAgent":
      if ((pre.contacts?.emails?.length ?? 0) > 0) {
        return () => emailAgent.analyze(pre);
      }
      return null;

    default:
      return null;
  }
}

function triggerReason(id, pre, hasLinkedinUrl) {
  switch (id) {
    case "scamDb":        return "always runs";
    case "domainAgent":   return pre.urls?.length ? `${pre.urls.length} URL(s) found` : `company "${pre.company}"`;
    case "gst":           return pre.company ? `company "${pre.company}"` : "GSTIN detected in text";
    case "mca":           return `company "${pre.company}"`;
    case "linkedinAgent": {
      const parts = [];
      if (pre.recruiterName) parts.push(`recruiter "${pre.recruiterName}"`);
      if (hasLinkedinUrl) parts.push("LinkedIn URL");
      if (pre.contacts?.emails?.length) parts.push(`${pre.contacts.emails.length} email(s)`);
      return parts.join(", ");
    }
    case "emailAgent":
      return `${pre.contacts.emails.length} email(s): ${pre.contacts.emails.slice(0, 2).join(", ")}`;
    default:
      return "";
  }
}
