import { preprocess } from "./preprocess.js";
import { orchestrate } from "./orchestrator.js";
import { draft as draftRecovery } from "./recovery.js";
import { plan } from "./planner.js";

export async function run(input, { onEvent } = {}) {
  const emit = (e) => onEvent?.(e);

  console.log("[Pipeline] Starting analysis…");
  console.log("[Pipeline] Input length:", input.length);

  // 1. Preprocess
  console.log("[Pipeline] Step 1: Preprocessing…");
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

  // 3. Agent selection — planner decides which agents are relevant
  const tasks = plan(pre);
  console.log("[Pipeline] Step 2: Selected", tasks.length, "agents:", tasks.map((t) => `${t.name}(${t.reason})`).join(", "));
  emit({ type: "plan", agents: tasks.map(({ name, reason }) => ({ name, reason })) });

  // 4. Run selected agents in parallel
  const signals = await Promise.all(
    tasks.map(async ({ name, run: runTask, reason }) => {
      emit({ type: "agent_start", name, reason });
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

  // 5. Orchestrate
  console.log("[Pipeline] Step 3: Orchestrating final verdict…");
  const verdict = await orchestrate({ pre, signals });
  console.log("[Pipeline] ✓ Verdict:", verdict.verdict, "score:", verdict.score);
  emit({ type: "verdict", verdict });

  return { pre, signals, verdict };
}

function summarize(signal) {
  if (!signal) return "";
  if (signal.status === "manual") {
    if (signal.source === "gst") return signal.data?.gstin ? `GSTIN ${signal.data.gstin} — verify at GST portal →` : "No GSTIN in posting — verify manually →";
    return "Verify manually at mca.gov.in →";
  }
  if (signal.status !== "ok") return signal.reason || signal.status;
  switch (signal.source) {
    case "scamDb":
      return signal.data?.match ? `match on ${signal.data.matchedOn?.join(", ")}` : "no match";
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
      return signal.data?.gstin || (signal.data?.found === false ? "not registered" : "checked");
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
    case "emailAgent": {
      const d = signal.data || {};
      const flags = d.reasoning?.redFlags ?? [];
      if (d.reasoning?.suspicious) return flags.length ? flags[0] : "suspicious";
      return flags.length ? flags[0] : "ok";
    }
    default:
      return "";
  }
}
