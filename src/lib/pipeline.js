import { preprocess } from "./preprocess.js";
import { orchestrate } from "./orchestrator.js";
import * as scamDb from "./tools/scamDb.js";

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

  // More tools/agents wired in later phases.
  return tasks;
}

function summarize(signal) {
  if (!signal) return "";
  if (signal.status === "ok" && signal.source === "scamDb") {
    if (signal.data?.match) {
      return `match on ${signal.data.matchedOn?.join(", ")}`;
    }
    return "no match";
  }
  if (signal.status !== "ok") return signal.reason || signal.status;
  return "";
}
