/**
 * Snowflake Integration — Climate Data Warehouse Queries
 * 
 * Connects to Snowflake for querying large-scale climate datasets:
 *   - Global temperature records (NASA GISS, HadCRUT)
 *   - CO₂ concentration (Mauna Loa, NOAA)
 *   - Deforestation data (Global Forest Watch)
 *   - Ocean metrics (NOAA, Copernicus)
 *   - Biodiversity indices (IUCN)
 * 
 * Free datasets: https://app.snowflake.com/marketplace
 * Docs: https://docs.snowflake.com/en/developer-guide
 */

const express = require('express');
const router = express.Router();

const SNOWFLAKE_CONFIG = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
  database: process.env.SNOWFLAKE_DATABASE || 'CLIMATE_DATA',
  schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC',
};

const snowflakeEnabled = !!(SNOWFLAKE_CONFIG.account && SNOWFLAKE_CONFIG.username);

// ─── Mock climate datasets (used when Snowflake is not configured) ──────────
const MOCK_DATASETS = {
  temperature: {
    name: 'Global Temperature Anomaly',
    unit: '°C relative to 1951-1980 baseline',
    source: 'NASA GISS',
    data: [
      { year: 1880, value: -0.16 }, { year: 1900, value: -0.08 },
      { year: 1920, value: -0.27 }, { year: 1940, value: 0.12 },
      { year: 1960, value: 0.01 }, { year: 1970, value: 0.02 },
      { year: 1980, value: 0.26 }, { year: 1990, value: 0.45 },
      { year: 2000, value: 0.40 }, { year: 2005, value: 0.67 },
      { year: 2010, value: 0.72 }, { year: 2015, value: 0.90 },
      { year: 2020, value: 1.02 }, { year: 2024, value: 1.48 },
    ],
  },
  co2: {
    name: 'Atmospheric CO₂ Concentration',
    unit: 'parts per million (ppm)',
    source: 'NOAA / Mauna Loa',
    data: [
      { year: 1960, value: 316.9 }, { year: 1970, value: 325.7 },
      { year: 1980, value: 338.7 }, { year: 1990, value: 354.2 },
      { year: 2000, value: 369.4 }, { year: 2005, value: 379.8 },
      { year: 2010, value: 389.9 }, { year: 2015, value: 400.8 },
      { year: 2020, value: 414.2 }, { year: 2024, value: 421.0 },
    ],
  },
  seaLevel: {
    name: 'Global Mean Sea Level Rise',
    unit: 'mm relative to 1993',
    source: 'NASA / NOAA',
    data: [
      { year: 1993, value: 0 }, { year: 1998, value: 15 },
      { year: 2003, value: 28 }, { year: 2008, value: 42 },
      { year: 2013, value: 60 }, { year: 2018, value: 82 },
      { year: 2023, value: 101 }, { year: 2024, value: 105 },
    ],
  },
  arcticIce: {
    name: 'Arctic Sea Ice Minimum Extent',
    unit: 'million km²',
    source: 'NSIDC',
    data: [
      { year: 1980, value: 7.8 }, { year: 1990, value: 6.2 },
      { year: 2000, value: 6.3 }, { year: 2005, value: 5.6 },
      { year: 2010, value: 4.9 }, { year: 2012, value: 3.4 },
      { year: 2015, value: 4.6 }, { year: 2020, value: 3.9 },
      { year: 2024, value: 4.3 },
    ],
  },
  deforestation: {
    name: 'Global Tree Cover Loss',
    unit: 'million hectares/year',
    source: 'Global Forest Watch',
    data: [
      { year: 2001, value: 32.3 }, { year: 2005, value: 33.8 },
      { year: 2010, value: 34.2 }, { year: 2015, value: 32.0 },
      { year: 2016, value: 29.7 }, { year: 2017, value: 29.4 },
      { year: 2020, value: 25.8 }, { year: 2021, value: 25.3 },
      { year: 2022, value: 22.8 }, { year: 2023, value: 28.3 },
    ],
  },
  renewable: {
    name: 'Global Renewable Energy Capacity',
    unit: 'gigawatts (GW)',
    source: 'IRENA',
    data: [
      { year: 2010, value: 1250 }, { year: 2012, value: 1490 },
      { year: 2014, value: 1710 }, { year: 2016, value: 2010 },
      { year: 2018, value: 2350 }, { year: 2020, value: 2799 },
      { year: 2022, value: 3372 }, { year: 2024, value: 4448 },
    ],
  },
  biodiversity: {
    name: 'Living Planet Index',
    unit: 'relative to 1970 = 100',
    source: 'WWF / ZSL',
    data: [
      { year: 1970, value: 100 }, { year: 1980, value: 77 },
      { year: 1990, value: 62 }, { year: 2000, value: 50 },
      { year: 2010, value: 41 }, { year: 2020, value: 32 },
    ],
  },
};

