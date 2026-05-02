"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function KeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [revealed, setRevealed] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchKeys(); }, []);

  async function fetchKeys() {
    setLoading(true);
    try {
      const res = await fetch("/api/keys");
      if (!res.ok) throw new Error("Failed to load keys");
      setKeys(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create key");
      setRevealed({ id: data.id, key: data.key });
      setNewName("");
      setShowCreate(false);
      await fetchKeys();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id) {
    if (!confirm("Revoke this key? Any system using it will stop working immediately.")) return;
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      if (revealed?.id === id) setRevealed(null);
      await fetchKeys();
    } catch (e) {
      setError(e.message);
    }
  }

  async function copy(text, id) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  }

  const activeKeys = keys.filter((k) => k.active);
  const revokedKeys = keys.filter((k) => !k.active);
  const totalRequests = activeKeys.reduce((s, k) => s + (k.requests || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-ui)" }}>

      {/* Sticky header */}
      <header style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 24px", borderBottom: "1px solid var(--line)",
        background: "rgba(250,250,247,0.92)", backdropFilter: "blur(8px)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "var(--ink-3)", textDecoration: "none",
        }}>
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
        <Link href="/agents" style={{
          fontSize: 12, color: "var(--ink-3)", textDecoration: "none",
          padding: "5px 12px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--bg-elev)",
        }}>Agents</Link>
        <Link href="/billing" style={{
          fontSize: 12, color: "var(--ink-3)", textDecoration: "none",
          padding: "5px 12px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--bg-elev)",
        }}>Billing</Link>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            fontSize: 12, fontWeight: 600, color: "white",
            padding: "5px 14px", borderRadius: 999, border: "none",
            background: "var(--ink-1)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New key
        </button>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px", display: "flex", flexDirection: "column", gap: 40 }}>

        {/* Hero */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink-1)", margin: "0 0 6px" }}>
              API Keys
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0, lineHeight: 1.6 }}>
              Pass the key in the{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--bg-sunken)", padding: "1px 7px", borderRadius: 5, border: "1px solid var(--line)", color: "var(--ink-2)" }}>
                X-API-Key
              </code>
              {" "}header when calling{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--bg-sunken)", padding: "1px 7px", borderRadius: 5, border: "1px solid var(--line)", color: "var(--ink-2)" }}>
                POST /api/analyze
              </code>
            </p>
          </div>
        </div>

        {/* Stats row */}
        {!loading && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Active keys", value: activeKeys.length, color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
              { label: "Total calls", value: totalRequests.toLocaleString(), color: "var(--ink-2)", bg: "var(--bg-elev)", border: "var(--line)" },
              { label: "Credits / call", value: "10", color: "var(--ink-2)", bg: "var(--bg-elev)", border: "var(--line)" },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} style={{
                padding: "14px 20px", borderRadius: 14,
                background: bg, border: `1px solid ${border}`,
                minWidth: 110,
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* One-time reveal banner */}
        {revealed && (
          <div style={{
            borderRadius: 16, overflow: "hidden",
            border: "1px solid #A7F3D0",
            boxShadow: "0 4px 20px rgba(16,185,129,0.12)",
            animation: "slideUp .25s ease both",
          }}>
            <div style={{
              background: "linear-gradient(135deg, #064E3B, #065F46)",
              padding: "16px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="6" r="3" stroke="#A7F3D0" strokeWidth="1.4"/>
                    <path d="M8.5 8.5l3 3M6 3V1M6 11v-2M1 6H3M11 6H9M2.5 2.5l1.5 1.5M8.5 8.5l1.5 1.5" stroke="#A7F3D0" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#ECFDF5", margin: 0 }}>Key created — copy it now</p>
                  <p style={{ fontSize: 11, color: "rgba(167,243,208,0.7)", margin: 0 }}>This is the only time the full key is shown.</p>
                </div>
              </div>
              <button onClick={() => setRevealed(null)} style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(167,243,208,0.8)",
              }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div style={{
              background: "#ECFDF5", padding: "16px 22px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <code style={{
                flex: 1, fontFamily: "var(--font-mono)", fontSize: 13,
                color: "#065F46", wordBreak: "break-all", lineHeight: 1.5,
              }}>
                {revealed.key}
              </code>
              <button
                onClick={() => copy(revealed.key, "revealed")}
                style={{
                  flexShrink: 0, padding: "8px 16px", borderRadius: 10,
                  border: "1px solid #A7F3D0", background: "white",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  color: "#065F46", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "background .12s",
                }}
              >
                {copiedId === "revealed" ? (
                  <><CheckIcon color="#065F46" /> Copied</>
                ) : (
                  <><CopyIcon color="#065F46" /> Copy key</>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "oklch(0.97 0.02 28)", border: "1px solid oklch(0.88 0.06 28)",
            fontSize: 13, color: "var(--accent-ink)",
          }}>{error}</div>
        )}

        {/* Usage snippet */}
        <div style={{
          borderRadius: 16, overflow: "hidden",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow-xs)",
        }}>
          <div style={{
            padding: "10px 18px", background: "#1A1A12",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#FF5F56","#FFBD2E","#27C93F"].map((c) => (
                <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>terminal</span>
          </div>
          <div style={{ background: "#0F0F0A", padding: "18px 22px" }}>
            <pre style={{
              margin: 0, fontFamily: "var(--font-mono)", fontSize: 12.5,
              lineHeight: 1.8, color: "#C5C5B8", overflowX: "auto",
            }}>{[
              { color: "#6B9B6B", text: "# Analyze a job posting via API" },
              { color: "#C5C5B8", text: "curl -X POST https://your-domain/api/analyze \\" },
              { color: "#C5C5B8", text: '  -H "Content-Type: application/json" \\' },
              { color: "#A8C4E8", text: '  -H "X-API-Key: fai_••••••••••••" \\' },
              { color: "#C5C5B8", text: `  -d '{"input": "paste job offer here"}'` },
            ].map((line, i) => (
              <span key={i} style={{ display: "block", color: line.color }}>{line.text}</span>
            ))}</pre>
          </div>
        </div>

        {/* Active keys */}
        {loading ? (
          <LoadingState />
        ) : activeKeys.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "#ECFDF5", border: "1px solid #A7F3D0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#10B981",
                }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="6" cy="7" r="4" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M9.5 10.5l3.5 3.5M6 5V3M6 11V9M3 7H1M11 7H9M3.9 4.9L2.5 3.5M9.5 10.5L8.1 9.1M9.1 4.9L10.5 3.5M3.9 9.1L2.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-1)", margin: 0 }}>Active Keys</p>
                  <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{activeKeys.length} key{activeKeys.length !== 1 ? "s" : ""} in use</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  fontSize: 12, fontWeight: 600, color: "var(--ink-2)",
                  padding: "7px 14px", borderRadius: 10,
                  border: "1px solid var(--line)", background: "var(--bg-elev)",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "all .12s",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                New key
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeKeys.map((k) => (
                <KeyCard key={k.id} k={k} onRevoke={handleRevoke} onCopy={copy} copiedId={copiedId} />
              ))}
            </div>
          </section>
        )}

        {/* Revoked keys */}
        {revokedKeys.length > 0 && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "var(--bg-sunken)", border: "1px solid var(--line)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--ink-4)",
              }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 7.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-3)", margin: 0 }}>Revoked</p>
                <p style={{ fontSize: 12, color: "var(--ink-4)", margin: 0 }}>{revokedKeys.length} revoked key{revokedKeys.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 0.55 }}>
              {revokedKeys.map((k) => (
                <KeyCard key={k.id} k={k} revoked />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Create key modal */}
      {showCreate && (
        <CreateKeyModal
          name={newName}
          onNameChange={setNewName}
          onSubmit={handleCreate}
          creating={creating}
          error={error}
          onClose={() => { setShowCreate(false); setNewName(""); setError(null); }}
        />
      )}
    </div>
  );
}

