import { fetchAndExtract, altTlds } from "../tools/websiteFetch.js";
import * as whois from "../tools/whois.js";
import { generateJson, FAST_MODEL } from "../gemini.js";

const SYSTEM = `You are the Website + Domain agent of Flagged AI. You receive (a) the suspicious job posting context, and (b) WHOIS + scraped website content for the company's apparent domain.

Decide whether the domain and website are consistent with a legitimate Indian employer. Specifically reason about:
- Does the website actually exist and look like a corporate site, or is it a thin landing page?
- Does it list a careers / jobs page? Does it mention the role being offered?
- Does the domain match the company name? (acme.com for "Acme Corp" yes; acme-careers-2026.in is suspicious.)
- Domain age: under 60 days for a "well-known" company is a red flag, under 14 days is a major red flag.
- If the site is unreachable or Cloudflare-blocked: that's a soft negative signal, not a fail. Note it.

Return strict JSON.`;

const SCHEMA = {
  type: "object",
  properties: {
    domainConsistent: { type: "boolean" },
    careersFound: { type: "boolean" },
    redFlags: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
  },
  required: ["domainConsistent", "careersFound", "redFlags", "notes"],
};

export async function analyze(pre) {
  const candidates = pickCandidates(pre);
  if (candidates.length === 0) {
    return {
      source: "domainAgent",
      status: "skipped",
      reason: "no domain or company to investigate",
    };
  }

  const tried = [];
  let fetched = null;
  for (const candidate of candidates) {
    const result = await fetchAndExtract(candidate);
    tried.push({ url: candidate, status: result.status, reason: result.reason });
    if (result.status === "ok") {
      fetched = result;
      break;
    }
    // alt-TLD fallback if the bare host failed
    try {
      const host = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`).hostname;
      for (const alt of altTlds(host)) {
        const altResult = await fetchAndExtract(`https://${alt}`);
        tried.push({ url: alt, status: altResult.status, reason: altResult.reason });
        if (altResult.status === "ok") {
          fetched = altResult;
          break;
        }
      }
    } catch {
      // ignore url parse errors
    }
    if (fetched) break;
  }

  const primaryDomain = fetched?.data?.url
    ? new URL(fetched.data.url).hostname.replace(/^www\./, "")
    : (() => {
        try {
          return new URL(candidates[0].startsWith("http") ? candidates[0] : `https://${candidates[0]}`).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })();

  const whoisResult = primaryDomain ? await whois.lookup(primaryDomain) : null;

  // If both WHOIS and fetch are unavailable, just report what we tried.
  if (!fetched && (!whoisResult || whoisResult.status !== "ok")) {
    return {
      source: "domainAgent",
      status: "unavailable",
      reason: "site unreachable and WHOIS unavailable",
      data: { tried, whois: whoisResult },
    };
  }

  // Reason with Gemini over what we have.
  let reasoning = null;
  try {
    reasoning = await generateJson({
      model: FAST_MODEL,
      system: SYSTEM,
      prompt: buildPrompt({ pre, fetched, whoisResult, tried }),
      schema: SCHEMA,
      temperature: 0.2,
    });
  } catch (err) {
    return {
      source: "domainAgent",
      status: "error",
      reason: err.message,
      data: { tried, whois: whoisResult, fetched: !!fetched },
    };
  }

  return {
    source: "domainAgent",
    status: "ok",
    data: {
      domain: primaryDomain,
      tried,
      reachable: !!fetched,
      cloudflare: fetched?.data?.cloudflare ?? null,
      title: fetched?.data?.title ?? null,
      description: fetched?.data?.description ?? null,
      careersHint: fetched?.data?.careersHint ?? null,
      addressHint: fetched?.data?.addressHint ?? null,
      whois: whoisResult?.status === "ok" ? whoisResult.data : { unavailable: true, reason: whoisResult?.reason },
      reasoning,
    },
  };
}

function pickCandidates(pre) {
  const out = new Set();
  for (const u of pre.urls ?? []) {
    try {
      const url = new URL(u.startsWith("http") ? u : `https://${u}`);
      out.add(`https://${url.hostname.replace(/^www\./, "")}`);
    } catch {}
  }
  if (pre.contacts?.emails?.length) {
    for (const e of pre.contacts.emails) {
      const m = e.match(/@([^\s>]+)/);
      if (m) {
        const domain = m[1].toLowerCase();
        if (!isFreeMail(domain)) out.add(`https://${domain}`);
      }
    }
  }
  if (pre.company && out.size === 0) {
    const slug = pre.company.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (slug) {
      out.add(`https://${slug}.com`);
      out.add(`https://${slug}.in`);
    }
  }
  return Array.from(out).slice(0, 4);
}

function isFreeMail(domain) {
  return /^(gmail|yahoo|outlook|hotmail|protonmail|icloud|live|rediffmail|aol)\./.test(domain);
}

function buildPrompt({ pre, fetched, whoisResult, tried }) {
  return [
    "Job posting fact sheet:",
    JSON.stringify(
      { company: pre.company, role: pre.role, urls: pre.urls, recruiterName: pre.recruiterName, contacts: pre.contacts },
      null,
      2,
    ),
    "",
    "Domains tried:",
    JSON.stringify(tried, null, 2),
    "",
    "Site fetched:",
    fetched
      ? JSON.stringify(
          {
            url: fetched.data.url,
            cloudflare: fetched.data.cloudflare,
            title: fetched.data.title,
            description: fetched.data.description,
            careersHint: fetched.data.careersHint,
            addressHint: fetched.data.addressHint,
            bodyExcerpt: fetched.data.bodyExcerpt,
          },
          null,
          2,
        )
      : "(none reachable)",
    "",
    "WHOIS:",
    whoisResult ? JSON.stringify(whoisResult, null, 2) : "(no WHOIS attempted)",
    "",
    "Decide.",
  ].join("\n");
}
