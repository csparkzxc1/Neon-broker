import { generateAssets } from './data.js';

export const CYCLE_DURATION_SEC = 30 * 60;
export const TICK_INTERVAL_MS = 1000;
export const STARTING_CAPITAL = 1.50;

export const state = {
  cycle: 1,
  cycleProgress: 0,
  cycleElapsedSec: 0,
  speed: 5,
  capital: STARTING_CAPITAL,
  assets: [],
  selectedAssetId: null,
  selectedHoldingId: null,
  holdings: new Map(),
  history: [],
  events: [],
  cycleStats: {
    trades: 0, bought: 0, sold: 0,
    realizedPnL: 0, startCapital: STARTING_CAPITAL,
  },
  inhumanity: 5,
  lastBandChange: null,
  pendingMissions: [],         // { assetId, completesAt, payout, reputation }
  storyFlags: new Set(),       // 'arc_a_started', 'arc_a_complete', etc.
  totalCyclesPlayed: 0,
  running: false,
  ended: false,
  _lastBannerAt: 0,
  _dialogueQueue: [],
};

export function initState() {
  state.assets = generateAssets();
  state.selectedAssetId = state.assets[0].id;
  state.holdings = new Map();
  resetCycleStats();
}

export function resetCycleStats() {
  state.cycleStats = {
    trades: 0, bought: 0, sold: 0,
    realizedPnL: 0, startCapital: state.capital,
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

export function holdSecondsOf(assetId) {
  const h = state.holdings.get(assetId);
  if (!h) return 0;
  const cyclesElapsed = state.cycle - h.firstBoughtCycle;
  return cyclesElapsed * CYCLE_DURATION_SEC + (state.cycleElapsedSec - h.firstBoughtAt);
}

export function holdCyclesOf(assetId) {
  const h = state.holdings.get(assetId);
  if (!h) return 0;
  return state.cycle - h.firstBoughtCycle;
}

export function queueDialogue(speaker, line, kind = 'persona') {
  state._dialogueQueue.push({ speaker, line, kind, at: Date.now() });
  if (state._dialogueQueue.length > 4) state._dialogueQueue.shift();
}

export function popDialogue() {
  return state._dialogueQueue.shift();
}
