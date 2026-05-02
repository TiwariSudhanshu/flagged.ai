"use client";

import { useState, useRef } from "react";
import VerdictCard from "./VerdictCard";
import SignalRow from "./SignalRow";

export default function Chat() {
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  async function analyze() {
    if (!input.trim() || running) return;
    setRunning(true);
    setEvents([]);
    setVerdict(null);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            if (ev.type === "verdict") setVerdict(ev.verdict);
            else if (ev.type === "error") setError(ev.message);
            else setEvents((prev) => [...prev, ev]);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setInput("");
    setEvents([]);
    setVerdict(null);
    setError(null);
  }

  const signalEvents = events.filter(
    (e) => e.type === "agent_done" || e.type === "agent_skipped",
  );
  const inProgress = events
    .filter((e) => e.type === "agent_start")
    .map((e) => e.name)
    .filter(
      (name) =>
        !signalEvents.some((s) => s.name === name),
    );

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 px-4 py-8 sm:py-16">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          <span className="text-xs uppercase tracking-widest text-zinc-500">
            Flagged AI
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
          The agent between a scam job and its victim.
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
          Paste a suspicious job message, a recruiter URL, or describe the offer.
          We&apos;ll score it 0–100 and tell you exactly what&apos;s wrong.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste the WhatsApp message, the offer letter text, the LinkedIn URL, or the recruiter's pitch…"
          className="w-full min-h-32 resize-y bg-transparent outline-none text-sm leading-6 placeholder:text-zinc-400"
          disabled={running}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">
            {input.length} chars · runs ~6 checks in parallel
          </span>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="text-sm px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Reset
            </button>
            <button
              onClick={analyze}
              disabled={!input.trim() || running}
              className="text-sm px-4 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black disabled:opacity-40"
            >
              {running ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </div>
      </div>

      {(events.length > 0 || verdict || error) && (
        <section className="flex flex-col gap-3">
          {events.find((e) => e.type === "preprocess") && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-sm">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                Extracted
              </div>
              <PreprocessSummary
                data={events.find((e) => e.type === "preprocess").data}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {signalEvents.map((e, i) => (
              <SignalRow
                key={`${e.name}-${i}`}
                name={e.name}
                status={e.signal?.status ?? "ok"}
                summary={e.summary}
              />
            ))}
            {inProgress.map((name) => (
              <SignalRow key={`pending-${name}`} name={name} status="running" />
            ))}
          </div>

          {verdict && <VerdictCard verdict={verdict} />}

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-900 text-red-800 dark:text-red-200 px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function PreprocessSummary({ data }) {
  if (!data) return null;
  const rows = [
    ["Intent", data.userIntent],
    ["Company", data.company],
    ["Role", data.role],
    ["Salary claimed", data.salaryClaimed],
    ["Recruiter", data.recruiterName],
    ["Payment ask", data.paymentAsk ? `Yes${data.paymentAmount ? ` (${data.paymentAmount})` : ""}` : "No"],
    ["URLs", data.urls?.join(", ")],
    ["Phones", data.contacts?.phones?.join(", ")],
    ["Red flags", data.redFlagPhrases?.join(" · ")],
  ].filter(([, v]) => v && (Array.isArray(v) ? v.length : true));
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
      {rows.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="text-zinc-500">{k}</dt>
          <dd className="text-zinc-900 dark:text-zinc-100">{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function Fragment({ children }) {
  return <>{children}</>;
}
