import {
  state, initState, resetCycleStats, findAsset, logHistory, queueDialogue,
  CYCLE_DURATION_SEC, TICK_INTERVAL_MS, STARTING_CAPITAL
} from './state.js';
import {
  driftPrice, reapStaleOrders, playerBuy, playerSell,
  seedLiquidity, refreshLiquidityFor
} from './market.js';
import { makeNPCs, tickNPCs, resetNPCsForCycle } from './npcs.js';
import {
  maybeTriggerEvents, expireEvents, eventBoostFor, resetEventsForCycle
} from './events.js';
import { applyInhumanity, bandOf, cyclePassiveDelta } from './inhumanity.js';
import { startMission, spreadRumor, collab, release, resolveMissions, canPlayerTrade } from './actions.js';
import { startOnboarding, maybeKageReaction } from './onboarding.js';
import { checkArcTriggers } from './stories.js';
import { sfx, unlockAudio, setMuted } from './sound.js';
import {
  renderHUD, renderMarketList, renderChart, renderOrderBook,
  renderHoldings, renderHistory, renderActions, pumpDialogue,
  showEventBanner, showCycleEnd, hideCycleEnd, hideBoot
} from './ui.js';

let npcs = [];
let lastTickWall = 0;
let liquidityTimer = 0;
let prevBand = null;
let storyTimer = 0;
let cyclePassiveTimer = 0;

function startGame() {
  initState();
  npcs = makeNPCs();
  resetEventsForCycle();
  seedLiquidity();
  hideBoot();
  state.running = true;
  lastTickWall = performance.now();
  prevBand = bandOf(state.inhumanity);

  unlockAudio();
  startOnboarding();
  logHistory(`Cycle 1 begins. Capital ${state.capital.toFixed(3)} ETH.`, 'info');
  scheduleTick();
  fullRender();
}

function scheduleTick() {
  setInterval(realTick, TICK_INTERVAL_MS);
}

function realTick() {
  if (!state.running) {
    pumpDialogue();
    return;
  }
  const now = performance.now();
  const dtReal = (now - lastTickWall) / 1000;
  lastTickWall = now;

  if (state.speed === 0) {
    pumpDialogue();
    fullRender();
    return;
  }
  const dtGame = dtReal * state.speed;

  state.cycleElapsedSec += dtGame;
  state.cycleProgress = Math.min(1, state.cycleElapsedSec / CYCLE_DURATION_SEC);

  // Events
  maybeTriggerEvents();
  expireEvents();

  // Price drift + reap orders
  for (const a of state.assets) {
    const eventBoost = eventBoostFor(a);
    driftPrice(a, dtGame, 0, eventBoost);
    reapStaleOrders(a);
  }

  // Refresh market-maker liquidity every ~30 game-seconds.
  liquidityTimer += dtGame;
  if (liquidityTimer >= 30) {
    liquidityTimer = 0;
    for (const a of state.assets) refreshLiquidityFor(a);
  }

  // NPCs
  tickNPCs(npcs, dtGame);

  // Pending mission resolution
  resolveMissions();

  // Cycle passive inhumanity drain (e.g. holding NIRVANA / ZEN-04). Apply per game-minute.
  cyclePassiveTimer += dtGame;
  if (cyclePassiveTimer >= 60) {
    cyclePassiveTimer = 0;
    const d = cyclePassiveDelta();
    if (d !== 0) applyInhumanity(d, 'passive_holdings');
  }

  // Story arc triggers (every 5 game-sec)
  storyTimer += dtGame;
  if (storyTimer >= 5) {
    storyTimer = 0;
    checkArcTriggers();
  }

  // Inhumanity band change → SFX + KAGE reaction
  const band = bandOf(state.inhumanity);
  if (band !== prevBand) {
    if (state.inhumanity >= 60 && prevBand && bandOf(prevBand) !== band) {
      sfx.threshold();
      maybeKageReaction('highInhumanity');
    } else if (state.inhumanity < 30 && band !== prevBand) {
      // Recovery - subtle
    }
    prevBand = band;
  }

  // Cycle end
  if (state.cycleElapsedSec >= CYCLE_DURATION_SEC) {
    endCycle();
    return;
  }

  fullRender();
  pumpDialogue();

  const newest = state.events[state.events.length - 1];
  if (newest && newest.startedAt > state._lastBannerAt) {
    state._lastBannerAt = newest.startedAt;
    showEventBanner(newest.label);
    sfx.event();
  }
}

