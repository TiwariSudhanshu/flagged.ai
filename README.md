# Flagged AI

The agent that sits between a scam job and its victim. Paste a suspicious offer, get a 0–100 risk score with reasoning in under 30 seconds. Web-only MVP for the agentic AI hackathon — see `doc.md` for the full product spec, `AGENTS.md` for Next.js-specific agent rules.

## Stack

- Next.js 16 App Router (Route Handlers under `src/app/api`)
- React 19 + Tailwind 4
- Gemini 2.5 (`@google/genai`) — Flash for preprocessing, Pro for orchestration
- MongoDB (scam DB, seed loaded automatically on first boot)

## Architecture

```
input → preprocess (Flash) → planTasks → Promise.all([
  scamDb,                  // Mongo fuzzy match on phone/email/UPI/domain/company
  domainAgent,             // fetch + cheerio + WHOIS + Gemini reasoning
  gst,                     // GST registry (3rd-party trial API)
  mca,                     // Probe42 MCA lookup
  linkedinAgent,           // ProxyCurl + reverse image + email-domain analysis
]) → orchestrator (Pro) → streaming verdict
```

If the user has already paid, preprocessing routes them to the recovery flow instead — drafts a cybercrime.gov.in complaint, the 1930 helpline script, and bank talking points.

## Setup

```bash
cp .env.example .env.local        # fill GEMINI_API_KEY + MONGODB_URI at minimum
npm install
npm run dev
```

Open http://localhost:3000. Click any "Try a demo" pill to load a built-in scenario.

### Optional API keys (real signals slot in when present)

Without these, the corresponding tools return `status: "unavailable"` and the orchestrator factors that in:

- `WHOIS_API_KEY` — whoisxmlapi.com (500 calls/month free)
- `PROBE42_API_KEY` — MCA company data
- `PROXYCURL_API_KEY` — LinkedIn profile lookup
- `SERPAPI_KEY` — Google reverse image
- `GST_API_KEY` + `GST_API_URL` — Surepass / KnowYourGST trial

## Endpoints

- `POST /api/analyze` — `{ input: string }`, returns NDJSON stream of `{ type: "preprocess" | "agent_start" | "agent_done" | "verdict" | "recovery" | "error", ... }`
- `POST /api/report` — submit a known scam to extend the database: `{ company?, phones?, emails?, upis?, domains?, notes? }`

## Files

```
src/
├── app/api/analyze/route.js     streaming detection endpoint
├── app/api/report/route.js      user-submitted scam reports
├── components/                  Chat, VerdictCard, RecoveryCard, SignalRow
├── data/                        seed-scams.json, demo-scenarios.json
└── lib/
    ├── pipeline.js              top-level orchestration
    ├── preprocess.js            Gemini Flash extraction
    ├── orchestrator.js          Gemini Pro reasoning
    ├── recovery.js              already-paid complaint drafting
    ├── gemini.js / mongo.js     clients
    ├── schemas.js               zod schemas
    ├── agents/{domain,linkedin}.js
    └── tools/{scamDb,whois,gst,mca,proxycurl,reverseImage,websiteFetch}.js
```
