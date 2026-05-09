// Headless smoke test for the simulation engine (no DOM).
// Run: node src/_smoke.mjs
// Verifies: assets generate, NPCs trade, prices drift, orders match.

import { state, initState, CYCLE_DURATION_SEC } from './state.js';
import { driftPrice, reapStaleOrders, seedLiquidity, refreshLiquidityFor } from './market.js';
import { makeNPCs, tickNPCs } from './npcs.js';
import { maybeTriggerEvents, expireEvents, eventBoostFor, resetEventsForCycle } from './events.js';

initState();
resetEventsForCycle();
seedLiquidity();
const npcs = makeNPCs();

console.log(`Assets generated: ${state.assets.length}`);
console.log(`Rarity breakdown:`, state.assets.reduce((acc, a) => {
  acc[a.rarity] = (acc[a.rarity] || 0) + 1; return acc;
}, {}));
console.log(`NPCs: ${npcs.length}`);
console.log(`Sample asset:`, state.assets[0]);

const dt = 1; // 1 game sec per loop
let totalEvents = 0;

for (let t = 0; t < CYCLE_DURATION_SEC; t += dt) {
  state.cycleElapsedSec = t;
  state.cycleProgress = t / CYCLE_DURATION_SEC;

  const newEv = maybeTriggerEvents();
  if (newEv) totalEvents++;
  expireEvents();

  for (const a of state.assets) {
    const boost = eventBoostFor(a);
    driftPrice(a, dt, 0, boost);
    reapStaleOrders(a);
  }
  tickNPCs(npcs, dt);
  if (t > 0 && t % 30 === 0) {
    for (const a of state.assets) refreshLiquidityFor(a);
  }
}

console.log('---- AFTER 30 GAME-MIN ----');
console.log(`Total trade volume across all assets: ${state.assets.reduce((s, a) => s + a.tradeCount, 0)}`);
console.log(`Total events triggered: ${totalEvents}`);
console.log(`Active events: ${state.events.length}`);

const sorted = state.assets.slice().sort((a, b) => b.tradeCount - a.tradeCount);
console.log('Top 5 by trade count:');
for (const a of sorted.slice(0, 5)) {
  console.log(`  ${a.id} [${a.rarity}] price=${a.price.toFixed(3)} trades=${a.tradeCount} change=${(a.lastChange*100).toFixed(2)}%`);
}

const npcStats = npcs.map(n => ({
  id: n.id,
  capital: n.capital.toFixed(2),
  holdings: n.portfolio.size,
}));
console.log('NPC final state:');
for (const s of npcStats) console.log(' ', s);
