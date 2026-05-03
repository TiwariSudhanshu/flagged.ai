// GST lookup — two modes:
//   1. Paid API (Surepass / KnowYourGST / ClearTax) when GST_API_KEY + GST_API_URL are set
//   2. Free public GSTIN verification via gst.gov.in taxpayer API when a GSTIN is extractable
//      from the input text — no key needed.

const PAID_KEY = process.env.GST_API_KEY;
const PAID_URL = process.env.GST_API_URL;

// Regex: 15-char GSTIN format — 2-digit state + 10-char PAN + 1Z + 1 checksum
const GSTIN_RE = /\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1})\b/gi;

export async function lookup({ company, rawText }) {
  // 1. Try paid API first if configured
  if (PAID_KEY && PAID_URL) return paidLookup({ company });

  // 2. Extract GSTIN from text and hit the free government endpoint
  const gstin = extractGstin(rawText || company || "");
  if (gstin) return freeLookup(gstin);

  return {
    source: "gst",
    status: "manual",
    reason: "No GSTIN in posting",
    data: {
      manualUrl: `https://taxpayersearch.gst.gov.in/`,
      tip: "Legitimate companies often include GSTIN in formal offer letters. Ask the recruiter for it, then verify here.",
    },
  };
}

function extractGstin(text) {
  const matches = [...text.matchAll(GSTIN_RE)];
  return matches[0]?.[1]?.toUpperCase() ?? null;
}

// Free: gst.gov.in taxpayer search (public endpoint, no auth needed, returns basic info)
async function freeLookup(gstin) {
  const url = `https://services.gst.gov.in/services/api/search/taxpayerDetails?gstin=${encodeURIComponent(gstin)}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 7000);
  let res;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      signal: controller.signal,
    });
  } catch {
    clearTimeout(t);
    return { source: "gst", status: "manual", reason: "GST portal unreachable", data: { manualUrl: "https://taxpayersearch.gst.gov.in/", gstin } };
  }
  clearTimeout(t);

  if (res.status === 404 || res.status === 400) {
    return { source: "gst", status: "ok", data: { found: false, gstin, provider: "gst.gov.in" } };
  }
  if (!res.ok) {
    return { source: "gst", status: "manual", reason: "GST portal unavailable", data: { manualUrl: "https://taxpayersearch.gst.gov.in/", gstin } };
  }

  let json;
  try { json = await res.json(); } catch {
    return { source: "gst", status: "manual", reason: "GST portal unavailable", data: { manualUrl: "https://taxpayersearch.gst.gov.in/", gstin } };
  }

  const d = json?.taxpayerInfo || json;
  return {
    source: "gst",
    status: "ok",
    data: {
      found: true,
      provider: "gst.gov.in",
      gstin,
      tradeName: d?.tradeNam || d?.tradeName || null,
      legalName: d?.lgnm || d?.legalName || null,
      status: d?.sts || d?.status || null,
      state: d?.stj || d?.state || null,
      registrationDate: d?.rgdt || null,
    },
  };
}

async function paidLookup({ company }) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);
  let res;
  try {
    res = await fetch(PAID_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAID_KEY}` },
      body: JSON.stringify({ company }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(t);
    return { source: "gst", status: "unavailable", reason: err.name === "AbortError" ? "timeout" : err.message };
  }
  clearTimeout(t);
  if (!res.ok) return { source: "gst", status: "error", reason: `HTTP ${res.status}` };
  const data = await res.json();
  return { source: "gst", status: "ok", data };
}
