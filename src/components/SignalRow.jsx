"use client";

import { useState } from "react";

/* ── Icons ────────────────────────────────────────────────────────────────── */
const IcoShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z"/>
    <path d="M9.5 12.5l2 2 3.5-4"/>
  </svg>
);
const IcoGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>
  </svg>
);
const IcoDoc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h8l4 4v14H7V3z"/><path d="M15 3v4h4M9 12h6M9 16h6"/>
  </svg>
);
const IcoBuilding = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="1.5"/>
    <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>
  </svg>
);
const IcoUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
  </svg>
);
const IcoMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
  </svg>
);
const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>
  </svg>
);
const IcoWarn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18.5v.5"/>
  </svg>
);
const IcoChevron = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
    <path d="M6 9l6 6 6-6"/>
  </svg>
);
const IcoSpin = () => (
  <span className="spin">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" strokeDasharray="40 20" strokeLinecap="round"/>
    </svg>
  </span>
);

/* ── Config ─────────────────────────────────────────────────────────────── */
const AGENT_META = {
  scamDb:        { label: "Scam database",        Icon: IcoShield   },
  domainAgent:   { label: "Domain & website",     Icon: IcoGlobe    },
  gst:           { label: "GST registry",         Icon: IcoDoc      },
  mca:           { label: "MCA registry",         Icon: IcoBuilding },
  linkedinAgent: { label: "Recruiter / LinkedIn", Icon: IcoUser     },
  emailAgent:    { label: "Email check",          Icon: IcoMail     },
  whois:         { label: "WHOIS lookup",         Icon: IcoSearch   },
  proxycurl:     { label: "LinkedIn profile",     Icon: IcoUser     },
  reverseImage:  { label: "Reverse image",        Icon: IcoSearch   },
};

/* ── Detail renderers (keep existing Tailwind-based ones intact) ─────────── */
function ScamDbDetail({ data }) {
  if (!data) return <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No data</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <StatusChip ok={!data.match} trueLabel="No match found" falseLabel={`Match on: ${data.matchedOn?.join(", ") || "unknown"}`} />
      {data.match && data.matchedRecords?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.matchedRecords.map((r, i) => (
            <div key={i} style={{ background: "oklch(0.97 0.02 28)", border: "1px solid oklch(0.9 0.05 28)", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent-ink)", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(r, null, 2)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DomainDetail({ data }) {
  if (!data) return <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No data</span>;
  const w = data.whois || {};
  const r = data.reasoning || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Pill label={data.domain || "—"} />
        <Pill label={data.reachable ? "Reachable" : "Unreachable"} color={data.reachable ? "ok" : "danger"} />
        {w.ageDays != null && <Pill label={`${w.ageDays}d old`} color={w.ageDays < 14 ? "danger" : w.ageDays < 60 ? "warn" : "ok"} />}
        {w.registrar && <Pill label={w.registrar} />}
      </div>
      {r.notes && <p style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6, margin: 0 }}>{r.notes}</p>}
      {r.redFlags?.length > 0 && (
        <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
          {r.redFlags.map((f, i) => <li key={i} style={{ fontSize: 12, color: "var(--danger)", marginBottom: 3 }}>{f}</li>)}
        </ul>
      )}
    </div>
  );
}

function GstDetail({ data }) {
  if (!data) return <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No data</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {data.gstin && <Pill label={`GSTIN: ${data.gstin}`} />}
      {data.tradeName && <Pill label={data.tradeName} />}
      {data.status && <Pill label={data.status} color={data.status === "Active" ? "ok" : "danger"} />}
      {data.state && <Pill label={data.state} />}
      {!data.gstin && !data.tradeName && <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No GST record found</span>}
    </div>
  );
}

function McaDetail({ data }) {
  if (!data) return <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No data</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Pill label={data.found ? "Found" : "Not found"} color={data.found ? "ok" : "danger"} />
        {data.cin && <Pill label={`CIN: ${data.cin}`} />}
        {data.ageDays != null && <Pill label={`${data.ageDays}d old`} color={data.ageDays < 90 ? "warn" : "ok"} />}
        {data.status && <Pill label={data.status} color={data.status?.toLowerCase().includes("active") ? "ok" : "warn"} />}
      </div>
      {data.companyName && <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{data.companyName}</p>}
    </div>
  );
}

function LinkedinDetail({ data }) {
  if (!data) return <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No data</span>;
  const r = data.reasoning || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {r.plausibleRecruiter != null && (
        <StatusChip ok={r.plausibleRecruiter} trueLabel="Recruiter looks plausible" falseLabel="Recruiter looks implausible" />
      )}
      {data.emailDomainAnalysis?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.emailDomainAnalysis.map((e, i) => (
            <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              <Pill label={e.email} />
              {e.isFreemail && <Pill label="Freemail" color="warn" />}
              {e.isLookalike && <Pill label="Lookalike domain" color="danger" />}
            </div>
          ))}
        </div>
      )}
      {r.notes && <p style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6, margin: 0 }}>{r.notes}</p>}
      {r.redFlags?.length > 0 && (
        <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
          {r.redFlags.map((f, i) => <li key={i} style={{ fontSize: 12, color: "var(--danger)", marginBottom: 3 }}>{f}</li>)}
        </ul>
      )}
    </div>
  );
}

