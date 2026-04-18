/**
 * Carbon Footprint Calculator
 * 
 * Calculates personal carbon footprint based on lifestyle factors
 * using emission factors from IPCC, EPA, and academic research.
 */

const express = require('express');
const router = express.Router();

// Emission factors (kg CO₂ per unit)
const FACTORS = {
  transport: {
    car_km: 0.21,           // Average car
    car_suv_km: 0.29,       // SUV/pickup
    car_ev_km: 0.05,        // Electric vehicle
    bus_km: 0.089,          // Public bus
    train_km: 0.041,        // Electric train
    subway_km: 0.033,       // Metro/subway
    bike_km: 0,             // Cycling
    walk_km: 0,             // Walking
    flight_short_km: 0.255, // Short haul (<1500km)
    flight_long_km: 0.195,  // Long haul (>1500km)
    flight_per_trip: 0.5,   // Avg short flight (2000km)
  },
  diet: {
    heavy_meat: 3300,       // kg CO₂/year — high meat (>100g/day)
    medium_meat: 2500,      // Medium meat (50-100g/day)
    low_meat: 1900,         // Low meat (<50g/day)
    vegetarian: 1500,       // Vegetarian
    vegan: 1100,            // Vegan
  },
  energy: {
    coal_grid: 3500,        // kg CO₂/year — coal-heavy electricity
    mixed_grid: 2500,       // Average mixed grid
    gas_heating: 2000,      // Natural gas
    renewable_grid: 800,    // Mostly renewable
    solar_100: 300,         // 100% solar/renewable
  },
  home: {
    small_apt: 1500,        // Small apartment
    medium_house: 3000,     // Average house
    large_house: 5000,      // Large house
  },
  consumption: {
    minimal: 1000,          // Minimal consumption
    average: 2500,          // Average consumer
    high: 4500,             // High consumption
  },
};

/**
 * POST /api/carbon/calculate
 * Calculate total carbon footprint
 */
router.post('/calculate', (req, res) => {
  const {
    // Transport
    commute_km = 25,
    commute_days = 5,
    commute_mode = 'car',
    flights_per_year = 3,
    // Diet
    diet = 'medium_meat',
    // Energy
    energy_source = 'mixed_grid',
    home_size = 'medium_house',
    // Consumption
    consumption_level = 'average',
    // Offsets
    existing_offsets = 0,
  } = req.body;

  // Transport
  const commuteFactor = FACTORS.transport[`${commute_mode}_km`] || FACTORS.transport.car_km;
  const transportCommute = commute_km * commuteFactor * commute_days * 52 / 1000; // tonnes
  const transportFlights = flights_per_year * FACTORS.transport.flight_per_trip;
  const transportTotal = transportCommute + transportFlights;

  // Diet
  const dietEmissions = (FACTORS.diet[diet] || FACTORS.diet.medium_meat) / 1000;

  // Home Energy
  const energyEmissions = (FACTORS.energy[energy_source] || FACTORS.energy.mixed_grid) / 1000;
  const homeEmissions = (FACTORS.home[home_size] || FACTORS.home.medium_house) / 1000;

  // Consumption
  const consumptionEmissions = (FACTORS.consumption[consumption_level] || FACTORS.consumption.average) / 1000;

  // Total
  const grossTotal = transportTotal + dietEmissions + energyEmissions + homeEmissions + consumptionEmissions;
  const netTotal = Math.max(0, grossTotal - existing_offsets);

  // Global averages for comparison
  const globalAverage = 4.7;  // tonnes CO₂/year per capita
  const target15C = 2.3;      // required for 1.5°C pathway
  const target2C = 3.5;       // required for 2°C pathway

  // Percentile (rough estimate)
  const percentile = Math.min(99, Math.max(1, Math.round(
    100 * (1 - Math.exp(-netTotal / 3.5))
  )));

  res.json({
    breakdown: {
      transport: {
        total: parseFloat(transportTotal.toFixed(2)),
        commute: parseFloat(transportCommute.toFixed(2)),
        flights: parseFloat(transportFlights.toFixed(2)),
        unit: 'tonnes CO₂/year',
      },
      diet: {
        total: parseFloat(dietEmissions.toFixed(2)),
        label: diet.replace(/_/g, ' '),
        unit: 'tonnes CO₂/year',
      },
      energy: {
        total: parseFloat((energyEmissions + homeEmissions).toFixed(2)),
        electricity: parseFloat(energyEmissions.toFixed(2)),
        heating: parseFloat(homeEmissions.toFixed(2)),
        unit: 'tonnes CO₂/year',
      },
      consumption: {
        total: parseFloat(consumptionEmissions.toFixed(2)),
        level: consumption_level,
        unit: 'tonnes CO₂/year',
      },
    },
    total: {
      gross: parseFloat(grossTotal.toFixed(2)),
      offsets: parseFloat(existing_offsets.toFixed(2)),
      net: parseFloat(netTotal.toFixed(2)),
      unit: 'tonnes CO₂/year',
    },
    comparison: {
      globalAverage,
      target15C,
      target2C,
      yourPosition: percentile,
      vsAverage: `${netTotal > globalAverage ? '+' : ''}${((netTotal / globalAverage - 1) * 100).toFixed(0)}% vs global average`,
      vsTarget15: `${((netTotal / target15C - 1) * 100).toFixed(0)}% above 1.5°C target`,
    },
    recommendations: generateRecommendations(req.body, netTotal),
  });
});

