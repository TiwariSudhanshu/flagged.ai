export default function VerdictCard({ verdict }) {
  const { score, verdict: label, headline, reasoning, keyFindings, recommendedAction } = verdict;
  const tone =
    label === "scam" ? "red" : label === "suspicious" ? "amber" : "emerald";
  const palette = {
    red: "from-red-500 to-rose-600 text-white",
    amber: "from-amber-400 to-orange-500 text-black",
    emerald: "from-emerald-500 to-teal-600 text-white",
  }[tone];

  return (
    <article className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className={`bg-gradient-to-br ${palette} px-5 py-4 flex items-center gap-4`}>
        <div className="text-5xl font-bold tabular-nums">{score}</div>
        <div className="flex flex-col">
          <div className="text-xs uppercase tracking-widest opacity-80">
            {label.replace("_", " ")}
          </div>
          <div className="text-lg font-medium leading-tight">{headline}</div>
        </div>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3 text-sm bg-white dark:bg-zinc-950">
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{reasoning}</p>
        {keyFindings?.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {keyFindings.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className={`mt-1 inline-block h-1.5 w-1.5 rounded-full flex-none ${
                    f.weight === "high"
                      ? "bg-red-500"
                      : f.weight === "medium"
                      ? "bg-amber-500"
                      : "bg-zinc-400"
                  }`}
                />
                <div>
                  <span className="font-medium">{f.signal}</span>
                  <span className="text-zinc-600 dark:text-zinc-400"> — {f.explanation}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-zinc-800 dark:text-zinc-200">
          <span className="text-xs uppercase tracking-wider text-zinc-500 mr-2">
            Do this
          </span>
          {recommendedAction}
        </div>
      </div>
    </article>
  );
}
