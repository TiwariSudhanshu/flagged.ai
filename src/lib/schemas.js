import { z } from "zod";

export const PreprocessResult = z.object({
  type: z.enum(["text", "url", "image"]).default("text"),
  userIntent: z.enum(["detect", "recovery"]).default("detect"),
  company: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  salaryClaimed: z.string().nullable().optional(),
  contacts: z.object({
    phones: z.array(z.string()).default([]),
    emails: z.array(z.string()).default([]),
    upis: z.array(z.string()).default([]),
  }).default({ phones: [], emails: [], upis: [] }),
  urls: z.array(z.string()).default([]),
  paymentAsk: z.boolean().default(false),
  paymentAmount: z.string().nullable().optional(),
  recruiterName: z.string().nullable().optional(),
  redFlagPhrases: z.array(z.string()).default([]),
  rawSummary: z.string().default(""),
});

export const Signal = z.object({
  source: z.string(),
  status: z.enum(["ok", "unavailable", "error", "skipped"]),
  reason: z.string().optional(),
  data: z.any().optional(),
});

export const Verdict = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(["scam", "suspicious", "likely_legit"]),
  headline: z.string(),
  reasoning: z.string(),
  keyFindings: z.array(z.object({
    signal: z.string(),
    weight: z.enum(["high", "medium", "low"]),
    explanation: z.string(),
  })).default([]),
  recommendedAction: z.string(),
});

export const RecoveryDraft = z.object({
  cybercrimeComplaint: z.string(),
  helplineScript: z.string(),
  bankTalkingPoints: z.array(z.string()),
});
