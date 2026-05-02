const KEY = process.env.WHOIS_API_KEY;
const WHOISXML_ENDPOINT = "https://www.whoisxmlapi.com/whoisserver/WhoisService";

export async function lookup(domain) {
  if (!domain) return { source: "whois", status: "error", reason: "no domain" };

  // Prefer WhoisXML if key is present (richer data), else fall back to free RDAP
  if (KEY) return whoisXml(domain);
  return rdap(domain);
}

async function whoisXml(domain) {
  const url = `${WHOISXML_ENDPOINT}?apiKey=${encodeURIComponent(KEY)}&domainName=${encodeURIComponent(domain)}&outputFormat=JSON`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(t);
    // Key present but request failed — fall back to RDAP silently
    return rdap(domain);
  }
  clearTimeout(t);
  if (!res.ok) return rdap(domain);

  const json = await res.json();
  const rec = json?.WhoisRecord;
  if (!rec) return { source: "whois", status: "ok", data: { domain, found: false } };

  const created = rec.createdDate || rec.registryData?.createdDate || null;
  const ageDays = created ? Math.floor((Date.now() - new Date(created).getTime()) / 86_400_000) : null;
  return {
    source: "whois",
    status: "ok",
    data: {
      domain,
      found: true,
      provider: "whoisxml",
      createdDate: created,
      ageDays,
      registrar: rec.registrarName || rec.registryData?.registrarName || null,
      country: rec.registrant?.country || null,
    },
  };
}

// Free RDAP lookup — no key needed, standard IETF protocol (RFC 9083)
async function rdap(domain) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);
  let res;
  try {
    res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: "application/rdap+json" },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(t);
    return { source: "whois", status: "unavailable", reason: err.name === "AbortError" ? "timeout" : err.message };
  }
  clearTimeout(t);

  if (res.status === 404) return { source: "whois", status: "ok", data: { domain, found: false, provider: "rdap" } };
  if (!res.ok) return { source: "whois", status: "unavailable", reason: `RDAP HTTP ${res.status}` };

  const json = await res.json();

  // Registration date is in the events array
  const regEvent = (json.events ?? []).find((e) => e.eventAction === "registration");
  const created = regEvent?.eventDate ?? null;
  const ageDays = created ? Math.floor((Date.now() - new Date(created).getTime()) / 86_400_000) : null;

  // Registrar is the first entity with role "registrar"
  const registrarEntity = (json.entities ?? []).find((e) => e.roles?.includes("registrar"));
  const registrar = registrarEntity?.vcardArray?.[1]?.find?.((f) => f[0] === "fn")?.[3] ?? null;

  return {
    source: "whois",
    status: "ok",
    data: {
      domain,
      found: true,
      provider: "rdap",
      createdDate: created,
      ageDays,
      registrar,
      country: null,
    },
  };
}
