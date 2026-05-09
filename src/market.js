import { state, logHistory, addHolding, removeHolding, findAsset, queueDialogue, holdSecondsOf, holdCyclesOf } from './state.js';
import { round } from './data.js';
import { applyInhumanity, deltaForSell } from './inhumanity.js';
import { pickDialogue } from './personas.js';

// Place an order. Tries to match immediately against the book.
// Returns { matched: qty, remaining: qty }.
export function placeOrder(asset, side, price, qty, by) {
  let matched = 0;
  let remaining = qty;

  if (side === 'buy') {
    // Match against asks (sellers).
    asset.sellOrders.sort((a, b) => a.price - b.price);
    while (remaining > 0 && asset.sellOrders.length > 0 && asset.sellOrders[0].price <= price) {
      const ask = asset.sellOrders[0];
      const take = Math.min(remaining, ask.qty);
      executeTrade(asset, ask.price, take, by, ask.by);
      ask.qty -= take;
      remaining -= take;
      matched += take;
      if (ask.qty <= 0) asset.sellOrders.shift();
    }
    if (remaining > 0) asset.buyOrders.push({ price, qty: remaining, by });
  } else {
    asset.buyOrders.sort((a, b) => b.price - a.price);
    while (remaining > 0 && asset.buyOrders.length > 0 && asset.buyOrders[0].price >= price) {
      const bid = asset.buyOrders[0];
      const take = Math.min(remaining, bid.qty);
      executeTrade(asset, bid.price, take, bid.by, by);
      bid.qty -= take;
      remaining -= take;
      matched += take;
      if (bid.qty <= 0) asset.buyOrders.shift();
    }
    if (remaining > 0) asset.sellOrders.push({ price, qty: remaining, by });
  }

  return { matched, remaining };
}

function executeTrade(asset, price, qty, buyer, seller) {
  const prev = asset.price;
  asset.price = round(price, 4);
  asset.lastChange = (asset.price - prev) / prev;
  asset.tradeCount += qty;

  const isPlayer = buyer === 'player' || seller === 'player';
  if (isPlayer) {
    asset.timesTradedByPlayer += 1;
    if (buyer === 'player') {
      const cost = price * qty;
      state.capital = round(state.capital - cost, 4);
      addHolding(asset.id, qty, price);
      state.cycleStats.bought += qty;
      state.cycleStats.trades += 1;
      logHistory(`PLAYER bought ${asset.id} x${qty} @ ${price.toFixed(3)}`, 'player-buy');
      // Greet line based on persona dialogue & inhumanity
      const persona = asset.persona;
      if (persona) {
        const line = pickDialogue(persona, state.inhumanity);
        queueDialogue(asset.id, line, 'greet');
        asset.lastSeenInDialogue = state.cycleElapsedSec;
      }
    } else {
      const proceed = price * qty;
      const holding = state.holdings.get(asset.id);
      const cost = holding ? holding.avgPrice * qty : 0;
      const realized = proceed - cost;
      state.capital = round(state.capital + proceed, 4);

      // Inhumanity penalty for sale
      const holdSec = holdSecondsOf(asset.id);
      const holdCyc = holdCyclesOf(asset.id);
      const recentChange = (asset.price - (holding ? holding.avgPrice : asset.price)) / Math.max(0.001, holding ? holding.avgPrice : asset.price);
      const dI = deltaForSell({ asset, holdQty: qty, holdCycles: holdCyc, holdSeconds: holdSec, recentChange });
      applyInhumanity(dI, `sell ${asset.id}`);

      removeHolding(asset.id, qty);
      state.cycleStats.sold += qty;
      state.cycleStats.trades += 1;
      state.cycleStats.realizedPnL = round(state.cycleStats.realizedPnL + realized, 4);
      logHistory(`PLAYER sold ${asset.id} x${qty} @ ${price.toFixed(3)} (${realized >= 0 ? '+' : ''}${realized.toFixed(3)})`, 'player-sell');
      // Goodbye line
      const persona = asset.persona;
      if (persona && persona.onSell) {
        const line = holdSec < 60 ? persona.onSell.short
                  : holdCyc >= 5 ? persona.onSell.long
                  : pickDialogue(persona, state.inhumanity);
        queueDialogue(asset.id, line, 'farewell');
      }
    }
  } else {
    logHistory(`${buyer} bought ${asset.id} from ${seller} @ ${price.toFixed(3)}`, 'npc');
  }
}

// Snapshot order book in compact form for UI rendering.
export function getBook(asset, depth = 5) {
  const asks = [...asset.sellOrders].sort((a, b) => a.price - b.price).slice(0, depth);
  const bids = [...asset.buyOrders].sort((a, b) => b.price - a.price).slice(0, depth);
  return { asks, bids };
}

