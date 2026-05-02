const KEY = process.env.PROXYCURL_API_KEY;
const ENDPOINT = "https://nubela.co/proxycurl/api/v2/linkedin";

export async function lookupProfile({ url }) {
  if (!url) return { source: "proxycurl", status: "error", reason: "no profile url" };
  if (!KEY) {
    return {
      source: "proxycurl",
      status: "unavailable",
      reason: "no PROXYCURL_API_KEY (set to enable LinkedIn profile lookup)",
    };
  }
  const u = `${ENDPOINT}?url=${encodeURIComponent(url)}&fallback_to_cache=on-error&use_cache=if-present`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  let res;
  try {
    res = await fetch(u, {
      headers: { Authorization: `Bearer ${KEY}` },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(t);
    return {
      source: "proxycurl",
      status: "unavailable",
      reason: err.name === "AbortError" ? "timeout" : err.message,
    };
  }
  clearTimeout(t);
  if (!res.ok) {
    return { source: "proxycurl", status: "error", reason: `HTTP ${res.status}` };
  }
  const profile = await res.json();
  return {
    source: "proxycurl",
    status: "ok",
    data: {
      fullName: profile.full_name,
      headline: profile.headline,
      occupation: profile.occupation,
      connections: profile.connections,
      country: profile.country,
      profilePicUrl: profile.profile_pic_url,
      experiences: (profile.experiences || []).slice(0, 4).map((e) => ({
        company: e.company,
        title: e.title,
        startsAt: e.starts_at?.year ?? null,
      })),
      profileCreatedYear: profile?.created_at?.year ?? null,
    },
  };
}
