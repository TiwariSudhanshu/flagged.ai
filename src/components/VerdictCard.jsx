const WEIGHT_DOT = {
  high:   { bg: "var(--danger)", label: "High risk" },
  medium: { bg: "var(--warn)",   label: "Medium risk" },
  low:    { bg: "var(--ink-4)",  label: "Low risk" },
};

export default function VerdictCard({ verdict }) {
  const { score, verdict: label, headline, reasoning, keyFindings, recommendedAction } = verdict;

  const verdictClass = label === "likely_legit" ? "safe" : label === "suspicious" ? "suspicious" : "";

  const headlineEl = (() => {
    if (label === "scam") return <>Likely <em>scam</em>.</>;
    if (label === "suspicious") return <>Suspicious — <em className="em-warn">verify before responding</em>.</>;
    return <>Looks <em className="em-ok">legitimate</em>.</>;
  })();

  return (
    <div className="verdict-card">
      {/* Header */}
      <div className="vc-head">
        <div className={"vc-score " + verdictClass}>
          <span className="num">{score}</span>
          <span className="lbl">RISK</span>
        </div>
        <div className="vc-headline">
          <div className="vc-verdict">{headline || headlineEl}</div>
          <div className="vc-sub">{reasoning}</div>
        </div>
      </div>

      {/* Key findings */}
      {keyFindings?.length > 0 && (
        <div className="reasoning" style={{ borderRadius: 0, border: "none", borderTop: "1px solid var(--line)" }}>
          <div className="reasoning-head">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
            </svg>
            Key findings
          </div>
          <ul>
            {keyFindings.map((f, i) => (
              <li key={i}>
                <strong>{f.signal}</strong> — {f.explanation}
                {f.weight && f.weight !== "low" && (
                  <span style={{
                    display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                    background: WEIGHT_DOT[f.weight]?.bg ?? "var(--ink-4)",
                    marginLeft: 6, verticalAlign: "middle",
                  }} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer with recommended action */}
      {recommendedAction && (
        <div className="vc-foot">
          <span className="meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5, verticalAlign: "middle" }}>
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
            </svg>
            {recommendedAction}
          </span>
          <div className="actions">
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn"
              style={{ textDecoration: "none" }}
            >
              Report to authorities
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