function fullRender() {
  renderHUD();
  renderMarketList();
  renderChart();
  renderOrderBook();
  renderHoldings();
  renderHistory();
  renderActions();
}

function endCycle() {
  state.running = false;

  let retainedValue = 0;
  for (const [aid, h] of state.holdings) {
    const a = findAsset(aid);
    if (a) retainedValue += a.price * h.qty;
  }

  const stats = {
    startCapital: state.cycleStats.startCapital,
    endCapital: state.capital,
    netProfit: state.capital - state.cycleStats.startCapital,
    trades: state.cycleStats.trades,
    bought: state.cycleStats.bought,
    sold: state.cycleStats.sold,
    retained: state.holdings.size,
    retainedValue,
  };

  const kageLine = pickKageLine(stats);
  showCycleEnd(stats, kageLine);
  sfx.cycleEnd();
  state.totalCyclesPlayed += 1;
}

function pickKageLine(stats) {
  if (state.storyFlags.has('arc_a_complete') && !state.storyFlags.has('arc_a_kage_said')) {
    state.storyFlags.add('arc_a_kage_said');
    return 'KAGE: ...신참, 이 일은 너랑 안 맞아.';
  }
  if (state.inhumanity >= 75) return 'KAGE: 너, 망가지고 있다.';
  const lines = [];
  if (stats.netProfit > 1.0) lines.push("KAGE: 잘했어. 다음 사이클은 더 큰 거 노려.");
  else if (stats.netProfit > 0) lines.push("KAGE: 무난했지. 무난한 게 제일 위험해.");
  else if (stats.netProfit > -0.3) lines.push("KAGE: 본전이군. 신참답네.");
  else lines.push("KAGE: 너 신참 맞지? 아직 시간 있어.");
  if (stats.retained === 0) lines.push("KAGE: 다 팔았네. 미련 없는 건 좋다.");
  if (stats.trades > 20) lines.push("KAGE: 손이 너무 빨라. 시장이 너 보고 있어.");
  return lines[Math.floor(Math.random() * lines.length)];
}

function nextCycle() {
  state.cycle += 1;
  state.cycleElapsedSec = 0;
  state.cycleProgress = 0;
  state._lastBannerAt = 0;
  resetCycleStats();
  resetEventsForCycle();
  resetNPCsForCycle(npcs);
  for (const a of state.assets) {
    a.priceHistory = [{ t: 0, price: a.price }];
    a.tradeCount = 0;
    a.lastChange = 0;
  }
  hideCycleEnd();
  seedLiquidity();
  state.running = true;
  lastTickWall = performance.now();
  logHistory(`Cycle ${state.cycle} begins. Capital ${state.capital.toFixed(3)} ETH.`, 'info');
  fullRender();
}

// ============ INPUT BINDINGS ============
document.getElementById('start-btn').addEventListener('click', () => { unlockAudio(); startGame(); });
document.getElementById('next-cycle-btn').addEventListener('click', nextCycle);

document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.speed = Number(btn.dataset.speed);
    sfx.click();
    renderHUD();
  });
});

document.getElementById('mute-btn').addEventListener('click', () => {
  const btn = document.getElementById('mute-btn');
  const muted = btn.classList.toggle('muted');
  setMuted(muted);
  btn.textContent = muted ? '♪̸' : '♪';
});

