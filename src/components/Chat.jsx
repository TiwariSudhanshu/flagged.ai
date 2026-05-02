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
const IcoBilling = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M6 14h4"/>
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

/* ── Casual message detection ───────────────────────────────────────────── */
const CASUAL_PATTERNS = [
  /^(hi+|hey+|hello+|helo|yo+|sup|howdy|hiya|hai)[\s!?.]*$/i,
  /^how (are|r) (you|u|ya|doing)[\s!?.]*$/i,
  /^(how'?s it going|what'?s up|wassup|wsp|kya haal|kaise ho)[\s!?.]*$/i,
  /^(good (morning|afternoon|evening|night)|gm|gn|good day)[\s!?.]*$/i,
  /^(thanks?|thank you|ty|thx|thank u|thnk?s|shukriya|dhanyawad)[\s!?.]*$/i,
  /^(ok(ay)?|k+|cool|great|nice|awesome|perfect|sounds good|alright|sure|got it)[\s!?.]*$/i,
  /^(bye+|goodbye|see (you|ya|u)|cya|ttyl|later|take care|alvida)[\s!?.]*$/i,
  /^(who are you|what (are|is|can) you|what do you do|tell me about yourself|about you)[\s!?.]*$/i,
  /^(help|help me|how (does this work|do i use this|to use)|what can you do)[\s!?.]*$/i,
  /^(lol|lmao|haha+|hehe+|xd|😂+|🤣+|😊+|👍+)[\s!?.]*$/i,
  /^(yes|no|yeah|nope|yep|nah|yup)[\s!?.]*$/i,
  /^(wow|omg|oh|ah|nice one|good job|well done|impressive)[\s!?.]*$/i,
  /^(test(ing)?|hello world|ping|check)[\s!?.]*$/i,
];

const CASUAL_RESPONSES = {
  greeting: [
    "Hey! 👋 I'm Flagged AI . I detect job scams and shady recruiter messages.\n\nPaste a suspicious job offer, recruiter email, or LinkedIn message and I'll run it through 6 checks for you.",
    "Hi there! Send me that sketchy job posting and I'll verify it across company registries, domain databases, and known scam lists.",
    "Hello! I'm built to spot job scams before they can do damage. Paste any suspicious offer and I'll analyze it.",
  ],
  thanks: [
    "Anytime! Stay safe out there  job scams are more sophisticated than ever these days. 🛡️",
    "Happy to help! If you get another suspicious message, just paste it here.",
    "No problem! Always verify before sharing documents or paying any fees.",
  ],
  bye: [
    "Take care! Remember  if any job offer sounds too good to be true, paste it here first. 👋",
    "Bye! Stay sharp out there. Real recruiters never ask for money upfront.",
    "See you! Always do a quick check before responding to unknown recruiters.",
  ],
  help: [
    "Here's what I can do:\n\n• **Analyze job postings** — paste any text from Naukri, LinkedIn, WhatsApp, email\n• **Check companies** — verify via GST & MCA registries\n• **Check domains** — domain age, legitimacy, WHOIS\n• **Check emails** — freemail, disposable, fake corporate domains\n• **Cross-reference scam databases** — phones, UPI IDs, emails\n• **Score 0–100** — scam probability with key findings\n\nJust paste the suspicious content below ↓",
  ],
  whoami: [
    "I'm **Flagged AI**  a job scam detector built to protect Indian job seekers from fraudulent offers.\n\nI verify companies via GST/MCA registries, check domain ages, cross-reference crowd-sourced scam databases, and use AI to flag suspicious patterns in recruiter messages.\n\nPaste any suspicious job offer to get started.",
  ],
  general: [
    "I'm specialized in detecting job scams! Paste a suspicious job offer, recruiter message, or company name and I'll analyze it. 🔍",
    "That's not quite in my wheelhouse — but I'm great at spotting fake job offers! Paste one below and I'll break it down.",
    "I'm a job scam detector! Try pasting a suspicious recruiter message or job posting and I'll verify it for you.",
  ],
};

function isCasualMessage(text) {
  return CASUAL_PATTERNS.some((p) => p.test(text.trim()));
}

function getCasualResponse(text) {
  const t = text.toLowerCase().trim();
  if (/^(hi|hey|hello|helo|yo|sup|howdy|hiya|hai|gm|gn|good (morning|afternoon|evening|night))/.test(t))
    return pick(CASUAL_RESPONSES.greeting);
  if (/(thanks?|thank you|ty|thx|shukriya|dhanyawad)/.test(t))
    return pick(CASUAL_RESPONSES.thanks);
  if (/(bye|goodbye|see you|cya|ttyl|later|take care|alvida)/.test(t))
    return pick(CASUAL_RESPONSES.bye);
  if (/(help|how does|what can you|how do i|how to use)/.test(t))
    return pick(CASUAL_RESPONSES.help);
  if (/(who are you|what are you|tell me about|about you|what do you do)/.test(t))
    return pick(CASUAL_RESPONSES.whoami);
  return pick(CASUAL_RESPONSES.general);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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

    const userMsg = { id: uid(), role: "user", text, ts: Date.now() };
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "22px"; }

    // Handle casual / conversational messages without calling the analysis API
    if (isCasualMessage(text)) {
      const reply = getCasualResponse(text);
      const aiMsg = { id: uid(), role: "assistant", casualText: reply, events: [], verdict: null, recovery: null, error: null, done: true, ts: Date.now() };
      setMessages([userMsg, aiMsg]);
      return;
    }

    const chatId = genId();
    currentIdRef.current = chatId;
    startTimeRef.current = Date.now();
    setActiveId(chatId);

    const aiMsg   = { id: uid(), role: "assistant", events: [], verdict: null, recovery: null, error: null, done: false, ts: Date.now() };

    setMessages([userMsg, aiMsg]);
    setRunning(true);

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
          <Link href="/billing" className="tb-btn">
            <IcoBilling /> <span>Billing</span>
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
  const { events, verdict, recovery, error, done, ts, casualText } = msg;

  // Casual / conversational reply — no analysis cards needed
  if (casualText) {
    return (
      <div className="msg-ai">
        <div className="ai-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Flagged AI" width={32} height={32} style={{ objectFit: "cover", display: "block" }} />
        </div>
        <div className="ai-body">
          <div className="ai-head">
            <span>Flagged AI</span>
            <span className="timestamp">{fmtTime(ts ?? Date.now())}</span>
          </div>
          <div style={{
            background: "var(--bg-elev)", border: "1px solid var(--line)",
            borderRadius: "4px 18px 18px 18px",
            padding: "13px 16px", fontSize: 14, lineHeight: 1.65,
            color: "var(--ink-1)", whiteSpace: "pre-wrap",
            boxShadow: "var(--shadow-xs)", maxWidth: 480,
          }}>
            {casualText.replace(/\*\*(.*?)\*\*/g, "$1")}
          </div>
        </div>
      </div>
    );
  }

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
