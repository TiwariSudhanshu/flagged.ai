"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const PACKS = [
  { credits: 100, price: "$1.00", label: "Starter", calls: 10 },
  { credits: 500, price: "$5.00", label: "Growth", calls: 50, popular: true },
  { credits: 1000, price: "$10.00", label: "Pro", calls: 100 },
  { credits: 5000, price: "$50.00", label: "Scale", calls: 500 },
];

export default function BillingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(500);
  const [selectedKey, setSelectedKey] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing");
      if (!res.ok) throw new Error("Failed to load billing data");
      const d = await res.json();
      setData(d);
      if (!selectedKey && d.keys?.length > 0) setSelectedKey(d.keys[0].id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function doRecharge() {
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId: selectedKey, credits: selectedPack }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Recharge failed");
    return result;
  }

  function openPayModal() {
    if (!selectedKey || !selectedPack) return;
    setSuccess(null);
    setError(null);
    setShowPayModal(true);
  }

  async function onPaySuccess() {
    setShowPayModal(false);
    try {
      const result = await doRecharge();
      setSuccess(`+${selectedPack} credits added — balance now ${result.balanceAfter.toLocaleString()}`);
      await fetchData();
    } catch (e) {
      setError(e.message);
    }
  }

  const totalCalls = data?.keys?.reduce((s, k) => s + (k.requests || 0), 0) ?? 0;
  const selectedPackMeta = PACKS.find((p) => p.credits === selectedPack);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-ui)" }}>

      {/* Header */}
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
          <span style={{ fontWeight: 600, fontSize: 14 }}>Flagged AI</span>
        </div>
        <div style={{ flex: 1 }} />
        <Link href="/agents" style={{
          fontSize: 12, color: "var(--ink-3)", textDecoration: "none",
          padding: "5px 12px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--bg-elev)",
        }}>Agents</Link>
        <Link href="/keys" style={{
          fontSize: 12, fontWeight: 500, color: "white", textDecoration: "none",
          padding: "5px 12px", borderRadius: 999, background: "var(--ink-1)",
        }}>API Keys</Link>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px", display: "flex", flexDirection: "column", gap: 40 }}>

        {/* Hero */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink-1)", margin: "0 0 6px" }}>
            Billing & Credits
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
            10 credits per{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--bg-sunken)", padding: "1px 6px", borderRadius: 5, border: "1px solid var(--line)" }}>
              POST /api/analyze
            </code>
            {" "}call · Credits never expire · No real charges
          </p>
        </div>

        {loading ? (
          <LoadingPulse />
        ) : error && !data ? (
          <ErrorCard message={error} />
        ) : (
          <>
            {/* Wallet summary */}
            <WalletSummary totalCredits={data.totalCredits} totalCalls={totalCalls} keyCount={data.keys?.length ?? 0} />

            {/* Recharge section */}
            <section>
              <SectionHeader
                icon={
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v12M3 7l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                title="Top up balance"
                subtitle="Select a pack and an API key, then click Add Credits"
              />

              {data.keys?.length === 0 ? (
                <div style={{
                  padding: "28px", borderRadius: 14, border: "1px dashed var(--line)",
                  textAlign: "center", color: "var(--ink-3)", fontSize: 14,
                }}>
                  <p style={{ margin: "0 0 12px" }}>No API keys yet. Create one first.</p>
                  <Link href="/keys" style={{
                    display: "inline-block", padding: "8px 18px", borderRadius: 999,
                    background: "var(--ink-1)", color: "white", fontSize: 13,
                    fontWeight: 500, textDecoration: "none",
                  }}>Create API Key</Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Pack selector */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
                    {PACKS.map((pack) => (
                      <button
                        key={pack.credits}
                        onClick={() => setSelectedPack(pack.credits)}
                        style={{
                          position: "relative", padding: "18px 16px", borderRadius: 14,
                          border: selectedPack === pack.credits
                            ? "2px solid var(--ink-1)"
                            : "1px solid var(--line)",
                          background: selectedPack === pack.credits ? "var(--ink-1)" : "var(--bg-elev)",
                          cursor: "pointer", textAlign: "left",
                          boxShadow: selectedPack === pack.credits ? "var(--shadow-md)" : "var(--shadow-xs)",
                          transition: "all .15s",
                        }}
                      >
                        {pack.popular && (
                          <span style={{
                            position: "absolute", top: -10, right: 12,
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", padding: "3px 8px", borderRadius: 999,
                            background: "var(--accent)", color: "white",
                          }}>Popular</span>
                        )}
                        <div style={{
                          fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em",
                          color: selectedPack === pack.credits ? "#F5F5F0" : "var(--ink-1)",
                          marginBottom: 4,
                        }}>
                          {pack.credits.toLocaleString()}
                        </div>
                        <div style={{
                          fontSize: 12, color: selectedPack === pack.credits ? "rgba(245,245,240,0.6)" : "var(--ink-3)",
                          marginBottom: 10,
                        }}>
                          credits · {pack.calls} calls
                        </div>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: selectedPack === pack.credits ? "#F5F5F0" : "var(--ink-2)",
                        }}>
                          {pack.price}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: selectedPack === pack.credits ? "rgba(245,245,240,0.45)" : "var(--ink-4)",
                        }}>
                          {pack.label}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Key selector + CTA */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                      <select
                        value={selectedKey}
                        onChange={(e) => setSelectedKey(e.target.value)}
                        style={{
                          width: "100%", padding: "10px 14px", borderRadius: 12,
                          border: "1px solid var(--line)", background: "var(--bg-elev)",
                          fontSize: 13, color: "var(--ink-1)", outline: "none",
                          cursor: "pointer", appearance: "none",
                          fontFamily: "var(--font-ui)",
                        }}
                      >
                        {data.keys.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.name} — {k.credits.toLocaleString()} credits
                          </option>
                        ))}
                      </select>
                      <div style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        pointerEvents: "none", color: "var(--ink-3)",
                      }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    <button
                      onClick={openPayModal}
                      disabled={!selectedKey}
                      style={{
                        padding: "10px 22px", borderRadius: 12, border: "none",
                        background: "var(--ink-1)", color: "white",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        opacity: !selectedKey ? 0.4 : 1,
                        transition: "opacity .15s, transform .12s",
                        display: "flex", alignItems: "center", gap: 8,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M1 6h12" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M3.5 9h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                      Pay {selectedPackMeta?.price ?? ""}
                    </button>
                  </div>

                  {success && (
                    <div style={{
                      padding: "12px 16px", borderRadius: 12,
                      background: "#ECFDF5", border: "1px solid #A7F3D0",
                      fontSize: 13, color: "#065F46", fontWeight: 500,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6.5" stroke="#10B981" strokeWidth="1.3"/>
                        <path d="M5 8l2.5 2.5L11 6" stroke="#10B981" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {success}
                    </div>
                  )}
                  {error && <ErrorCard message={error} />}
                </div>
              )}
            </section>

            {/* Per-key balances */}
            {data.keys?.length > 0 && (
              <section>
                <SectionHeader
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M10.5 8.5a.5.5 0 110-1 .5.5 0 010 1z" fill="currentColor"/>
                      <path d="M2 7h12" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                  }
                  title="Key balances"
                  subtitle="Credits available per API key"
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.keys.map((k) => (
                    <KeyBalanceRow key={k.id} k={k} onQuickRecharge={(keyId) => {
                      setSelectedKey(keyId);
                      document.getElementById("recharge-section")?.scrollIntoView({ behavior: "smooth" });
                    }} />
                  ))}
                </div>
              </section>
            )}

            {/* Transaction history */}
            {data.transactions?.length > 0 && (
              <section>
                <SectionHeader
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v6l3.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                  }
                  title="Transaction history"
                  subtitle={`Last ${data.transactions.length} transactions across all keys`}
                />
                <div style={{
                  background: "var(--bg-elev)", border: "1px solid var(--line)",
                  borderRadius: 14, overflow: "hidden",
                }}>
                  {data.transactions.map((t, i) => (
                    <TransactionRow key={t.id} t={t} last={i === data.transactions.length - 1} />
                  ))}
                </div>
              </section>
            )}

            {/* Pricing note */}
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
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", margin: "0 0 3px" }}>
                  Pricing model
                </p>
                <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.65, margin: 0 }}>
                  <strong style={{ color: "var(--ink-2)" }}>10 credits</strong> are deducted per{" "}
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "rgba(20,20,15,0.05)", padding: "1px 5px", borderRadius: 4 }}>
                    POST /api/analyze
                  </code>{" "}
                  call made with an API key. Direct web app usage is free.
                  If your balance hits 0, the API returns <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "rgba(20,20,15,0.05)", padding: "1px 5px", borderRadius: 4 }}>402 Payment Required</code>.
                  Recharge any time above — no real card required.
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Payment Modal */}
      {showPayModal && (
        <PaymentModal
          pack={selectedPackMeta}
          keyName={data?.keys?.find((k) => k.id === selectedKey)?.name ?? "API Key"}
          onClose={() => setShowPayModal(false)}
          onSuccess={onPaySuccess}
        />
      )}
    </div>
  );
}

