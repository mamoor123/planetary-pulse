/**
 * Backboard Integration — AI Climate Assistant with Persistent Memory
 * 
 * Backboard provides:
 *   - Persistent conversation threads (state management)
 *   - Automatic memory extraction across sessions
 *   - RAG over uploaded climate documents
 *   - 17,000+ LLM routing
 * 
 * Docs: https://docs.backboard.io
 */

const express = require('express');
const router = express.Router();

const BACKBOARD_BASE = process.env.BACKBOARD_BASE_URL || 'https://app.backboard.io/api';
const BACKBOARD_KEY = process.env.BACKBOARD_API_KEY;

// Helper: Backboard API request
async function backboardFetch(endpoint, options = {}) {
  if (!BACKBOARD_KEY) {
    return null; // Will fall back to mock
  }
  
  const url = `${BACKBOARD_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-API-Key': BACKBOARD_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Backboard API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// ─── Mock fallback when no API key ──────────────────────────────────────────
const MOCK_CLIMATE_FACTS = [
  { id: '1', content: 'Global CO₂ has risen from 280 ppm (pre-industrial) to 421 ppm (2024).', category: 'atmosphere', importance: 0.95 },
  { id: '2', content: 'Renewable energy costs have dropped 89% since 2010, making solar the cheapest electricity source in most regions.', category: 'energy', importance: 0.90 },
  { id: '3', content: 'The ocean absorbs about 30% of human-produced CO₂.', category: 'ocean', importance: 0.85 },
  { id: '4', content: 'Plant-rich diets reduce food emissions by up to 50%.', category: 'lifestyle', importance: 0.80 },
  { id: '5', content: 'Deforestation accounts for ~10% of global emissions.', category: 'forests', importance: 0.88 },
  { id: '6', content: 'Electric vehicles produce 50-70% fewer emissions than gas cars over their lifetime.', category: 'transport', importance: 0.82 },
  { id: '7', content: 'A single tree absorbs ~22 kg of CO₂ per year and produces oxygen for 2 people.', category: 'nature', importance: 0.75 },
  { id: '8', content: '37 countries have peaked their emissions and are now declining.', category: 'progress', importance: 0.87 },
];

/**
 * GET /api/backboard/status
 * Check Backboard integration status
 */
router.get('/status', (req, res) => {
  const enabled = !!BACKBOARD_KEY;
  res.json({
    enabled,
    message: enabled
      ? 'Backboard connected — AI assistant has persistent memory'
      : 'Backboard not configured — using local mock data',
    features: ['persistent_threads', 'auto_memory', 'rag_search', 'multi_model_routing'],
  });
});

/**
 * GET /api/backboard/memories
 * Retrieve stored climate knowledge from Backboard memory
 * Falls back to mock data when no API key
 */
router.get('/memories', async (req, res) => {
  try {
    if (BACKBOARD_KEY) {
      // Real Backboard: search memories for climate facts
      const result = await backboardFetch('/memories/search', {
        method: 'POST',
        body: JSON.stringify({
          query: req.query.q || 'climate facts environmental data',
          limit: parseInt(req.query.limit) || 10,
        }),
      });
      return res.json({ source: 'backboard', memories: result?.memories || [] });
    }
  } catch (err) {
    console.error('Backboard memories error:', err.message);
  }

  // Fallback: local mock data
  const query = (req.query.q || '').toLowerCase();
  let results = MOCK_CLIMATE_FACTS;
  if (query) {
    results = results.filter(f =>
      f.content.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query)
    );
  }
  res.json({ source: 'mock', memories: results });
});

/**
 * POST /api/backboard/chat
 * Send a message to the AI climate assistant
 * Backboard maintains conversation state + memory automatically
 */
router.post('/chat', async (req, res) => {
  const { message, thread_id, assistant_id } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    if (BACKBOARD_KEY) {
      let currentThreadId = thread_id;
      let currentAssistantId = assistant_id;

      // Step 1: Create assistant if needed (climate specialist)
      if (!currentAssistantId) {
        const assistant = await backboardFetch('/assistants', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Planetary Pulse Climate Assistant',
            system_prompt: `You are a climate science expert and sustainability advisor. 
              You help users understand environmental data, calculate their carbon footprint, 
              and create actionable plans to reduce their impact. Be data-driven, hopeful but 
              honest about challenges. Reference specific statistics when possible. 
              Keep responses concise and actionable.`,
            model: 'google/gemini-2.0-flash',
          }),
        });
        currentAssistantId = assistant.assistant_id;
      }

      // Step 2: Create thread if needed
      if (!currentThreadId) {
        const thread = await backboardFetch(`/assistants/${currentAssistantId}/threads`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        currentThreadId = thread.thread_id;
      }

      // Step 3: Send message (Backboard handles memory + state automatically)
      const response = await backboardFetch(`/threads/${currentThreadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: message,
          stream: false,
        }),
      });

      return res.json({
        source: 'backboard',
        assistant_id: currentAssistantId,
        thread_id: currentThreadId,
        reply: response.content,
        memory_used: response.memory_facts || [],
      });
    }
  } catch (err) {
    console.error('Backboard chat error:', err.message);
  }

  // Fallback: mock intelligent responses
  const reply = generateMockClimateReply(message);
  res.json({
    source: 'mock',
    thread_id: thread_id || 'mock-thread-' + Date.now(),
    reply,
    memory_used: [],
  });
});

