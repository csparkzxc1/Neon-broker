import { state, findAsset, popDialogue } from './state.js';
import { getBook } from './market.js';
import { colorFor, bandOf } from './inhumanity.js';
import { canPlayerTrade } from './actions.js';

const $ = (sel) => document.querySelector(sel);

export function renderHUD() {
  $('#cycle-num').textContent = state.cycle;
  $('#capital').textContent = state.capital.toFixed(3);

  const remaining = Math.max(0, 30 * 60 - state.cycleElapsedSec);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(Math.floor(remaining % 60)).padStart(2, '0');
  const timer = $('#timer');
  timer.textContent = `${mm}:${ss}`;
  timer.classList.toggle('urgent', remaining < 60);

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.speed) === state.speed);
  });

  // Inhumanity gauge
  const v = Math.round(state.inhumanity);
  $('#inh-num').textContent = v;
  const fill = $('#inh-fill');
  fill.style.width = `${v}%`;
  fill.style.background = colorFor(v);
}

export function renderMarketList() {
  const list = $('#market-list');
  const sorted = state.assets.slice().sort((a, b) => {
    const order = { L: 0, SR: 1, R: 2, U: 3, C: 4 };
    if (order[a.rarity] !== order[b.rarity]) return order[a.rarity] - order[b.rarity];
    return b.price - a.price;
  });

  let html = '';
  for (const a of sorted) {
    const isSel = a.id === state.selectedAssetId;
    const ch = a.lastChange;
    const arrow = ch > 0.001 ? '↗' : ch < -0.001 ? '↘' : '→';
    const cls = ch > 0.001 ? 'up' : ch < -0.001 ? 'down' : 'flat';
    const locked = !canPlayerTrade(a);
    html += `
      <div class="market-row ${isSel ? 'selected' : ''} ${locked ? 'locked' : ''}" data-id="${a.id}">
        <span class="id">${a.id}</span>
        <span class="rarity ${a.rarity}">${a.rarity}</span>
        <span class="price">${a.price.toFixed(3)}</span>
        <span class="delta ${cls}">${arrow} ${(ch * 100).toFixed(1)}%</span>
      </div>`;
  }
  list.innerHTML = html;
  $('#market-count').textContent = state.assets.length;
}

export function renderChart() {
  const a = findAsset(state.selectedAssetId);
  const titleEl = $('#chart-title');
  const priceEl = $('#chart-price');
  const cardName = $('#pcard-name');
  const cardMeta = $('#pcard-meta');
  const cardSummary = $('#pcard-summary');
  const cardTraits = $('#pcard-traits');
  if (!a) {
    titleEl.textContent = 'DEPTH CHART — select asset';
    priceEl.textContent = '';
    $('#chart').innerHTML = '';
    cardName.textContent = '—';
    cardMeta.textContent = '';
    cardSummary.textContent = '';
    cardTraits.textContent = '';
    return;
  }
  titleEl.innerHTML = `DEPTH CHART — ${a.id}  <span class="rarity ${a.rarity}" style="margin-left:8px">${a.rarity}</span>`;
  const ch = a.lastChange;
  const sign = ch > 0 ? '+' : '';
  priceEl.textContent = `${a.price.toFixed(3)} ETH  ${sign}${(ch * 100).toFixed(2)}%`;
  priceEl.className = ch > 0.001 ? 'up' : ch < -0.001 ? 'down' : '';

  // Persona card
  const p = a.persona;
  cardName.textContent = p.id;
  cardMeta.textContent = `${a.rarity} · EGO ${p.ego} · ${a.timesTradedByPlayer}x traded by you`;
  cardSummary.textContent = p.summary;
  const t = a.traits;
  cardTraits.innerHTML = `H: ${t.hair}<br>O: ${t.outfit}<br>A: ${t.accessory}<br>BG: ${t.background}<br>AURA: ${t.aura}`;

  const svg = $('#chart');
  const W = 800, H = 320;
  const hist = a.priceHistory.slice();
  if (hist.length === 0) hist.push({ t: 0, price: a.price });
  hist.push({ t: state.cycleElapsedSec, price: a.price });

  const minP = Math.min(...hist.map(p => p.price)) * 0.95;
  const maxP = Math.max(...hist.map(p => p.price)) * 1.05;
  const range = Math.max(0.01, maxP - minP);
  const tStart = hist[0].t;
  const tEnd = Math.max(hist[hist.length - 1].t, tStart + 1);
  const tRange = tEnd - tStart;

  const x = (t) => ((t - tStart) / tRange) * W;
  const y = (p) => H - ((p - minP) / range) * H;

  const points = hist.map(h => `${x(h.t).toFixed(1)},${y(h.price).toFixed(1)}`).join(' ');
  const fillPoints = `0,${H} ${points} ${W},${H}`;

  let grid = '';
  for (let i = 1; i < 4; i++) {
    const yy = (H / 4) * i;
    grid += `<line class="grid-line" x1="0" x2="${W}" y1="${yy}" y2="${yy}" />`;
  }

  const yLabels = `
    <text x="6" y="14">${maxP.toFixed(3)}</text>
    <text x="6" y="${H - 6}">${minP.toFixed(3)}</text>
  `;

  svg.innerHTML = `
    ${grid}
    <polyline class="price-fill" points="${fillPoints}" />
    <polyline class="price-line" points="${points}" />
    ${yLabels}
  `;
}

