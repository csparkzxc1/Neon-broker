// Inhumanity gauge: 0..100. Resource constraint, not morality score.
// Per docs/inhumanity-system.md.

import { state } from './state.js';

export const THRESHOLDS = {
  CALM: 0,
  NORMAL: 15,
  WARN1: 30,    // High-ego personas refuse missions
  WARN2: 45,    // Some NPC traders stop dealing
  HARD: 60,     // New persona pool restricted
  CRITICAL: 75, // Some meta locked
  REFUSAL: 90,  // High-ego personas refuse trade
  GAME_OVER: 100,
};

export function bandOf(value) {
  if (value < 15) return 'calm';
  if (value < 30) return 'normal';
  if (value < 45) return 'warn1';
  if (value < 60) return 'warn2';
  if (value < 75) return 'hard';
  if (value < 90) return 'critical';
  if (value < 100) return 'refusal';
  return 'over';
}

export function colorFor(value) {
  if (value < 30) return '#00E5FF';
  if (value < 60) return '#FFB300';
  if (value < 90) return '#FF6B1A';
  return '#FF3D7F';
}

// Compute Δ for a sale.
// docs/inhumanity-system.md formula:
// ΔI = base × (1 + ego_factor) × repeat_multiplier × cycle_modifier
export function deltaForSell({ asset, holdQty, holdCycles, holdSeconds, recentChange }) {
  const persona = asset.persona;
  const ego_factor = persona.ego / 100;
  const cycle_progress = state.cycleProgress;
  const cycle_modifier = 1 + cycle_progress * 0.5;

  let base = 1; // hold ≥ 1 cycle
  if (holdCycles < 1) base = 2;
  if (holdSeconds < 60 && recentChange > 0.3) base = 4;

  const n = asset.timesTradedByPlayer;
  const repeat_multiplier = Math.min(2.5, 1 + Math.max(0, n - 1) * 0.3);

  let delta = base * (1 + ego_factor) * repeat_multiplier * cycle_modifier;

  // Persona-specific: NIRVANA sell penalty
  if (persona.passives && persona.passives.includes('sell_penalty_+20')) delta += 20;

  // COP-1, KIRA-77 force penalty: applies only on force-mission, not sell. Skip here.

  return delta;
}

// Δ for forced mission on high-ego (≥ 50).
export function deltaForForceMission(asset) {
  const persona = asset.persona;
  let delta = persona.ego >= 50 ? 5 : 0;
  if (persona.passives) {
    if (persona.passives.includes('force_penalty_x1.5')) delta *= 1.5;
    if (persona.passives.includes('force_penalty_x2')) delta *= 2.0;
  }
  return delta;
}

// Δ for rumor (success or detected).
export function deltaForRumor({ detected }) {
  return detected ? 6 : 3;
}

// Δ for forced collab (one side disagrees).
export function deltaForCollab({ forced }) {
  return forced ? 4 : -1;
}

// Δ for voluntary release.
export function deltaForRelease(asset, holdCycles) {
  const persona = asset.persona;
  let delta = -5;
  if (holdCycles >= 5) delta = -10;
  if (persona.ego >= 80) delta = -15;
  return delta;
}

// Apply delta with clamping.
export function applyInhumanity(delta, reason) {
  const before = state.inhumanity;
  state.inhumanity = Math.max(0, Math.min(100, state.inhumanity + delta));
  const band = bandOf(state.inhumanity);
  if (bandOf(before) !== band) {
    state.lastBandChange = { from: bandOf(before), to: band };
  }
  return { from: before, to: state.inhumanity, delta, reason };
}

// Threshold gate checks.
// Returns true if action is allowed.
export function canForceMission(asset) {
  if (asset.persona.ego >= 80 && state.inhumanity >= 30) return false;
  return true;
}

export function canTradeNew(asset) {
  // Trade refusal on high-ego at high inhumanity.
  if (state.inhumanity >= 90 && asset.persona.ego >= 60) return false;
  if (state.inhumanity >= 75 && asset.persona.ego >= 80) return false;
  return true;
}

// Per-cycle passive effects from holdings (NIRVANA -2, ZEN-04 -1).
export function cyclePassiveDelta() {
  let delta = 0;
  for (const [aid, h] of state.holdings) {
    const asset = state.assets.find(a => a.id === aid);
    if (!asset) continue;
    const passives = asset.persona.passives || [];
    if (passives.includes('inhumanity_passive_-2')) delta -= 2;
    if (passives.includes('inhumanity_passive_-1')) delta -= 1;
  }
  return delta;
}
