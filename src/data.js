// Asset definitions, rarity tiers, trait pool.
// Solo build: 30 abstract assets, no persona layer.

export const RARITY = {
  C:  { label: 'C',  weight: 0.60, volatility: 0.05, basePrice: [0.08, 0.20] },
  U:  { label: 'U',  weight: 0.25, volatility: 0.08, basePrice: [0.30, 0.60] },
  R:  { label: 'R',  weight: 0.10, volatility: 0.12, basePrice: [0.70, 1.10] },
  SR: { label: 'SR', weight: 0.04, volatility: 0.18, basePrice: [1.50, 2.20] },
  L:  { label: 'L',  weight: 0.01, volatility: 0.25, basePrice: [3.50, 5.50] },
};

// Trait categories. Each asset gets one per category.
export const TRAITS = {
  hair:      ['black_bob', 'white_long', 'pink_short', 'cyan_twin', 'silver_buzz', 'green_mohawk'],
  outfit:    ['hoodie', 'suit', 'uniform', 'kimono', 'cloak', 'armor'],
  accessory: ['none', 'headphones', 'glasses', 'mask', 'wand', 'scythe'],
  background:['void', 'city', 'shrine', 'ruins'],
  aura:      ['none', 'glitch', 'sparkle', 'death', 'peace'],
};

const TRAIT_KEYS = Object.keys(TRAITS);

function seededRandom(seed) {
  // Mulberry32. Deterministic for reproducible asset definitions.
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRarity(roll) {
  // L: 1%, SR: 4%, R: 10%, U: 25%, C: 60%
  if (roll < 0.01) return 'L';
  if (roll < 0.05) return 'SR';
  if (roll < 0.15) return 'R';
  if (roll < 0.40) return 'U';
  return 'C';
}

export function generateAssets() {
  const rand = seededRandom(20260509);
  const assets = [];

  // Force at least one of each rarity.
  const forcedRarities = ['L', 'SR', 'R', 'R', 'R',
                          'U','U','U','U','U','U','U','U',
                          'C','C','C','C','C','C','C','C','C','C','C','C','C','C','C','C', 'SR'];

  for (let i = 0; i < 30; i++) {
    const id = '#' + String(i + 1).padStart(3, '0');
    const rarity = forcedRarities[i] || pickRarity(rand());
    const cfg = RARITY[rarity];
    const [lo, hi] = cfg.basePrice;
    const price = lo + rand() * (hi - lo);

    const traits = {};
    for (const key of TRAIT_KEYS) {
      const pool = TRAITS[key];
      traits[key] = pool[Math.floor(rand() * pool.length)];
    }

    assets.push({
      id,
      rarity,
      volatility: cfg.volatility,
      price: round(price, 4),
      traits,
      lastChange: 0,
      priceHistory: [],   // {t, price}
      tradeCount: 0,
      buyOrders: [],      // {price, qty, by}
      sellOrders: [],     // {price, qty, by}
    });
  }
  return assets;
}

export function round(v, d = 4) {
  const m = Math.pow(10, d);
  return Math.round(v * m) / m;
}
