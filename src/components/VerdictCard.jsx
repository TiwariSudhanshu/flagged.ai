const TONE = {
  scam: {
    bar: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    scoreBg: "bg-red-500",
    scoreText: "text-white",
  },
  suspicious: {
    bar: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    scoreBg: "bg-amber-400",
    scoreText: "text-black",
  },
  likely_legit: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    scoreBg: "bg-emerald-500",
    scoreText: "text-white",
  },
};

const WEIGHT_DOT = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-[#d4d4d8]",
};

export default function VerdictCard({ verdict }) {
  const { score, verdict: label, headline, reasoning, keyFindings, recommendedAction } = verdict;
  const t = TONE[label] ?? TONE.suspicious;
  const displayLabel = label === "likely_legit" ? "Likely legit" : label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <article className="rounded-2xl border border-[#e4e4e7] overflow-hidden bg-white">
      {/* Color bar */}
      <div className={`h-1 w-full ${t.bar}`} />

      <div className="px-5 py-4 flex items-center gap-4 border-b border-[#f4f4f5]">
        {/* Score circle */}
        <div className={`h-14 w-14 rounded-full ${t.scoreBg} flex items-center justify-center shrink-0`}>
          <span className={`text-2xl font-bold tabular-nums ${t.scoreText}`}>{score}</span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border self-start ${t.badge}`}>
            {displayLabel}
          </span>
          <p className="text-[15px] font-medium text-[#0d0d0d] leading-snug">{headline}</p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">
        <p className="text-sm text-[#52525b] leading-relaxed">{reasoning}</p>

        {keyFindings?.length > 0 && (
          <ul className="flex flex-col gap-2">
            {keyFindings.map((f, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-none ${WEIGHT_DOT[f.weight] ?? WEIGHT_DOT.low}`} />
                <div className="leading-relaxed">
                  <span className="font-medium text-[#0d0d0d]">{f.signal}</span>
                  <span className="text-[#71717a]"> — {f.explanation}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2.5 items-start rounded-xl bg-[#f9f9f9] border border-[#e4e4e7] px-3.5 py-3 text-sm">
          <span className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-semibold shrink-0 mt-0.5">Action</span>
          <span className="text-[#0d0d0d]">{recommendedAction}</span>
        </div>
      </div>
    </article>
  );
}