document.getElementById('market-list').addEventListener('click', (e) => {
  const row = e.target.closest('.market-row');
  if (!row) return;
  const id = row.dataset.id;
  const a = findAsset(id);
  if (a && !canPlayerTrade(a)) {
    queueDialogue(id, '...당신과는 거래 안 해요.', 'refusal');
    sfx.fail();
  }
  state.selectedAssetId = id;
  sfx.click();
  fullRender();
});

document.getElementById('holdings').addEventListener('click', (e) => {
  const row = e.target.closest('.holding-row');
  if (!row) return;
  state.selectedAssetId = row.dataset.id;
  state.selectedHoldingId = row.dataset.id;
  sfx.click();
  fullRender();
});

document.getElementById('buy-btn').addEventListener('click', () => {
  if (!state.selectedAssetId) return;
  const a = findAsset(state.selectedAssetId);
  if (!a || !canPlayerTrade(a)) { sfx.fail(); return; }
  const result = playerBuy(state.selectedAssetId, 1);
  if (result && result.ok === false) {
    logHistory(`BUY FAILED: ${result.reason}`, 'info');
    sfx.fail();
  } else {
    sfx.buy();
    if (state.cycleStats.bought === 1 && state.totalCyclesPlayed === 0) {
      maybeKageReaction('firstBuy');
    }
  }
  fullRender();
});

document.getElementById('sell-btn').addEventListener('click', () => {
  if (!state.selectedAssetId) return;
  const result = playerSell(state.selectedAssetId, 1);
  if (result && result.ok === false) {
    logHistory(`SELL FAILED: ${result.reason}`, 'info');
    sfx.fail();
  } else {
    sfx.sell();
  }
  fullRender();
});

document.getElementById('mission-btn').addEventListener('click', () => {
  if (!state.selectedAssetId) return;
  const r = startMission(state.selectedAssetId);
  if (!r.ok) sfx.fail(); else sfx.click();
  fullRender();
});

document.getElementById('rumor-btn').addEventListener('click', () => {
  if (!state.selectedAssetId) return;
  const r = spreadRumor(state.selectedAssetId);
  if (!r.ok) sfx.fail(); else sfx.click();
  fullRender();
});

document.getElementById('collab-btn').addEventListener('click', () => {
  if (!state.selectedAssetId) return;
  const r = collab(state.selectedAssetId);
  if (!r.ok) sfx.fail(); else sfx.click();
  fullRender();
});

document.getElementById('release-btn').addEventListener('click', () => {
  if (!state.selectedAssetId) return;
  const r = release(state.selectedAssetId);
  if (!r.ok) sfx.fail(); else sfx.release();
  fullRender();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space') { e.preventDefault(); document.getElementById('buy-btn').click(); }
  else if (e.code === 'KeyS') document.getElementById('sell-btn').click();
  else if (e.code === 'KeyM') document.getElementById('mission-btn').click();
  else if (e.code === 'KeyR') document.getElementById('rumor-btn').click();
  else if (e.code === 'KeyC') document.getElementById('collab-btn').click();
  else if (e.code === 'KeyL') document.getElementById('release-btn').click();
  else if (e.code === 'Digit1') { state.speed = 1; renderHUD(); }
  else if (e.code === 'Digit2') { state.speed = 5; renderHUD(); }
  else if (e.code === 'Digit3') { state.speed = 20; renderHUD(); }
  else if (e.code === 'Digit0') { state.speed = 0; renderHUD(); }
  else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
    e.preventDefault();
    cycleSelection(e.code === 'ArrowDown' ? 1 : -1);
  }
});

function cycleSelection(dir) {
  const ids = state.assets.map(a => a.id);
  const idx = ids.indexOf(state.selectedAssetId);
  const next = (idx + dir + ids.length) % ids.length;
  state.selectedAssetId = ids[next];
  fullRender();
}

state._lastBannerAt = 0;
