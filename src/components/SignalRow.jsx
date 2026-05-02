"use client";

import { useState } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconShield() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1.5 L13 3.5 L13 7.5 C13 10.5 10.5 13 7.5 13.5 C4.5 13 2 10.5 2 7.5 L2 3.5 Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M5 7.5l1.5 1.5L10 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7.5 2C7.5 2 5.5 4.5 5.5 7.5S7.5 13 7.5 13M7.5 2C7.5 2 9.5 4.5 9.5 7.5S7.5 13 7.5 13" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 7.5h11" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="3" y="1.5" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5.5 5.5h4M5.5 7.5h4M5.5 9.5h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="2" y="3" width="11" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 13V9h5v4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M5 6h1.5M8.5 6H10M5 8h1.5M8.5 8H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M2 5.5h11" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
function IconPerson() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="2" y="3.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 5l5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconChevron({ open }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <path d="M3 5l3.5 3.5L10 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Config ────────────────────────────────────────────────────────────────────
const AGENT_META = {
  scamDb:        { label: "Scam database",        Icon: IconShield  },
  domainAgent:   { label: "Domain & website",     Icon: IconGlobe   },
  gst:           { label: "GST registry",         Icon: IconDoc     },
  mca:           { label: "MCA registry",         Icon: IconBuilding},
  linkedinAgent: { label: "Recruiter / LinkedIn", Icon: IconPerson  },
  emailAgent:    { label: "Email check",          Icon: IconMail    },
  whois:         { label: "WHOIS lookup",         Icon: IconSearch  },
  proxycurl:     { label: "LinkedIn profile",     Icon: IconPerson  },
  reverseImage:  { label: "Reverse image",        Icon: IconSearch  },
};

const STATUS_STYLE = {
  running:     { dot: "bg-blue-400 animate-pulse",  text: "text-blue-600",    label: "Running…"    },
  ok:          { dot: "bg-emerald-500",             text: "text-emerald-600", label: "Done"        },
  unavailable: { dot: "bg-zinc-300",                text: "text-zinc-400",    label: "Unavailable" },
  error:       { dot: "bg-red-400",                 text: "text-red-500",     label: "Error"       },
  skipped:     { dot: "bg-zinc-300",                text: "text-zinc-400",    label: "Skipped"     },
};

