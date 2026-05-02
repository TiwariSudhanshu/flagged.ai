import Link from "next/link";
import { REGISTRY } from "@/lib/planner";

export default function AgentsPage() {
  const categories = [...new Set(REGISTRY.map((a) => a.category))];

  return (
    <div className="min-h-full bg-white">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-3 border-b border-zinc-200 sticky top-0 bg-white z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Link>
        <span className="text-zinc-200">|</span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
          <span className="font-semibold text-[15px] text-zinc-900">Flagged AI</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-10">
        {/* Hero */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold text-zinc-900">Agents</h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            The planner selects only the relevant agents for each submission — no wasted checks.
          </p>
        </div>

        {/* Agents by category */}
        {categories.map((cat) => (
          <section key={cat} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{cat}</h2>
            <div className="flex flex-col gap-2">
              {REGISTRY.filter((a) => a.category === cat).map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

function AgentCard({ agent }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors px-5 py-4 flex items-start gap-4">
      <div className="shrink-0 h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 mt-0.5">
        <AgentIcon id={agent.id} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-zinc-900 text-sm">{agent.label}</span>
          <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
            {agent.triggerLabel}
          </span>
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed">{agent.description}</p>
      </div>
    </article>
  );
}

function AgentIcon({ id }) {
  switch (id) {
    case "scamDb":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5L13.5 3.5V8C13.5 11 11 13.5 8 14C5 13.5 2.5 11 2.5 8V3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M5.5 8l2 2L11 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "domainAgent":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 2C8 2 6 4.5 6 8s2 6 2 6M8 2c0 0 2 2.5 2 6s-2 6-2 6" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2 8h12" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      );
    case "gst":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M6 6h4M6 8h4M6 10h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      );
    case "mca":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5.5 13V9.5h5V13" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M2 7h12M5.5 6V5a2.5 2.5 0 015 0v1" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      );
    case "linkedinAgent":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      );
    case "emailAgent":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2 5.5l6 4.5 6-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      );
  }
}