function KeyCard({ k, onRevoke, onCopy, copiedId, revoked = false }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      borderRadius: 16, border: "1px solid var(--line)",
      background: "var(--bg-elev)",
      boxShadow: "var(--shadow-xs)",
      overflow: "hidden",
      transition: "box-shadow .15s",
    }}>
      <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Status indicator */}
        <div style={{
          width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
          background: revoked ? "var(--ink-4)" : "#10B981",
          boxShadow: revoked ? "none" : "0 0 0 3px #ECFDF5",
        }} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-1)", letterSpacing: "-0.01em" }}>
              {k.name}
            </span>
            <code style={{
              fontSize: 11, fontFamily: "var(--font-mono)",
              background: "var(--bg-sunken)", color: "var(--ink-3)",
              padding: "2px 8px", borderRadius: 6, border: "1px solid var(--line)",
            }}>
              {k.preview}
            </code>
            {!revoked && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "2px 8px", borderRadius: 999,
                background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46",
              }}>Active</span>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <MetaChip icon={<CalIcon />} text={`Created ${fmtDate(k.createdAt)}`} />
            {k.lastUsedAt && <MetaChip icon={<ClockIcon />} text={`Used ${fmtDate(k.lastUsedAt)}`} />}
            <MetaChip
              icon={<ActivityIcon />}
              text={`${(k.requests || 0).toLocaleString()} call${k.requests !== 1 ? "s" : ""}`}
              bold
            />
            {k.credits !== undefined && (
              <MetaChip
                icon={<CreditIcon />}
                text={`${(k.credits || 0).toLocaleString()} credits`}
                bold={k.credits < 50}
                warn={k.credits < 50}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        {!revoked && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => onCopy(k.preview, k.id)}
              style={{
                padding: "7px 14px", borderRadius: 10,
                border: "1px solid var(--line)", background: "var(--bg-elev)",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6,
                transition: "all .12s",
              }}
            >
              {copiedId === k.id ? <><CheckIcon color="#10B981" /> Copied</> : <><CopyIcon /> Copy</>}
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                padding: "7px 10px", borderRadius: 10,
                border: "1px solid var(--line)", background: "var(--bg-elev)",
                fontSize: 12, cursor: "pointer", color: "var(--ink-3)",
                display: "flex", alignItems: "center",
                transition: "all .12s",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Expanded revoke section */}
      {expanded && !revoked && (
        <div style={{
          borderTop: "1px solid var(--line)", padding: "14px 22px",
          background: "var(--bg-sunken)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          flexWrap: "wrap",
        }}>
          <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, lineHeight: 1.6 }}>
            Revoking this key will immediately block all requests using it.
            This action cannot be undone.
          </p>
          <button
            onClick={() => onRevoke(k.id)}
            style={{
              padding: "7px 16px", borderRadius: 10,
              border: "1px solid #FECACA", background: "#FFF5F5",
              fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#B91C1C",
              whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
              transition: "all .12s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Revoke key
          </button>
        </div>
      )}
    </div>
  );
}

