const MAX_LEN = 3800; // WhatsApp cap is 4096 — leave headroom for splits

const STATUS_EMOJI = { ok: "🟢", warn: "🟡", danger: "🔴", error: "⚫", unavailable: "⚫", skipped: "⚫" };
const AGENT_LABEL  = {
  scamDb:        "Scam database",
  domainAgent:   "Domain & website",
  gst:           "GST registry",
  mca:           "MCA registry",
  linkedinAgent: "Recruiter / LinkedIn",
  emailAgent:    "Email check",
};

export function formatWhatsApp(result) {
  const { verdict, recovery, signals = [], pre } = result;

  // ── Recovery mode ───────────────────────────────────────────────────────────
  if (recovery) {
    return splitMessages(buildRecovery(recovery));
  }

  // ── Normal verdict ──────────────────────────────────────────────────────────
  if (!verdict) {
    return ["⚠️ Analysis completed but no verdict was produced. Try sending the full job offer text."];
  }

  return splitMessages(buildVerdict(verdict, signals, pre));
}

function buildVerdict(verdict, signals, pre) {
  const { score, verdict: label, headline, reasoning, keyFindings, recommendedAction } = verdict;

  const riskEmoji = label === "scam" ? "🚨" : label === "suspicious" ? "⚠️" : "✅";
  const verdictLabel = label === "scam" ? "Likely Scam" : label === "suspicious" ? "Suspicious" : "Likely Legit";
  const scoreBar = buildScoreBar(score);

  let msg = "";

  msg += `${riskEmoji} *FLAGGED AI — ${verdictLabel.toUpperCase()}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `📊 *Risk Score:* ${score}/100\n`;
  msg += `${scoreBar}\n\n`;

  if (pre?.company || pre?.role) {
    const parts = [];
    if (pre.company) parts.push(`*Company:* ${pre.company}`);
    if (pre.role)    parts.push(`*Role:* ${pre.role}`);
    msg += parts.join("  ·  ") + "\n\n";
  }

  if (headline) {
    msg += `💬 *${headline}*\n\n`;
  }

  if (reasoning) {
    msg += `📋 *Summary:*\n${reasoning}\n\n`;
  }

  // Checks
  const doneSignals = signals.filter((s) => s?.status && s.status !== "error");
  if (doneSignals.length > 0) {
    msg += `🔍 *Checks (${doneSignals.length} completed):*\n`;
    for (const sig of signals) {
      const name  = AGENT_LABEL[sig?.source] ?? sig?.source ?? "Check";
      const emoji = STATUS_EMOJI[sig?.status] ?? "⚫";
      const detail = getSignalOneliner(sig);
      msg += `${emoji} ${name}${detail ? ` · ${detail}` : ""}\n`;
    }
    msg += "\n";
  }

  // Key findings
  if (keyFindings?.length > 0) {
    msg += `⚠️ *Key Findings:*\n`;
    for (const f of keyFindings) {
      const bullet = f.weight === "high" ? "🔴" : f.weight === "medium" ? "🟡" : "•";
      msg += `${bullet} *${f.signal}* — ${f.explanation}\n`;
    }
    msg += "\n";
  }

  // Recommended action
  if (recommendedAction) {
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `✅ *What to do:*\n${recommendedAction}\n\n`;
  }

  if (label === "scam" || label === "suspicious") {
    msg += `📞 *Cybercrime helpline:* 1930\n`;
    msg += `🌐 *Report online:* cybercrime.gov.in\n\n`;
  }

  msg += `_Flagged AI · flagged.ai_`;
  return msg;
}

function buildRecovery(recovery) {
  let msg = "⚠️ *RECOVERY MODE — Flagged AI*\n";
  msg += "━━━━━━━━━━━━━━━━━━━━\n\n";
  msg += "You've already been targeted. Act *immediately*:\n\n";

  msg += "1️⃣ *File complaint at cybercrime.gov.in:*\n";
  msg += "```\n" + (recovery.cybercrimeComplaint ?? "See complaint template") + "\n```\n\n";

  msg += "2️⃣ *Call 1930 (Cyber Crime Helpline):*\n";
  if (recovery.helplineScript) {
    msg += recovery.helplineScript + "\n\n";
  }

  if (recovery.bankTalkingPoints?.length > 0) {
    msg += "3️⃣ *Call your bank's fraud line:*\n";
    for (const b of recovery.bankTalkingPoints) {
      msg += `• ${b}\n`;
    }
    msg += "\n";
  }

  msg += "━━━━━━━━━━━━━━━━━━━━\n";
  msg += "_Flagged AI · flagged.ai_";
  return msg;
}

function buildScoreBar(score) {
  const filled = Math.round(score / 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);
  return `[${bar}] ${score}%`;
}

function getSignalOneliner(sig) {
  if (!sig) return "";
  if (sig.status !== "ok") return sig.reason ? sig.reason.slice(0, 60) : sig.status;
  const d = sig.data || {};
  switch (sig.source) {
    case "scamDb":
      return d.match ? `match found on ${(d.matchedOn ?? []).join(", ")}` : "no match";
    case "domainAgent": {
      const parts = [];
      if (d.domain) parts.push(d.domain);
      if (d.whois?.ageDays != null) parts.push(`${d.whois.ageDays}d old`);
      if (!d.reachable) parts.push("unreachable");
      return parts.join(" · ");
    }
    case "gst":
      return d.gstin ? `GSTIN ${d.gstin}` : d.found === false ? "not registered" : "checked";
    case "mca":
      return d.found ? (d.cin ? `CIN ${d.cin}` : "found") : "no MCA record";
    case "linkedinAgent":
      return d.reasoning?.plausibleRecruiter === false ? "implausible recruiter"
           : d.reasoning?.plausibleRecruiter ? "recruiter looks ok" : "checked";
    case "emailAgent":
      return d.reasoning?.suspicious ? "suspicious email(s)" : "emails look normal";
    default:
      return "";
  }
}

function splitMessages(text) {
  if (text.length <= MAX_LEN) return [text];

  // Split at paragraph boundaries
  const chunks = [];
  const paragraphs = text.split("\n\n");
  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? current + "\n\n" + para : para;
    if (candidate.length <= MAX_LEN) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = para.length <= MAX_LEN ? para : para.slice(0, MAX_LEN);
    }
  }
  if (current) chunks.push(current);

  // Add page markers if multiple chunks
  if (chunks.length > 1) {
    return chunks.map((c, i) => `(${i + 1}/${chunks.length})\n\n${c}`);
  }
  return chunks;
}
