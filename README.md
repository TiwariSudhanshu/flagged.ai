# Flagged AI 🚩
*Because job hunting shouldn't cost you your savings.*

## The Problem
Every day, thousands of people fall victim to sophisticated employment scams. These aren't just your typical "prince from another country" emails anymore. Today's scammers use fake company websites, spoofed LinkedIn profiles, and legitimate-looking offer letters to steal money (often through "training fees" or "laptop deposits") and sensitive personal data. 

When a victim receives a suspicious offer, verifying it requires navigating a maze of MCA records, GST registries, WHOIS data, and reverse image searches. It's overwhelming, time-consuming, and by the time you figure it out, it might be too late.

## The Solution: Flagged AI
We built Flagged AI as an intervention layer. It sits between a suspicious job offer and its potential victim. 

You simply paste the dubious email, WhatsApp message, or offer letter into the app. Within 30 seconds, our agentic workflow cross-references multiple data points to give you a definitive **0-100 risk score** and a clear, easy-to-understand breakdown of *why* the offer is likely a scam.

If you've already paid money? Flagged AI pivots from prevention to response, automatically drafting a complaint for the National Cyber Crime portal and providing a script to use when calling your bank's emergency helpline.

---

## How It Works (The Architecture)

Under the hood, Flagged AI relies on an orchestrator pattern powered by Gemini.

1. **Extraction (Gemini Flash):** The user's unstructured input is parsed to extract key entities—names, phone numbers, email addresses, UPI IDs, company names, and domains.
2. **Parallel Investigation:** The orchestrator dispatches several agents to investigate the entities simultaneously:
   - **ScamDB Matcher:** Checks our local MongoDB instance for known scammer details.
   - **Domain Agent:** Looks up WHOIS registration data, scrapes the company website, and uses Gemini to spot red flags (e.g., domain registered 3 days ago, stock images on the team page).
   - **Corporate Registries:** Queries the GST portal and MCA (Probe42) to verify if the company is legally registered and active.
   - **LinkedIn Investigator:** Uses ProxyCurl and reverse image searches to verify the recruiter's identity and employment history.
3. **The Verdict (Gemini Pro):** The orchestrator synthesizes all the gathered intelligence into a final, streaming verdict.

```text
Input ──► Preprocess (Flash) ──► Parallel Execution ───────────────┐
                                 ├─ Scam Database (MongoDB)        │
                                 ├─ Domain & Website Analysis      │
                                 ├─ GST & MCA Lookup               ├──► Orchestrator (Pro) ──► Verdict
                                 └─ LinkedIn / Identity Check      │
                                                                   │
(If already paid) ─────────────► Recovery Flow (Drafts complaints) ┘
```

---

## Tech Stack

We chose a modern, edge-ready stack optimized for speed and streaming responses:

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **AI / LLMs:** Gemini 2.5 (`@google/genai` SDK) 
  - *Gemini Flash* for rapid text extraction and preprocessing.
  - *Gemini Pro* for deep reasoning and final orchestration.
- **Database:** MongoDB (Stores known scams and user reports; seeds automatically on first boot).
- **APIs & Tooling:** Cheerio (scraping), Zod (schema validation), and various third-party OSINT APIs.

---

## Getting Started

Want to run this locally? Here's how to get it spinning.

### 1. Clone & Install
```bash
npm install
```

### 2. Environment Variables
Copy the example environment file and fill in your keys. At a bare minimum, you'll need a Gemini API key and a MongoDB connection string.
```bash
cp .env.example .env.local
```

**Optional Keys (For full functionality):**
If you don't provide these, the system gracefully falls back and the orchestrator notes that the data source is "unavailable."
- `WHOIS_API_KEY`: from whoisxmlapi.com (they give 500 free calls/month).
- `PROBE42_API_KEY`: for MCA company data lookups.
- `PROXYCURL_API_KEY`: to analyze LinkedIn profiles.
- `SERPAPI_KEY`: for reverse image searching recruiter photos.
- `GST_API_KEY` + `GST_API_URL`: Surepass or KnowYourGST credentials.

### 3. Fire it up
```bash
npm run dev
```
Navigate to `http://localhost:3000`. We've included a few "Try a demo" buttons on the landing page so you can test the pipeline without needing a real scam message right away.

---

## API Reference

If you want to plug the engine into another frontend, we expose two main routes:

- **`POST /api/analyze`**
  Expects `{ input: string }`. Returns an NDJSON stream. We stream the steps so the user isn't staring at a blank screen for 30 seconds. Event types include: `preprocess`, `agent_start`, `agent_done`, `verdict`, `recovery`, and `error`.
  
- **`POST /api/report`**
  Allows users to submit confirmed scams to grow the community database.
  Expects: `{ company?, phones?, emails?, upis?, domains?, notes? }`

---

## Project Structure

A quick map of the repository to help you navigate:

```text
src/
├── app/
│   └── api/
│       ├── analyze/route.js     # The main streaming pipeline endpoint
│       └── report/route.js      # Endpoint for crowdsourcing scam data
├── components/                  # React components (Chat, VerdictCard, etc.)
├── data/                        # Seed data and demo scenarios
└── lib/
    ├── pipeline.js              # Top-level orchestrator logic
    ├── preprocess.js            # Gemini Flash entity extraction
    ├── orchestrator.js          # Gemini Pro final reasoning
    ├── recovery.js              # Logic for generating post-scam action plans
    ├── gemini.js / mongo.js     # Database and LLM clients
    ├── schemas.js               # Zod validation schemas
    ├── agents/                  # Specialized agent logic (domain, linkedin)
    └── tools/                   # API wrappers (whois, gst, mca, proxycurl, etc.)
```

---

*Built with ❤️ for the Agentic AI Hackathon.*
