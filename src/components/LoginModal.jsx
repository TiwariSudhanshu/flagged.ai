"use client";
import { signIn } from "next-auth/react";

export default function LoginModal({ onClose }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(10,10,8,0.6)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, fontFamily: "var(--font-ui)",
        animation: "fadeIn .18s ease both",
      }}
    >
      <div style={{
        background: "var(--bg-elev)", borderRadius: 22,
        border: "1px solid var(--line)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
        width: "100%", maxWidth: 380, overflow: "hidden",
        animation: "slideUp .22s cubic-bezier(.2,.8,.2,1) both",
      }}>

        {/* Top dark band */}
        <div style={{
          background: "linear-gradient(135deg, #0F0F0A, #1C1C14)",
          padding: "32px 32px 28px", textAlign: "center",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 80% 60% at 50% 100%, oklch(0.62 0.16 28 / 0.18), transparent)",
          }} />
          {/* Logo */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
            overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Flagged AI" width={52} height={52} style={{ display: "block", objectFit: "cover" }} />
          </div>
          <h2 style={{
            fontSize: 20, fontWeight: 700, color: "#F5F5F0",
            letterSpacing: "-0.01em", margin: "0 0 6px",
          }}>
            Sign in to Flagged AI
          </h2>
          <p style={{ fontSize: 13, color: "rgba(245,245,240,0.5)", margin: 0, lineHeight: 1.5 }}>
            Save your analysis history and access it across devices
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 28px 24px" }}>

          {/* Google button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            style={{
              width: "100%", padding: "13px 20px", borderRadius: 12,
              border: "1px solid var(--line)", background: "var(--bg-elev)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              fontSize: 14, fontWeight: 600, color: "var(--ink-1)",
              cursor: "pointer", boxShadow: "var(--shadow-sm)",
              transition: "box-shadow .15s, border-color .15s",
              fontFamily: "var(--font-ui)",
            }}
          >
            <GoogleLogo />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            margin: "20px 0",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.06em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>

          {/* Continue without login */}
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "11px 20px", borderRadius: 12,
              border: "1px solid var(--line)", background: "transparent",
              fontSize: 13, fontWeight: 500, color: "var(--ink-3)",
              cursor: "pointer", fontFamily: "var(--font-ui)",
              transition: "color .15s",
            }}
          >
            Continue without signing in
          </button>

          {/* Fine print */}
          <p style={{
            fontSize: 11, color: "var(--ink-4)", textAlign: "center",
            margin: "16px 0 0", lineHeight: 1.5,
          }}>
            We only use your Google account to save history.<br />
            No spam, no data selling.
          </p>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
