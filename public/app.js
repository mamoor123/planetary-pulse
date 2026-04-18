/**
 * Planetary Pulse — Frontend Application
 * 
 * Ties together all integrations:
 *   - Backboard: AI assistant with persistent memory
 *   - Auth0: User authentication
 *   - Gemini: AI climate insights
 *   - Snowflake: Environmental data queries
 *   - Solana: Carbon credit tracking
 */

// ════════════════════════════════════════════════════════════════
// State
// ════════════════════════════════════════════════════════════════
const state = {
  activeTab: 'dashboard',
  healthScore: 0,
  services: {},
  datasets: {},
  chatThreadId: null,
  chatAssistantId: null,
  completedActions: new Set(),
};

// ════════════════════════════════════════════════════════════════
// Init
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  createStars();
  initTabs();
  initChartControls();
  initCalculator();
  initChat();
  initActions();
  initCreditFilters();

  // Load all data
  await Promise.all([
    checkServices(),
    loadDashboard(),
    loadCredits(),
    loadPortfolio(),
    loadImpact(),
  ]);
});

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
// ════════════════════════════════════════════════════════════════
function createStars() {
  const el = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = Math.random() * 3 + 's';
    s.style.animationDuration = (2 + Math.random() * 3) + 's';
    el.appendChild(s);
  }
}

// ════════════════════════════════════════════════════════════════
// Tabs
// ════════════════════════════════════════════════════════════════
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      state.activeTab = btn.dataset.tab;
    });
  });
}

