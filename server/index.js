/**
 * Planetary Pulse — Main Server
 * 
 * Integrations:
 *   - Backboard: AI climate assistant with persistent memory
 *   - Auth0: User authentication for agents
 *   - Google Gemini: AI-powered climate insights
 *   - Snowflake: Climate dataset queries
 *   - Solana: Carbon credit token tracking
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Auth0 Integration (User + Agent Authentication) ────────────────────────
try {
  const { auth } = require('express-openid-connect');
  
  const auth0Config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    baseURL: process.env.AUTH0_CALLBACK_URL?.replace('/callback', '') || `http://localhost:${PORT}`,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : undefined,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
      audience: process.env.AUTH0_AUDIENCE,
    },
    routes: {
      callback: '/callback',
      login: '/login',
      logout: '/logout',
    },
  };

  if (process.env.AUTH0_CLIENT_ID && process.env.AUTH0_DOMAIN) {
    app.use(auth(auth0Config));
    console.log('✅ Auth0: Enabled (user + agent authentication)');
    
    // Auth status endpoint
    app.get('/api/auth/status', (req, res) => {
      res.json({
        authenticated: req.oidc?.isAuthenticated() || false,
        user: req.oidc?.user || null,
      });
    });

    // Protected route example for agent auth
    app.get('/api/auth/agent-token', (req, res) => {
      if (!req.oidc?.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      // In production: mint a scoped token for the AI agent
      res.json({
        agent_token: req.oidc.accessToken,
        user_id: req.oidc.user.sub,
        expires_in: 3600,
      });
    });
  } else {
    console.log('⚠️  Auth0: Disabled (set AUTH0_CLIENT_ID and AUTH0_DOMAIN)');
  }
} catch (_e) {
  console.log('⚠️  Auth0: Module not available, using mock auth');
}

// Auth fallback routes (always available when Auth0 is not configured)
app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: false, user: null });
});
app.get('/api/auth/agent-token', (req, res) => {
  res.status(501).json({ error: 'Auth0 not configured — agent tokens unavailable' });
});

// ─── Route Registration ─────────────────────────────────────────────────────
const backboardRoutes = require('./routes/backboard');
const geminiRoutes = require('./routes/gemini');
const snowflakeRoutes = require('./routes/snowflake');
const solanaRoutes = require('./routes/solana');
const carbonRoutes = require('./routes/carbon');

app.use('/api/backboard', backboardRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/snowflake', snowflakeRoutes);
app.use('/api/solana', solanaRoutes);
app.use('/api/carbon', carbonRoutes);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      backboard: !!process.env.BACKBOARD_API_KEY,
      auth0: !!(process.env.AUTH0_CLIENT_ID && process.env.AUTH0_DOMAIN),
      gemini: !!process.env.GEMINI_API_KEY,
      snowflake: !!(process.env.SNOWFLAKE_ACCOUNT && process.env.SNOWFLAKE_USERNAME),
      solana: !!process.env.SOLANA_RPC_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── SPA Fallback ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`\n🌍 Planetary Pulse running at http://localhost:${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}`);
  console.log(`   API Health: http://localhost:${PORT}/api/health\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Set PORT env var or kill the existing process.`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});
