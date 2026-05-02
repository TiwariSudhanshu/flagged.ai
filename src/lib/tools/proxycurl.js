// Primary: Scrapin.io — 50 free credits/month, instant signup at scrapin.io
// Fallback: ProxyCurl if PROXYCURL_API_KEY is set (kept for compatibility)
const SCRAPIN_KEY = process.env.SCRAPIN_API_KEY;
const PROXYCURL_KEY = process.env.PROXYCURL_API_KEY;

export async function lookupProfile({ url }) {
  if (!url) return { source: "proxycurl", status: "error", reason: "no profile url" };

  if (SCRAPIN_KEY) return scrapin(url);
  if (PROXYCURL_KEY) return proxycurl(url);

  return {
    source: "proxycurl",
    status: "unavailable",
    reason: "no LinkedIn key — set SCRAPIN_API_KEY (scrapin.io, 50 free/month) or PROXYCURL_API_KEY",
  };
}

async function scrapin(profileUrl) {
  // Scrapin.io LinkedIn Profile endpoint
  const u = `https://api.scrapin.io/enrichment/profile?apikey=${encodeURIComponent(SCRAPIN_KEY)}&linkedInUrl=${encodeURIComponent(profileUrl)}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  let res;
  try {
    res = await fetch(u, { signal: controller.signal });
  } catch (err) {
    clearTimeout(t);
    return { source: "proxycurl", status: "unavailable", reason: err.name === "AbortError" ? "timeout" : err.message };
  }
  clearTimeout(t);

  if (res.status === 402 || res.status === 429) {
    return { source: "proxycurl", status: "unavailable", reason: "Scrapin.io credits exhausted" };
  }
  if (!res.ok) {
    return { source: "proxycurl", status: "error", reason: `Scrapin HTTP ${res.status}` };
  }

  const p = await res.json();
  // Scrapin returns: person.firstName, person.lastName, person.headline,
  // person.connections, person.photoUrl, person.positions.positionHistory
  const person = p?.person ?? p;
  return {
    source: "proxycurl",
    status: "ok",
    provider: "scrapin",
    data: {
      fullName: [person.firstName, person.lastName].filter(Boolean).join(" ") || person.fullName || null,
      headline: person.headline ?? null,
      occupation: person.occupation ?? person.headline ?? null,
      connections: person.connections ?? person.connectionsCount ?? null,
      country: person.location ?? person.geo?.country ?? null,
      profilePicUrl: person.photoUrl ?? person.photo ?? null,
      experiences: (person.positions?.positionHistory ?? person.experience ?? [])
        .slice(0, 4)
        .map((e) => ({
          company: e.companyName ?? e.company ?? null,
          title: e.title ?? null,
          startsAt: e.startEndDate?.start?.year ?? e.startedOn?.year ?? null,
        })),
      profileCreatedYear: null, // not exposed by Scrapin
    },
  };
}

async function proxycurl(profileUrl) {
  const u = `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(profileUrl)}&fallback_to_cache=on-error&use_cache=if-present`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  let res;
  try {
    res = await fetch(u, {
      headers: { Authorization: `Bearer ${PROXYCURL_KEY}` },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(t);
    return { source: "proxycurl", status: "unavailable", reason: err.name === "AbortError" ? "timeout" : err.message };
  }
  clearTimeout(t);
  if (!res.ok) return { source: "proxycurl", status: "error", reason: `ProxyCurl HTTP ${res.status}` };

  const profile = await res.json();
  return {
    source: "proxycurl",
    status: "ok",
    provider: "proxycurl",
    data: {
      fullName: profile.full_name ?? null,
      headline: profile.headline ?? null,
      occupation: profile.occupation ?? null,
      connections: profile.connections ?? null,
      country: profile.country ?? null,
      profilePicUrl: profile.profile_pic_url ?? null,
      experiences: (profile.experiences ?? []).slice(0, 4).map((e) => ({
        company: e.company ?? null,
        title: e.title ?? null,
        startsAt: e.starts_at?.year ?? null,
      })),
      profileCreatedYear: profile?.created_at?.year ?? null,
    },
  };
}
