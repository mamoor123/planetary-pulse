/**
 * Google Gemini Integration — AI-Powered Climate Insights
 *
 * Uses Gemini API to generate personalized climate analysis,
 * environmental insights, and action recommendations.
 *
 * Docs: https://ai.google.dev/gemini-api/docs
 */

const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─── Mock insights for when API key is not set ──────────────────────────────
const MOCK_INSIGHTS = {
  overview: {
    title: 'Global Climate Overview',
    summary: 'Earth\'s climate system shows accelerating changes across all major indicators. 2024 was the hottest year on record, with global temperatures exceeding 1.5°C above pre-industrial levels for the first time on an annual basis.',
    keyFindings: [
      'Global surface temperature: +1.48°C above 1850-1900 baseline',
      'Atmospheric CO₂: 421 ppm (highest in 3 million years)',
      'Sea level rise: 3.6 mm/year (accelerating from 1.4 mm/year in early 1900s)',
      'Arctic sea ice: 2nd lowest minimum extent on record',
    ],
    recommendation: 'Immediate action on methane reduction (short-lived but potent) and rapid renewable energy deployment offer the fastest pathways to slowing warming.',
  },
  personalActions: [
    { action: 'Switch to renewable energy', impact: '-1.5 tonnes CO₂/year', difficulty: 'Easy', timeframe: '1 week' },
    { action: 'Reduce meat consumption 50%', impact: '-0.8 tonnes CO₂/year', difficulty: 'Moderate', timeframe: 'Ongoing' },
    { action: 'Use public transit 3+ days/week', impact: '-1.2 tonnes CO₂/year', difficulty: 'Moderate', timeframe: 'Immediate' },
    { action: 'Install home solar panels', impact: '-3.0 tonnes CO₂/year', difficulty: 'Investment', timeframe: '1-3 months' },
    { action: 'Buy carbon offsets for remaining emissions', impact: 'Variable', difficulty: 'Easy', timeframe: 'Immediate' },
  ],
};

/**
 * GET /api/gemini/status
 */
router.get('/status', (_req, res) => {
  res.json({
    enabled: !!GEMINI_API_KEY,
    model: GEMINI_MODEL,
    capabilities: ['climate_analysis', 'personalized_insights', 'action_planning', 'data_interpretation'],
  });
});

/**
 * Call Gemini API and extract JSON or text response.
 * Returns null on failure (caller should fall back to mock).
 */
async function callGemini(prompt, { temperature = 0.7, maxOutputTokens = 2048 } = {}) {
  if (!GEMINI_API_KEY) return null;

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens },
    }),
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch (_e) { /* not valid JSON */ }
  }
  return { summary: text, raw: true };
}

/**
 * POST /api/gemini/analyze
 * Generate AI-powered climate analysis for specific metrics or regions
 */
router.post('/analyze', async (req, res) => {
  const { metrics, region, timeframe } = req.body || {};

  const prompt = `You are a climate science analyst. Analyze the following environmental context and provide actionable insights.

${metrics ? `Metrics to analyze: ${JSON.stringify(metrics)}` : ''}
${region ? `Region: ${region}` : 'Global scope'}
${timeframe ? `Timeframe: ${timeframe}` : 'Current state'}

Provide your analysis in this JSON format:
{
  "title": "Brief analysis title",
  "summary": "2-3 sentence overview",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "trend": "improving|stable|deteriorating",
  "confidence": 0.0-1.0,
  "recommendation": "Specific actionable recommendation",
  "dataPoints": [{"label": "string", "value": "string", "change": "string"}]
}

Be data-driven, specific with numbers, and honest about uncertainties. Focus on what individuals can actually do.`;

  try {
    const analysis = await callGemini(prompt, { temperature: 0.7, maxOutputTokens: 2048 });
    if (analysis) {
      return res.json({ source: 'gemini', analysis });
    }
  } catch (err) {
    console.error('Gemini analyze error:', err.message);
  }

  res.json({ source: 'mock', analysis: MOCK_INSIGHTS.overview });
});

/**
 * POST /api/gemini/personal-plan
 * Generate a personalized climate action plan using Gemini
 */
router.post('/personal-plan', async (req, res) => {
  const { footprint, location, preferences } = req.body || {};

  const prompt = `Create a personalized climate action plan based on this profile:

Carbon footprint: ${footprint || 'Unknown'} tonnes CO₂/year
Location: ${location || 'Global'}
Preferences: ${preferences || 'Balance of impact and convenience'}

Generate a JSON response with this structure:
{
  "planTitle": "Personalized plan name",
  "currentFootprint": number,
  "targetFootprint": number,
  "actions": [
    {
      "name": "Action name",
      "category": "energy|transport|diet|consumption|offset",
      "co2Reduction": number,
      "difficulty": "easy|moderate|challenging",
      "timeToStart": "immediate|1 week|1 month",
      "description": "How to do this"
    }
  ],
  "timeline": "30|90|365 days",
  "encouragement": "Motivational note"
}

Prioritize highest-impact actions first. Be realistic and encouraging.`;

  try {
    const plan = await callGemini(prompt, { temperature: 0.8, maxOutputTokens: 3072 });
    if (plan && !plan.raw) {
      return res.json({ source: 'gemini', plan });
    }
  } catch (err) {
    console.error('Gemini plan error:', err.message);
  }

  // Fallback
  res.json({
    source: 'mock',
    plan: {
      planTitle: 'Your Climate Action Plan',
      currentFootprint: footprint || 8.2,
      targetFootprint: 2.3,
      actions: MOCK_INSIGHTS.personalActions,
      timeline: '90 days',
      encouragement: 'Every action counts! You don\'t need to be perfect — consistent progress is what matters. Start with the easiest changes and build momentum.',
    },
  });
});

/**
 * POST /api/gemini/interpret-data
 * Use Gemini to interpret raw environmental data
 */
router.post('/interpret-data', async (req, res) => {
  const { dataType, values, context } = req.body || {};

  const prompt = `Interpret this environmental data for a general audience:

Data type: ${dataType || 'unknown'}
Values: ${JSON.stringify(values || [])}
Context: ${context || 'None provided'}

Provide a human-readable interpretation including:
1. What this data means
2. Whether it's good, bad, or concerning
3. How it connects to climate change
4. What individuals can do about it

Keep it under 200 words, data-driven, and accessible to non-scientists.`;

  try {
    const result = await callGemini(prompt, { temperature: 0.6, maxOutputTokens: 1024 });
    if (result) {
      return res.json({ source: 'gemini', interpretation: result.summary || result });
    }
  } catch (err) {
    console.error('Gemini interpret error:', err.message);
  }

  res.json({
    source: 'mock',
    interpretation: 'Environmental data shows continued warming trends. The values indicate ongoing changes in global systems that require both systemic and individual action to address.',
  });
});

module.exports = router;
