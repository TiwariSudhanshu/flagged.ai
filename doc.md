# Flagged AI
### The agent that sits between a scam job and its victim

---

## The Problem

Job scams in India are exploding.

Fake Amazon/Flipkart WFH offers. Fake HR consultancies charging ₹2,000–15,000 as "registration fees". Fake overseas job rackets — Cambodia/Myanmar scam compounds. AI-generated recruiter profiles on LinkedIn with stolen photos and fabricated experience.

NCRB data puts employment fraud in the top 5 cybercrime categories in India. The target victims are freshers, tier-2/3 job seekers, and laid-off IT workers — the most trusting, most vulnerable segment of the job market.

Unlike UPI fraud where RBI/NPCI are actively building safeguards, this space has almost no consumer tools. Nobody is sitting between the scam message and the victim.

Flagged AI is that layer.

---

## What It Is

A WhatsApp-first agentic tool that detects job scams in real time.

User does one of three things:
- Forwards a suspicious job message from WhatsApp to the Flagged AI number
- Pastes a LinkedIn / Naukri / Indeed URL
- Sends a screenshot of a job offer

Agent responds in under 30 seconds with:
- A risk score (0–100)
- Plain-language explanation of what's suspicious
- Recommended next action ("don't pay", "verify via this channel", "report to cybercrime.gov.in")

No app download. No signup. No friction. WhatsApp-first because that's where the scam message arrives.

If the user is already a victim — "I already paid ₹3,000" — the agent switches to recovery mode. Drafts the cybercrime.gov.in complaint. Gives the 1930 helpline script. Tells them exactly what to say to their bank.

---

## Two Interfaces

### WhatsApp
Primary channel. Twilio WhatsApp sandbox for demo, proper BSP for production. User forwards the message, gets the verdict back in the same chat thread. Zero friction, zero learning curve.

### Web Chatbot
Sits on the landing page. Judges and power users can interact without setting up WhatsApp. Accepts pasted job descriptions, URLs, or recruiter names. Streams the response back conversationally. Maintains conversation context for follow-up questions — "why is it flagged?", "can you draft the complaint now?", "what if the company is real but the recruiter is fake?"

The chatbot has two modes:
- **Detection mode** — default, runs the full verification pipeline
- **Recovery mode** — triggered when user mentions they already paid or applied, switches to complaint drafting and helpline guidance

---

## Detection Architecture

### Preprocessing Function (not an agent)

Intake and text analysis are combined into a single preprocessing function. Both are pure Claude calls with no external tools — no branching logic, no tool use, no decision making. They don't qualify as agents. They run first, always, synchronously, and output structured JSON that everything else consumes.

**What it extracts:** company name, role, salary claimed, contact info, URLs, payment ask (yes/no), recruiter name, red flag phrases found.

**What it checks in text:**
- Any money flowing from candidate to company — registration fee, training fee, laptop deposit, ID card charges, security deposit. Scam 99% of the time in India. Legitimate companies never ask freshers to pay.
- Urgency markers — "limited seats", "only today", "respond in 2 hours", "immediate joining"
- Salary-to-role mismatch — ₹45,000/month for "data entry, no experience, 2 hours daily"
- Vague roles — "online work", "form filling", "typing job", "copy-paste WFH"
- Communication red flags — WhatsApp-only contact, personal Gmail instead of company domain, foreign number for an India job

Uses Claude Haiku. Fast. No ML classifier needed — few-shot prompting handles salary reasonableness by role + experience + city tier.

---

### The Real Agents

An agent needs two things — tool use and internal decision making. If it's just "take input, call Claude or an API, return output" — it's a tool, not an agent. Here's what actually qualifies.

---

#### Website + Domain Agent

**Why it's an agent:** Has genuine internal branching logic.

- Checks if a URL was provided or derives one from company name
- Runs WHOIS and website fetch in parallel
- If website is unreachable, tries alternate TLDs (.in, .co.in)
- If site is Cloudflare-protected, extracts whatever it can from headers and meta
- Parses fetched content, decides what's relevant to pass to Claude
- Claude reasons about careers page consistency, address match, job listing existence

