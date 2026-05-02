import * as cheerio from "cheerio";

const TIMEOUT_MS = 6000;
const MAX_BYTES = 600_000;
const UA = "FlaggedAI/0.1 (+https://flagged.ai) job-scam-verifier";

export async function fetchAndExtract(url) {
  const target = normalize(url);
  if (!target) {
    return { source: "websiteFetch", status: "error", reason: "invalid url" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(target, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return {
      source: "websiteFetch",
      status: "unavailable",
      reason: err.name === "AbortError" ? "timeout" : err.message || "fetch failed",
    };
  }
  clearTimeout(timer);

  const headers = Object.fromEntries(res.headers);
  const cloudflare = !!headers.server?.toLowerCase().includes("cloudflare");

  if (!res.ok) {
    return {
      source: "websiteFetch",
      status: "unavailable",
      reason: `HTTP ${res.status}`,
      data: { url: target, cloudflare, status: res.status },
    };
  }

  const ct = (headers["content-type"] || "").toLowerCase();
  if (!ct.includes("html")) {
    return {
      source: "websiteFetch",
      status: "ok",
      data: { url: target, cloudflare, contentType: ct, title: null, description: null, careersHint: null, addressHint: null },
    };
  }

  const buf = await res.arrayBuffer();
  const limited = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
  const html = new TextDecoder("utf-8", { fatal: false }).decode(limited);

  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || null;
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    null;

  const links = $("a[href]")
    .toArray()
    .map((a) => ({
      href: $(a).attr("href"),
      text: $(a).text().trim().slice(0, 80),
    }))
    .filter((l) => l.href);

  const careersHint = links.find((l) => /career|job|hiring|recruit/i.test(l.text + " " + l.href)) || null;

  // Crude address detection: "PIN" / "Pin Code" / 6-digit Indian PIN.
  const bodyText = $("body").text().replace(/\s+/g, " ").slice(0, 5000);
  const pinMatch = bodyText.match(/\b\d{6}\b/);
  const addressHint = pinMatch ? bodyText.slice(Math.max(0, pinMatch.index - 80), pinMatch.index + 20) : null;

  return {
    source: "websiteFetch",
    status: "ok",
    data: {
      url: target,
      cloudflare,
      title,
      description: description?.slice(0, 400) ?? null,
      careersHint,
      addressHint,
      bodyExcerpt: bodyText.slice(0, 1500),
    },
  };
}

function normalize(u) {
  if (!u) return null;
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    return url.toString();
  } catch {
    return null;
  }
}

export function altTlds(host) {
  const m = host.match(/^([^.]+)(?:\.[^.]+)+$/);
  if (!m) return [];
  const root = m[1];
  return [`${root}.in`, `${root}.co.in`, `${root}.com`].filter(
    (h) => h !== host,
  );
}
