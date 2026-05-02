const STATUS_META = {
  running: { dot: "bg-blue-500 animate-pulse", label: "running" },
  ok: { dot: "bg-emerald-500", label: "ok" },
  unavailable: { dot: "bg-zinc-400", label: "unavailable" },
  error: { dot: "bg-red-500", label: "error" },
  skipped: { dot: "bg-zinc-300", label: "skipped" },
};

const NICE_NAME = {
  scamDb: "Scam DB",
  whois: "WHOIS",
  gst: "GST registry",
  mca: "MCA registry",
  websiteFetch: "Website fetch",
  domainAgent: "Domain + website agent",
  linkedinAgent: "Recruiter + LinkedIn agent",
  proxycurl: "ProxyCurl",
  reverseImage: "Reverse image",
};

export default function SignalRow({ name, status, summary }) {
  const meta = STATUS_META[status] ?? STATUS_META.ok;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm bg-white dark:bg-zinc-950">
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      <span className="font-medium">{NICE_NAME[name] || name}</span>
      <span className="text-zinc-500 text-xs uppercase tracking-wider">
        {meta.label}
      </span>
      {summary && (
        <span className="text-zinc-600 dark:text-zinc-400 truncate ml-auto">
          {summary}
        </span>
      )}
    </div>
  );
}