/**
 * GET /api/carbon/factors
 * List all emission factors used in calculations
 */
router.get('/factors', (req, res) => {
  res.json({
    factors: FACTORS,
    sources: [
      'IPCC AR6 (2021)',
      'EPA Greenhouse Gas Equivalencies',
      'Our World in Data — CO₂ and Greenhouse Gas Emissions',
      'Global Carbon Project 2024',
    ],
    notes: {
      transport: 'Based on average vehicle efficiency + grid electricity mix',
      diet: 'Based on Poore & Nemecek (2018) Science, adjusted for regional averages',
      energy: 'Based on IEA electricity emission factors by grid type',
      consumption: 'Based on lifecycle assessment of goods and services',
    },
  });
});

// ─── Recommendation engine ──────────────────────────────────────────────────
function generateRecommendations(params, total) {
  const recs = [];
  const { commute_mode, diet, energy_source, flights_per_year } = params;

  if (commute_mode === 'car' || commute_mode === 'car_suv') {
    recs.push({
      category: 'transport',
      action: 'Switch to an electric vehicle or carpool 3 days/week',
      potentialSaving: parseFloat((FACTORS.transport.car_km - FACTORS.transport.car_ev_km).toFixed(2)),
      priority: 'high',
    });
  }

  if (flights_per_year > 4) {
    recs.push({
      category: 'transport',
      action: 'Reduce flights or choose direct routes (takeoff/landing = most emissions)',
      potentialSaving: parseFloat(((flights_per_year - 4) * 0.5).toFixed(2)),
      priority: 'high',
    });
  }

  if (diet === 'heavy_meat' || diet === 'medium_meat') {
    const targetDiet = diet === 'heavy_meat' ? 'low_meat' : 'vegetarian';
    recs.push({
      category: 'diet',
      action: `Reduce meat to ${targetDiet === 'low_meat' ? '2-3 meals/week' : 'vegetarian'}`,
      potentialSaving: parseFloat(((FACTORS.diet[diet] - FACTORS.diet[targetDiet]) / 1000).toFixed(2)),
      priority: 'medium',
    });
  }

  if (energy_source === 'coal_grid' || energy_source === 'mixed_grid') {
    recs.push({
      category: 'energy',
      action: 'Switch to a renewable energy provider or install solar panels',
      potentialSaving: parseFloat(((FACTORS.energy[energy_source] - FACTORS.energy.solar_100) / 1000).toFixed(2)),
      priority: 'high',
    });
  }

  if (total > 2.3) {
    recs.push({
      category: 'offset',
      action: `Purchase verified carbon offsets for ${(total - 2.3).toFixed(1)} tonnes to reach 1.5°C target`,
      potentialSaving: parseFloat((total - 2.3).toFixed(2)),
      priority: 'medium',
    });
  }

  return recs;
}

module.exports = router;
