"use client";

import { useState } from "react";

export default function RecoveryCard({ recovery }) {
  return (
    <article className="rounded-2xl border border-amber-200 overflow-hidden bg-white">
      <div className="h-1 w-full bg-amber-400" />

      <div className="px-5 py-4 border-b border-[#f4f4f5] flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
          <span className="text-amber-500 text-lg">⚠</span>
        </div>
        <div>
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Recovery mode</div>
          <div className="text-[15px] font-medium text-[#0d0d0d]">
            You acted fast. Here&apos;s exactly what to do in the next hour.
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-5 text-sm">
        <RecoverySection title="1 · File at cybercrime.gov.in">
          <CopyableText
            text={recovery.cybercrimeComplaint}
            href="https://cybercrime.gov.in/"
            hrefLabel="Open portal →"
          />
        </RecoverySection>

        <RecoverySection title="2 · Call 1930 (cybercrime helpline)">
          <CopyableText
            text={recovery.helplineScript}
            href="tel:1930"
            hrefLabel="Call 1930"
          />
        </RecoverySection>

        <RecoverySection title="3 · Call your bank&apos;s fraud line">
          <ul className="flex flex-col gap-2">
            {recovery.bankTalkingPoints.map((b, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-none" />
                <span className="text-[#52525b]">{b}</span>
              </li>
            ))}
          </ul>
        </RecoverySection>
      </div>
    </article>
  );
}

function RecoverySection({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {children}
    </div>
  );
}

function CopyableText({ text, href, hrefLabel }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-[#e4e4e7] bg-[#f9f9f9] px-3.5 py-3 text-[#52525b] whitespace-pre-wrap leading-relaxed text-sm">
        {text}
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
          className="text-xs px-3 py-1.5 rounded-full border border-[#e4e4e7] text-[#52525b] hover:bg-[#f4f4f5] transition-colors"
        >
          {copied ? "Copied ✓" : "Copy text"}
        </button>
        {href && (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            {hrefLabel}
          </a>
        )}
      </div>
    </div>
  );
}
