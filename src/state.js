import { generateAssets } from './data.js';

export const CYCLE_DURATION_SEC = 30 * 60;       // 30 real-minute cycle, scaled by speed multiplier
export const TICK_INTERVAL_MS = 1000;            // Real-time tick
export const STARTING_CAPITAL = 1.50;

export const state = {
  cycle: 1,
  cycleProgress: 0,            // 0..1
  cycleElapsedSec: 0,          // game-time seconds
  speed: 5,                    // 1x / 5x / 20x / 0 (paused)
  capital: STARTING_CAPITAL,
  assets: [],
  selectedAssetId: null,
  selectedHoldingId: null,
  holdings: new Map(),         // assetId -> { qty, avgPrice, firstBoughtCycle }
  history: [],                 // { t, text, type }
  events: [],                  // active events
  cycleStats: {
    trades: 0,
    bought: 0,
    sold: 0,
    realizedPnL: 0,
    startCapital: STARTING_CAPITAL,
  },
  running: false,
  ended: false,
};

export function initState() {
  state.assets = generateAssets();
  state.selectedAssetId = state.assets[0].id;
  state.holdings = new Map();
  resetCycleStats();
}

export function resetCycleStats() {
  state.cycleStats = {
    trades: 0,
    bought: 0,
    sold: 0,
    realizedPnL: 0,
    startCapital: state.capital,
  };
}

export function findAsset(id) {
  return state.assets.find(a => a.id === id);
}

export function logHistory(text, type = 'info') {
  state.history.unshift({ t: state.cycleElapsedSec, text, type });
  if (state.history.length > 80) state.history.pop();
}

export function addHolding(assetId, qty, price) {
  const cur = state.holdings.get(assetId);
  if (!cur) {
    state.holdings.set(assetId, {
      qty,
      avgPrice: price,
      firstBoughtCycle: state.cycle,
      firstBoughtAt: state.cycleElapsedSec,
    });
  } else {
    const totalCost = cur.avgPrice * cur.qty + price * qty;
    cur.qty += qty;
    cur.avgPrice = totalCost / cur.qty;
  }
}

export function removeHolding(assetId, qty) {
  const cur = state.holdings.get(assetId);
  if (!cur) return 0;
  const sellQty = Math.min(qty, cur.qty);
  cur.qty -= sellQty;
  if (cur.qty <= 0) state.holdings.delete(assetId);
  return sellQty;
}
