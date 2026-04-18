---
title: "🌍 Planetary Pulse — AI-Powered Earth Dashboard with 6 Prize Tech Integrations"
published: false
description: "A full-stack Node.js app combining Backboard memory, Auth0 agents, Gemini AI, Snowflake data, Solana blockchain, and GitHub Copilot for Earth Day."
tags: hackathon, earthday, webdev, sustainability, ai, blockchain, node
cover_image: https://raw.githubusercontent.com/mamoor123/Planetary-Pulse/main/public/og-image.png
---

# 🌍 Planetary Pulse — Build for the Planet

*Submitted for the "Build for the Planet" Challenge*

## What Inspired Me

We're drowning in climate data but starved for meaning. Every day there's a new headline about record temperatures, melting ice, or endangered species — and every day we scroll past it because it feels abstract, distant, and someone else's problem.

I wanted to build something that closes that gap. Not another doom-and-gloom dashboard, but a tool that says: "Here's what's happening. Here's what it means for YOU. Here's what you can do about it. And here's proof it matters."

The idea of combining six different technologies wasn't just about checking boxes — each one solves a real problem in this space. Backboard gives the AI memory so it actually knows you. Gemini turns raw numbers into insight. Snowflake provides the real data backbone. Solana makes carbon offsets transparent and verifiable. And Auth0 makes sure your personal climate data stays yours.

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

## Technology Deep Dive

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

The assistant also stores user insights in Backboard's memory system, so your climate goals persist across sessions.

### 🟠 Auth0 for Agents — User Auth + Agent Tokens

Auth0 secures the application and mints scoped tokens for AI agent access:

```javascript
app.use(auth({
  authRequired: false,
  auth0Logout: true,
  baseURL: 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
}));

// Agent token endpoint
app.get('/api/auth/agent-token', (req, res) => {
  if (!req.oidc?.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ agent_token: req.oidc.accessToken, user_id: req.oidc.user.sub });
});
```

This enables the pattern where a user authenticates, then delegates specific capabilities to the AI agent via scoped tokens.

### 🔵 Google Gemini — AI Climate Analysis

Three Gemini endpoints power intelligent climate analysis:

```javascript
// POST /api/gemini/analyze — analyze environmental metrics
// POST /api/gemini/personal-plan — generate action plans
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

Gemini generates structured JSON responses that the frontend renders as interactive insights and personalized action plans.

### 🔷 Snowflake — Climate Data Warehouse

Seven climate datasets are queried through Snowflake with full SQL support:

```javascript
// Parameterized queries with year filtering
let sql = `SELECT year, value, source FROM ${dataset}_data WHERE 1=1`;
if (fromYear) sql += ` AND year >= ?`;
if (toYear) sql += ` AND year <= ?`;
sql += ` ORDER BY year`;
```

Datasets include: Global Temperature (NASA GISS), CO₂ (NOAA), Sea Level (NASA), Arctic Ice (NSIDC), Deforestation (Global Forest Watch), Renewables (IRENA), Biodiversity (WWF).

### 🟣 Solana — Carbon Credit Blockchain

Carbon credits are tracked as on-chain tokens with verifiable retirement:

```javascript
// Retire a carbon credit (burn on-chain)
const burnTx = new Transaction().add(
  createBurnInstruction(
    creditTokenAccount, CREDIT_MINT,
    keypair.publicKey, tonnes * 1e9
  )
);
const signature = await connection.sendTransaction(burnTx, [keypair]);
```

Each retirement generates a transaction signature viewable on Solana Explorer, creating a transparent, immutable record of environmental impact.

### 🟢 GitHub Copilot — Development Accelerator

GitHub Copilot was used extensively throughout development:

- **API route scaffolding**: Generated the Express router patterns, error handling wrappers, and mock fallback logic across all 5 route files
- **CSS animations**: Suggested the keyframe sequences for the rotating globe, pulse rings, and star twinkle effects
- **SVG chart construction**: Helped build the interactive trend chart with gradients, tooltips, and dynamic axis scaling
- **Carbon calculation research**: Assisted in finding IPCC emission factors and structuring the calculator logic
- **Responsive design**: Generated the CSS grid breakpoints and media queries for mobile/tablet layouts

Copilot accelerated development by roughly 40% — especially for boilerplate patterns and CSS where it excels at predicting the next line.

## Demo

🌍 **Live Demo**: [https://planetary-pulse-fgdk.onrender.com](https://planetary-pulse-fgdk.onrender.com)

```bash
git clone https://github.com/mamoor123/Planetary-Pulse.git
cd Planetary-Pulse
npm install
cp .env.example .env  # Optional: add API keys for real integrations
npm start
open http://localhost:3000
```

**The app works fully without any API keys** using realistic mock data. Add keys to unlock real integrations.

### Four Interactive Tabs:

1. **📊 Dashboard** — Health score, metrics, globe, chart, AI insights, action plan
2. **🤖 AI Assistant** — Chat with persistent memory (Backboard)
3. **🧮 Calculator** — Personal carbon footprint with recommendations
4. **🪙 Credits** — Browse, purchase, and retire carbon credits (Solana)

## What I Learned

1. **Backboard's memory is magic.** The assistant automatically extracts facts from conversations and surfaces them contextually. No manual memory management needed.

2. **Auth0 for Agents is the missing piece.** Most AI demos skip auth. Scoped agent tokens enable real delegation patterns where users control what the AI can access.

3. **Gemini excels at structured output.** Asking for JSON responses with specific schemas produces reliable, parseable climate analysis every time.

4. **Snowflake mock fallbacks are essential.** Real credentials aren't available during demos. Cached datasets with real values make the app work everywhere.

5. **Solana devnet makes blockchain development painless.** Instant transactions, free test tokens, and a real explorer for verification.

## Future Enhancements

- **Real-time data feeds** — WebSocket updates from live climate APIs
- **Social features** — Community leaderboards and shared climate goals
- **Mobile PWA** — Installable progressive web app
- **MCP integration** — Model Context Protocol for the Auth0 + Backboard agent

## Links

- 📂 [Source Code](https://github.com/mamoor123/Planetary-Pulse)
- 🌍 [Live Demo](https://planetary-pulse-fgdk.onrender.com) — works with zero API keys

---

*The planet is worth building for.* 🌍💚
