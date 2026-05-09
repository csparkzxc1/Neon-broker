// Asset = Persona-backed market entity.
// Asset data is generated from PERSONAS in personas.js.

import { PERSONAS } from './personas.js';

export const RARITY = {
  C:  { label: 'C',  volatility: 0.05 },
  U:  { label: 'U',  volatility: 0.08 },
  R:  { label: 'R',  volatility: 0.12 },
  SR: { label: 'SR', volatility: 0.18 },
  L:  { label: 'L',  volatility: 0.25 },
};

export function generateAssets() {
  return PERSONAS.map(p => ({
    id: p.id,
    rarity: p.rarity,
    volatility: RARITY[p.rarity].volatility * effectiveVolMultiplier(p),
    price: p.basePrice,
    traits: p.traits,
    persona: p,                  // Direct reference for dialogue / passives
    lastChange: 0,
    priceHistory: [],
    tradeCount: 0,
    buyOrders: [],
    sellOrders: [],
    cyclesHeldByPlayer: 0,
    timesTradedByPlayer: 0,
    lastSeenInDialogue: -Infinity,
  }));
}

function effectiveVolMultiplier(p) {
  if (p.passives && p.passives.includes('volatility_x1.5')) return 1.5;
  if (p.passives && p.passives.includes('volatility_x1.3')) return 1.3;
  return 1.0;
}

export function round(v, d = 4) {
  const m = Math.pow(10, d);
  return Math.round(v * m) / m;
}
