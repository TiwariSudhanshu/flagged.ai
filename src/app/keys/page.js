"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function KeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [revealed, setRevealed] = useState(null); // { id, key } shown once after creation
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>
          <span className="text-zinc-200">|</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="font-semibold text-[15px] text-zinc-900">Flagged AI</span>
          </div>
        </div>
        <span className="text-xs text-zinc-400">{activeKeys.length} active key{activeKeys.length !== 1 ? "s" : ""}</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Hero */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold text-zinc-900">API Keys</h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            Generate keys for businesses and integrations. Pass the key in the{" "}
            <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-zinc-700">X-API-Key</code>{" "}
            header when calling <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-zinc-700">POST /api/analyze</code>.
          </p>
        </div>

        {/* Usage snippet */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 flex flex-col gap-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Usage</span>
          <pre className="text-xs text-zinc-600 leading-relaxed overflow-x-auto">{`curl -X POST https://your-domain/api/analyze \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: fai_••••••••••••" \\
  -d '{"input": "paste job offer here"}'`}</pre>
        </div>

        {/* Create key */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-700">Create new key</h2>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Acme Corp integration"
              maxLength={80}
              className="flex-1 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors"
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium disabled:opacity-30 hover:bg-zinc-700 transition-colors shrink-0"
            >
              {creating ? "Creating…" : "Generate key"}
            </button>
          </form>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </section>

        {/* One-time reveal */}
        {revealed && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-800">Key created — save it now</span>
              <button onClick={() => setRevealed(null)} className="text-emerald-400 hover:text-emerald-700 transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-emerald-700">This is the only time the full key is shown. Copy it before closing.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-white border border-emerald-200 rounded-xl px-3.5 py-2.5 text-zinc-800 break-all">
                {revealed.key}
              </code>
              <button
                onClick={() => copy(revealed.key, "revealed")}
                className="shrink-0 px-3.5 py-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-700 bg-white hover:bg-emerald-50 transition-colors font-medium"
              >
                {copiedId === "revealed" ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Active keys */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400 py-4">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : activeKeys.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-700">Active keys</h2>
            <div className="flex flex-col gap-2">
              {activeKeys.map((k) => (
                <KeyRow key={k.id} k={k} onRevoke={handleRevoke} onCopy={copy} copiedId={copiedId} />
              ))}
            </div>
          </section>
        ) : (
          <p className="text-sm text-zinc-400">No active keys yet.</p>
        )}

        {/* Revoked keys */}
        {revokedKeys.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-400">Revoked</h2>
            <div className="flex flex-col gap-2 opacity-50">
              {revokedKeys.map((k) => (
                <KeyRow key={k.id} k={k} revoked />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function KeyRow({ k, onRevoke, onCopy, copiedId, revoked = false }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 flex items-center gap-4">
      {/* Status dot */}
      <span className={`h-2 w-2 rounded-full flex-none ${revoked ? "bg-zinc-300" : "bg-emerald-500"}`} />

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-900 truncate">{k.name}</span>
          <code className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
            {k.preview}
          </code>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>Created {fmtDate(k.createdAt)}</span>
          {k.lastUsedAt && <span>Last used {fmtDate(k.lastUsedAt)}</span>}
          <span>{k.requests.toLocaleString()} request{k.requests !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Actions */}
      {!revoked && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onCopy(k.preview, k.id)}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            {copiedId === k.id ? "Copied ✓" : "Copy preview"}
          </button>
          <button
            onClick={() => onRevoke(k.id)}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
          >
            Revoke
          </button>
        </div>
      )}
    </div>
  );
}

function fmtDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
