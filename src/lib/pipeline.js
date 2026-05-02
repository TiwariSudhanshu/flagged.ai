import { preprocess } from "./preprocess.js";
import { orchestrate } from "./orchestrator.js";
import * as scamDb from "./tools/scamDb.js";
import * as gst from "./tools/gst.js";
import * as domainAgent from "./agents/domain.js";

export async function run(input, { onEvent } = {}) {
  const emit = (e) => onEvent?.(e);

  // 1. Preprocess
  const pre = await preprocess(input);
  emit({ type: "preprocess", data: pre });

  // 2. Recovery branch — short-circuit
  if (pre.userIntent === "recovery") {
    return { pre, signals: [], recovery: true };
  }

  // 3. Plan + run signal tasks in parallel
  const tasks = planTasks(pre);
  const signals = await Promise.all(
    tasks.map(async ({ name, run: runTask }) => {
      emit({ type: "agent_start", name });
      try {
        const result = await runTask();
        emit({ type: "agent_done", name, signal: result, summary: summarize(result) });
        return result;
      } catch (err) {
        const fail = { source: name, status: "error", reason: String(err?.message || err) };
        emit({ type: "agent_done", name, signal: fail, summary: fail.reason });
        return fail;
      }
    }),
  );

  // 4. Orchestrate
  const verdict = await orchestrate({ pre, signals });
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
    default:
      return "";
  }
}