// ════════════════════════════════════════════════════════════════
// API Helper
// ════════════════════════════════════════════════════════════════
async function api(path, options = {}) {
  try {
    const res = await fetch('/api' + path, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    return await res.json();
  } catch (err) {
    console.error('API error:', path, err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// Service Status
// ════════════════════════════════════════════════════════════════
async function checkServices() {
  const health = await api('/health');
  if (!health) return;
  state.services = health.services;

  const badges = document.getElementById('serviceBadges');
  const colors = { backboard: '#a855f7', auth0: '#f97316', gemini: '#0ea5e9', snowflake: '#06b6d4', solana: '#a855f7' };
  
  badges.innerHTML = Object.entries(health.services).map(([key, on]) =>
    `<div class="svc-dot ${on ? 'on' : 'off'}" title="${key}: ${on ? 'connected' : 'not configured'}" style="${on ? 'background:' + colors[key] + ';box-shadow:0 0 6px ' + colors[key] : ''}"></div>`
  ).join('');

  // Auth status
  const auth = await api('/auth/status');
  const loginBtn = document.getElementById('loginBtn');
  if (auth?.authenticated) {
    loginBtn.textContent = auth.user?.name || 'Account';
    loginBtn.href = '/logout';
  } else if (!state.services.auth0) {
    // Hide login button when Auth0 is not configured
    loginBtn.style.display = 'none';
  }
}

// ════════════════════════════════════════════════════════════════
// Dashboard
// ════════════════════════════════════════════════════════════════
async function loadDashboard() {
  // Load Snowflake data (or mock)
  const dashboard = await api('/snowflake/dashboard');
  if (!dashboard) return;

  state.datasets = {};
  dashboard.dashboard.forEach(ds => { state.datasets[ds.id] = ds; });

  document.getElementById('metricsSource').textContent =
    dashboard.source === 'snowflake' ? '● Snowflake' : '● Cached Data';

  // Render metrics
  renderMetrics(dashboard.dashboard);
  
  // Render score
  animateScore(67);
  
  // Render descriptors
  renderDescriptors();
  
  // Render eco stats
  renderEcoStats();
  
  // Render chart (temperature by default)
  renderChart('temperature');
  
  // Load Gemini insights
  loadInsights();
}

function renderMetrics(datasets) {
  const el = document.getElementById('metricsList');
  const barColors = {
    temperature: 'linear-gradient(90deg,#22c55e,#f97316,#ef4444)',
    co2: 'linear-gradient(90deg,#22c55e,#f97316)',
    seaLevel: 'linear-gradient(90deg,#22c55e,#0ea5e9)',
    arcticIce: 'linear-gradient(90deg,#ef4444,#0ea5e9)',
    deforestation: 'linear-gradient(90deg,#22c55e,#ef4444)',
    renewable: 'linear-gradient(90deg,#22c55e,#a855f7)',
    biodiversity: 'linear-gradient(90deg,#22c55e,#ef4444)',
  };

  const labels = {
    temperature: { name: '🌡️ Global Temperature', status: 'Critical', statusClass: 'var(--red)' },
    co2: { name: '💨 CO₂ Concentration', status: 'Warning', statusClass: 'var(--orange)' },
    seaLevel: { name: '🌊 Sea Level Rise', status: 'Warning', statusClass: 'var(--orange)' },
    arcticIce: { name: '🧊 Arctic Sea Ice', status: 'Critical', statusClass: 'var(--red)' },
    deforestation: { name: '🌳 Deforestation', status: 'Moderate', statusClass: 'var(--purple)' },
    renewable: { name: '⚡ Renewable Capacity', status: 'Growing', statusClass: 'var(--green)' },
    biodiversity: { name: '🦋 Biodiversity', status: 'Critical', statusClass: 'var(--red)' },
  };

  el.innerHTML = datasets.filter(d => labels[d.id]).map(d => {
    const l = labels[d.id];
    // Normalize bar width (0-100%)
    let pct = 50;
    if (d.sparkline?.length > 1) {
      const first = d.sparkline[0];
      const last = d.sparkline[d.sparkline.length - 1];
      if (d.id === 'arcticIce' || d.id === 'biodiversity') {
        pct = Math.max(10, Math.min(90, (1 - last / first) * 50 + 30));
      } else if (d.id === 'renewable') {
        pct = Math.min(95, (last / first) * 30);
      } else {
        const changeNum = parseFloat(d.change);
        pct = Math.min(90, Math.max(20, (isNaN(changeNum) ? 50 : Math.abs(changeNum) * 10 + 40)));
      }
    }

    return `
      <div class="metric">
        <div class="metric-top">
          <span class="metric-name">${l.name}</span>
          <span class="metric-val" style="color:${l.statusClass}">${d.latest ?? '--'} ${d.unit?.split(' ')[0] || ''}</span>
        </div>
        <div class="metric-bar">
          <div class="metric-fill" style="width:${pct}%;background:${barColors[d.id] || 'var(--green)'}"></div>
        </div>
        <div class="metric-meta">
          <span>${d.source || ''}</span>
          <span>${d.change || ''} / year</span>
        </div>
      </div>
    `;
  }).join('');
}

function animateScore(target) {
  const ring = document.getElementById('scoreRing');
  const num = document.getElementById('healthScore');
  const circumference = 2 * Math.PI * 70;
  const offset = circumference * (1 - target / 100);

  setTimeout(() => {
    ring.style.strokeDashoffset = offset;
  }, 300);

  let current = 0;
  const interval = setInterval(() => {
    current += Math.ceil((target - current) / 8) || 1;
    if (current >= target) { current = target; clearInterval(interval); }
    num.textContent = current;
  }, 30);
}

function renderDescriptors() {
  document.getElementById('scoreDescriptors').innerHTML = [
    { label: 'Atmosphere', value: '⚠️ Stressed', color: 'var(--red)' },
    { label: 'Oceans', value: '🌊 Declining', color: 'var(--orange)' },
    { label: 'Forests', value: '🌱 Recovering', color: 'var(--purple)' },
    { label: 'Wildlife', value: '🦊 Vulnerable', color: 'var(--blue)' },
  ].map(d => `
    <div class="descriptor">
      <div class="desc-value" style="color:${d.color}">${d.value}</div>
      <div class="desc-label">${d.label}</div>
    </div>
  `).join('');
}

function renderEcoStats() {
  document.getElementById('ecoStats').innerHTML = [
    { icon: '🌲', val: '3.04T', label: 'Trees on Earth', color: 'var(--green)' },
    { icon: '🌊', val: '71%', label: 'Ocean Coverage', color: 'var(--blue)' },
    { icon: '🏔️', val: '8.8K', label: 'Species Daily', color: 'var(--purple)' },
    { icon: '☀️', val: '173K', label: 'TW Solar/yr', color: 'var(--orange)' },
  ].map(s => `
    <div class="eco-stat">
      <div class="eco-stat-icon">${s.icon}</div>
      <div class="eco-stat-val" style="color:${s.color}">${s.val}</div>
      <div class="eco-stat-label">${s.label}</div>
    </div>
  `).join('');
}

// ════════════════════════════════════════════════════════════════
// Chart (SVG)
// ════════════════════════════════════════════════════════════════
function initChartControls() {
  document.querySelectorAll('.chart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderChart(btn.dataset.dataset);
    });
  });
}

async function renderChart(datasetId) {
  const data = await api(`/snowflake/query/${datasetId}`);
  if (!data?.data) return;

  const svg = document.getElementById('trendChart');
  svg.innerHTML = '';

  const values = data.data;
  if (values.length < 2) return; // Need at least 2 points for a chart

  const pad = { top: 15, right: 20, bottom: 28, left: 50 };
  const W = 600, H = 220;
  const w = W - pad.left - pad.right;
  const h = H - pad.top - pad.bottom;

  const years = values.map(d => d.year);
  const vals = values.map(d => d.value);
  const minY = Math.min(...years), maxY = Math.max(...years);
  let minV = Math.min(...vals) * 0.9;
  let maxV = Math.max(...vals) * 1.1;
  // Prevent division by zero when all values are identical
  if (minV === maxV) { minV -= 1; maxV += 1; }

  const x = yr => pad.left + ((yr - minY) / (maxY - minY)) * w;
  const y = v => pad.top + h - ((v - minV) / (maxV - minV)) * h;

  // Grid lines
  const vStep = (maxV - minV) / 4;
  for (let i = 0; i <= 4; i++) {
    const v = minV + vStep * i;
    const yy = y(v);
    const line = svgEl('line', { x1: pad.left, x2: pad.left + w, y1: yy, y2: yy, class: 'chart-grid' });
    svg.appendChild(line);
    const label = svgEl('text', { x: pad.left - 6, y: yy + 3, 'text-anchor': 'end', class: 'chart-label' });
    label.textContent = v.toFixed(1);
    svg.appendChild(label);
  }

  // Year labels
  const yearStep = Math.ceil((maxY - minY) / 6);
  for (let yr = minY; yr <= maxY; yr += yearStep) {
    const label = svgEl('text', { x: x(yr), y: pad.top + h + 18, 'text-anchor': 'middle', class: 'chart-label' });
    label.textContent = yr;
    svg.appendChild(label);
  }

  // Defs for gradients
  const defs = svgEl('defs');
  const lineGrad = svgEl('linearGradient', { id: 'lg', x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
  lineGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#22c55e' }));
  lineGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#ef4444' }));
  defs.appendChild(lineGrad);

  const areaGrad = svgEl('linearGradient', { id: 'ag', x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
  areaGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#22c55e', 'stop-opacity': '.3' }));
  areaGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#22c55e', 'stop-opacity': '0' }));
  defs.appendChild(areaGrad);
  svg.appendChild(defs);

  // Area
  let areaPath = `M${x(years[0])},${y(minV)}`;
  values.forEach(d => { areaPath += ` L${x(d.year)},${y(d.value)}`; });
  areaPath += ` L${x(years[years.length-1])},${y(minV)} Z`;
  svg.appendChild(svgEl('path', { d: areaPath, class: 'chart-area', fill: 'url(#ag)' }));

  // Line
  let linePath = '';
  values.forEach((d, i) => {
    linePath += (i === 0 ? 'M' : ' L') + `${x(d.year)},${y(d.value)}`;
  });
  svg.appendChild(svgEl('path', { d: linePath, class: 'chart-line', stroke: 'url(#lg)' }));

  // Dots
  const tooltip = document.getElementById('chartTooltip');
  const wrap = document.getElementById('chartWrap');
  values.forEach(d => {
    const dot = svgEl('circle', {
      cx: x(d.year), cy: y(d.value), r: 3.5, class: 'chart-dot',
      fill: d.value < 0 ? '#0ea5e9' : d.value < vals[Math.floor(vals.length/2)] ? '#22c55e' : '#f97316',
    });
    dot.addEventListener('mouseenter', e => {
      tooltip.innerHTML = `<strong>${d.year}</strong>: ${d.value > 0 ? '+' : ''}${d.value} ${data.unit || ''}`;
      tooltip.classList.add('vis');
      const r = wrap.getBoundingClientRect();
      tooltip.style.left = (e.clientX - r.left + 12) + 'px';
      tooltip.style.top = (e.clientY - r.top - 30) + 'px';
    });
    dot.addEventListener('mouseleave', () => tooltip.classList.remove('vis'));
    svg.appendChild(dot);
  });
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// ════════════════════════════════════════════════════════════════
// Gemini Insights
// ════════════════════════════════════════════════════════════════
async function loadInsights() {
  const el = document.getElementById('insightsList');
  
  const insights = [
    { tag: '🔴 Critical', cls: 'ins-urgent', text: 'Arctic sea ice reached its 2nd lowest extent on record. The feedback loop of reduced albedo accelerating warming is intensifying rapidly.' },
    { tag: '⚡ Opportunity', cls: 'ins-action', text: 'Renewable energy costs dropped 89% since 2010. Solar is now the cheapest electricity source in history for most of the world.' },
    { tag: '🌱 Progress', cls: 'ins-positive', text: '37 countries have peaked emissions. Global EV sales surpassed 18 million in 2024, up 25% year-over-year.' },
    { tag: '💡 Did You Know', cls: 'ins-info', text: 'A single mature tree absorbs ~22 kg of CO₂/year and produces enough oxygen for 2 people.' },
    { tag: '🌊 Ocean Alert', cls: 'ins-urgent', text: 'Ocean temperatures hit record highs in 2024. Marine heatwaves caused mass coral bleaching across 75% of tropical reefs.' },
    { tag: '📊 Data Point', cls: 'ins-info', text: 'Global methane concentrations reached 1923 ppb — the highest level in at least 800,000 years.' },
  ];

  // Try to get Gemini-enhanced insights
  const geminiInsight = await api('/gemini/analyze', {
    method: 'POST',
    body: JSON.stringify({ metrics: ['temperature', 'co2', 'biodiversity'], region: 'global' }),
  });

  if (geminiInsight?.source === 'gemini' && geminiInsight.analysis?.keyFindings) {
    geminiInsight.analysis.keyFindings.forEach((f, i) => {
      if (i < 2) insights.unshift({
        tag: '✨ AI Analysis',
        cls: 'ins-info',
        text: f,
      });
    });
  }

  el.innerHTML = insights.slice(0, 6).map(ins => `
    <div class="insight ${ins.cls}">
      <div class="insight-tag">${ins.tag}</div>
      ${ins.text}
    </div>
  `).join('');
}

// ════════════════════════════════════════════════════════════════
// Actions
// ════════════════════════════════════════════════════════════════
function initActions() {
  const actions = [
    { text: 'Switch to renewable energy provider', impact: '-1.5t CO₂/yr' },
    { text: 'Reduce meat consumption by 50%', impact: '-0.8t CO₂/yr' },
    { text: 'Use public transit 3+ days/week', impact: '-1.2t CO₂/yr' },
    { text: 'Plant 5 trees in your community', impact: '-0.1t CO₂/yr' },
    { text: 'Offset remaining emissions via verified credits', impact: 'Offset' },
    { text: 'Unsubscribe from junk mail & catalogs', impact: '-0.05t CO₂/yr' },
    { text: 'Support a local conservation organization', impact: 'Impact' },
    { text: 'Share your climate journey on social media', impact: 'Inspire' },
  ];
  const totalActions = actions.length;

  const el = document.getElementById('actionsList');
  el.innerHTML = actions.map((a, i) => `
    <div class="action-item" data-idx="${i}">
      <div class="action-check"></div>
      <div class="action-text">${a.text}</div>
      <div class="action-impact">${a.impact}</div>
    </div>
  `).join('');

  // Update initial counter
  document.getElementById('actionCounter').textContent = `0 / ${totalActions}`;

  el.querySelectorAll('.action-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('done');
      const idx = item.dataset.idx;
      if (state.completedActions.has(idx)) state.completedActions.delete(idx);
      else state.completedActions.add(idx);
      updateActionCounter(totalActions);
    });
  });
}

function updateActionCounter(total) {
  const n = state.completedActions.size;
  document.getElementById('actionCounter').textContent = `${n} / ${total}`;
  // Boost score
  document.getElementById('healthScore').textContent = Math.min(100, 67 + Math.round(n * 1.2));
}

// ════════════════════════════════════════════════════════════════
// Chat (Backboard)
// ════════════════════════════════════════════════════════════════
function initChat() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    // Show user message
    appendChat('user', msg);
    input.value = '';

    // Show typing indicator
    const typingEl = appendChat('bot', '⏳ Thinking...');

    // Send to Backboard / mock
    const res = await api('/backboard/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: msg,
        thread_id: state.chatThreadId,
        assistant_id: state.chatAssistantId,
      }),
    });

    // Update typing with real response
    typingEl.querySelector('.msg-bubble').textContent = res?.reply || 'Sorry, I had trouble processing that.';

    // Store thread/assistant IDs for persistent sessions
    if (res?.thread_id) state.chatThreadId = res.thread_id;
    if (res?.assistant_id) state.chatAssistantId = res.assistant_id;

    // Show memory facts if any
    if (res?.memory_used?.length > 0) {
      renderMemoryFacts(res.memory_used);
    }

    // Update Backboard status
    document.getElementById('backboardStatus').textContent =
      res?.source === 'backboard' ? '● Connected' : '○ Mock Mode';
  });
}

