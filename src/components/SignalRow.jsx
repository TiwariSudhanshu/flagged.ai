const STATUS_META = {
  running: { icon: "⟳", color: "text-blue-500", bg: "bg-blue-50 border-blue-100", label: "running…" },
  ok: { icon: "✓", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", label: null },
  unavailable: { icon: "–", color: "text-[#a1a1aa]", bg: "bg-[#f9f9f9] border-[#e4e4e7]", label: "unavailable" },
  error: { icon: "✕", color: "text-red-500", bg: "bg-red-50 border-red-100", label: "error" },
  skipped: { icon: "–", color: "text-[#a1a1aa]", bg: "bg-[#f9f9f9] border-[#e4e4e7]", label: "skipped" },
};

const NICE_NAME = {
  scamDb: "Scam database",
  whois: "WHOIS lookup",
  gst: "GST registry",
  mca: "MCA registry",
  websiteFetch: "Website check",
  domainAgent: "Domain & website",
  linkedinAgent: "Recruiter & LinkedIn",
  proxycurl: "LinkedIn profile",
  reverseImage: "Reverse image",
};

export default function SignalRow({ name, status, summary }) {
  const meta = STATUS_META[status] ?? STATUS_META.ok;
  const isRunning = status === "running";

  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${meta.bg}`}>
      <span className={`text-xs font-mono font-bold ${meta.color} ${isRunning ? "animate-spin inline-block" : ""}`}>
        {meta.icon}
      </span>
      <span className="text-[#0d0d0d] font-medium">{NICE_NAME[name] || name}</span>
      {meta.label && !summary && (
        <span className={`text-xs ${meta.color}`}>{meta.label}</span>
      )}
      {summary && (
        <span className="text-xs text-[#71717a] ml-auto truncate max-w-[200px]">{summary}</span>
      )}
    </div>
  );
}
