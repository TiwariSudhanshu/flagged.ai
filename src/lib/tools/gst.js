// gst.gov.in does not expose a CORS-friendly public endpoint. Treat this as a
// stub for the hackathon: when GST_API_KEY (a 3rd-party GST verification API
// like Surepass / KnowYourGST / ClearTax) is present, we hit it; otherwise
// we return "unavailable" so the orchestrator factors that in.

const KEY = process.env.GST_API_KEY;
const ENDPOINT = process.env.GST_API_URL;

export async function lookup({ company, gstin }) {
  if (!KEY || !ENDPOINT) {
    return {
      source: "gst",
      status: "unavailable",
      reason: "no GST_API_KEY/GST_API_URL (free option: gst.gov.in has CAPTCHA, plug in Surepass/KnowYourGST trial)",
    };
  }
  const body = gstin ? { gstin } : { company };
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(t);
    return {
      source: "gst",
      status: "unavailable",
      reason: err.name === "AbortError" ? "timeout" : err.message,
    };
  }
  clearTimeout(t);
  if (!res.ok) {
    return { source: "gst", status: "error", reason: `HTTP ${res.status}` };
  }
  const data = await res.json();
  return { source: "gst", status: "ok", data };
}
