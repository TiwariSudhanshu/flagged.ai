"use client";

import { useState } from "react";

export default function RecoveryCard({ recovery }) {
  return (
    <article className="rounded-2xl border border-amber-300 dark:border-amber-900 overflow-hidden">
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-black px-5 py-4">
        <div className="text-xs uppercase tracking-widest opacity-80">Recovery mode</div>
        <div className="text-lg font-medium leading-tight">
          You acted fast. Here&apos;s exactly what to do in the next hour.
        </div>
      </div>
      <div className="px-5 py-4 flex flex-col gap-5 bg-white dark:bg-zinc-950 text-sm">
        <Section title="1. File at cybercrime.gov.in">
          <CopyableText
            label="Complaint paragraph"
            text={recovery.cybercrimeComplaint}
            href="https://cybercrime.gov.in/"
            hrefLabel="Open portal"
          />
        </Section>

        <Section title="2. Call 1930 (Indian cybercrime helpline)">
          <CopyableText label="Script to read" text={recovery.helplineScript} href="tel:1930" hrefLabel="Call 1930" />
        </Section>

        <Section title="3. Call your bank's fraud line right after">
          <ul className="flex flex-col gap-2">
            {recovery.bankTalkingPoints.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-none" />
                <span className="text-zinc-800 dark:text-zinc-200">{b}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs uppercase tracking-wider text-zinc-500">{title}</h3>
      {children}
    </div>
  );
}

function CopyableText({ label, text, href, hrefLabel }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
        {text}
      </div>
      <div className="flex gap-2 text-xs">
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
          className="px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {copied ? "Copied!" : `Copy ${label.toLowerCase()}`}
        </button>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {hrefLabel}
          </a>
        )}
      </div>
    </div>
  );
}