function appendChat(role, text) {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  const safeText = escapeHtml(text);
  div.innerHTML = `
    <div class="msg-avatar">${role === 'user' ? '👤' : '🌱'}</div>
    <div class="msg-bubble">${safeText}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function renderMemoryFacts(facts) {
  const el = document.getElementById('memoryFacts');
  el.innerHTML = facts.map(f => `
    <div class="memory-fact">💡 ${typeof f === 'string' ? f : f.content || JSON.stringify(f)}</div>
  `).join('');
}

// ════════════════════════════════════════════════════════════════
// Calculator
// ════════════════════════════════════════════════════════════════
function initCalculator() {
  const ids = ['commuteKm', 'commuteDays', 'flightsYear', 'commuteMode', 'dietType', 'energySource', 'homeSize', 'consumptionLevel'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateCarbon);
  });

  // Slider displays
  const commute = document.getElementById('commuteKm');
  const days = document.getElementById('commuteDays');
  const flights = document.getElementById('flightsYear');
  if (commute) commute.addEventListener('input', () => document.getElementById('commuteVal').textContent = commute.value + ' km');
  if (days) days.addEventListener('input', () => document.getElementById('daysVal').textContent = days.value + ' days');
  if (flights) flights.addEventListener('input', () => document.getElementById('flightsVal').textContent = flights.value + ' flights');

  calculateCarbon();
}

async function calculateCarbon() {
  const body = {
    commute_km: parseInt(document.getElementById('commuteKm')?.value || 25),
    commute_days: parseInt(document.getElementById('commuteDays')?.value || 5),
    commute_mode: document.getElementById('commuteMode')?.value || 'car',
    flights_per_year: parseInt(document.getElementById('flightsYear')?.value || 3),
    diet: document.getElementById('dietType')?.value || 'medium_meat',
    energy_source: document.getElementById('energySource')?.value || 'mixed_grid',
    home_size: document.getElementById('homeSize')?.value || 'medium_house',
    consumption_level: document.getElementById('consumptionLevel')?.value || 'average',
  };

  const res = await api('/carbon/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res) return;

  // Total
  document.getElementById('resultTotal').textContent = res.total.net.toFixed(1);

  // Comparison bars
  const comp = res.comparison;
  document.getElementById('resultComparison').innerHTML = `
    <div class="comp-row">
      <span class="comp-label">Your footprint</span>
      <div class="comp-bar"><div class="comp-fill" style="width:${Math.min(100, res.total.net / 15 * 100)}%;background:linear-gradient(90deg,var(--green),var(--orange),var(--red))"></div></div>
      <span class="comp-val" style="color:var(--orange)">${res.total.net}t</span>
    </div>
    <div class="comp-row">
      <span class="comp-label">Global avg</span>
      <div class="comp-bar"><div class="comp-fill" style="width:${comp.globalAverage / 15 * 100}%;background:var(--blue)"></div></div>
      <span class="comp-val">${comp.globalAverage}t</span>
    </div>
    <div class="comp-row">
      <span class="comp-label">1.5°C target</span>
      <div class="comp-bar"><div class="comp-fill" style="width:${comp.target15C / 15 * 100}%;background:var(--green)"></div></div>
      <span class="comp-val" style="color:var(--green)">${comp.target15C}t</span>
    </div>
    <div style="margin-top:.5rem;font-size:.75rem;color:var(--t3)">${comp.vsAverage} · ${comp.vsTarget15}</div>
  `;

  // Breakdown
  const bd = res.breakdown;
  document.getElementById('resultBreakdown').innerHTML = `
    <div class="breakdown-item"><span class="breakdown-label">🚗 Transport</span><span class="breakdown-val">${bd.transport.total}t</span></div>
    <div class="breakdown-item"><span class="breakdown-label">   Commute</span><span class="breakdown-val">${bd.transport.commute}t</span></div>
    <div class="breakdown-item"><span class="breakdown-label">   Flights</span><span class="breakdown-val">${bd.transport.flights}t</span></div>
    <div class="breakdown-item"><span class="breakdown-label">🥩 Diet</span><span class="breakdown-val">${bd.diet.total}t</span></div>
    <div class="breakdown-item"><span class="breakdown-label">🏠 Energy</span><span class="breakdown-val">${bd.energy.total}t</span></div>
    <div class="breakdown-item"><span class="breakdown-label">🛍️ Consumption</span><span class="breakdown-val">${bd.consumption.total}t</span></div>
  `;

  // Recommendations
  if (res.recommendations?.length > 0) {
    document.getElementById('resultRecommendations').innerHTML = `
      <h4 style="font-size:.8rem;margin-bottom:.6rem;color:var(--t2)">💡 Top Recommendations</h4>
      ${res.recommendations.map(r => `
        <div class="rec-item">
          ${r.action}
          <span class="rec-saving"> -${r.potentialSaving}t CO₂/year</span>
        </div>
      `).join('')}
    `;
  }
}

// ════════════════════════════════════════════════════════════════
// Carbon Credits (Solana)
// ════════════════════════════════════════════════════════════════
async function loadCredits() {
  const res = await api('/solana/credits');
  if (!res) return;
  renderCreditsGrid(res.credits);
}

function renderCreditsGrid(credits) {
  document.getElementById('creditsGrid').innerHTML = credits.map(c => `
    <div class="credit-card">
      <div class="credit-type">${c.type.replace(/_/g, ' ')}</div>
      <div class="credit-name">${c.name}</div>
      <div class="credit-project">${c.project} · ${c.registry}</div>
      <div class="credit-meta">
        <span class="credit-tons">${c.tonnes} tonne${c.tonnes !== 1 ? 's' : ''}</span>
        <span class="credit-price">$${c.price_usd.toFixed(2)}</span>
      </div>
      <button class="btn-retire" onclick="retireCredit('${c.id}', ${c.tonnes})">Retire Credit ◎</button>
    </div>
  `).join('');
}

function initCreditFilters() {
  document.getElementById('creditFilter')?.addEventListener('change', async (e) => {
    const type = e.target.value;
    const url = type ? `/solana/credits?type=${type}` : '/solana/credits';
    const res = await api(url);
    if (res) renderCreditsGrid(res.credits);
  });
}

async function retireCredit(creditId, tonnes) {
  const reason = prompt('Reason for retiring this credit (optional):') || 'Personal carbon offset';
  const res = await api('/solana/retire', {
    method: 'POST',
    body: JSON.stringify({ credit_id: creditId, tonnes, reason }),
  });

  if (res?.success) {
    alert(`✅ Credit retired!\n\n${tonnes} tonne(s) CO₂ offset\nTX: ${res.retirement.tx_signature}\n\nView on Solana Explorer:\n${res.retirement.explorer_url}`);
    loadPortfolio();
    loadImpact();
  }
}

async function loadPortfolio() {
  const res = await api('/solana/portfolio');
  if (!res) return;

  const p = res.portfolio;
  document.getElementById('portfolioStats').innerHTML = `
    <div class="pstat"><div class="pstat-val" style="color:var(--green)">${p.totalCredits}t</div><div class="pstat-label">Total Credits</div></div>
    <div class="pstat"><div class="pstat-val" style="color:var(--blue)">$${p.totalInvested}</div><div class="pstat-label">Invested</div></div>
    <div class="pstat"><div class="pstat-val" style="color:var(--purple)">${p.offsets.length}</div><div class="pstat-label">Offsets</div></div>
    <div class="pstat"><div class="pstat-val" style="color:var(--orange)">${p.impactMetrics.treesEquivalent}</div><div class="pstat-label">Trees Equiv.</div></div>
  `;

  document.getElementById('portfolioOffsets').innerHTML = p.offsets.map(o => `
    <div class="offset-row">
      <span>${o.credit_id}</span>
      <span>${o.tonnes}t</span>
      <span style="font-family:monospace;font-size:.65rem;color:var(--t3)">${o.tx_signature}</span>
    </div>
  `).join('');
}

async function loadImpact() {
  const res = await api('/solana/impact?tonnes=3.6');
  if (!res) return;

  const eq = res.equivalents;
  document.getElementById('impactEquivalents').innerHTML = `
    <div class="impact-item"><div class="impact-icon">🌳</div><div class="impact-val" style="color:var(--green)">${eq.trees.toLocaleString()}</div><div class="impact-label">Trees Equivalent</div></div>
    <div class="impact-item"><div class="impact-icon">🚗</div><div class="impact-val" style="color:var(--blue)">${eq.carMiles.toLocaleString()}</div><div class="impact-label">Car Miles Offset</div></div>
    <div class="impact-item"><div class="impact-icon">✈️</div><div class="impact-val" style="color:var(--purple)">${eq.flightHours}</div><div class="impact-label">Flight Hours Offset</div></div>
    <div class="impact-item"><div class="impact-icon">🏠</div><div class="impact-val" style="color:var(--orange)">${eq.homeDays.toLocaleString()}</div><div class="impact-label">Home Days Offset</div></div>
  `;
}
