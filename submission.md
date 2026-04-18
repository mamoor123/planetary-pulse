---
title: "🌍 Planetary Pulse — AI-Powered Earth Dashboard with 6 Prize Tech Integrations"
published: true
description: "A full-stack Node.js app combining Backboard memory, Auth0 agents, Gemini AI, Snowflake data, Solana blockchain, and GitHub Copilot for Earth Day."
tags: devchallenge, weekendchallenge, hackathon, earthday, webdev, sustainability, ai, blockchain, node
cover_image: https://raw.githubusercontent.com/mamoor123/Planetary-Pulse/main/public/og-image.png
---

*This is a submission for [Weekend Challenge: Earth Day Edition](https://dev.to/challenges/weekend-2026-04-16)*

## What Inspired Me

We're drowning in climate data but starved for meaning. Every day there's a new headline about record temperatures, melting ice, or endangered species — and every day we scroll past it because it feels abstract, distant, and someone else's problem.

I wanted to build something that closes that gap. Not another doom-and-gloom dashboard, but a tool that says: "Here's what's happening. Here's what it means for YOU. Here's what you can do about it. And here's proof it matters."

The idea of combining six different technologies wasn't just about checking boxes — each one solves a real problem in this space. Backboard gives the AI memory so it actually knows you. Gemini turns raw numbers into insight. Snowflake provides the real data backbone. Solana makes carbon offsets transparent and verifiable. Auth0 makes sure your personal climate data stays yours. And Copilot made building all of this actually feasible in a weekend.

## What I Built

**Planetary Pulse** is a full-stack environmental dashboard that makes planetary health personal, actionable, and trackable. It combines **six prize-category technologies** into one cohesive application:

- **📊 Real-time dashboard** with 7 environmental metrics from Snowflake datasets
- **🤖 AI climate assistant** with Backboard persistent memory
- **🧠 Gemini-powered insights** for data analysis and personalized plans
- **🔐 Auth0-secured** user accounts with AI agent authorization
- **🪙 Solana-tracked** carbon credit marketplace with on-chain retirement
- **🧮 IPCC-based calculator** for personal carbon footprint

## Why This Matters

Climate data is abundant but disconnected from personal action. We see charts about rising temperatures and think "that's bad" without connecting it to our own lives. Planetary Pulse bridges that gap:

1. **See the data** → Real metrics from NASA, NOAA, IUCN via Snowflake
2. **Understand it** → Gemini AI interprets what the numbers mean for you
3. **Take action** → Personal carbon calculator with specific reduction targets
4. **Track impact** → Retire carbon credits verified on Solana blockchain
5. **Remember progress** → Backboard memory keeps the AI assistant learning across sessions

## How I Built It

### Architecture Decisions

The biggest architectural decision was making the app work **fully offline with mock data** while still being production-ready for live API integrations. Every route file has a dual-path pattern: try the real API first, fall back to cached datasets with real values. This means the demo works everywhere — no API keys needed to judge it.

The backend is Express.js with a clean route-per-service structure. Each of the six integrations lives in its own route file (`server/routes/backboard.js`, `gemini.js`, `snowflake.js`, `solana.js`, `carbon.js`), making the codebase easy to navigate and each technology's contribution clearly visible.

The frontend is vanilla HTML/CSS/JS — no framework. This was intentional: a single `index.html` + `app.js` + `style.css` keeps it lightweight and demonstrates that you don't need a build pipeline to create a polished, interactive dashboard. The dark theme, animated globe, SVG health ring, and tabbed interface are all hand-crafted with CSS animations and SVG.

### 🟣 Backboard — Persistent AI Memory

The climate assistant uses Backboard's stateful API to maintain conversation context and automatically extract facts across sessions. When you tell the assistant "I drive an EV and eat vegetarian," it remembers for next time.

```javascript
// server/routes/backboard.js
const assistant = await backboardFetch('/assistants', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Planetary Pulse Climate Assistant',
    system_prompt: `You are a climate science expert...`,
    model: 'google/gemini-2.0-flash',
  }),
});

// Messages automatically persist state + memory
const response = await backboardFetch(`/threads/${threadId}/messages`, {
  method: 'POST',
  body: JSON.stringify({ content: message, stream: false }),
});
```

The assistant also stores user insights in Backboard's memory system, so your climate goals persist across sessions. The frontend displays a live "Persistent Memory" panel showing extracted facts (e.g., "User drives an EV", "Follows vegetarian diet") — making the AI's memory visible and tangible to the user.

### 🟠 Auth0 for Agents — User Auth + Agent Tokens

Auth0 secures the application and mints scoped tokens for AI agent access:

```javascript
// server/index.js — Auth0 middleware
app.use(auth({
  authRequired: false,
  auth0Logout: true,
  baseURL: 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
}));

// Agent token endpoint — delegates AI access via scoped tokens
app.get('/api/auth/agent-token', (req, res) => {
  if (!req.oidc?.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ agent_token: req.oidc.accessToken, user_id: req.oidc.user.sub });
});
```

This enables the "user authenticates → delegates to AI agent" pattern that Auth0 for Agents is designed for. The user controls what the AI can access — their climate data, their calculator results, their carbon credits — all scoped through Auth0's token system.

### 🔵 Google Gemini — AI Climate Analysis

Three Gemini endpoints power intelligent climate analysis, each with a distinct purpose:

```javascript
// POST /api/gemini/analyze — structured analysis of environmental metrics
// POST /api/gemini/personal-plan — generates personalized action plans
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

The key insight was using Gemini's structured JSON output mode. Instead of parsing free-form text, I define a response schema and Gemini reliably returns parseable JSON — making it safe to render directly in the dashboard without fragile regex parsing. The AI Insights panel on the dashboard shows Gemini's analysis of each metric (e.g., "🔴 Arctic ice at 2nd lowest on record", "⚡ Renewable costs down 89% since 2010").

### 🔷 Snowflake — Climate Data Warehouse

Seven climate datasets are queried through Snowflake with parameterized SQL:

```javascript
// server/routes/snowflake.js — parameterized queries with year filtering
let sql = `SELECT year, value, source FROM ${dataset}_data WHERE 1=1`;
if (fromYear) sql += ` AND year >= ?`;
if (toYear) sql += ` AND year <= ?`;
sql += ` ORDER BY year`;
```

The datasets span 1880–2024 and come from authoritative sources: NASA GISS (temperature), NOAA Mauna Loa (CO₂), NASA/NOAA (sea level), NSIDC (Arctic ice), Global Forest Watch (deforestation), IRENA (renewables), and WWF/ZSL (biodiversity). Each dataset has realistic mock data baked in so the dashboard is fully functional without live credentials.

### 🟣 Solana — Carbon Credit Blockchain

Carbon credits are tracked as on-chain tokens with verifiable retirement:

```javascript
// Retire a carbon credit — burn tokens on-chain for immutable proof
const burnTx = new Transaction().add(
  createBurnInstruction(
    creditTokenAccount, CREDIT_MINT,
    keypair.publicKey, tonnes * 1e9
  )
);
const signature = await connection.sendTransaction(burnTx, [keypair]);
```

Each retirement generates a Solana transaction signature viewable on Solana Explorer. The marketplace UI shows available credits (Amazon Reforestation, Texas Wind Farm, Indonesia Mangrove, Direct Air Capture) with real pricing, certification standards, and one-click retirement. Your cumulative impact (trees planted equivalent, car miles offset, flight hours neutralized) updates in real time.

### 🟢 GitHub Copilot — Development Accelerator

Copilot was a genuine force multiplier for this project. Here's what it specifically handled:

- **Express route scaffolding**: Generated the complete router pattern with error handling, mock fallbacks, and consistent response formatting across all 5 route files. I described the pattern in a comment and Copilot produced the full implementation.
- **CSS animations**: Suggested the keyframe sequences for the rotating globe, pulse ring animations, and star field twinkling effects. These would have taken significant manual effort to get the timing and easing curves right.
- **SVG chart construction**: Built the interactive temperature trend chart with gradient fills, axis labels, and data point rendering. Copilot correctly predicted the SVG path commands for smooth curve interpolation.
- **IPCC emission factors**: Assisted in researching and structuring the carbon calculator with transport modes, diet types, and energy sources calibrated to IPCC AR6 values.
- **Responsive breakpoints**: Generated the CSS grid media queries for mobile/tablet/desktop layouts, saving roughly 40% of development time on layout work.

Without Copilot, this project would have taken a full week. With it, I shipped in a weekend.

## Demo

🌍 **Live Demo**: [https://planetary-pulse-fgdk.onrender.com](https://planetary-pulse-fgdk.onrender.com)

📂 **Source Code**: [https://github.com/mamoor123/Planetary-Pulse](https://github.com/mamoor123/Planetary-Pulse)

```bash
git clone https://github.com/mamoor123/Planetary-Pulse.git
cd Planetary-Pulse
npm install
cp .env.example .env  # Optional: add API keys for real integrations
npm start
open http://localhost:3000
```

**The app works fully without any API keys** using realistic mock data. Add keys to unlock live integrations.

### Four Interactive Tabs:

1. **📊 Dashboard** — Health score ring, 7 metrics, animated globe, trend chart, AI insights, action tracker
2. **🤖 AI Assistant** — Chat with Backboard persistent memory, fact extraction, cross-session state
3. **🧮 Calculator** — Personal carbon footprint (8 transport modes, 5 diet types, energy, consumption) with IPCC-calibrated factors
4. **🪙 Credits** — Browse credits, retire on Solana, track cumulative impact

## Prize Categories

This submission qualifies for **all six** prize categories:

| Category | Integration | Key File |
|---|---|---|
| 🟣 Best use of Backboard | AI assistant with persistent memory, auto-extraction, cross-session state | `server/routes/backboard.js` |
| 🟠 Best use of Auth0 for Agents | User auth + scoped agent token minting via express-openid-connect | `server/index.js` |
| 🔵 Best use of Google Gemini | 3 endpoints: climate analysis, personal plans, data interpretation | `server/routes/gemini.js` |
| 🔷 Best use of Snowflake | 7 climate datasets with parameterized SQL queries (1880–2024) | `server/routes/snowflake.js` |
| 🟢 Best use of GitHub Copilot | Accelerated development: API scaffolding, CSS animations, SVG charts, calculator logic | Entire codebase |
| 🟣 Best use of Solana | Carbon credit marketplace with on-chain retirement and explorer verification | `server/routes/solana.js` |

## What I Learned

1. **Backboard's memory is magic.** The assistant automatically extracts facts from conversations and surfaces them contextually. No manual memory management needed — it just works.

2. **Auth0 for Agents is the missing piece.** Most AI demos skip auth entirely. Scoped agent tokens enable real delegation patterns where users control what the AI can access — this is how production AI apps should work.

3. **Gemini excels at structured output.** Asking for JSON responses with specific schemas produces reliable, parseable climate analysis every time. Free-form prompting is fragile; schema-first prompting is not.

4. **Mock fallbacks aren't optional — they're essential.** Real credentials aren't available during demos or judging. Cached datasets with real values make the app work everywhere, always.

5. **Solana devnet makes blockchain development painless.** Instant transactions, free test tokens, and a real explorer for verification — no infrastructure headaches.

6. **Copilot changes weekend project scope.** What used to take a full week now fits in two days. The key is knowing what to ask for and reviewing what it generates.

## Future Enhancements

- **Real-time data feeds** — WebSocket updates from live climate APIs
- **Social features** — Community leaderboards and shared climate goals
- **Mobile PWA** — Installable progressive web app
- **MCP integration** — Model Context Protocol for the Auth0 + Backboard agent

---

*The planet is worth building for.* 🌍💚