/**
 * POST /api/backboard/memory
 * Store a new climate insight in persistent memory
 */
router.post('/memory', async (req, res) => {
  const { content, category, importance } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content (string) is required' });
  }

  try {
    if (BACKBOARD_KEY) {
      const result = await backboardFetch('/memories', {
        method: 'POST',
        body: JSON.stringify({ content, metadata: { category, importance } }),
      });
      return res.json({ stored: true, source: 'backboard', memory_id: result?.memory_id });
    }
  } catch (err) {
    console.error('Backboard memory store error:', err.message);
  }

  res.json({ stored: true, source: 'mock', memory_id: 'mock-' + Date.now() });
});

// ─── Mock reply generator ───────────────────────────────────────────────────
function generateMockClimateReply(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('carbon') || msg.includes('footprint') || msg.includes('emission')) {
    return 'Your carbon footprint depends on several factors: transportation, diet, home energy, and consumption habits. The global average is about 4.7 tonnes CO₂/year, but the sustainable target for 1.5°C is 2.3 tonnes. I can help you calculate yours — just tell me about your commute, diet, and energy source!';
  }
  if (msg.includes('tree') || msg.includes('plant') || msg.includes('forest')) {
    return 'Trees are incredible carbon sinks! A single mature tree absorbs about 22 kg of CO₂ per year and produces enough oxygen for 2 people. Planting just 5 trees in your community offsets ~110 kg of CO₂ annually. Want to find reforestation projects near you?';
  }
  if (msg.includes('renewable') || msg.includes('solar') || msg.includes('energy')) {
    return 'Great question! Solar energy costs have dropped 89% since 2010, making it the cheapest electricity source in history for most regions. A typical home solar system (6kW) offsets about 4-8 tonnes of CO₂ per year. Wind power has also become extremely competitive. Would you like help finding renewable energy providers in your area?';
  }
  if (msg.includes('ocean') || msg.includes('sea') || msg.includes('marine')) {
    return 'The ocean is our planet\'s largest carbon sink, absorbing about 30% of human-produced CO₂. However, this comes at a cost — ocean acidification threatens marine ecosystems. Ocean temperatures hit record highs in 2024. Supporting marine conservation and reducing plastic use are tangible ways to help.';
  }
  if (msg.includes('vegan') || msg.includes('meat') || msg.includes('diet') || msg.includes('food')) {
    return 'Food accounts for ~26% of global greenhouse gas emissions. A plant-rich diet can reduce your food emissions by 50-75%. You don\'t have to go fully vegan — even reducing meat to 2-3 meals per week makes a significant difference. Beef has the highest carbon footprint (~27 kg CO₂/kg) while legumes are among the lowest (~0.9 kg CO₂/kg).';
  }
  if (msg.includes('help') || msg.includes('what can you') || msg.includes('who are you')) {
    return 'I\'m your Planetary Pulse climate assistant! I can help you: 🔬 Understand climate data and trends, 🧮 Calculate your carbon footprint, 🌱 Create a personalized action plan, 📊 Track environmental metrics, 💡 Find ways to reduce your impact. What would you like to explore?';
  }
  
  return 'That\'s an interesting question about our planet! Climate change affects everything from weather patterns to biodiversity. The key levers for individual impact are: energy use, transportation, diet, and consumption. Would you like me to help you with a specific area — like calculating your carbon footprint or finding the best actions for your situation?';
}

module.exports = router;