function WalletSummary({ totalCredits, totalCalls, keyCount }) {
  const estimatedCalls = Math.floor(totalCredits / 10);

  return (
    <div style={{
      background: "linear-gradient(135deg, #0F0F0A 0%, #1C1C14 100%)",
      borderRadius: 20, padding: "32px 36px",
      display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap",
      boxShadow: "var(--shadow-lg)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 50% 80% at 80% 50%, oklch(0.62 0.16 28 / 0.12), transparent)",
      }} />

      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(245,245,240,0.45)", margin: "0 0 8px", fontWeight: 600 }}>
          Total Balance
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 52, fontWeight: 400,
            letterSpacing: "-0.03em", color: "#F5F5F0", lineHeight: 1,
          }}>
            {totalCredits.toLocaleString()}
          </span>
          <span style={{ fontSize: 16, color: "rgba(245,245,240,0.45)", fontWeight: 500 }}>
            credits
          </span>
        </div>
        <p style={{ fontSize: 13, color: "rgba(245,245,240,0.45)", margin: "8px 0 0" }}>
          ≈ {estimatedCalls.toLocaleString()} API calls remaining
        </p>
      </div>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        <Stat label="API Keys" value={keyCount} light />
        <Stat label="Total Calls" value={totalCalls.toLocaleString()} light />
        <Stat label="Per Call" value="10 cr" light />
      </div>
    </div>
  );
}