export function renderOrderBook() {
  const a = findAsset(state.selectedAssetId);
  const root = $('#orderbook');
  if (!a) { root.innerHTML = ''; return; }
  const { asks, bids } = getBook(a, 6);

  let asksHtml = `<div class="book-side asks">`;
  asks.slice().reverse().forEach(o => {
    asksHtml += `<div class="book-row"><span>ASK</span><span>${o.price.toFixed(3)}</span><span class="who">${o.by}</span></div>`;
  });
  asksHtml += `</div>`;

  const lastHtml = `<div class="book-side last">
    <span class="label">LAST</span>
    <span class="px">${a.price.toFixed(3)}</span>
  </div>`;

  let bidsHtml = `<div class="book-side bids">`;
  bids.forEach(o => {
    bidsHtml += `<div class="book-row"><span>BID</span><span>${o.price.toFixed(3)}</span><span class="who">${o.by}</span></div>`;
  });
  bidsHtml += `</div>`;

  root.innerHTML = asksHtml + lastHtml + bidsHtml;
}

export function renderHoldings() {
  const root = $('#holdings');
  if (state.holdings.size === 0) {
    root.innerHTML = `<div id="holdings-empty">NO HOLDINGS — buy something.</div>`;
    $('#holdings-count').textContent = '0';
    return;
  }
  let html = '';
  for (const [aid, h] of state.holdings) {
    const a = findAsset(aid);
    if (!a) continue;
    const value = a.price * h.qty;
    const cost = h.avgPrice * h.qty;
    const pnl = value - cost;
    const cls = pnl > 0.0001 ? 'up' : pnl < -0.0001 ? 'down' : '';
    const sign = pnl > 0 ? '+' : '';
    const isSel = aid === state.selectedAssetId;
    html += `
      <div class="holding-row ${isSel ? 'selected' : ''}" data-id="${aid}">
        <span class="id">${aid}</span>
        <span class="rarity ${a.rarity}">${a.rarity}</span>
        <span class="qty">x${h.qty} @ ${h.avgPrice.toFixed(3)}</span>
        <span class="now">${a.price.toFixed(3)}</span>
        <span class="pnl ${cls}">${sign}${pnl.toFixed(3)}</span>
      </div>`;
  }
  root.innerHTML = html;
  $('#holdings-count').textContent = state.holdings.size;
}

export function renderHistory() {
  const root = $('#history');
  let html = '';
  for (const h of state.history.slice(0, 30)) {
    const t = formatT(h.t);
    let cls = '';
    if (h.type === 'player-buy') cls = 'player buy';
    else if (h.type === 'player-sell') cls = 'player sell';
    else if (h.type === 'event') cls = 'event';
    else if (h.type === 'action') cls = 'action';
    html += `<div class="history-entry"><span class="${cls}">[${t}] ${escapeHtml(h.text)}</span></div>`;
  }
  root.innerHTML = html;
}