function EmailDetail({ data }) {
  if (!data) return <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No data</span>;
  const r = data.reasoning || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {r.suspicious != null && (
        <StatusChip ok={!r.suspicious} trueLabel="Emails look normal" falseLabel="Suspicious email(s) found" />
      )}
      {data.checks?.map((c, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--bg-sunken)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px" }}>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-2)" }}>{c.email}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {c.isFreemail && <Pill label="Freemail" color="warn" />}
            {c.isDisposable && <Pill label="Disposable" color="danger" />}
            {c.isLookalike && <Pill label="Lookalike domain" color="danger" />}
            <Pill label={c.mx?.available ? "MX ✓" : "No MX"} color={c.mx?.available ? "ok" : "danger"} />
            {c.whois?.ageDays != null && <Pill label={`Domain ${c.whois.ageDays}d old`} color={c.whois.ageDays < 30 ? "danger" : "neutral"} />}
          </div>
        </div>
      ))}
      {r.notes && <p style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6, margin: 0 }}>{r.notes}</p>}
      {r.redFlags?.length > 0 && (
        <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
          {r.redFlags.map((f, i) => <li key={i} style={{ fontSize: 12, color: "var(--danger)", marginBottom: 3 }}>{f}</li>)}
        </ul>
      )}
    </div>
  );
}

function renderDetail(name, signal) {
  const data = signal?.data;
  const status = signal?.status;
  if (status === "skipped")     return <span style={{ fontSize: 12, color: "var(--ink-4)" }}>Skipped — {signal.reason}</span>;
  if (status === "error")       return <span style={{ fontSize: 12, color: "var(--danger)" }}>{signal.reason}</span>;
  if (status === "unavailable") return <span style={{ fontSize: 12, color: "var(--ink-4)" }}>Unavailable — {signal.reason}</span>;
  if (status === "manual") {
    const isGst = name === "gst";
    const url = data?.manualUrl ?? (isGst ? "https://taxpayersearch.gst.gov.in/" : "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do");
    const linkLabel = isGst ? "Search on GST portal →" : "Search on MCA portal →";
    const tip = isGst
      ? (data?.tip ?? "Legitimate companies include GSTIN in formal offer letters. Ask the recruiter for it, then verify.")
      : "Verify the company's incorporation status and CIN on the official MCA portal.";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{tip}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "var(--accent)", textDecoration: "none", padding: "5px 10px", border: "1px solid var(--accent)", borderRadius: 6, width: "fit-content" }}
          onClick={(e) => e.stopPropagation()}
        >
          {linkLabel}
        </a>
      </div>
    );
  }
  switch (name) {
    case "scamDb":        return <ScamDbDetail data={data} />;
    case "domainAgent":   return <DomainDetail data={data} />;
    case "gst":           return <GstDetail data={data} />;
    case "mca":           return <McaDetail data={data} />;
    case "linkedinAgent": return <LinkedinDetail data={data} />;
    case "emailAgent":    return <EmailDetail data={data} />;
    default: return data ? (
      <pre style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    ) : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No data</span>;
  }
}

/* ── Tiny helpers ───────────────────────────────────────────────────────── */
const PILL_BG = { ok: "var(--ok-soft)", danger: "var(--accent-soft)", warn: "var(--warn-soft)", neutral: "var(--neutral-soft)" };
const PILL_COLOR = { ok: "oklch(0.4 0.12 150)", danger: "var(--accent-ink)", warn: "oklch(0.42 0.13 70)", neutral: "var(--ink-3)" };

function Pill({ label, color = "neutral" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 999,
      fontSize: 11, fontWeight: 500,
      background: PILL_BG[color] ?? "var(--neutral-soft)",
      color: PILL_COLOR[color] ?? "var(--ink-3)",
    }}>
      {label}
    </span>
  );
}

function StatusChip({ ok, trueLabel, falseLabel }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: ok ? "oklch(0.4 0.12 150)" : "var(--danger)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: ok ? "var(--ok)" : "var(--danger)", flexShrink: 0 }} />
      {ok ? trueLabel : falseLabel}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function SignalRow({ name, status, summary, signal, reason }) {
  const [open, setOpen] = useState(false);
  const meta = AGENT_META[name] || { label: name, Icon: IcoSearch };
  const isRunning  = status === "running";
  const hasDetail  = !isRunning && !!signal;

  const iconClass = `check-icon ${status === "ok" ? "ok" : status === "warn" ? "warn" : status === "danger" ? "danger" : status === "running" ? "running" : status === "error" ? "error" : status === "manual" ? "unavailable" : "unavailable"}`;
  const dotClass  = `check-status ${status === "manual" ? "unavailable" : status}`;

  const renderIcon = () => {
    if (isRunning) return <IcoSpin />;
    if (status === "ok") return <IcoCheck />;
    if (status === "warn" || status === "danger" || status === "error") return <IcoWarn />;
    return <meta.Icon />;
  };

  return (
    <button
      className={"vc-check " + (open ? "expanded" : "")}
      onClick={() => hasDetail && setOpen((v) => !v)}
      disabled={!hasDetail}
      style={{ cursor: hasDetail ? "pointer" : "default" }}
    >
      <div className={iconClass}>{renderIcon()}</div>
      <div className="check-name">{meta.label}</div>
      {isRunning && reason ? (
        <div className="check-detail" style={{ fontStyle: "italic" }}>{reason}</div>
      ) : summary ? (
        <div className="check-detail">{summary}</div>
      ) : (
        <div className="check-detail" />
      )}
      <span className={dotClass} />
      {hasDetail ? (
        <span className="check-chevron"><IcoChevron open={open} /></span>
      ) : (
        <span style={{ width: 13 }} />
      )}
      {open && hasDetail && (
        <div className="check-body">
          {renderDetail(name, signal)}
        </div>
      )}
    </button>
  );
}