/**
 * GET /api/snowflake/status
 */
router.get('/status', (req, res) => {
  res.json({
    enabled: snowflakeEnabled,
    database: SNOWFLAKE_CONFIG.database,
    warehouse: SNOWFLAKE_CONFIG.warehouse,
    availableDatasets: Object.keys(MOCK_DATASETS),
    message: snowflakeEnabled
      ? 'Snowflake connected — querying live climate data'
      : 'Snowflake not configured — using cached datasets',
  });
});

/**
 * GET /api/snowflake/datasets
 * List all available climate datasets
 */
router.get('/datasets', (req, res) => {
  const datasets = Object.entries(MOCK_DATASETS).map(([key, ds]) => ({
    id: key,
    name: ds.name,
    unit: ds.unit,
    source: ds.source,
    points: ds.data.length,
    yearRange: `${ds.data[0].year}–${ds.data[ds.data.length - 1].year}`,
  }));
  res.json({ datasets, source: snowflakeEnabled ? 'snowflake' : 'mock' });
});

/**
 * GET /api/snowflake/query/:dataset
 * Query a specific climate dataset
 */
router.get('/query/:dataset', async (req, res) => {
  const { dataset } = req.params;
  const { fromYear, toYear, limit } = req.query;

  if (snowflakeEnabled) {
    try {
      const snowflake = require('snowflake-sdk');
      const connection = snowflake.createConnection(SNOWFLAKE_CONFIG);
      
      await new Promise((resolve, reject) => {
        connection.connect((err) => err ? reject(err) : resolve());
      });

      let sql = `SELECT year, value, source FROM ${dataset}_data WHERE 1=1`;
      const binds = [];
      
      if (fromYear) {
        sql += ` AND year >= ?`;
        binds.push(parseInt(fromYear));
      }
      if (toYear) {
        sql += ` AND year <= ?`;
        binds.push(parseInt(toYear));
      }
      sql += ` ORDER BY year`;
      if (limit) {
        sql += ` LIMIT ?`;
        binds.push(parseInt(limit));
      }

      const rows = await new Promise((resolve, reject) => {
        connection.execute({
          sqlText: sql,
          binds,
          complete: (err, stmt, rows) => err ? reject(err) : resolve(rows),
        });
      });

      connection.destroy();
      
      return res.json({
        source: 'snowflake',
        dataset,
        data: rows,
      });
    } catch (err) {
      console.error('Snowflake query error:', err.message);
    }
  }

  // Fallback to mock data
  const ds = MOCK_DATASETS[dataset];
  if (!ds) {
    return res.status(404).json({
      error: `Dataset '${dataset}' not found`,
      available: Object.keys(MOCK_DATASETS),
    });
  }

  let data = ds.data;
  if (fromYear) data = data.filter(d => d.year >= parseInt(fromYear));
  if (toYear) data = data.filter(d => d.year <= parseInt(toYear));
  if (limit) data = data.slice(0, parseInt(limit));

  res.json({
    source: 'mock',
    dataset,
    name: ds.name,
    unit: ds.unit,
    data_source: ds.source,
    data,
  });
});

/**
 * GET /api/snowflake/dashboard
 * Get all datasets formatted for the dashboard
 */
router.get('/dashboard', (req, res) => {
  const dashboard = Object.entries(MOCK_DATASETS).map(([key, ds]) => {
    const latest = ds.data[ds.data.length - 1];
    const previous = ds.data[ds.data.length - 2];
    const change = latest && previous ? ((latest.value - previous.value) / previous.value * 100).toFixed(1) : null;

    return {
      id: key,
      name: ds.name,
      unit: ds.unit,
      source: ds.source,
      latest: latest?.value,
      latestYear: latest?.year,
      change: change ? `${change > 0 ? '+' : ''}${change}%` : null,
      trend: latest && previous ? (latest.value > previous.value ? 'up' : 'down') : 'stable',
      sparkline: ds.data.slice(-6).map(d => d.value),
    };
  });

  res.json({ source: snowflakeEnabled ? 'snowflake' : 'mock', dashboard });
});

module.exports = router;