function Stat({ label, value, light }) {
  return (
    <div>
      <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: light ? "rgba(245,245,240,0.4)" : "var(--ink-3)", margin: "0 0 4px", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 700, color: light ? "#F5F5F0" : "var(--ink-1)", margin: 0, letterSpacing: "-0.02em" }}>
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: "var(--bg-sunken)", border: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink-3)", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-1)", margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  );
}

function KeyBalanceRow({ k, onQuickRecharge }) {
  const pct = Math.min(100, (k.credits / 1000) * 100);

  return (
    <div style={{
      background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: 14,
      padding: "16px 20px", display: "flex", gap: 16, alignItems: "center",
    }}>
      {/* Status dot */}
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        background: k.credits > 50 ? "var(--ok)" : k.credits > 0 ? "var(--warn)" : "#E5E5E5",
        boxShadow: k.credits > 50 ? "0 0 0 3px var(--ok-soft)" : k.credits > 0 ? "0 0 0 3px var(--warn-soft)" : "none",
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-1)" }}>{k.name}</span>
          <code style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)", background: "var(--bg-sunken)", padding: "2px 7px", borderRadius: 6, border: "1px solid var(--line)" }}>
            {k.preview}
          </code>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            flex: 1, height: 4, borderRadius: 999,
            background: "rgba(20,20,15,0.06)", overflow: "hidden", maxWidth: 180,
          }}>
            <div style={{
              height: "100%", borderRadius: 999,
              width: `${pct}%`,
              background: k.credits > 50 ? "var(--ok)" : k.credits > 0 ? "var(--warn)" : "var(--ink-4)",
              transition: "width .4s ease",
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-1)", whiteSpace: "nowrap" }}>
            {k.credits.toLocaleString()} credits
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
            {k.requests.toLocaleString()} calls
          </span>
        </div>
      </div>

      <button
        onClick={() => onQuickRecharge(k.id)}
        style={{
          fontSize: 12, fontWeight: 500, padding: "7px 14px", borderRadius: 10,
          border: "1px solid var(--line)", background: "var(--bg-elev)",
          color: "var(--ink-2)", cursor: "pointer", whiteSpace: "nowrap",
          transition: "all .12s",
        }}
      >
        Recharge
      </button>
    </div>
  );
}

