// Headless smoke test for the full game (no DOM).
// Run: node src/_smoke.mjs

import { state, initState, CYCLE_DURATION_SEC } from './state.js';
import { driftPrice, reapStaleOrders, seedLiquidity, refreshLiquidityFor, playerBuy, playerSell } from './market.js';
import { makeNPCs, tickNPCs } from './npcs.js';
import { maybeTriggerEvents, expireEvents, eventBoostFor, resetEventsForCycle } from './events.js';
import { startMission, spreadRumor, collab, release, resolveMissions } from './actions.js';
import { applyInhumanity, bandOf, cyclePassiveDelta } from './inhumanity.js';
import { checkArcTriggers } from './stories.js';
import { PERSONAS } from './personas.js';

initState();
resetEventsForCycle();
seedLiquidity();
const npcs = makeNPCs();

console.log(`Personas loaded: ${PERSONAS.length}`);
console.log(`Assets: ${state.assets.length}`);
console.log(`Rarity:`, state.assets.reduce((acc, a) => { acc[a.rarity] = (acc[a.rarity] || 0) + 1; return acc; }, {}));
console.log(`NPCs: ${npcs.length}`);

const dt = 1;
let totalEvents = 0;
let passiveAccum = 0;
let storyAccum = 0;

// Player simulation: buy NULL-07 early, hold, then sell some hot personas.
let phase = 0;

for (let t = 0; t < CYCLE_DURATION_SEC; t += dt) {
  state.cycleElapsedSec = t;
  state.cycleProgress = t / CYCLE_DURATION_SEC;

  if (maybeTriggerEvents()) totalEvents++;
  expireEvents();
  resolveMissions();

  for (const a of state.assets) {
    const boost = eventBoostFor(a);
    driftPrice(a, dt, 0, boost);
    reapStaleOrders(a);
  }
  tickNPCs(npcs, dt);

  if (t > 0 && t % 30 === 0) {
    for (const a of state.assets) refreshLiquidityFor(a);
  }

  passiveAccum += dt;
  if (passiveAccum >= 60) {
    passiveAccum = 0;
    const d = cyclePassiveDelta();
    if (d !== 0) applyInhumanity(d, 'passive');
  }

  storyAccum += dt;
  if (storyAccum >= 5) { storyAccum = 0; checkArcTriggers(); }

  // Player script
  if (phase === 0 && t > 30) { state.selectedAssetId = 'NULL-07'; const r = playerBuy('NULL-07', 1); console.log(`t=${t} BUY NULL-07:`, r); phase = 1; }
  if (phase === 1 && t > 120) { const r = startMission('NULL-07'); console.log(`t=${t} MISSION NULL-07:`, r); phase = 2; }
  if (phase === 2 && t > 600) { state.selectedAssetId = 'KAYA-22'; const r = playerBuy('KAYA-22', 1); console.log(`t=${t} BUY KAYA-22:`, r); phase = 3; }
  if (phase === 3 && t > 700) { const r = playerSell('KAYA-22', 1); console.log(`t=${t} SELL KAYA-22 (short):`, r); phase = 4; }
  if (phase === 4 && t > 800) { const r = spreadRumor('NULL-07'); console.log(`t=${t} RUMOR NULL-07:`, r); phase = 5; }
  if (phase === 5 && t > 1000) { const r = playerBuy('MEI-19', 1); console.log(`t=${t} BUY MEI-19:`, r); phase = 6; }
  if (phase === 6 && t > 1100) { const r = collab('NULL-07'); console.log(`t=${t} COLLAB NULL-07:`, r); phase = 7; }
  if (phase === 7 && t > 1500) { const r = release('NULL-07'); console.log(`t=${t} RELEASE NULL-07:`, r); phase = 8; }
}

console.log('---- AFTER 30 GAME-MIN ----');
console.log(`Total trade volume: ${state.assets.reduce((s, a) => s + a.tradeCount, 0)}`);
console.log(`Total events: ${totalEvents}`);
console.log(`Inhumanity: ${state.inhumanity.toFixed(1)}  band=${bandOf(state.inhumanity)}`);
console.log(`Capital: ${state.capital.toFixed(3)} ETH`);
console.log(`Holdings: ${state.holdings.size}`);
console.log(`Story flags:`, [...state.storyFlags]);
console.log(`Pending missions: ${state.pendingMissions.length}`);
console.log(`Dialogue queue size: ${state._dialogueQueue.length}`);
console.log(`Top 3 by volume:`);
const top = state.assets.slice().sort((a, b) => b.tradeCount - a.tradeCount).slice(0, 3);
for (const a of top) console.log(`  ${a.id} [${a.rarity}] price=${a.price.toFixed(3)} volume=${a.tradeCount}`);
