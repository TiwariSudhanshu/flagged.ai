const KEY = process.env.WHOIS_API_KEY;
const ENDPOINT = "https://www.whoisxmlapi.com/whoisserver/WhoisService";

export async function lookup(domain) {
  if (!domain) {
    return { source: "whois", status: "error", reason: "no domain" };
  }
  if (!KEY) {
    return { source: "whois", status: "unavailable", reason: "no WHOIS_API_KEY (set to enable real WHOIS)" };
  }

  const url = `${ENDPOINT}?apiKey=${encodeURIComponent(KEY)}&domainName=${encodeURIComponent(domain)}&outputFormat=JSON`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(t);
    return {
      source: "whois",
      status: "unavailable",
      reason: err.name === "AbortError" ? "timeout" : err.message,
    };
  }
  clearTimeout(t);

  if (!res.ok) {
    return { source: "whois", status: "error", reason: `HTTP ${res.status}` };
  }
  const json = await res.json();
  const rec = json?.WhoisRecord;
  if (!rec) {
    return { source: "whois", status: "ok", data: { domain, found: false } };
  }
  const created =
    rec.createdDate ||
    rec.registryData?.createdDate ||
    null;
  const ageDays = created ? Math.floor((Date.now() - new Date(created).getTime()) / 86_400_000) : null;
  return {
    source: "whois",
    status: "ok",
    data: {
      domain,
      found: true,
      createdDate: created,
      ageDays,
      registrar: rec.registrarName || rec.registryData?.registrarName || null,
      country: rec.registrant?.country || null,
    },
  };
}