// Best bid / ask helpers.
export function bestBid(asset) {
  if (!asset.buyOrders.length) return null;
  return Math.max(...asset.buyOrders.map(o => o.price));
}

export function bestAsk(asset) {
  if (!asset.sellOrders.length) return null;
  return Math.min(...asset.sellOrders.map(o => o.price));
}

// Recalculate price based on supply/demand pressure + drift.
// trendBoost / eventShock are per-game-second rates.
export function driftPrice(asset, dtSec, trendBoost = 0, eventShock = 0) {
  const buyDepth = asset.buyOrders.reduce((s, o) => s + o.qty, 0);
  const sellDepth = asset.sellOrders.reduce((s, o) => s + o.qty, 0);
  const total = buyDepth + sellDepth;

  let pressure = 0;
  if (total > 0) pressure = (buyDepth - sellDepth) / total;

  // Per-game-second rates. Conservative so 30-min cycle stays bounded.
  const driftPerSec = pressure * asset.volatility * 0.0015;
  const noisePerSec = (Math.random() - 0.5) * asset.volatility * 0.02;
  const rate = driftPerSec + trendBoost + eventShock + noisePerSec;

  // Apply for dtSec, with per-tick cap.
  const change = Math.max(-0.03, Math.min(0.03, rate * dtSec));
  const newPrice = Math.max(0.01, asset.price * (1 + change));
  asset.lastChange = (newPrice - asset.price) / asset.price;
  asset.price = round(newPrice, 4);

  if (asset.priceHistory.length === 0 ||
      state.cycleElapsedSec - asset.priceHistory[asset.priceHistory.length - 1].t >= 5) {
    asset.priceHistory.push({ t: state.cycleElapsedSec, price: asset.price });
    if (asset.priceHistory.length > 360) asset.priceHistory.shift();
  }
}

// Place market-maker quotes on both sides of every asset to seed liquidity.
// Called at cycle start, and periodically refreshed.
export function seedLiquidity() {
  for (const asset of state.assets) {
    refreshLiquidityFor(asset);
  }
}

export function refreshLiquidityFor(asset) {
  // Maintain ≥ 2 quotes per side from MARKET maker.
  const mmAsks = asset.sellOrders.filter(o => o.by === 'MARKET').length;
  const mmBids = asset.buyOrders.filter(o => o.by === 'MARKET').length;
  for (let i = mmAsks; i < 3; i++) {
    asset.sellOrders.push({
      price: round(asset.price * (1 + 0.01 + i * 0.01), 4),
      qty: 1 + Math.floor(Math.random() * 2),
      by: 'MARKET',
    });
  }
  for (let i = mmBids; i < 3; i++) {
    asset.buyOrders.push({
      price: round(asset.price * (1 - 0.01 - i * 0.01), 4),
      qty: 1 + Math.floor(Math.random() * 2),
      by: 'MARKET',
    });
  }
}

// Clean up stale orders periodically.
export function reapStaleOrders(asset, maxOrdersPerSide = 12) {
  if (asset.buyOrders.length > maxOrdersPerSide) {
    asset.buyOrders.sort((a, b) => b.price - a.price);
    asset.buyOrders = asset.buyOrders.slice(0, maxOrdersPerSide);
  }
  if (asset.sellOrders.length > maxOrdersPerSide) {
    asset.sellOrders.sort((a, b) => a.price - b.price);
    asset.sellOrders = asset.sellOrders.slice(0, maxOrdersPerSide);
  }
}

// Player buy at best ask (market order).
export function playerBuy(assetId, qty = 1) {
  const asset = findAsset(assetId);
  if (!asset) return { ok: false, reason: 'not_found' };
  const ask = bestAsk(asset);
  const price = ask !== null ? ask : asset.price * 1.01;
  const cost = price * qty;
  if (state.capital < cost) return { ok: false, reason: 'insufficient_capital' };
  // Use a price slightly above best ask to ensure match if there are sellers,
  // else placement near current price.
  const orderPrice = ask !== null ? ask : asset.price * 1.02;
  return placeOrder(asset, 'buy', orderPrice, qty, 'player');
}

// Player sell at best bid.
export function playerSell(assetId, qty = 1) {
  const asset = findAsset(assetId);
  if (!asset) return { ok: false, reason: 'not_found' };
  const holding = state.holdings.get(assetId);
  if (!holding || holding.qty < qty) return { ok: false, reason: 'no_holding' };
  const bid = bestBid(asset);
  const orderPrice = bid !== null ? bid : asset.price * 0.98;
  return placeOrder(asset, 'sell', orderPrice, qty, 'player');
}
