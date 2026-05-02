"use client";

function groupByDay(history) {
  const groups = { Today: [], Yesterday: [], "This week": [], Older: [] };
  const now = new Date();
  history.forEach((item) => {
    const diff = Math.floor((now - new Date(item.createdAt)) / 86_400_000);
    if (diff === 0) groups.Today.push(item);
    else if (diff === 1) groups.Yesterday.push(item);
    else if (diff < 7) groups["This week"].push(item);
    else groups.Older.push(item);
  });
  return groups;
}

function verdictDotClass(verdict) {
  if (verdict === "scam") return "verdict-dot scam";
  if (verdict === "suspicious") return "verdict-dot suspicious";
  if (verdict === "likely_legit") return "verdict-dot safe";
  return "verdict-dot";
}

function verdictLabel(verdict) {
  if (verdict === "scam") return "Scam";
  if (verdict === "suspicious") return "Suspicious";
  if (verdict === "likely_legit") return "Likely legit";
  return "Unknown";
}

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function Sidebar({ open, history, activeId, onSelect, onDelete, onNew }) {
  const groups = groupByDay(history);

  return (
    <aside
      className="sidebar"
      style={{ width: open ? 264 : 0, padding: open ? undefined : 0 }}
    >
      {/* Brand */}
      <div className="sb-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Flagged AI" width={26} height={26} style={{ borderRadius: 7, flexShrink: 0 }} />
        <span className="name">Flagged AI</span>
        <span className="dot" title="Operational" />
      </div>

      {/* New investigation */}
      <button className="sb-new" onClick={onNew}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New investigation
        </span>
      </button>

      {/* History */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div className="sb-section-label">History</div>
        <div className="sb-history">
          {history.length === 0 ? (
            <div style={{ padding: "20px 8px", fontSize: 12, color: "var(--ink-4)", textAlign: "center", lineHeight: 1.6 }}>
              Your analyses<br />will appear here.
            </div>
          ) : (
            Object.entries(groups).map(([day, items]) =>
              items.length > 0 ? (
                <div key={day}>
                  <div className="sb-day">{day}</div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={"sb-item " + (activeId === item.id ? "active" : "")}
                      onClick={() => onSelect(item.id)}
                    >
                      <div className="title">{item.title}</div>
                      <div className="meta">
                        <span className={verdictDotClass(item.verdict)} />
                        <span>{verdictLabel(item.verdict)}</span>
                        <span>·</span>
                        <span>{fmtTime(item.createdAt)}</span>
                      </div>
                      <button
                        className="del-btn"
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        title="Delete"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : null
            )
          )}
        </div>
      </div>
    </aside>
  );
}
