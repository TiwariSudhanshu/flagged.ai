import Link from "next/link";
import { REGISTRY } from "@/lib/planner";

const CATEGORY_META = {
  Database: { color: "#3B82F6", softColor: "#EFF6FF", borderColor: "#BFDBFE" },
  Domain:   { color: "#8B5CF6", softColor: "#F5F3FF", borderColor: "#DDD6FE" },
  Company:  { color: "#10B981", softColor: "#ECFDF5", borderColor: "#A7F3D0" },
  Contact:  { color: "#F59E0B", softColor: "#FFFBEB", borderColor: "#FDE68A" },
};

const AGENT_ICON = {
  scamDb: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5L15 4v5C15 12.5 12.5 15 9 15.5 5.5 15 3 12.5 3 9V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M6.5 9l2 2L12 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  domainAgent: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9 2.5C9 2.5 6.5 5.5 6.5 9s2.5 6.5 2.5 6.5M9 2.5c0 0 2.5 3 2.5 6.5S9 15.5 9 15.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2.5 9h13" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  gst: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3.5" y="2" width="11" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6.5 7h5M6.5 9.5h5M6.5 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  mca: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4.5" width="14" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6.5 15V11h5v4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M2 8h14M6.5 6.5V5a2.5 2.5 0 015 0v1.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  linkedinAgent: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M3 16c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  emailAgent: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4.5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 6.5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export default function AgentsPage() {
  const categories = [...new Set(REGISTRY.map((a) => a.category))];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-ui)" }}>
      <style>{`
        .ag-back { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--ink-3); text-decoration:none; transition:color .15s; }
        .ag-back:hover { color:var(--ink-1); }
        .ag-pill { font-size:12px; color:var(--ink-3); text-decoration:none; padding:5px 12px; border-radius:999px; border:1px solid var(--line); background:var(--bg-elev); transition:color .15s,border-color .15s; }
        .ag-pill:hover { color:var(--ink-1); border-color:var(--line-strong); }
        .ag-cta { font-size:12px; font-weight:500; color:white; text-decoration:none; padding:5px 12px; border-radius:999px; background:var(--ink-1); }
        .ag-card { background:var(--bg-elev); border-radius:16px; border:1px solid var(--line); box-shadow:var(--shadow-xs); overflow:hidden; display:flex; flex-direction:column; transition:box-shadow .18s, border-color .18s; }
        .ag-card:hover { box-shadow:var(--shadow-md); border-color:var(--line-strong); }
      `}</style>

      {/* Header — identical to /billing and /keys */}
      <header style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 24px", borderBottom: "1px solid var(--line)",
        background: "rgba(250,250,247,0.92)", backdropFilter: "blur(8px)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <Link href="/" className="ag-back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Link>
        <span style={{ color: "var(--line-strong)" }}>|</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-1)" }}>Flagged AI</span>
        </div>
        <div style={{ flex: 1 }} />
        <Link href="/billing" className="ag-pill">Billing</Link>
        <Link href="/keys" className="ag-cta">API Keys</Link>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px", display: "flex", flexDirection: "column", gap: 40 }}>

        {/* Hero — same style as /billing */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink-1)", margin: "0 0 6px" }}>
            Agents
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0, lineHeight: 1.6 }}>
            The planner selects only the relevant agents per submission — no wasted checks.
          </p>
        </div>

        {/* Stats row — same style as /keys */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Total agents",  value: REGISTRY.length,      color: "var(--ink-1)" },
            { label: "Categories",    value: categories.length,    color: "var(--ink-1)" },
            { label: "Free tier",     value: "All",                color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
            { label: "Execution",     value: "Parallel",           color: "var(--ink-1)" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{
              padding: "14px 20px", borderRadius: 14,
              background: bg || "var(--bg-elev)",
              border: `1px solid ${border || "var(--line)"}`,
              minWidth: 100,
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", margin: "0 0 4px" }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* How it works — subtle strip, same sunken bg as billing uses */}
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          background: "var(--bg-elev)", border: "1px solid var(--line)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {[
            { n: "01", text: "Input arrives" },
            { n: "02", text: "Planner selects" },
            { n: "03", text: "Agents run in parallel" },
            { n: "04", text: "Verdict synthesized" },
          ].map(({ n, text }, i, arr) => (
            <div key={n} style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              padding: "14px 16px",
              borderRight: i < arr.length - 1 ? "1px solid var(--line)" : "none",
            }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                color: "var(--accent)", letterSpacing: "0.06em", flexShrink: 0,
              }}>{n}</span>
              <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Agent sections */}
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat] || CATEGORY_META.Database;
          const agents = REGISTRY.filter((a) => a.category === cat);
          return (
            <section key={cat} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Category header — same SectionHeader pattern as billing */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: meta.softColor, border: `1px solid ${meta.borderColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: meta.color, flexShrink: 0,
                }}>
                  <CategoryIcon cat={cat} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-1)", margin: 0 }}>{cat}</p>
                  <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
                    {agents.length} agent{agents.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Cards grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                gap: 12,
              }}>
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} meta={meta} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Footer info — same pattern as billing's pricing note */}
        <div style={{
          padding: "20px 24px", borderRadius: 14,
          background: "var(--bg-sunken)", border: "1px solid var(--line)",
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: "var(--ink-3)", flexShrink: 0, marginTop: 1 }}>
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9 8v5M9 6v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", margin: "0 0 3px" }}>Selective execution by design</p>
            <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.65, margin: 0 }}>
              The planner reads the preprocessed input and only queues agents whose trigger conditions match.
              A text-only post with no URLs skips the domain agent entirely — keeping latency low and avoiding unnecessary API calls.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function AgentCard({ agent, meta }) {
  const alwaysRuns = agent.triggerLabel === "Always";

  return (
    <article className="ag-card">
      {/* Category color top bar */}
      <div style={{ height: 3, background: meta.color, opacity: 0.7 }} />

      <div style={{ padding: "18px 20px 20px" }}>
        {/* Icon + name row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: meta.softColor, border: `1px solid ${meta.borderColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: meta.color,
          }}>
            {AGENT_ICON[agent.id]}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-1)", letterSpacing: "-0.01em" }}>
                {agent.label}
              </span>
              {/* Trigger badge — uses same chip style as /keys status badges */}
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                padding: "2px 8px", borderRadius: 999,
                background: alwaysRuns ? meta.softColor : "var(--bg-sunken)",
                border: `1px solid ${alwaysRuns ? meta.borderColor : "var(--line)"}`,
                color: alwaysRuns ? meta.color : "var(--ink-3)",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                {alwaysRuns && (
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: meta.color, display: "inline-block",
                  }} />
                )}
                {agent.triggerLabel}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6, margin: 0 }}>
              {agent.description}
            </p>
          </div>
        </div>

        {/* Chips row — free tier + optional API key */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 999,
            background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46",
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Free tier
          </span>

          {agent.envVars?.map((env) => (
            <span key={env.key} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 999,
              background: "var(--bg-sunken)", border: "1px solid var(--line)", color: "var(--ink-3)",
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="4" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M6 6l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {env.label} — optional
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function CategoryIcon({ cat }) {
  switch (cat) {
    case "Database":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <ellipse cx="8" cy="4.5" rx="5" ry="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M3 4.5v3c0 1.1 2.24 2 5 2s5-.9 5-2v-3" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M3 7.5v3c0 1.1 2.24 2 5 2s5-.9 5-2v-3" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      );
    case "Domain":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 2.5C8 2.5 6 5 6 8s2 5.5 2 5.5M8 2.5c0 0 2 2.5 2 5.5S8 13.5 8 13.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2.5 8h11" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      );
    case "Company":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="4.5" width="12" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5.5 13.5V10h5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M2 7.5h12M5.5 6V5A2.5 2.5 0 0110.5 5v1" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      );
    case "Contact":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      );
    default:
      return null;
  }
}