function formatT(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export function renderActions() {
  const a = findAsset(state.selectedAssetId);
  const buy = $('#buy-btn');
  const sell = $('#sell-btn');
  const mission = $('#mission-btn');
  const rumor = $('#rumor-btn');
  const collab = $('#collab-btn');
  const release = $('#release-btn');

  if (!a) {
    buy.disabled = sell.disabled = mission.disabled = rumor.disabled = collab.disabled = release.disabled = true;
    buy.textContent = 'BUY';
    sell.textContent = 'SELL';
    return;
  }
  const owned = state.holdings.get(a.id);
  const tradable = canPlayerTrade(a);

  buy.disabled = !tradable || state.capital < a.price;
  buy.textContent = `BUY ${a.price.toFixed(3)}`;
  sell.disabled = !owned || owned.qty <= 0;
  sell.textContent = owned ? `SELL ${a.price.toFixed(3)}` : 'SELL';

  mission.disabled = !owned;
  rumor.disabled = !owned;
  collab.disabled = !owned || state.holdings.size < 2;
  release.disabled = !owned;
}

// ============ DIALOGUE BUBBLES ============
export function pumpDialogue() {
  const stack = $('#dialogue-stack');
  while (true) {
    const item = popDialogue();
    if (!item) break;
    const div = document.createElement('div');
    div.className = `dialogue-bubble kind-${item.kind || 'persona'}`;
    div.innerHTML = `<span class="speaker">${escapeHtml(item.speaker)}</span><span class="line">${escapeHtml(item.line)}</span>`;
    stack.appendChild(div);
    setTimeout(() => div.remove(), 6500);
    while (stack.children.length > 4) stack.removeChild(stack.firstChild);
  }
}

// ============ BANNERS / MODAL ============
export function showEventBanner(text) {
  const b = $('#event-banner');
  b.textContent = text;
  b.classList.remove('hidden');
  b.style.animation = 'none';
  void b.offsetWidth;
  b.style.animation = '';
  setTimeout(() => b.classList.add('hidden'), 4000);
}

export function showCycleEnd(stats, kageLine) {
  const overlay = $('#cycle-end-overlay');
  const statsEl = $('#cycle-end-stats');
  const kage = $('#kage-line');
  const next = $('#next-cycle-btn');
  next.textContent = `START CYCLE ${state.cycle + 1}`;

  const sign = stats.netProfit >= 0 ? '+' : '';
  statsEl.innerHTML = `
    <div class="stat-row"><span class="label">STARTING CAPITAL</span><span>${stats.startCapital.toFixed(3)} ETH</span></div>
    <div class="stat-row"><span class="label">ENDING CAPITAL</span><span>${stats.endCapital.toFixed(3)} ETH</span></div>
    <div class="stat-row"><span class="label">NET P&L</span><span style="color:${stats.netProfit>=0?'var(--success)':'var(--danger)'}">${sign}${stats.netProfit.toFixed(3)} ETH</span></div>
    <div class="stat-row"><span class="label">TRADES</span><span>${stats.trades}</span></div>
    <div class="stat-row"><span class="label">PERSONAS BOUGHT</span><span>${stats.bought}</span></div>
    <div class="stat-row"><span class="label">PERSONAS SOLD</span><span>${stats.sold}</span></div>
    <div class="stat-row"><span class="label">RETAINED</span><span>${stats.retained}</span></div>
    <div class="stat-row"><span class="label">INHUMANITY</span><span>${Math.round(state.inhumanity)} / 100  (${bandOf(state.inhumanity)})</span></div>
  `;
  kage.textContent = kageLine;
  overlay.classList.remove('hidden');
}

export function hideCycleEnd() { $('#cycle-end-overlay').classList.add('hidden'); }
export function hideBoot() { $('#boot-overlay').classList.add('hidden'); }