function TransactionRow({ t, last }) {
  const isRecharge = t.type === "recharge";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "13px 20px",
      borderBottom: last ? "none" : "1px solid var(--line)",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: isRecharge ? "#ECFDF5" : "#FFF7ED",
        border: `1px solid ${isRecharge ? "#A7F3D0" : "#FDE68A"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: isRecharge ? "#10B981" : "#F59E0B",
      }}>
        {isRecharge ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", margin: 0 }}>
          {isRecharge ? "Credits added" : "API call"}
        </p>
        <p style={{ fontSize: 11, color: "var(--ink-3)", margin: 0 }}>
          {t.keyName} · {fmtDate(t.createdAt)}
        </p>
      </div>

      <div style={{ textAlign: "right" }}>
        <p style={{
          fontSize: 14, fontWeight: 700, margin: 0,
          color: isRecharge ? "#10B981" : "var(--ink-2)",
        }}>
          {isRecharge ? "+" : ""}{t.credits.toLocaleString()}
        </p>
        <p style={{ fontSize: 11, color: "var(--ink-3)", margin: 0 }}>
          bal. {t.balanceAfter?.toLocaleString() ?? "—"}
        </p>
      </div>
    </div>
  );
}

function PaymentModal({ pack, keyName, onClose, onSuccess }) {
  const [step, setStep] = useState("form"); // form | processing | done
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [cardError, setCardError] = useState("");

  function formatCardNumber(val) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(val) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  async function handlePay(e) {
    e.preventDefault();
    const digits = card.number.replace(/\s/g, "");
    if (digits.length < 16) { setCardError("Enter a valid 16-digit card number"); return; }
    if (card.expiry.length < 5) { setCardError("Enter a valid expiry (MM/YY)"); return; }
    if (card.cvv.length < 3) { setCardError("Enter a valid CVV"); return; }
    if (!card.name.trim()) { setCardError("Enter the name on card"); return; }
    setCardError("");
    setStep("processing");
    // Fake processing delay
    await new Promise((r) => setTimeout(r, 2200));
    setStep("done");
    await new Promise((r) => setTimeout(r, 900));
    onSuccess();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(10,10,8,0.6)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      animation: "fadeIn .18s ease both",
    }}
      onClick={(e) => { if (e.target === e.currentTarget && step === "form") onClose(); }}
    >
      <div style={{
        background: "var(--bg-elev)", borderRadius: 20,
        border: "1px solid var(--line)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
        width: "100%", maxWidth: 420,
        overflow: "hidden",
        animation: "slideUp .22s cubic-bezier(.2,.8,.2,1) both",
      }}>

        {step === "processing" && (
          <div style={{ padding: "52px 40px", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", margin: "0 auto 24px",
              border: "3px solid var(--line)", borderTopColor: "var(--ink-1)",
              animation: "spin 0.75s linear infinite",
            }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-1)", margin: "0 0 6px" }}>
              Processing payment…
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
              Verifying card and adding credits
            </p>
          </div>
        )}

        {step === "done" && (
          <div style={{ padding: "52px 40px", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", margin: "0 auto 24px",
              background: "#ECFDF5", border: "2px solid #A7F3D0",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L20 7" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-1)", margin: "0 0 6px" }}>
              Payment successful!
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
              +{pack?.credits.toLocaleString()} credits added to <strong style={{ color: "var(--ink-2)" }}>{keyName}</strong>
            </p>
          </div>
        )}

        {step === "form" && (
          <>
            {/* Modal header */}
            <div style={{
              padding: "20px 24px 18px",
              borderBottom: "1px solid var(--line)",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              background: "var(--bg-sunken)",
            }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 600, margin: "0 0 4px" }}>
                  Secure Checkout
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-1)", margin: 0, letterSpacing: "-0.01em" }}>
                  {pack?.label} — {pack?.price}
                </p>
                <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "3px 0 0" }}>
                  {pack?.credits.toLocaleString()} credits · {pack?.calls} API calls → <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>{keyName}</span>
                </p>
              </div>
              <button onClick={onClose} style={{
                width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)",
                background: "var(--bg-elev)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--ink-3)",
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Card form */}
            <form onSubmit={handlePay} style={{ padding: "24px" }}>

              {/* Fake card visual */}
              <div style={{
                background: "linear-gradient(135deg, #1A1A12 0%, #2A2A1A 100%)",
                borderRadius: 14, padding: "20px 22px", marginBottom: 22,
                position: "relative", overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "oklch(0.62 0.16 28 / 0.2)" }} />
                <div style={{ position: "absolute", bottom: -30, left: 20, width: 80, height: 80, borderRadius: "50%", background: "oklch(0.62 0.16 28 / 0.1)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>FLAGGED AI</span>
                  <div style={{ display: "flex" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EB5757", opacity: 0.9 }} />
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#F5A623", opacity: 0.9, marginLeft: -10 }} />
                  </div>
                </div>
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: 17, letterSpacing: "0.18em",
                  color: "#F5F5F0", margin: "0 0 14px", lineHeight: 1,
                }}>
                  {card.number || "•••• •••• •••• ••••"}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "0 0 2px", textTransform: "uppercase" }}>Card holder</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 500 }}>{card.name || "Your Name"}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "0 0 2px", textTransform: "uppercase" }}>Expires</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, fontFamily: "var(--font-mono)" }}>{card.expiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Card number */}
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", letterSpacing: "0.04em" }}>Card number</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={card.number}
                    onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                    style={inputStyle}
                    autoComplete="cc-number"
                  />
                </label>

                {/* Expiry + CVV */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", letterSpacing: "0.04em" }}>Expiry</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={card.expiry}
                      onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                      style={inputStyle}
                      autoComplete="cc-exp"
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", letterSpacing: "0.04em" }}>CVV</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="•••"
                      maxLength={4}
                      value={card.cvv}
                      onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      style={inputStyle}
                      autoComplete="cc-csc"
                    />
                  </label>
                </div>

                {/* Name */}
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", letterSpacing: "0.04em" }}>Name on card</span>
                  <input
                    type="text"
                    placeholder="Rahul Sharma"
                    value={card.name}
                    onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                    style={inputStyle}
                    autoComplete="cc-name"
                  />
                </label>

                {cardError && (
                  <p style={{ fontSize: 12, color: "var(--accent-ink)", margin: 0 }}>{cardError}</p>
                )}

                <button type="submit" style={{
                  marginTop: 4,
                  padding: "13px", borderRadius: 12, border: "none",
                  background: "var(--ink-1)", color: "white",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  letterSpacing: "-0.01em",
                  boxShadow: "var(--shadow-md)",
                  transition: "transform .12s",
                }}>
                  Pay {pack?.price} →
                </button>
              </div>

              {/* Trust badges */}
              <div style={{
                marginTop: 16, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 16,
              }}>
                {[
                  { icon: "🔒", text: "SSL encrypted" },
                  { icon: "🧪", text: "Test mode" },
                  { icon: "✅", text: "No real charge" },
                ].map(({ icon, text }) => (
                  <span key={text} style={{ fontSize: 11, color: "var(--ink-4)", display: "flex", alignItems: "center", gap: 4 }}>
                    {icon} {text}
                  </span>
                ))}
              </div>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

const inputStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "var(--bg)",
  fontSize: 14,
  fontFamily: "var(--font-mono)",
  color: "var(--ink-1)",
  outline: "none",
  letterSpacing: "0.04em",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color .15s",
};

function LoadingPulse() {
  return (
    <div style={{ display: "flex", gap: 6, padding: "40px 0", justifyContent: "center" }}>
      {[0, 150, 300].map((d) => (
        <span key={d} style={{
          width: 8, height: 8, borderRadius: "50%", background: "var(--ink-4)",
          animation: "bob 1.2s ease-in-out infinite", animationDelay: `${d}ms`,
        }} />
      ))}
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <div style={{
      padding: "12px 16px", borderRadius: 12,
      background: "oklch(0.97 0.02 28)", border: "1px solid oklch(0.88 0.06 28)",
      fontSize: 13, color: "var(--accent-ink)",
    }}>
      {message}
    </div>
  );
}

function fmtDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
