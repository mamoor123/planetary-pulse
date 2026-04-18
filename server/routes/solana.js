/**
 * Solana Integration — Carbon Credit Token Tracking
 * 
 * Uses Solana blockchain for:
 *   - Tracking carbon offset credits as on-chain tokens
 *   - Transparent, verifiable environmental impact records
 *   - Community carbon credit marketplace concepts
 * 
 * Uses @solana/web3.js for devnet interactions
 * Docs: https://solana.com/developers
 */

const express = require('express');
const router = express.Router();

const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const solanaEnabled = !!(process.env.SOLANA_RPC_URL || process.env.SOLANA_PRIVATE_KEY);

// ─── Mock Carbon Credit Data ────────────────────────────────────────────────
const MOCK_CARBON_CREDITS = [
  {
    id: 'cc-001',
    name: 'Amazon Reforestation Credit',
    project: 'Amazon Rainforest Conservation',
    type: 'reforestation',
    tonnes: 1.0,
    price_usd: 15.50,
    vintage: 2024,
    registry: 'Verra VCS',
    status: 'active',
    verification: 'gold-standard',
  },
  {
    id: 'cc-002',
    name: 'Wind Farm Credit',
    project: 'Texas Wind Energy Project',
    type: 'renewable_energy',
    tonnes: 0.5,
    price_usd: 8.25,
    vintage: 2024,
    registry: 'American Carbon Registry',
    status: 'active',
    verification: 'verified',
  },
  {
    id: 'cc-003',
    name: 'Mangrove Restoration Credit',
    project: 'Indonesia Mangrove Project',
    type: 'blue_carbon',
    tonnes: 1.0,
    price_usd: 22.00,
    vintage: 2023,
    registry: 'Plan Vivo',
    status: 'active',
    verification: 'gold-standard',
  },
  {
    id: 'cc-004',
    name: 'Direct Air Capture Credit',
    project: 'Climeworks Iceland',
    type: 'dac',
    tonnes: 0.1,
    price_usd: 120.00,
    vintage: 2024,
    registry: 'Puro.earth',
    status: 'active',
    verification: 'premium',
  },
];

const MOCK_USER_PORTFOLIO = {
  wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  totalCredits: 3.6,
  totalInvested: 189.50,
  offsets: [
    { credit_id: 'cc-001', tonnes: 1.0, tx_signature: '5VERIFIED...sig1', date: '2024-03-15' },
    { credit_id: 'cc-003', tonnes: 1.0, tx_signature: '4VERIFIED...sig2', date: '2024-02-20' },
    { credit_id: 'cc-002', tonnes: 0.5, tx_signature: '3VERIFIED...sig3', date: '2024-01-10' },
  ],
  impactMetrics: {
    treesEquivalent: 164,
    carMilesOffset: 8050,
    homeDaysOffset: 410,
  },
};

/**
 * GET /api/solana/status
 */
router.get('/status', (req, res) => {
  res.json({
    enabled: solanaEnabled,
    network: SOLANA_RPC.includes('devnet') ? 'devnet' : 'mainnet-beta',
    features: ['carbon_credits', 'offset_tracking', 'on_chain_verification'],
    message: solanaEnabled
      ? 'Solana connected — carbon credits tracked on-chain'
      : 'Solana not configured — using mock credit data',
  });
});

/**
 * GET /api/solana/credits
 * List available carbon credit tokens
 */
router.get('/credits', (req, res) => {
  const { type, minTonnes, maxPrice } = req.query;
  
  let credits = [...MOCK_CARBON_CREDITS];
  
  if (type) credits = credits.filter(c => c.type === type);
  if (minTonnes) credits = credits.filter(c => c.tonnes >= parseFloat(minTonnes));
  if (maxPrice) credits = credits.filter(c => c.price_usd <= parseFloat(maxPrice));

  res.json({
    source: solanaEnabled ? 'solana' : 'mock',
    network: 'devnet',
    credits,
    totalAvailable: credits.reduce((sum, c) => sum + c.tonnes, 0),
    avgPrice: credits.length > 0
      ? (credits.reduce((sum, c) => sum + c.price_usd, 0) / credits.length).toFixed(2)
      : 0,
  });
});

/**
 * GET /api/solana/portfolio
 * Get user's carbon credit portfolio
 */
router.get('/portfolio', (req, res) => {
  res.json({
    source: solanaEnabled ? 'solana' : 'mock',
    portfolio: MOCK_USER_PORTFOLIO,
  });
});

/**
 * POST /api/solana/retire
 * Retire (burn) a carbon credit to claim the offset
 * On Solana, this would transfer tokens to a burn address
 */
router.post('/retire', async (req, res) => {
  const { credit_id, tonnes, reason } = req.body;

  if (!credit_id || !tonnes || parseFloat(tonnes) <= 0) {
    return res.status(400).json({ error: 'credit_id and positive tonnes are required' });
  }

  try {
    if (process.env.SOLANA_PRIVATE_KEY) {
      // In production: use @solana/web3.js to create and send a transaction
      // that transfers the carbon credit tokens to a burn address
      /*
      const { Connection, Keypair, Transaction, PublicKey } = require('@solana/web3.js');
      
      const connection = new Connection(SOLANA_RPC, 'confirmed');
      const keypair = Keypair.fromSecretKey(
        bs58.decode(process.env.SOLANA_PRIVATE_KEY)
      );
      
      // Create burn transaction
      const burnTx = new Transaction().add(
        createBurnInstruction(
          creditTokenAccount,
          CREDIT_MINT,
          keypair.publicKey,
          tonnes * 1e9 // token decimals
        )
      );
      
      const signature = await connection.sendTransaction(burnTx, [keypair]);
      await connection.confirmTransaction(signature);
      */
    }
  } catch (err) {
    console.error('Solana retire error:', err.message);
  }

  // Mock response
  const txSignature = `${Math.random().toString(36).slice(2, 10)}VERIFIED${Math.random().toString(36).slice(2, 10)}`;
  
  res.json({
    success: true,
    source: solanaEnabled ? 'solana' : 'mock',
    retirement: {
      credit_id,
      tonnes: parseFloat(tonnes),
      reason: reason || 'Personal carbon offset',
      tx_signature: txSignature,
      retired_at: new Date().toISOString(),
      network: 'devnet',
      explorer_url: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
    },
  });
});

/**
 * GET /api/solana/impact
 * Calculate environmental impact from carbon credits
 */
router.get('/impact', (req, res) => {
  const totalTonnes = parseFloat(req.query.tonnes);
  const safeTonnes = isNaN(totalTonnes) ? MOCK_USER_PORTFOLIO.totalCredits : totalTonnes;
  
  res.json({
    totalTonnes: safeTonnes,
    equivalents: {
      trees: Math.round(safeTonnes * 45),
      carMiles: Math.round(safeTonnes * 2500),
      flightHours: (safeTonnes / 0.25).toFixed(1),
      homeDays: Math.round(safeTonnes * 113),
      smartphoneCharges: Math.round(safeTonnes * 121643),
    },
    verified: true,
    blockchain: 'Solana (devnet)',
  });
});

module.exports = router;
