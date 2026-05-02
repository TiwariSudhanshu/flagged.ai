"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import VerdictCard from "./VerdictCard";
import SignalRow from "./SignalRow";
import RecoveryCard from "./RecoveryCard";
import Sidebar from "./Sidebar";
import demoScenarios from "@/data/demo-scenarios.json";

const LS_HISTORY = "flaggedai_history";
const MAX_HISTORY = 50;

let msgId = 0;
function uid() { return ++msgId; }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function makeTitle(text) { return text.trim().slice(0, 55) + (text.trim().length > 55 ? "…" : ""); }

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY) ?? "[]"); } catch { return []; }
}
function saveHistory(h) {
  try { localStorage.setItem(LS_HISTORY, JSON.stringify(h.slice(0, MAX_HISTORY))); } catch {}
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IcoPanel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16"/>
  </svg>
);
const IcoAgents = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const IcoKey = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="14" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l3 3"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IcoArrowUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7"/>
  </svg>
);
const IcoStop = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);
const IcoSpark = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
  </svg>
);
const IcoMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
  </svg>
);
const IcoLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>
  </svg>
);
const IcoGlobe = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>
  </svg>
);
const IcoUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
  </svg>
);

/* ── Demo suggestions ───────────────────────────────────────────────────── */
const SUGG_ICONS = [IcoMail, IcoLink, IcoGlobe, IcoUser];

