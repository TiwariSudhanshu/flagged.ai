"use client";

const VERDICT_DOT = {
  scam:        "bg-red-500",
  suspicious:  "bg-amber-400",
  likely_legit:"bg-emerald-500",
};

function fmtDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Sidebar({ open, history, activeId, onSelect, onDelete, onNew }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/20 sm:hidden"
          onClick={() => onNew()}
        />
      )}

      {/* Sidebar panel */}
      <aside
        style={{ width: open ? 256 : 0 }}
        className="relative z-30 flex flex-col h-full bg-zinc-50 border-r border-zinc-200 overflow-hidden shrink-0 transition-all duration-200 ease-in-out"
      >
        {/* Inner wrapper — keeps content from wrapping during animation */}
        <div className="w-64 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 shrink-0">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">History</span>
            <button
              onClick={onNew}
              title="New check"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-2">
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-400 leading-relaxed">
                Your analysis history<br />will appear here.
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5 px-2">
                {history.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onSelect(item.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl group flex items-start gap-2.5 transition-colors ${
                        activeId === item.id
                          ? "bg-white border border-zinc-200 shadow-sm"
                          : "hover:bg-white hover:border hover:border-zinc-100"
                      }`}
                    >
                      {/* Verdict dot */}
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-none ${VERDICT_DOT[item.verdict] ?? "bg-zinc-300"}`} />

                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-zinc-800 truncate leading-snug">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-zinc-400">{fmtDate(item.createdAt)}</span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="opacity-0 group-hover:opacity-100 shrink-0 h-5 w-5 rounded-md flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