**Tools it uses:**
- whoisxmlapi.com — domain creation date, registrar info (free tier, 500 calls/month)
- node-fetch + Cheerio — website content extraction
- Claude Sonnet — reasoning about parsed content

**Signals produced:**
- Domain age (under 60 days = major red flag)
- Careers page consistency (does this job actually appear on their site?)
- Address match against MCA data
- Site reachability (unreachable = negative signal, not a crash)

---

#### LinkedIn + Recruiter Agent

**Why it's an agent:** Branches based on data availability, runs multiple sub-checks, synthesizes recruiter credibility.

- Decides whether to use ProxyCurl API or fall back to user-pasted profile text
- If photo URL exists, spins up reverse image search
- If profile is private or unavailable, falls back to email domain verification only
- Cross-checks claimed employer against LinkedIn company page

**Tools it uses:**
- ProxyCurl API — LinkedIn profile data as JSON (connections, join date, experience, photo URL, email)
- SerpAPI — reverse image search on recruiter photo
- Claude Vision — rough AI-generated face detection as fallback

**Signals produced:**
- Profile age vs claimed seniority
- Connection count vs claimed role ("Senior TA at Infosys" with 50 connections)
- Email domain match (infosys.com vs infosys-careers.info)
- Photo authenticity (stolen stock photo or AI-generated face)

---

### The Tools (not agents)

These are single API calls or DB queries exposed as tools the orchestrator calls directly.

**GST Tool**
- Hits gst.gov.in taxpayer search AJAX endpoint
- Returns GSTIN status — verified, unverified, not found
- No LLM needed. Clean JSON response.

**MCA Tool**
- Hits Probe42 API or scrapes mca.gov.in
- Returns incorporation date, paid-up capital, company status, registered address
- Flag: ₹1 lakh paid-up capital company "hiring 500 engineers" incorporated 3 months ago

**Scam DB Tool**
- Fuzzy match against MongoDB scam collection
- Exact match on phone numbers, UPI IDs, domains
- Sources: cybercrime.gov.in reports, Reddit r/IndianJobs scrape, user-submitted reports

---

### Orchestrator Agent

The brain. The only agent doing genuine multi-signal reasoning.

Receives outputs from all tools and sub-agents. Weighs signals. Resolves conflicts. Produces final risk score + plain-language explanation + recommended action. Handles missing data gracefully — if LinkedIn agent fails due to quota, notes "could not verify recruiter" rather than defaulting to safe or crashing.

**Decision logic:**

| Signal Combination | Score |
|---|---|
| Any payment ask from candidate | 70+ immediately, non-negotiable |
| Domain under 14 days + MCA not found | 85+ |
| GST not found + vague role + urgency markers | 75+ |
| Recruiter profile 2 weeks old + stolen photo | +20 to base score |
| Scam DB exact match (phone/domain/UPI) | 95+ regardless of other signals |
| Legitimate company + one red flag (personal Gmail contact) | 40–50, flagged but not condemned |

Uses Claude Sonnet for final reasoning pass.

---

### Full Execution Flow