function CreateKeyModal({ name, onNameChange, onSubmit, creating, error, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(10,10,8,0.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "var(--bg-elev)", borderRadius: 20,
        border: "1px solid var(--line)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
        width: "100%", maxWidth: 440,
        animation: "slideUp .2s cubic-bezier(.2,.8,.2,1) both",
      }}>
        {/* Modal header */}
        <div style={{
          padding: "20px 24px 18px",
          borderBottom: "1px solid var(--line)",
          background: "var(--bg-sunken)", borderRadius: "20px 20px 0 0",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", margin: "0 0 4px" }}>
              New API Key
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-1)", margin: 0, letterSpacing: "-0.01em" }}>
              Create a key
            </p>
            <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "3px 0 0" }}>
              Give it a name to identify where it's used
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 9, border: "1px solid var(--line)",
            background: "var(--bg-elev)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ink-3)",
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", letterSpacing: "0.03em" }}>
                Key name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. Production — Acme Corp"
                maxLength={80}
                autoFocus
                style={{
                  padding: "11px 14px", borderRadius: 11,
                  border: "1px solid var(--line)", background: "var(--bg)",
                  fontSize: 14, color: "var(--ink-1)", fontFamily: "var(--font-ui)",
                  outline: "none", transition: "border-color .15s",
                }}
              />
              <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                {name.length}/80 · Helps you identify this key later
              </span>
            </label>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "oklch(0.97 0.02 28)", border: "1px solid oklch(0.88 0.06 28)",
                fontSize: 12, color: "var(--accent-ink)",
              }}>{error}</div>
            )}

            {/* Info note */}
            <div style={{
              padding: "12px 14px", borderRadius: 11,
              background: "#FFFBEB", border: "1px solid #FDE68A",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }}>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 6.5v3M7 5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.55 }}>
                The full key is shown <strong>once</strong> after creation. Copy it immediately — it cannot be retrieved again.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: "11px", borderRadius: 11,
                  border: "1px solid var(--line)", background: "var(--bg-elev)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", color: "var(--ink-2)",
                  transition: "all .12s",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !name.trim()}
                style={{
                  flex: 2, padding: "11px", borderRadius: 11, border: "none",
                  background: "var(--ink-1)", color: "white",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  opacity: creating || !name.trim() ? 0.4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "opacity .15s",
                }}
              >
                {creating ? (
                  <>
                    <span style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                      display: "inline-block", animation: "spin 0.75s linear infinite",
                    }} />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="5.5" cy="5.5" r="3.5" stroke="white" strokeWidth="1.4"/>
                      <path d="M8.5 8.5l3 3M5.5 3V2M5.5 9V8M2 5.5H1M10 5.5H9" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Generate key
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div style={{
      padding: "60px 40px", borderRadius: 20,
      border: "1px dashed var(--line-strong)",
      textAlign: "center", background: "var(--bg-elev)",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
        background: "var(--bg-sunken)", border: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink-4)",
      }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M17 17l5.5 5.5M11 7V5M11 17v-2M5 11H3M19 11h-2M7.05 7.05L5.64 5.64M16.95 16.95l-1.41-1.41M16.95 7.05l1.41-1.41M7.05 16.95L5.64 18.36" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-1)", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
        No API keys yet
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 24px", lineHeight: 1.6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
        Create a key to start integrating Flagged AI into your systems via the REST API.
      </p>
      <button
        onClick={onCreate}
        style={{
          padding: "10px 24px", borderRadius: 12, border: "none",
          background: "var(--ink-1)", color: "white",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 8,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Create first key
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2].map((i) => (
        <div key={i} style={{
          height: 90, borderRadius: 16, border: "1px solid var(--line)",
          background: "var(--bg-elev)",
          backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(20,20,15,0.03) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }`}</style>
    </div>
  );
}

function MetaChip({ icon, text, bold, warn }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 12, color: warn ? "#D97706" : "var(--ink-3)",
      fontWeight: bold ? 600 : 400,
    }}>
      <span style={{ color: warn ? "#D97706" : "var(--ink-4)", display: "flex" }}>{icon}</span>
      {text}
    </span>
  );
}

function CopyIcon({ color = "currentColor" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.3"/>
      <path d="M1 8V1.5A.5.5 0 011.5 1H8" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon({ color = "#10B981" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <rect x="1" y="2" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 5h9M3.5 1v2M7.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5.5 3v2.5L7.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M1 6l2-3 2 4 2-5 2 3 1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <rect x="1" y="3" width="9" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 5.5h9" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function fmtDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
