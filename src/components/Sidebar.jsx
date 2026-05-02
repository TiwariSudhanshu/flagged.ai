"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import LoginModal from "./LoginModal";

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
  const { data: session, status } = useSession();
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
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

        {/* User profile section — bottom of sidebar */}
        <div style={{
          borderTop: "1px solid var(--line)",
          paddingTop: 12,
          marginTop: 4,
          flexShrink: 0,
        }}>
          {status === "loading" ? (
            <div style={{
              height: 40, borderRadius: 10,
              background: "var(--neutral-soft)",
              animation: "pulse 1.4s ease-in-out infinite",
            }} />
          ) : session?.user ? (
            /* Logged-in user */
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 10px", borderRadius: 10,
                  background: showUserMenu ? "rgba(20,20,15,0.05)" : "transparent",
                  border: "none", cursor: "pointer",
                  transition: "background .12s", textAlign: "left",
                }}
              >
                {/* Avatar */}
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    width={28}
                    height={28}
                    style={{ borderRadius: "50%", flexShrink: 0, border: "1.5px solid var(--line)" }}
                  />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "var(--accent)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white",
                  }}>
                    {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {session.user.name || "User"}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {session.user.email}
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ color: "var(--ink-4)", flexShrink: 0, transform: showUserMenu ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0,
                  background: "var(--bg-elev)", border: "1px solid var(--line)",
                  borderRadius: 12, boxShadow: "var(--shadow-md)",
                  padding: 6, zIndex: 50,
                  animation: "slideUp .15s ease both",
                }}>
                  <div style={{ padding: "8px 10px 8px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-1)", margin: 0 }}>
                      {session.user.name}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--ink-4)", margin: 0 }}>
                      {session.user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); signOut({ callbackUrl: "/" }); }}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 8,
                      border: "none", background: "transparent",
                      fontSize: 12, color: "var(--ink-2)", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8,
                      transition: "background .1s", textAlign: "left",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M5 2H2.5A1.5 1.5 0 001 3.5v6A1.5 1.5 0 002.5 11H5M8.5 9.5L12 6.5 8.5 3.5M12 6.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in */
            <button
              onClick={() => setShowLogin(true)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "9px 10px", borderRadius: 10,
                border: "1px solid var(--line)", background: "var(--bg-elev)",
                cursor: "pointer", transition: "border-color .12s",
                fontFamily: "var(--font-ui)",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "var(--bg-sunken)", border: "1px solid var(--line)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--ink-4)",
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1.5 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Sign in</div>
                <div style={{ fontSize: 10, color: "var(--ink-4)" }}>Save your history</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--ink-4)", flexShrink: 0 }}>
                <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Login modal — rendered outside the sidebar so it overlays everything */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
