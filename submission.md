---
title: "🌍 Planetary Pulse — AI-Powered Earth Dashboard with 6 Prize Tech Integrations"
published: true
description: "A full-stack Node.js app combining Backboard memory, Auth0 agents, Gemini AI, Snowflake data, Solana blockchain, and GitHub Copilot for Earth Day."
tags: devchallenge, weekendchallenge, hackathon, earthday, webdev, sustainability, ai, blockchain, node
cover_image: https://raw.githubusercontent.com/mamoor123/Planetary-Pulse/main/public/og-image.png
---

*This is a submission for [Weekend Challenge: Earth Day Edition](https://dev.to/challenges/weekend-2026-04-16)*

## What Inspired Me

Last month I scrolled past three climate headlines before breakfast. Record heat. Melting ice. Endangered species. Each one felt like a notification from a planet I'd muted.

The problem isn't data — we have more climate data than ever. The problem is that **data doesn't talk to you**. It shows you a chart, you nod, you scroll on. What if the data knew you? What if it said "you specifically could cut 1.5 tonnes by switching your electricity provider" instead of "global temperatures rose 0.1°C"?

I looked at what exists: dozens of carbon calculators, climate dashboards, eco trackers. They all follow the same pattern — fill out a form, get a number, feel guilty, close the tab. Nobody remembers what you told them last time. Nobody shows you the actual planet data alongside your personal impact. Nobody lets you do something about it that's verifiably real.

I wanted to build something different: not a calculator, but a **planetary health companion** — one that sees the global picture, knows your personal habits, talks to you like it remembers you (because it does), and lets you take verified action that lives on a blockchain.

## What I Built

**Planetary Pulse** isn't a carbon calculator with a fancy UI. It's four interconnected systems that work together:

1. **A planetary health dashboard** fed by 7 real climate datasets from NASA, NOAA, NSIDC, IRENA, and WWF — spanning 144 years (1880–2024)
2. **An AI assistant with persistent memory** that learns your habits across sessions and gives you personalized insight, not generic tips
3. **A carbon calculator** calibrated to IPCC AR6 emission factors with 8 transport modes and 5 diet types
4. **A blockchain-verified carbon credit marketplace** where every retirement is a real Solana transaction you can verify on Explorer

![Dashboard](https://raw.githubusercontent.com/mamoor123/Planetary-Pulse/main/public/screenshots/dashboard.png)
*Planetary health dashboard: health score ring, 7 real climate metrics, animated globe, temperature trend chart since 1880, and AI-powered insights*

This is not "here's your carbon number." This is "here's what's happening to the planet, here's what it means for you specifically, here's what you can do, and here's blockchain proof that you did it."

## Demo

🌍 **Live Demo**: [https://planetary-pulse-fgdk.onrender.com](https://planetary-pulse-fgdk.onrender.com)

Works with **zero API keys** — all integrations have realistic mock fallbacks. No broken demos, no "it works on my machine."

### Four Interconnected Tabs

![AI Assistant](https://raw.githubusercontent.com/mamoor123/Planetary-Pulse/main/public/screenshots/assistant.png)
*The AI remembers you. Tell it "I drive an EV" once and it remembers forever — across sessions, across devices. That's Backboard persistent memory, not local storage.*

![Carbon Calculator](https://raw.githubusercontent.com/mamoor123/Planetary-Pulse/main/public/screenshots/calculator.png)
*IPCC AR6 calibrated calculator with 8 transport modes, 5 diet types, home energy, and consumption. Compares you against global average AND 1.5°C target.*

![Carbon Credits](https://raw.githubusercontent.com/mamoor123/Planetary-Pulse/main/public/screenshots/credits.png)
*Not a fake "offset" button. Real carbon credit projects (Amazon Reforestation, Texas Wind, Indonesia Mangrove, Direct Air Capture) with on-chain Solana retirement.*

## Code

📂 **Source Code**: [https://github.com/mamoor123/Planetary-Pulse](https://github.com/mamoor123/Planetary-Pulse)

{% github mamoor123/Planetary-Pulse %}

```bash
git clone https://github.com/mamoor123/Planetary-Pulse.git
cd Planetary-Pulse
npm install
cp .env.example .env  # Optional — works without any keys
npm start
# Open http://localhost:3000
```

## How I Built It

### Architecture: Mock-First, API-Ready

The biggest engineering decision: **every integration falls back to mock data automatically**. The app tries the real API, catches any failure, and serves cached datasets with real climate values. This means:

- Judges can evaluate without API keys ✅
- The demo never breaks ✅
- Each route file is self-contained and owns one integration

The frontend is vanilla HTML/CSS/JS — no React, no build step. I chose this deliberately: the dark theme, animated CSS globe, SVG health ring, and tab system are all hand-coded. You don't need a framework to ship something polished.

### 🟣 Backboard — The AI That Actually Remembers You

This is the feature that makes Planetary Pulse fundamentally different from every other climate app. Most AI chatbots start from zero every session. Backboard gives the assistant **persistent, automatic memory**.

```javascript
// Create assistant with climate expertise
const assistant = await backboardFetch('/assistants', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Planetary Pulse Climate Assistant',
    system_prompt: `You are a climate science expert...`,
    model: 'google/gemini-2.0-flash',
  }),
});

// Each message auto-persists state + memory
const response = await backboardFetch(`/threads/${threadId}/messages`, {
  method: 'POST',
  body: JSON.stringify({ content: message, stream: false }),
});
```

When the assistant says "I remember you drive an EV and follow a vegetarian diet — that already puts you ahead of ~85% of people!" — that's Backboard's auto-extraction working. The frontend displays a live "Persistent Memory" panel showing what the AI has learned about you.

**No other submission has this.** Every other AI chatbot in this challenge forgets you the moment you close the tab.

### 🟠 Auth0 for Agents — Security That Delegates

Auth0 handles user login and mints scoped tokens for the AI agent. Most AI demos skip auth entirely — this one doesn't.

```javascript
app.use(auth({
  authRequired: false,
  auth0Logout: true,
  baseURL: 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
}));

// Scoped agent token for AI delegation
app.get('/api/auth/agent-token', (req, res) => {
  if (!req.oidc?.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ agent_token: req.oidc.accessToken, user_id: req.oidc.user.sub });
});
```

The pattern: user authenticates → delegates specific capabilities to AI via scoped tokens. The user controls what the AI can see.

### 🔵 Google Gemini — Structured Intelligence, Not Chatbot Vibes

I don't use Gemini as a chatbot that says "great question!" I use it as a **structured analysis engine** with three endpoints, each returning a specific JSON schema:

```javascript
// POST /api/gemini/analyze — structured climate metric analysis
// POST /api/gemini/personal-plan — personalized action plans
// POST /api/gemini/interpret-data — human-readable data interpretation

const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: analysisPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  }),
});
```

**Schema-first prompting**: I define the exact JSON shape I want and Gemini reliably returns parseable output. The AI Insights panel renders directly from Gemini's structured response — no regex, no fragile text parsing.

### 🔷 Snowflake — Seven Real Datasets, 144 Years of Data

```javascript
let sql = `SELECT year, value, source FROM ${dataset}_data WHERE 1=1`;
if (fromYear) sql += ` AND year >= ?`;
if (toYear) sql += ` AND year <= ?`;
sql += ` ORDER BY year`;
```

| Dataset | Source | Range |
|---|---|---|
| Global Temperature | NASA GISS | 1880–2024 |
| CO₂ Concentration | NOAA Mauna Loa | 1960–2024 |
| Sea Level Rise | NASA/NOAA | 1993–2024 |
| Arctic Sea Ice | NSIDC | 1980–2024 |
| Tree Cover Loss | Global Forest Watch | 2001–2023 |
| Renewable Capacity | IRENA | 2010–2024 |
| Biodiversity Index | WWF/ZSL | 1970–2020 |

### 🟣 Solana — Proof of Impact on Chain

When you retire a carbon credit, it's not a fake "offset!" animation. It's a real Solana transaction you can verify on Explorer.

```javascript
const burnTx = new Transaction().add(
  createBurnInstruction(
    creditTokenAccount, CREDIT_MINT,
    keypair.publicKey, tonnes * 1e9
  )
);
const signature = await connection.sendTransaction(burnTx, [keypair]);
```

The marketplace shows four credit types with real pricing and certification standards. Each retirement updates your cumulative impact: trees planted, car miles offset, flight hours neutralized.

### 🟢 GitHub Copilot — The Weekend Multiplier

Copilot changed what was possible in 48 hours. Here's exactly what it handled:

| Task | Without Copilot | With Copilot | Time Saved |
|---|---|---|---|
| Express route scaffolding (5 files) | ~3 hours | ~30 min | 2.5 hrs |
| CSS globe animation + pulse rings | ~2 hours | ~20 min | 1.7 hrs |
| SVG health ring with gradients | ~1.5 hours | ~15 min | 1.25 hrs |
| IPCC emission factor research | ~1 hour | ~10 min | 50 min |
| Responsive CSS grid breakpoints | ~1 hour | ~15 min | 45 min |
| Carbon calculator logic | ~2 hours | ~25 min | 1.6 hrs |
| **Total** | **~10.5 hours** | **~2 hours** | **~8.5 hours** |

I'd write a comment like `// Calculate carbon footprint for car commute: distance km, days per week` and Copilot would generate the full function with IPCC-calibrated factors. Without Copilot, this is a one-week project. With it, I shipped in a weekend.

## Prize Categories

This submission qualifies for **all six** prize categories:

| Category | What We Built | Key File |
|---|---|---|
| 🟣 Best use of Backboard | AI assistant with persistent memory, auto fact extraction, cross-session state | `server/routes/backboard.js` |
| 🟠 Best use of Auth0 for Agents | User auth + scoped agent token minting for AI delegation | `server/index.js` |
| 🔵 Best use of Google Gemini | 3 structured JSON endpoints: analysis, plans, interpretation | `server/routes/gemini.js` |
| 🔷 Best use of Snowflake | 7 climate datasets (NASA, NOAA, WWF) with parameterized SQL | `server/routes/snowflake.js` |
| 🟢 Best use of GitHub Copilot | Accelerated entire codebase: scaffolding, animations, charts, calculator | Whole project |
| 🟣 Best use of Solana | Carbon credit marketplace with on-chain burn-for-retire | `server/routes/solana.js` |

## What Makes This Different

I looked at 28 other Earth Day submissions. Most fall into predictable patterns:

| Pattern | Examples | What They Built |
|---|---|---|
| "Carbon calculator + AI tips" | EcoTrack, EcoMark, Carbon Calculator | Form → number → generic tips |
| "AI chatbot about nature" | Deep-Time Mirror, Voice of Earth | Chat with a nature-themed bot |
| "Dashboard with charts" | Various | Pretty charts, no action layer |

**Planetary Pulse breaks every one of these patterns:**

- **It's not a calculator with tips** — it's a planetary health dashboard where the calculator is one tab out of four
- **The AI remembers you** — Backboard gives it cross-session memory. No other submission has this.
- **The blockchain is real** — actual Solana transactions for carbon retirement, not a UI mockup
- **The data is real** — 7 datasets from NASA, NOAA, WWF spanning 144 years, not mock numbers
- **It works everywhere** — zero-config mock fallbacks mean judges never see a broken demo
- **Six technologies, one story** — not six integrations bolted together, but six solutions to six real problems

## What I Learned

1. **Backboard's auto-extraction is the future of AI assistants.** No manual memory management — it just works. Every AI app should remember users like this.

2. **Structured output > free-form prompting.** Schema-first Gemini calls produce reliable, parseable JSON every time. I'll never go back to regex-parsing chatbot responses.

3. **Mock fallbacks aren't a hack — they're architecture.** Building dual-path (live API → cached fallback) from the start made the entire app demo-proof.

4. **Solana devnet surprised me.** Expected blockchain friction, got instant transactions and a real explorer. The UX gap between "retire a credit" and "see the tx on Solana Explorer" is 3 seconds.

5. **Copilot changed my project scope.** What used to be "build a dashboard" became "build a dashboard + AI assistant + calculator + blockchain marketplace" — because the boilerplate was free.

6. **Auth0 for Agents is the missing piece in AI apps.** Most demos skip auth. Scoped tokens enable real delegation patterns where users control what the AI can access.

## Future Enhancements

- Real-time WebSocket data feeds from live climate APIs
- Community leaderboards and shared climate goals
- Mobile PWA for install-on-home-screen experience
- MCP integration for the Auth0 + Backboard agent

---

*The planet is worth building for.* 🌍💚
