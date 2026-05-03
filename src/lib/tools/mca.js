// Primary: OpenCorporates free tier (no key needed, 500 req/month)
// Fallback: Probe42 if PROBE42_API_KEY is set (kept for compatibility)
const PROBE42_KEY = process.env.PROBE42_API_KEY;

export async function lookup({ company }) {
  if (!company) return { source: "mca", status: "error", reason: "no company name" };

  // Try OpenCorporates first — no key needed
  const oc = await openCorporates(company);
  if (oc.status === "ok" || oc.status === "error" || oc.status === "manual") return oc;

  // OpenCorporates unavailable → try Probe42 if key is present
  if (PROBE42_KEY) return probe42(company);

  return {
    source: "mca",
    status: "manual",
    reason: "Automated lookup unavailable",
    data: { manualUrl: `https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do` },
  };
}

async function openCorporates(company) {
  const u = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(company)}&jurisdiction_code=in&per_page=3`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 7000);
  let res;
  try {
    res = await fetch(u, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch {
    clearTimeout(t);
    return { source: "mca", status: "manual", reason: "Automated lookup unavailable", data: { manualUrl: "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do" } };
  }
  clearTimeout(t);

  if (res.status === 429 || !res.ok) {
    return { source: "mca", status: "manual", reason: "Automated lookup unavailable", data: { manualUrl: "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do" } };
  }

  const json = await res.json();
  const results = json?.results?.companies ?? [];
  if (!results.length) {
    return { source: "mca", status: "ok", data: { found: false, provider: "opencorporates" } };
  }

  const first = results[0].company;
  const dateOfIncorporation = first.incorporation_date ?? null;
  const ageDays = dateOfIncorporation
    ? Math.floor((Date.now() - new Date(dateOfIncorporation).getTime()) / 86_400_000)
    : null;

  return {
    source: "mca",
    status: "ok",
    data: {
      found: true,
      provider: "opencorporates",
      cin: first.company_number ?? null,
      name: first.name ?? null,
      status: first.current_status ?? null,
      dateOfIncorporation,
      ageDays,
      paidUpCapital: null, // not in OpenCorporates free tier
      address: first.registered_address_in_full ?? null,
      jurisdictionCode: first.jurisdiction_code ?? null,
      ocUrl: first.opencorporates_url ?? null,
    },
  };
}

async function probe42(company) {
  const ENDPOINT = process.env.PROBE42_API_URL || "https://api.probe42.in/probe_42/companies/search";
  const u = `${ENDPOINT}?q=${encodeURIComponent(company)}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);
  let res;
  try {
    res = await fetch(u, {
      headers: { "x-api-key": PROBE42_KEY, "x-api-version": "1.3" },
      signal: controller.signal,
    });
  } catch {
    clearTimeout(t);
    return { source: "mca", status: "manual", reason: "Automated lookup unavailable", data: { manualUrl: "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do" } };
  }
  clearTimeout(t);
  if (!res.ok) return { source: "mca", status: "error", reason: `Probe42 HTTP ${res.status}` };

  const json = await res.json();
  const first = json?.data?.[0] || json?.[0] || null;
  if (!first) return { source: "mca", status: "ok", data: { found: false, provider: "probe42" } };

  const dateOfIncorporation = first.date_of_incorporation || first.dateOfIncorporation || null;
  const ageDays = dateOfIncorporation
    ? Math.floor((Date.now() - new Date(dateOfIncorporation).getTime()) / 86_400_000)
    : null;

  return {
    source: "mca",
    status: "ok",
    data: {
      found: true,
      provider: "probe42",
      cin: first.cin || null,
      name: first.name || first.company_name || null,
      status: first.status || first.company_status || null,
      dateOfIncorporation,
      ageDays,
      paidUpCapital: first.paid_up_capital ?? first.paidUpCapital ?? null,
      address: first.registered_address || null,
    },
  };
}