```
User input (text / URL / screenshot)
        ↓
Preprocessing Function
— intake + text analysis (Haiku)
— outputs structured JSON
        ↓
Orchestrator looks at extracted data
decides which tools and agents to activate
        ↓
Parallel execution (Promise.all):
— GST Tool
— MCA Tool
— Scam DB Tool
— Website + Domain Agent
— LinkedIn + Recruiter Agent
        ↓
All results returned to Orchestrator
        ↓
Orchestrator Agent (Sonnet)
— weighs signals
— resolves conflicts
— produces risk score 0–100
— generates plain-language verdict
— recommends next action
        ↓
Response via WhatsApp or Web Chatbot
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js + Anthropic SDK | existing stack, tool use support |
| LLM — triage | Claude Haiku | fast, cheap, enough for extraction |
| LLM — reasoning | Claude Sonnet | orchestrator needs real reasoning |
| WhatsApp | Twilio sandbox | quick setup, known quantity |
| WHOIS | whoisxmlapi.com free tier | 500 calls/month, clean JSON |
| MCA | Probe42 trial | covers hackathon quota |
| GST | gst.gov.in AJAX | free, no auth needed |
| Website fetch | node-fetch + Cheerio | lightweight, fast |
| LinkedIn | ProxyCurl trial | only reliable option at hackathon scale |
| Reverse image | SerpAPI trial | covers demo quota |
| Database | MongoDB | scam DB, caching, user reports |
| Frontend | Next.js | existing stack |

---

## What's Easy vs Hard

**Easy — live in 12–15 hours:**
Text analysis, WHOIS, GST check, website fetch, scam DB, WhatsApp pipeline, agent orchestration loop. Core demo is live in this window.

**Medium — remaining time:**
MCA data (Probe42 trial solves it), full error handling across the agent loop, chatbot UI.

**Hard — scope carefully:**
LinkedIn verification (ProxyCurl solves it but adds external dependency), reverse image search (SerpAPI trial covers demo quota, watch the rate limit).

**Cut entirely:**
Browser extension, real-time LinkedIn scraping without a service, training any ML model from scratch, multi-language beyond Hindi + English on day one.

---

## Known Failure Points

| Risk | Mitigation |
|---|---|
| MCA portal CAPTCHA | Probe42 trial as fallback, set up day 0 |
| LinkedIn blocking | ProxyCurl trial ready before build starts |
| Twilio WhatsApp sandbox approval delay | Register day 0, not during hackathon |
| API rate limits under demo load | Cache every result in MongoDB — repeated queries hit cache not API |
| Scam sites being down | Treat unreachable as negative signal, not a crash |

---

## Why This Wins at an Agentic AI Hackathon

Most teams will build one agent with tool calls and call it "multi-agent." Flagged AI has:

- True agent isolation — each agent has its own system prompt, scope, and output schema
- Honest architecture — tools are tools, agents are agents, the distinction is defensible
- Parallel execution — not sequential tool calls
- An orchestrator that reasons about conflicting signals, not just averages scores
- Two interfaces showing the same pipeline (WhatsApp + web chatbot)
- Graceful degradation when individual agents fail
- A flywheel business model built into the product design

The judges want to see agents that think. The orchestrator reasoning through "GST exists but domain is 8 days old and MCA is unregistered — what does that actually mean?" is exactly that.

Show the orchestrator's reasoning out loud in the demo. Not just the final score — the full chain: "Text analysis flagged payment ask. MCA Agent found company incorporated 11 days ago. Domain Agent confirmed domain is 9 days old. Scam DB found 2 Reddit complaints matching this number. Orchestrator verdict: 91/100, high scam probability."

---

## Demo Strategy

**Option A — main demo:**
Live demo with a real scam message collected from r/IndianJobs. Paste it live, agent flags in 20 seconds with specific reasons. Then paste a real legitimate job — agent clears it. The contrast sells it.

**Option B — the gotcha:**
Job posting that looks legitimate — good English, proper format, reasonable salary — but agent catches it because domain is 12 days old and MCA registration doesn't match. Shows the agent catches what humans miss.

**Option C — recovery flow (supporting beat):**
User says "I already paid ₹3,000 to this company." Agent switches to recovery mode, drafts the cybercrime.gov.in complaint, gives the 1930 helpline script. Shows it's not just a detector — it's a companion through the whole problem.

Run A as the main demo. Mention C as "we also handle this."

---

## Pitch Framing

Don't pitch it as "AI detects job scams." Every team sounds like that.

> 3.4 crore Indians are looking for jobs online. Last year, hundreds of crores were lost to employment fraud. Flagged AI is the agent that sits between the scam message and the victim — on WhatsApp, in Hindi, free. One-tap forward, 30-second verdict. And if they're already a victim, it walks them through recovery in the first critical hour.

Lead with the user. Not the tech.

---

## Business Model

### The Core Tension

The product's value proposition is "free, no signup, WhatsApp-first, for people who just lost ₹3,000 to a scam." That user has zero willingness to pay. You cannot monetize the victim directly. So you find who else benefits from this existing.

---

### Freemium — for users and placement professionals

Freemium works by treating job seekers as the free tier and placement professionals + small businesses as the paid tier.

**Free tier — for job seekers**
- 5 checks per month via WhatsApp
- Basic risk score + plain-language verdict
- Text analysis + domain age + scam DB match only
- No MCA deep dive, no recruiter verification

**Pro tier — ₹99–149/month**
- Unlimited checks
- Full verification stack (MCA + GST + LinkedIn + reverse image)
- Detailed breakdown of every signal
- Recovery mode with auto-drafted cybercrime complaint
- Priority response time
- Who pays: placement consultants, HR professionals, college TPOs, parents of freshers. Not the fresher themselves.

**Institution tier — ₹499–999/month**
- Bulk checks via dashboard
- API access for internal systems
- Monthly scam trend report by city and sector
- Who pays: engineering college placement cells, staffing firms, placement agencies

---

### API — the real revenue

**Starter — ₹2/verification call**
- Text analysis + domain + scam DB only
- For small job boards, independent platforms, early-stage HR tools

**Growth — ₹5/call or ₹25k/month flat**
- Full stack verification, all agents running
- SLA on response time
- For mid-size platforms — Internshala, Apna, Shine

**Enterprise — custom pricing**
- Dedicated instance
- Custom scam DB with their own reported jobs fed in
- White-label option
- Data feed access
- For Naukri, LinkedIn India, government employment portals

---

### The Database — the long-term moat

Every scam report that comes through Flagged AI makes the database more valuable. After 6 months of volume:

- Scam company names, numbers, UPI IDs, domains updated in real time
- Geographic distribution of scam activity
- Emerging scam patterns before they hit the news

That's a threat intelligence feed. Sellable to:
- Banks — if someone pays a UPI ID flagged in the DB, the bank can warn them at transaction time
- RBI / cybercrime.gov.in as a data partner
- Cyber insurance companies offering job scam protection add-ons
- Job platforms for pre-listing verification

---

### The Flywheel

```
More freemium users
→ more scam reports
→ scam DB gets richer
→ API accuracy improves
→ API becomes more valuable to B2B buyers
→ B2B revenue funds free tier infrastructure
→ free tier stays free longer
→ more users join
→ loop continues
```

Freemium users are the API's best sales pitch. When you walk into Naukri and say "we've verified 50,000 job listings in 6 months and flagged 12,000 as scams, here's the breakdown by category and city" — that's proof of product-market fit they can't argue with.

---

### Revenue Sequencing

**0–6 months:** Free. Build volume. Build the scam database. Build credibility. Win the hackathon, get press coverage.

**6–18 months:** Approach 2–3 job platforms with B2B API pilot. ₹1–2/call or ₹25k–2L/month flat depending on volume. One Internshala or Apna pilot at small scale is meaningful early revenue.

**18 months+:** Threat intelligence feed as a separate product. Data partnerships with banks and cyber insurers.

---

### What Doesn't Work

- **Ads** — you're showing someone a scam verdict. ads next to that kill trust instantly.
- **Charging victims** — zero willingness to pay, wrong incentive structure.
- **Government grant as primary model** — slow, political, distracts from building. pursue as supplementary only.

---

### Hackathon Pitch — one clean line on business model

> Free for users forever. We monetize by selling our verification API to job platforms who need to vet listings before publishing. Every scam we catch makes our database smarter and more valuable to the next buyer.

---

## Numbers for the Pitch Slide

Conservative, believable, not hockey stick:

- 5,000 active freemium users generating 25,000 checks/month in year one
- 3 job platform API clients at ₹25k/month = ₹75,000 MRR from B2B alone
- 50,000 scam entities in database after year one = defensible moat

Judges respect believable over fantasy.

---

*Built for agentic AI hackathon. Flagged AI — one-tap forward, 30-second verdict.*