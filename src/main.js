import { state, initState, resetCycleStats, findAsset, logHistory, CYCLE_DURATION_SEC, TICK_INTERVAL_MS, STARTING_CAPITAL } from './state.js';
import { driftPrice, reapStaleOrders, playerBuy, playerSell, seedLiquidity, refreshLiquidityFor } from './market.js';
import { makeNPCs, tickNPCs, resetNPCsForCycle } from './npcs.js';
import { maybeTriggerEvents, expireEvents, eventBoostFor, resetEventsForCycle } from './events.js';
import {
  renderHUD, renderMarketList, renderChart, renderOrderBook,
  renderHoldings, renderHistory, renderActions,
  showEventBanner, showCycleEnd, hideCycleEnd, hideBoot
} from './ui.js';

let npcs = [];
let lastTickWall = 0;

function startGame() {
  initState();
  npcs = makeNPCs();
  resetEventsForCycle();
  seedLiquidity();
  hideBoot();
  state.running = true;
  lastTickWall = performance.now();

  logHistory(`Cycle 1 begins. Capital ${state.capital.toFixed(3)} ETH.`, 'info');
  scheduleTick();
  fullRender();
}

let liquidityTimer = 0;

function scheduleTick() {
  setInterval(realTick, TICK_INTERVAL_MS);
}

function realTick() {
  if (!state.running) return;
  if (state.speed === 0) {
    fullRender();
    return;
  }

  const now = performance.now();
  const dtReal = (now - lastTickWall) / 1000;
  lastTickWall = now;
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

  // Cycle end
  if (state.cycleElapsedSec >= CYCLE_DURATION_SEC) {
    endCycle();
    return;
  }

  fullRender();

  // Show last triggered event banner
  const newest = state.events[state.events.length - 1];
  if (newest && newest.startedAt > state._lastBannerAt) {
    state._lastBannerAt = newest.startedAt;
    showEventBanner(newest.label);
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

  // Mark-to-market: don't auto-liquidate, but report retained value
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
}

function pickKageLine(stats) {
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
  // Reset asset price history (per-cycle chart) but keep prices.
  for (const a of state.assets) {
    a.priceHistory = [{ t: 0, price: a.price }];
    a.tradeCount = 0;
    a.lastChange = 0;
  }
  hideCycleEnd();
  // Re-seed liquidity at cycle start.
  seedLiquidity();
  state.running = true;
  lastTickWall = performance.now();
  logHistory(`Cycle ${state.cycle} begins. Capital ${state.capital.toFixed(3)} ETH.`, 'info');
  fullRender();
}

// ---------------- INPUT BINDINGS ----------------

document.getElementById('start-btn').addEventListener('click', startGame);

document.getElementById('next-cycle-btn').addEventListener('click', nextCycle);

document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.speed = Number(btn.dataset.speed);
    renderHUD();
  });
});

document.getElementById('market-list').addEventListener('click', (e) => {
  const row = e.target.closest('.market-row');
  if (!row) return;
  state.selectedAssetId = row.dataset.id;
  fullRender();
});

document.getElementById('holdings').addEventListener('click', (e) => {
  const row = e.target.closest('.holding-row');
  if (!row) return;
  state.selectedAssetId = row.dataset.id;
  state.selectedHoldingId = row.dataset.id;
  fullRender();
});

document.getElementById('buy-btn').addEventListener('click', () => {
  if (!state.selectedAssetId) return;
  const result = playerBuy(state.selectedAssetId, 1);
  if (result && result.ok === false) {
    logHistory(`BUY FAILED: ${result.reason}`, 'info');
  }
  fullRender();
});

document.getElementById('sell-btn').addEventListener('click', () => {
  if (!state.selectedAssetId) return;
  const result = playerSell(state.selectedAssetId, 1);
  if (result && result.ok === false) {
    logHistory(`SELL FAILED: ${result.reason}`, 'info');
  }
  fullRender();
});

document.getElementById('inspect-btn').addEventListener('click', () => {
  const a = findAsset(state.selectedAssetId);
  if (!a) return;
  const trait = a.traits;
  logHistory(`INSPECT ${a.id}: ${trait.hair}/${trait.outfit}/${trait.accessory}/${trait.background}/${trait.aura}`, 'info');
  renderHistory();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space') { e.preventDefault(); document.getElementById('buy-btn').click(); }
  if (e.code === 'KeyS') document.getElementById('sell-btn').click();
  if (e.code === 'KeyI') document.getElementById('inspect-btn').click();
  if (e.code === 'Digit1') { state.speed = 1; renderHUD(); }
  if (e.code === 'Digit2') { state.speed = 5; renderHUD(); }
  if (e.code === 'Digit3') { state.speed = 20; renderHUD(); }
  if (e.code === 'Digit0') { state.speed = 0; renderHUD(); }
  if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
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