/* ── Main component ─────────────────────────────────────────────────────── */
export default function Chat() {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [running,     setRunning]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history,     setHistory]     = useState([]);
  const [activeId,    setActiveId]    = useState(null);

  const abortRef      = useRef(null);
  const bottomRef     = useRef(null);
  const threadRef     = useRef(null);
  const textareaRef   = useRef(null);
  const currentIdRef  = useRef(null);
  const startTimeRef  = useRef(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

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

  function persistChat(msgs, chatId) {
    if (!chatId || msgs.length < 2) return;
    const userMsg = msgs.find((m) => m.role === "user");
    if (!userMsg) return;
    const aiMsg = msgs.findLast?.((m) => m.role === "assistant") ?? msgs[msgs.length - 1];
    const entry = {
      id: chatId,
      title: makeTitle(userMsg.text),
      createdAt: Date.now(),
      verdict: aiMsg?.verdict?.verdict ?? null,
      messages: msgs.map((m) => m.role === "assistant" ? { ...m, events: [], done: true } : m),
    };
    setHistory((prev) => {
      const next = [entry, ...prev.filter((h) => h.id !== chatId)];
      saveHistory(next);
      return next;
    });
  }

  async function submit() {
    const text = input.trim();
    if (!text || running) return;

    const chatId = genId();
    currentIdRef.current = chatId;
    startTimeRef.current = Date.now();
    setActiveId(chatId);

    const userMsg = { id: uid(), role: "user", text, ts: Date.now() };
    const aiMsg   = { id: uid(), role: "assistant", events: [], verdict: null, recovery: null, error: null, done: false, ts: Date.now() };

    setMessages([userMsg, aiMsg]);
    setInput("");
    setRunning(true);
    if (textareaRef.current) { textareaRef.current.style.height = "22px"; }

    const controller = new AbortController();
    abortRef.current = controller;
    let finalMessages = [userMsg, aiMsg];

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
              patchLast((m) => { const u = { ...m, verdict: ev.verdict }; finalMessages = [userMsg, u]; return u; });
            } else if (ev.type === "recovery") {
              patchLast((m) => { const u = { ...m, recovery: ev.recovery }; finalMessages = [userMsg, u]; return u; });
            } else if (ev.type === "error") {
              patchLast((m) => { const u = { ...m, error: ev.message }; finalMessages = [userMsg, u]; return u; });
            } else {
              patchLast((m) => { const u = { ...m, events: [...m.events, ev] }; finalMessages = [userMsg, u]; return u; });
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        patchLast((m) => { const u = { ...m, error: err.message }; finalMessages = [userMsg, u]; return u; });
      }
    } finally {
      patchLast((m) => { const u = { ...m, done: true }; finalMessages = [userMsg, u]; return u; });
      setRunning(false);
      abortRef.current = null;
      persistChat(finalMessages, chatId);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setRunning(false);
    setActiveId(null);
    currentIdRef.current = null;
  }

  function loadChat(id) {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    abortRef.current?.abort();
    setMessages(item.messages);
    setActiveId(id);
    setRunning(false);
  }

  function deleteChat(id) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      saveHistory(next);
      return next;
    });
    if (activeId === id) newChat();
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="app" style={{ gridTemplateColumns: `${sidebarOpen ? 264 : 0}px 1fr` }}>
      <Sidebar
        open={sidebarOpen}
        history={history}
        activeId={activeId}
        onSelect={loadChat}
        onDelete={deleteChat}
        onNew={newChat}
      />

      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <button className="tb-btn" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar" style={{ padding: "7px 8px" }}>
            <IcoPanel />
          </button>
          <div className="tb-title">
            Flagged AI
            {!isEmpty && <span className="sub">— scam analysis</span>}
          </div>
          <div className="tb-spacer" />
          <Link href="/agents" className="tb-btn">
            <IcoAgents /> <span>Agents</span>
          </Link>
          <Link href="/keys" className="tb-btn">
            <IcoKey /> <span>API Keys</span>
          </Link>
          <div className="tb-divider" />
          <button className="tb-cta" onClick={newChat}>
            <IcoPlus /> New
          </button>
        </div>

        {/* Thread */}
        <div className="thread" ref={threadRef}>
          <div className="thread-inner">
            {isEmpty ? (
              <WelcomeState />
            ) : (
              messages.map((msg) =>
                msg.role === "user"
                  ? <UserMsgEl key={msg.id} msg={msg} />
                  : <AssistantMsgEl key={msg.id} msg={msg} />
              )
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="composer-wrap">
          {isEmpty && (
            <div className="suggestions">
              {demoScenarios.map((s, i) => {
                const Ico = SUGG_ICONS[i % SUGG_ICONS.length];
                return (
                  <button key={s.id} className="sugg" disabled={running} onClick={() => setInput(s.input)}>
                    <Ico /> {s.label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="composer">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "22px";
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste a suspicious job offer, recruiter message, or LinkedIn URL…"
              rows={1}
              style={{ height: "22px" }}
            />
            <div className="composer-row">
              <div className="comp-spacer" />
              <span className="comp-meta">{input.length > 0 ? `${input.length} chars` : "0 / 12 000"}</span>
              {running ? (
                <button className="send-btn stop" onClick={() => abortRef.current?.abort()} title="Stop analysis">
                  <IcoStop />
                </button>
              ) : (
                <button className="send-btn" onClick={submit} disabled={!input.trim()} title="Send">
                  <IcoArrowUp />
                </button>
              )}
            </div>
          </div>
          <div className="comp-hint">
            <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for new line · up to 6 checks in parallel
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Welcome state ──────────────────────────────────────────────────────── */
function WelcomeState() {
  return (
    <div className="welcome">
      <div className="eyebrow">Job Scam Detection · India</div>
      <h1>Is this offer <em>real</em>?</h1>
      <p>
        Paste a suspicious job offer, recruiter email, or LinkedIn message — I'll verify across
        6 sources and give you a 0–100 risk score in under 30 seconds.
      </p>
    </div>
  );
}

/* ── User message ───────────────────────────────────────────────────────── */
function UserMsgEl({ msg }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <div className="msg-user">
        <span className="from">You · {fmtTime(msg.ts ?? Date.now())}</span>
        {msg.text}
      </div>
    </div>
  );
}

/* ── Assistant message ──────────────────────────────────────────────────── */
function AssistantMsgEl({ msg }) {
  const { events, verdict, recovery, error, done, ts } = msg;

  const preprocessEvent = events.find((e) => e.type === "preprocess");
  const planEvent       = events.find((e) => e.type === "plan");

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

  const signalEntries   = Object.entries(signalMap);
  const doneCount       = signalEntries.filter(([, v]) => v.status !== "running").length;
  const totalCount      = signalEntries.length;
  const pct             = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allAgentsDone   = totalCount > 0 && doneCount === totalCount;
  const isOrchestrating = allAgentsDone && !verdict && !recovery && !error && !done;
  const isThinking      = !done && events.length === 0;
  const hasSignals      = totalCount > 0;

  return (
    <div className="msg-ai">
      {/* Avatar */}
      <div className="ai-avatar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Flagged AI" width={32} height={32} style={{ objectFit: "cover", display: "block" }} />
      </div>

      <div className="ai-body">
        <div className="ai-head">
          <span>Flagged AI</span>
          <span className="timestamp">{fmtTime(ts ?? Date.now())}</span>
        </div>

        {/* Thinking */}
        {isThinking && (
          <div className="typing">
            <span /><span /><span />
          </div>
        )}

        {/* Preprocess tags */}
        {preprocessEvent && <PreprocessTags data={preprocessEvent.data} />}

        {/* Agent checks */}
        {hasSignals && (
          <div className="verdict-card">
            <div className="vc-progress">
              <span className="label-strong">{doneCount}/{totalCount}</span>
              <span>checks complete</span>
              <div className="pbar">
                <div className="pfill" style={{ width: pct + "%" }} />
              </div>
              <span>{pct}%</span>
            </div>
            <div className="vc-checks">
              {signalEntries.map(([name, { status, summary, signal, reason }]) => (
                <SignalRow key={name} name={name} status={status} summary={summary} signal={signal} reason={reason} />
              ))}
            </div>
            {isOrchestrating && (
              <div className="vc-foot">
                <span className="meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="typing" style={{ padding: "4px 8px", border: "none", background: "transparent" }}>
                    <span /><span /><span />
                  </span>
                  Generating verdict…
                </span>
              </div>
            )}
          </div>
        )}

        {/* Recovery */}
        {recovery && <RecoveryCard recovery={recovery} />}

        {/* Verdict */}
        {verdict && <VerdictCard verdict={verdict} />}

        {/* Error */}
        {error && (
          <div className="error-block">{error}</div>
        )}

        {/* Reasoning summary from verdict */}
        {verdict?.reasoning && (
          <div className="reasoning">
            <div className="reasoning-head"><IcoSpark /> Why I flagged this</div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "var(--ink-2)" }}>
              {verdict.recommendedAction}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Preprocess tags ────────────────────────────────────────────────────── */
function PreprocessTags({ data }) {
  if (!data) return null;
  const tags = [];
  if (data.paymentAsk) tags.push({ label: `Payment ask${data.paymentAmount ? ` · ${data.paymentAmount}` : ""}`, cls: "danger" });
  if (data.userIntent === "recovery") tags.push({ label: "Recovery mode", cls: "warn" });
  if (data.redFlagPhrases?.length) tags.push({ label: `${data.redFlagPhrases.length} red flag phrase${data.redFlagPhrases.length > 1 ? "s" : ""}`, cls: "warn" });
  if (data.company) tags.push({ label: data.company, cls: "" });
  if (data.role) tags.push({ label: data.role, cls: "" });
  if (!tags.length) return null;
  return (
    <div className="tag-row">
      {tags.map((t, i) => (
        <span key={i} className={`tag ${t.cls}`}>
          <span className="tag-dot" />
          {t.label}
        </span>
      ))}
    </div>
  );
}
