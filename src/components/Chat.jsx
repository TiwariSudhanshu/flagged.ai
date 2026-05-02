"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import VerdictCard from "./VerdictCard";
import SignalRow from "./SignalRow";
import RecoveryCard from "./RecoveryCard";
import demoScenarios from "@/data/demo-scenarios.json";

let msgId = 0;
function uid() { return ++msgId; }

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const patchLast = useCallback((fn) => {
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = fn(next[next.length - 1]);
      return next;
    });
  }, []);

  async function submit() {
    const text = input.trim();
    if (!text || running) return;

    const userMsg = { id: uid(), role: "user", text };
    const aiMsg = { id: uid(), role: "assistant", events: [], verdict: null, recovery: null, error: null, done: false };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
    setRunning(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

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
            if (ev.type === "verdict") {
              patchLast((m) => ({ ...m, verdict: ev.verdict }));
            } else if (ev.type === "recovery") {
              patchLast((m) => ({ ...m, recovery: ev.recovery }));
            } else if (ev.type === "error") {
              patchLast((m) => ({ ...m, error: ev.message }));
            } else {
              patchLast((m) => ({ ...m, events: [...m.events, ev] }));
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        patchLast((m) => ({ ...m, error: err.message }));
      }
    } finally {
      patchLast((m) => ({ ...m, done: true }));
      setRunning(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setRunning(false);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#e4e4e7] shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
          <span className="font-semibold text-[15px] text-[#0d0d0d]">Flagged AI</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/agents"
            className="flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#0d0d0d] transition-colors px-2 py-1 rounded-lg hover:bg-[#f4f4f5]"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="2" y="2" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="8.5" y="2" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="2" y="8.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="8.5" y="8.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <span className="hidden sm:inline">Agents</span>
          </Link>
          {!isEmpty && (
            <button
              onClick={newChat}
              className="flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#0d0d0d] transition-colors px-2 py-1 rounded-lg hover:bg-[#f4f4f5]"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8 2.75a.75.75 0 0 0-1.5 0V7H2.75a.75.75 0 0 0 0 1.5H6.5v4.25a.75.75 0 0 0 1.5 0V8.5h4.25a.75.75 0 0 0 0-1.5H8V2.75Z" fill="currentColor"/></svg>
              New check
            </button>
          )}
        </div>
      </header>

      {/* Messages or empty state */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState
            onDemo={(text) => setInput(text)}
            running={running}
          />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserMessage key={msg.id} text={msg.text} />
              ) : (
                <AssistantMessage key={msg.id} msg={msg} />
              ),
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-[#e4e4e7] bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 rounded-2xl border border-[#e4e4e7] bg-white px-4 py-3 shadow-sm focus-within:border-[#a1a1aa] transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste a suspicious job offer, recruiter message, or LinkedIn URL…"
              rows={1}
              disabled={running}
              className="flex-1 resize-none bg-transparent text-sm leading-6 text-[#0d0d0d] placeholder:text-[#a1a1aa] outline-none disabled:opacity-50 min-h-[24px] max-h-[160px] overflow-y-auto"
              style={{ height: "auto" }}
            />
            <button
              onClick={submit}
              disabled={!input.trim() || running}
              className="shrink-0 h-8 w-8 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center disabled:opacity-30 hover:bg-[#3f3f46] transition-colors"
              aria-label="Send"
            >
              {running ? (
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5v11M7 1.5L3 5.5M7 1.5l4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-[#a1a1aa] mt-2">
            Enter to send · Shift+Enter for new line · runs up to 6 checks in parallel
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onDemo, running }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-16 gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-12 w-12 rounded-2xl bg-[#f4f4f5] flex items-center justify-center">
          <span className="h-4 w-4 rounded-full bg-red-500 inline-block" />
        </div>
        <h1 className="text-2xl font-semibold text-[#0d0d0d]">Flagged AI</h1>
        <p className="text-[#71717a] text-sm max-w-sm leading-relaxed">
          The agent between a scam job and its victim. Paste a suspicious
          offer — get a 0–100 risk score with reasoning in under 30 seconds.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-[#a1a1aa] uppercase tracking-wider">Try a demo</p>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {demoScenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => onDemo(s.input)}
              disabled={running}
              className="px-3.5 py-1.5 rounded-full border border-[#e4e4e7] text-sm text-[#3f3f46] hover:bg-[#f4f4f5] hover:border-[#d4d4d8] transition-colors disabled:opacity-40"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-[#f4f4f5] rounded-2xl rounded-br-sm px-4 py-3 text-sm text-[#0d0d0d] leading-relaxed whitespace-pre-wrap break-words">
        {text}
      </div>
    </div>
  );
}

function AssistantMessage({ msg }) {
  const { events, verdict, recovery, error, done } = msg;

  const preprocessEvent = events.find((e) => e.type === "preprocess");
  const planEvent = events.find((e) => e.type === "plan");

  // Build signal map: name → { status, summary, signal, reason }
  const reasonMap = {};
  for (const a of planEvent?.agents ?? []) reasonMap[a.name] = a.reason;

  const signalMap = {};
  for (const e of events) {
    if (e.type === "agent_start") {
      signalMap[e.name] = { status: "running", summary: null, signal: null, reason: reasonMap[e.name] ?? e.reason ?? null };
    } else if (e.type === "agent_done") {
      signalMap[e.name] = { status: e.signal?.status ?? "ok", summary: e.summary, signal: e.signal, reason: reasonMap[e.name] ?? null };
    }
  }
  const signalEntries = Object.entries(signalMap);
  const allAgentsDone = signalEntries.length > 0 && signalEntries.every(([, v]) => v.status !== "running");
  const isOrchestrating = allAgentsDone && !verdict && !recovery && !done;

  const isThinking = !done && events.length === 0;
  const hasSignals = signalEntries.length > 0;
  const hasContent = preprocessEvent || hasSignals || verdict || recovery || error;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="shrink-0 h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center mt-0.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block" />
      </div>

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <span className="text-sm font-semibold text-zinc-900">Flagged AI</span>

        {isThinking && (
          <div className="flex items-center gap-2.5 text-sm text-zinc-400">
            <ThinkingDots />
            <span>Reading your message…</span>
          </div>
        )}

        {hasContent && (
          <div className="flex flex-col gap-3">
            {/* Preprocess info bar */}
            {preprocessEvent && (
              <PreprocessBadges data={preprocessEvent.data} />
            )}

            {/* Agents section */}
            {hasSignals && (
              <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                {/* Section header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Checks
                  </span>
                  <span className="text-xs text-zinc-400">
                    {signalEntries.filter(([, v]) => v.status !== "running").length} / {signalEntries.length} done
                  </span>
                </div>

                <div className="divide-y divide-zinc-100">
                  {signalEntries.map(([name, { status, summary, signal, reason }]) => (
                    <SignalRow
                      key={name}
                      name={name}
                      status={status}
                      summary={summary}
                      signal={signal}
                      reason={reason}
                    />
                  ))}
                </div>

                {/* Orchestrating footer */}
                {isOrchestrating && (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-zinc-50 border-t border-zinc-100">
                    <ThinkingDots />
                    <span className="text-xs text-zinc-500">Generating verdict…</span>
                  </div>
                )}
              </div>
            )}

            {recovery && <RecoveryCard recovery={recovery} />}
            {verdict && <VerdictCard verdict={verdict} />}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

function PreprocessBadges({ data }) {
  if (!data) return null;
  const badges = [];
  if (data.paymentAsk) {
    badges.push({ label: `Payment ask${data.paymentAmount ? ` · ${data.paymentAmount}` : ""}`, color: "red" });
  }
  if (data.userIntent === "recovery") {
    badges.push({ label: "Recovery mode", color: "amber" });
  }
  if (data.redFlagPhrases?.length) {
    badges.push({ label: `${data.redFlagPhrases.length} red flag phrase${data.redFlagPhrases.length > 1 ? "s" : ""}`, color: "orange" });
  }
  if (data.company) {
    badges.push({ label: data.company, color: "gray" });
  }
  if (data.role) {
    badges.push({ label: data.role, color: "gray" });
  }

  if (!badges.length) return null;

  const colors = {
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    gray: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b, i) => (
        <span key={i} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colors[b.color]}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
