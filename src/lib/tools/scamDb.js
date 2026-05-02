import { tryGetDb } from "../mongo.js";

function domainsFromUrls(urls = []) {
  const out = [];
  for (const u of urls) {
    try {
      const url = new URL(u.startsWith("http") ? u : `https://${u}`);
      out.push(url.hostname.replace(/^www\./, ""));
    } catch {
      // ignore malformed
    }
  }
  return out;
}

export async function lookup(pre) {
  const db = await tryGetDb();
  if (!db) {
    return { source: "scamDb", status: "unavailable", reason: "mongo not reachable" };
  }
  const col = db.collection("scams");
  const phones = pre.contacts?.phones ?? [];
  const emails = (pre.contacts?.emails ?? []).map((e) => e.toLowerCase());
  const upis = pre.contacts?.upis ?? [];
  const domains = domainsFromUrls(pre.urls ?? []);

  const ors = [];
  if (phones.length) ors.push({ phones: { $in: phones } });
  if (emails.length) ors.push({ emails: { $in: emails } });
  if (upis.length) ors.push({ upis: { $in: upis } });
  if (domains.length) ors.push({ domains: { $in: domains } });
  if (pre.company) {
    ors.push({ company: { $regex: escapeRegex(pre.company), $options: "i" } });
  }

  if (!ors.length) {
    return {
      source: "scamDb",
      status: "ok",
      data: { match: false, reason: "no identifiers to search" },
    };
  }

  const hit = await col.findOne({ $or: ors });
  if (!hit) {
    return { source: "scamDb", status: "ok", data: { match: false } };
  }
  return {
    source: "scamDb",
    status: "ok",
    data: {
      match: true,
      matchedOn: matchedFields(hit, { phones, emails, upis, domains, company: pre.company }),
      record: {
        company: hit.company,
        source: hit.source,
        notes: hit.notes,
        reportedAt: hit.reportedAt,
      },
    },
  };
}

function matchedFields(hit, q) {
  const reasons = [];
  if (q.phones.some((p) => hit.phones?.includes(p))) reasons.push("phone");
  if (q.emails.some((e) => hit.emails?.map((x) => x.toLowerCase()).includes(e))) reasons.push("email");
  if (q.upis.some((u) => hit.upis?.includes(u))) reasons.push("upi");
  if (q.domains.some((d) => hit.domains?.includes(d))) reasons.push("domain");
  if (q.company && hit.company?.toLowerCase().includes(q.company.toLowerCase())) {
    reasons.push("company-name");
  }
  return reasons;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
