const KEY = process.env.PROBE42_API_KEY;
const ENDPOINT = process.env.PROBE42_API_URL || "https://api.probe42.in/probe_42/companies/search";

export async function lookup({ company }) {
  if (!company) return { source: "mca", status: "error", reason: "no company name" };
  if (!KEY) {
    return {
      source: "mca",
      status: "unavailable",
      reason: "no PROBE42_API_KEY (set to enable MCA registry lookup)",
    };
  }
  const u = `${ENDPOINT}?q=${encodeURIComponent(company)}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);
  let res;
  try {
    res = await fetch(u, {
      headers: { "x-api-key": KEY, "x-api-version": "1.3" },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(t);
    return {
      source: "mca",
      status: "unavailable",
      reason: err.name === "AbortError" ? "timeout" : err.message,
    };
  }
  clearTimeout(t);
  if (!res.ok) {
    return { source: "mca", status: "error", reason: `HTTP ${res.status}` };
  }
  const json = await res.json();
  const first = json?.data?.[0] || json?.[0] || null;
  if (!first) {
    return { source: "mca", status: "ok", data: { found: false } };
  }
  const dateOfIncorporation = first.date_of_incorporation || first.dateOfIncorporation || null;
  const ageDays = dateOfIncorporation
    ? Math.floor((Date.now() - new Date(dateOfIncorporation).getTime()) / 86_400_000)
    : null;
  return {
    source: "mca",
    status: "ok",
    data: {
      found: true,
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
