const KEY = process.env.SERPAPI_KEY;
const ENDPOINT = "https://serpapi.com/search.json";

export async function reverseImage({ imageUrl }) {
  if (!imageUrl) return { source: "reverseImage", status: "error", reason: "no image url" };
  if (!KEY) {
    return {
      source: "reverseImage",
      status: "unavailable",
      reason: "no SERPAPI_KEY (set to enable reverse image search)",
    };
  }
  const u = `${ENDPOINT}?engine=google_reverse_image&image_url=${encodeURIComponent(imageUrl)}&api_key=${encodeURIComponent(KEY)}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  let res;
  try {
    res = await fetch(u, { signal: controller.signal });
  } catch (err) {
    clearTimeout(t);
    return {
      source: "reverseImage",
      status: "unavailable",
      reason: err.name === "AbortError" ? "timeout" : err.message,
    };
  }
  clearTimeout(t);
  if (!res.ok) {
    return { source: "reverseImage", status: "error", reason: `HTTP ${res.status}` };
  }
  const json = await res.json();
  const matches = (json.image_results || json.inline_images || []).slice(0, 6).map((m) => ({
    title: m.title,
    source: m.source ?? m.link,
    link: m.link,
  }));
  return {
    source: "reverseImage",
    status: "ok",
    data: {
      matchCount: matches.length,
      matches,
      stockPhotoSuspect: matches.some((m) =>
        /shutterstock|istock|gettyimages|adobe.stock|pexels|unsplash/i.test(`${m.source} ${m.link}`),
      ),
    },
  };
}