// ── Signal detail renderers ───────────────────────────────────────────────────
function ScamDbDetail({ data }) {
  if (!data) return <Raw data={data} />;
  return (
    <div className="flex flex-col gap-2">
      <StatusChip ok={!data.match} trueLabel="No match found" falseLabel={`Match on: ${data.matchedOn?.join(", ") || "unknown"}`} />
      {data.match && data.matchedRecords?.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.matchedRecords.map((r, i) => (
            <div key={i} className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-800 font-mono whitespace-pre-wrap">
              {JSON.stringify(r, null, 2)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DomainDetail({ data }) {
  if (!data) return <Raw data={data} />;
  const w = data.whois || {};
  const r = data.reasoning || {};
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-1.5">
        <Pill label={data.domain || "—"} color="gray" />
        <Pill label={data.reachable ? "Reachable" : "Unreachable"} color={data.reachable ? "green" : "red"} />
        {w.ageDays != null && <Pill label={`${w.ageDays}d old`} color={w.ageDays < 14 ? "red" : w.ageDays < 60 ? "amber" : "green"} />}
        {w.registrar && <Pill label={w.registrar} color="gray" />}
      </div>
      {r.notes && <p className="text-xs text-zinc-500 leading-relaxed">{r.notes}</p>}
      {r.redFlags?.length > 0 && (
        <ul className="flex flex-col gap-1">
          {r.redFlags.map((f, i) => <li key={i} className="text-xs text-red-600 flex gap-1.5"><span>·</span>{f}</li>)}
        </ul>
      )}
    </div>
  );
}

function GstDetail({ data }) {
  if (!data) return <Raw data={data} />;
  return (
    <div className="flex flex-wrap gap-1.5">
      {data.gstin && <Pill label={`GSTIN: ${data.gstin}`} color="gray" />}
      {data.tradeName && <Pill label={data.tradeName} color="gray" />}
      {data.status && <Pill label={data.status} color={data.status === "Active" ? "green" : "red"} />}
      {data.state && <Pill label={data.state} color="gray" />}
      {!data.gstin && !data.tradeName && <span className="text-xs text-zinc-400">No GST record found</span>}
    </div>
  );
}

function McaDetail({ data }) {
  if (!data) return <Raw data={data} />;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        <Pill label={data.found ? "Found" : "Not found"} color={data.found ? "green" : "red"} />
        {data.cin && <Pill label={`CIN: ${data.cin}`} color="gray" />}
        {data.ageDays != null && <Pill label={`${data.ageDays}d old`} color={data.ageDays < 90 ? "amber" : "green"} />}
        {data.status && <Pill label={data.status} color={data.status?.toLowerCase().includes("active") ? "green" : "amber"} />}
      </div>
      {data.companyName && <p className="text-xs text-zinc-500">{data.companyName}</p>}
    </div>
  );
}

function LinkedinDetail({ data }) {
  if (!data) return <Raw data={data} />;
  const r = data.reasoning || {};
  return (
    <div className="flex flex-col gap-2.5">
      {r.plausibleRecruiter != null && (
        <StatusChip ok={r.plausibleRecruiter} trueLabel="Recruiter looks plausible" falseLabel="Recruiter looks implausible" />
      )}
      {data.emailDomainAnalysis?.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.emailDomainAnalysis.map((e, i) => (
            <div key={i} className="flex flex-wrap gap-1.5">
              <Pill label={e.email} color="gray" />
              {e.isFreemail && <Pill label="Freemail" color="amber" />}
              {e.isLookalike && <Pill label="Lookalike domain" color="red" />}
            </div>
          ))}
        </div>
      )}
      {r.notes && <p className="text-xs text-zinc-500 leading-relaxed">{r.notes}</p>}
      {r.redFlags?.length > 0 && (
        <ul className="flex flex-col gap-1">
          {r.redFlags.map((f, i) => <li key={i} className="text-xs text-red-600 flex gap-1.5"><span>·</span>{f}</li>)}
        </ul>
      )}
    </div>
  );
}

function EmailDetail({ data }) {
  if (!data) return <Raw data={data} />;
  const r = data.reasoning || {};
  return (
    <div className="flex flex-col gap-2.5">
      {r.suspicious != null && (
        <StatusChip ok={!r.suspicious} trueLabel="Emails look normal" falseLabel="Suspicious email(s) found" />
      )}
      {data.checks?.map((c, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2">
          <span className="text-xs font-mono text-zinc-600">{c.email}</span>
          <div className="flex flex-wrap gap-1.5">
            {c.isFreemail && <Pill label="Freemail" color="amber" />}
            {c.isDisposable && <Pill label="Disposable" color="red" />}
            {c.isLookalike && <Pill label="Lookalike domain" color="red" />}
            <Pill label={c.mx?.available ? "MX ✓" : "No MX records"} color={c.mx?.available ? "green" : "red"} />
            {c.whois?.ageDays != null && <Pill label={`Domain ${c.whois.ageDays}d old`} color={c.whois.ageDays < 30 ? "red" : "gray"} />}
          </div>
        </div>
      ))}
      {r.notes && <p className="text-xs text-zinc-500 leading-relaxed">{r.notes}</p>}
      {r.redFlags?.length > 0 && (
        <ul className="flex flex-col gap-1">
          {r.redFlags.map((f, i) => <li key={i} className="text-xs text-red-600 flex gap-1.5"><span>·</span>{f}</li>)}
        </ul>
      )}
    </div>
  );
}

function Raw({ data }) {
  if (!data) return <span className="text-xs text-zinc-400">No data</span>;
  return (
    <pre className="text-[11px] text-zinc-500 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function renderDetail(name, signal) {
  const data = signal?.data;
  const status = signal?.status;
  if (status === "skipped") return <span className="text-xs text-zinc-400">Skipped — {signal.reason}</span>;
  if (status === "error") return <span className="text-xs text-red-500">{signal.reason}</span>;
  if (status === "unavailable") return <span className="text-xs text-zinc-400">Unavailable — {signal.reason}</span>;
  switch (name) {
    case "scamDb":        return <ScamDbDetail data={data} />;
    case "domainAgent":   return <DomainDetail data={data} />;
    case "gst":           return <GstDetail data={data} />;
    case "mca":           return <McaDetail data={data} />;
    case "linkedinAgent": return <LinkedinDetail data={data} />;
    case "emailAgent":    return <EmailDetail data={data} />;
    default:              return <Raw data={data} />;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────
const PILL_COLORS = {
  gray:  "bg-zinc-100 text-zinc-600",
  green: "bg-emerald-50 text-emerald-700",
  red:   "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
};
function Pill({ label, color = "gray" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${PILL_COLORS[color]}`}>
      {label}
    </span>
  );
}
function StatusChip({ ok, trueLabel, falseLabel }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${ok ? "text-emerald-700" : "text-red-600"}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-none ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
      {ok ? trueLabel : falseLabel}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SignalRow({ name, status, summary, signal, reason }) {
  const [open, setOpen] = useState(false);
  const meta = AGENT_META[name] || { label: name, Icon: IconSearch };
  const st = STATUS_STYLE[status] ?? STATUS_STYLE.ok;
  const isRunning = status === "running";
  const hasDetail = !isRunning && signal;

  return (
    <div className="bg-white overflow-hidden">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
        onClick={() => hasDetail && setOpen((v) => !v)}
        disabled={!hasDetail}
        style={{ cursor: hasDetail ? "pointer" : "default" }}
      >
        {/* Agent icon */}
        <span className={`shrink-0 ${isRunning ? "text-blue-400" : st.text}`}>
          <meta.Icon />
        </span>

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-zinc-800">{meta.label}</span>

        {/* Summary or reason */}
        {summary && !isRunning && (
          <span className="text-xs text-zinc-400 truncate max-w-[180px] hidden sm:block">{summary}</span>
        )}
        {isRunning && reason && (
          <span className="text-xs text-zinc-400 truncate max-w-[180px] hidden sm:block italic">{reason}</span>
        )}

        {/* Status dot + label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`h-2 w-2 rounded-full flex-none ${st.dot}`} />
          {isRunning && <span className="text-xs text-blue-500">Running…</span>}
        </div>

        {/* Chevron */}
        {hasDetail && (
          <span className="shrink-0 text-zinc-300">
            <IconChevron open={open} />
          </span>
        )}
      </button>

      {/* Expanded detail */}
      {open && hasDetail && (
        <div className="border-t border-zinc-100 px-4 py-3.5 bg-zinc-50">
          {renderDetail(name, signal)}
        </div>
      )}
    </div>
  );
}
