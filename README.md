# 🌍 Planetary Pulse — Earth Health Dashboard

**Built for the "Build for the Planet" Challenge**

A full-stack Node.js application that combines real-time environmental monitoring, AI-powered climate insights, persistent memory, carbon footprint calculation, and blockchain-verified carbon credit tracking — all powered by six cutting-edge technologies.

## 🎯 What It Does

| Feature | Description | Technology |
|---------|-------------|------------|
| 📊 **Dashboard** | 7 environmental metrics with animated visualizations | Snowflake |
| 🌐 **Earth Globe** | CSS-only animated rotating globe | Pure CSS |
| 📈 **Trend Charts** | Interactive SVG charts (temp, CO₂, sea level, ice) | Snowflake |
| 🤖 **AI Assistant** | Climate chatbot with persistent memory | Backboard + Gemini |
| 🧮 **Carbon Calculator** | Personal footprint with IPCC-based factors | Custom |
| 🪙 **Carbon Credits** | Retire offsets tracked on-chain | Solana |
| 🔐 **User Auth** | Secure login with agent token minting | Auth0 |
| 🧠 **AI Insights** | Data-driven climate analysis | Google Gemini |

## 🛠️ Technology Integrations

### 1. 🟣 Backboard — Best Use of Backboard
**Persistent AI memory across conversations.**

- Creates a `Planetary Pulse Climate Assistant` on Backboard
- Automatic fact extraction from conversations
- Memory persists across sessions — the assistant remembers your goals
- Falls back to mock mode when no API key is set

**Files:** `server/routes/backboard.js`

### 2. 🟠 Auth0 for Agents — Best Use of Auth0 for Agents
**User authentication + AI agent authorization.**

- `express-openid-connect` for login/logout/callback flow
- `/api/auth/agent-token` mints scoped tokens for AI agent access
- Auth status exposed at `/api/auth/status`
- User profile displayed in header

**Files:** `server/index.js` (Auth0 config)

### 3. 🔵 Google Gemini — Best Use of Google Gemini
**AI-powered climate analysis and personalized plans.**

- `POST /api/gemini/analyze` — analyze environmental metrics with structured JSON output
- `POST /api/gemini/personal-plan` — generate personalized action plans
- `POST /api/gemini/interpret-data` — human-readable data interpretation
- Uses `gemini-2.0-flash` model via REST API

**Files:** `server/routes/gemini.js`

### 4. 🔷 Snowflake — Best Use of Snowflake
**Query large-scale climate datasets.**

- 7 datasets: temperature, CO₂, sea level, Arctic ice, deforestation, renewables, biodiversity
- `snowflake-sdk` connection with parameterized SQL queries
- `/api/snowflake/dashboard` aggregates all metrics for the UI
- Falls back to cached mock data (real values from NASA, NOAA, etc.)

**Files:** `server/routes/snowflake.js`

### 5. 🟢 GitHub Copilot — Best Use of GitHub Copilot
**Used throughout development for:**

- API route scaffolding and error handling patterns
- CSS animation keyframes and SVG chart construction
- Carbon calculation formulas and emission factor research
- Responsive grid layout and component architecture

### 6. 🟣 Solana — Best Use of Solana
**Carbon credit tokens tracked on blockchain.**

- Browse verified carbon credits (reforestation, wind, mangroves, DAC)
- Retire (burn) credits with on-chain transaction signatures
- Portfolio tracking with Solana explorer links
- Environmental impact equivalencies (trees, car miles, flight hours)
- `@solana/web3.js` integration (devnet for testing)

**Files:** `server/routes/solana.js`

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional — works without API keys)
cp .env.example .env
# Edit .env with your API keys

# 3. Start the server
npm start

# 4. Open dashboard
open http://localhost:3000
```

**No API keys needed!** The app works fully with mock data when keys are absent. Add keys to unlock real integrations.

## 📁 Project Structure

```
planetary-pulse/
├── server/
│   ├── index.js              # Express server + Auth0 config
│   └── routes/
│       ├── backboard.js      # Backboard AI memory integration
│       ├── gemini.js          # Google Gemini AI insights
│       ├── snowflake.js       # Snowflake climate data queries
│       ├── solana.js          # Solana carbon credit tracking
│       └── carbon.js          # Carbon footprint calculator
├── public/
│   ├── index.html             # Dashboard UI (4 tabs)
│   ├── style.css              # Complete styling
│   └── app.js                 # Frontend application logic
├── .env.example               # Environment template
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔌 API Endpoints

### Health
- `GET /api/health` — Service status for all integrations

### Backboard (AI Memory)
- `GET /api/backboard/status` — Connection status
- `GET /api/backboard/memories?q=climate` — Search climate memories
- `POST /api/backboard/chat` — Chat with persistent AI assistant
- `POST /api/backboard/memory` — Store new insight

### Auth0 (Authentication)
- `GET /api/auth/status` — Auth status + user profile
- `GET /api/auth/agent-token` — Mint agent authorization token
- `GET /login` — Auth0 login page
- `GET /logout` — Auth0 logout

### Gemini (AI Insights)
- `GET /api/gemini/status` — Model status
- `POST /api/gemini/analyze` — Analyze environmental data
- `POST /api/gemini/personal-plan` — Generate action plan
- `POST /api/gemini/interpret-data` — Human-readable data interpretation

### Snowflake (Climate Data)
- `GET /api/snowflake/status` — Connection + available datasets
- `GET /api/snowflake/datasets` — List all datasets
- `GET /api/snowflake/query/:dataset?fromYear=2000` — Query specific dataset
- `GET /api/snowflake/dashboard` — Aggregated dashboard data

### Solana (Carbon Credits)
- `GET /api/solana/status` — Network status
- `GET /api/solana/credits?type=reforestation` — Browse credits
- `GET /api/solana/portfolio` — User's credit portfolio
- `POST /api/solana/retire` — Retire a carbon credit (on-chain burn)
- `GET /api/solana/impact?tonnes=3.6` — Environmental impact equivalencies

### Carbon Calculator
- `POST /api/carbon/calculate` — Calculate personal footprint
- `GET /api/carbon/factors` — View emission factors + sources

## 📊 Data Sources

- NASA GISS — Global temperature anomalies
- NOAA — CO₂ concentration (Mauna Loa)
- NSIDC — Arctic sea ice extent
- Global Forest Watch — Deforestation data
- IRENA — Renewable energy capacity
- WWF/ZSL — Living Planet Index (biodiversity)
- IPCC AR6, EPA — Emission factors

## 🏆 Prize Categories

| Category | How We Qualify |
|----------|---------------|
| **Best use of Backboard** | AI assistant with persistent memory, auto fact extraction, cross-session state |
| **Best use of Auth0 for Agents** | User auth + agent token minting via express-openid-connect |
| **Best use of Google Gemini** | AI climate analysis, personal plan generation, data interpretation |
| **Best use of Snowflake** | 7 climate datasets with parameterized SQL queries |
| **Best use of GitHub Copilot** | Used for code generation, CSS animations, API patterns |
| **Best use of Solana** | Carbon credit marketplace with on-chain retirement tracking |

## 📝 License

MIT — Built with 🌍 for Earth Day 2025
