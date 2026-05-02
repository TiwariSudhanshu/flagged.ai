import { preprocess } from "./preprocess.js";
import { orchestrate } from "./orchestrator.js";
import { draft as draftRecovery } from "./recovery.js";
import * as scamDb from "./tools/scamDb.js";
import * as gst from "./tools/gst.js";
import * as mca from "./tools/mca.js";
import * as domainAgent from "./agents/domain.js";
import * as linkedinAgent from "./agents/linkedin.js";

export async function run(input, { onEvent } = {}) {
  const emit = (e) => onEvent?.(e);

  console.log("[Pipeline] Starting analysis…");
  console.log("[Pipeline] Input length:", input.length);

  // 1. Preprocess
  console.log("[Pipeline] Step 1: Preprocessing with Gemini…");
  const pre = await preprocess(input);
  console.log("[Pipeline] Preprocess done:", { company: pre.company, role: pre.role, intent: pre.userIntent, paymentAsk: pre.paymentAsk });
  emit({ type: "preprocess", data: pre });

  // 2. Recovery branch — short-circuit detection, draft complaint
  if (pre.userIntent === "recovery") {
    console.log("[Pipeline] Recovery mode detected — drafting complaint…");
    emit({ type: "recovery_start" });
    const recovery = await draftRecovery(pre);
    console.log("[Pipeline] Recovery draft complete");
    emit({ type: "recovery", recovery });
    return { pre, signals: [], recovery };
  }

  // 3. Plan + run signal tasks in parallel
  const tasks = planTasks(pre);
  console.log("[Pipeline] Step 2: Running", tasks.length, "signal tasks:", tasks.map((t) => t.name).join(", "));
  const signals = await Promise.all(
    tasks.map(async ({ name, run: runTask }) => {
      emit({ type: "agent_start", name });
      try {
        const result = await runTask();
        console.log(`[Pipeline] ✓ ${name}:`, result?.status, summarize(result)?.slice(0, 80));
        emit({ type: "agent_done", name, signal: result, summary: summarize(result) });
        return result;
      } catch (err) {
        console.error(`[Pipeline] ✗ ${name} error:`, err?.message?.slice(0, 200) || err);
        const fail = { source: name, status: "error", reason: String(err?.message || err) };
        emit({ type: "agent_done", name, signal: fail, summary: fail.reason });
        return fail;
      }
    }),
  );

  // 4. Orchestrate
  console.log("[Pipeline] Step 3: Orchestrating final verdict with Gemini…");
  const verdict = await orchestrate({ pre, signals });
  console.log("[Pipeline] ✓ Verdict:", verdict.verdict, "score:", verdict.score);
  emit({ type: "verdict", verdict });

  return { pre, signals, verdict };
}

function planTasks(pre) {
  const tasks = [];

  // Scam DB always runs — it's a cheap Mongo lookup.
  tasks.push({ name: "scamDb", run: () => scamDb.lookup(pre) });

  // Domain + website agent — only if we have a URL or company name to work with.
  if ((pre.urls?.length ?? 0) > 0 || pre.company) {
    tasks.push({ name: "domainAgent", run: () => domainAgent.analyze(pre) });
  }

  // GST registry — only meaningful when a company name is present.
  if (pre.company) {
    tasks.push({ name: "gst", run: () => gst.lookup({ company: pre.company }) });
    tasks.push({ name: "mca", run: () => mca.lookup({ company: pre.company }) });
  }

  // LinkedIn agent — fires if we have any recruiter signal at all.
  const hasLinkedinUrl = (pre.urls ?? []).some((u) => /linkedin\.com/i.test(u));
  if (pre.recruiterName || hasLinkedinUrl || (pre.contacts?.emails?.length ?? 0) > 0) {
    tasks.push({ name: "linkedinAgent", run: () => linkedinAgent.analyze(pre) });
  }

  return tasks;
}

function summarize(signal) {
  if (!signal) return "";
  if (signal.status !== "ok") return signal.reason || signal.status;
  switch (signal.source) {
    case "scamDb":
      return signal.data?.match
        ? `match on ${signal.data.matchedOn?.join(", ")}`
        : "no match";
    case "domainAgent": {
      const d = signal.data || {};
      const parts = [];
      if (d.domain) parts.push(d.domain);
      if (d.whois?.ageDays != null) parts.push(`age ${d.whois.ageDays}d`);
      if (!d.reachable) parts.push("unreachable");
      else if (d.reasoning?.careersFound === false) parts.push("no careers page");
      return parts.join(" · ");
    }
    case "gst":
      return signal.data?.gstin || "checked";
    case "mca": {
      const d = signal.data || {};
      if (!d.found) return "no MCA record";
      const parts = [];
      if (d.cin) parts.push(d.cin);
      if (d.ageDays != null) parts.push(`age ${d.ageDays}d`);
      if (d.status) parts.push(d.status);
      return parts.join(" · ");
    }
    case "linkedinAgent": {
      const d = signal.data || {};
      if (d.reasoning?.plausibleRecruiter === false) return "implausible recruiter";
      if (d.reasoning?.plausibleRecruiter) return "recruiter looks ok";
      return "checked";
    }
    default:
      return "";
  }
}
