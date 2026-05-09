import { state } from './state.js';
import { placeOrder, bestAsk, bestBid } from './market.js';

// Each NPC has capital, a portfolio, an interval, and a tick function.
// Behaviors implemented per the market-simulation.md spec.

function makeNPC(id, capital, intervalSec, behavior) {
  return {
    id, capital,
    intervalSec,
    nextTickAt: Math.random() * intervalSec,  // stagger initial fire
    portfolio: new Map(),
    behavior,
    pinnedTrait: null,
    pinnedAsset: null,
  };
}

function ownedQty(npc, asset) {
  return npc.portfolio.get(asset.id) || 0;
}

function adjustOwn(npc, asset, delta, price) {
  const cur = npc.portfolio.get(asset.id) || 0;
  const newQty = cur + delta;
  if (newQty <= 0) npc.portfolio.delete(asset.id);
  else npc.portfolio.set(asset.id, newQty);
  npc.capital -= delta * price;
}

// Wrapper: NPC places an order and we update its capital based on matched fills.
function npcOrder(npc, asset, side, price, qty) {
  const beforeCash = npc.capital;
  const beforeQty = ownedQty(npc, asset);
  // We don't run a parallel ledger; instead, track fills via assert on price ladder.
  // Simpler approximation: assume the immediate match price ~ the order price.
  const result = placeOrder(asset, side, price, qty, npc.id);
  // Adjust NPC ledger by matched amount only.
  if (result.matched > 0) {
    if (side === 'buy') {
      npc.capital -= price * result.matched;
      npc.portfolio.set(asset.id, beforeQty + result.matched);
    } else {
      npc.capital += price * result.matched;
      const next = beforeQty - result.matched;
      if (next <= 0) npc.portfolio.delete(asset.id);
      else npc.portfolio.set(asset.id, next);
    }
  }
  return result;
}

function recentChangePct(asset, sinceSec = 60) {
  const hist = asset.priceHistory;
  if (hist.length < 2) return 0;
  const cutoff = state.cycleElapsedSec - sinceSec;
  let oldest = hist[0];
  for (const p of hist) {
    if (p.t >= cutoff) { oldest = p; break; }
  }
  if (oldest.price <= 0) return 0;
  return (asset.price - oldest.price) / oldest.price;
}

// ---------- BEHAVIORS ----------

// 1. KAGE — long-horizon macro
function kageBehavior(npc) {
  const progress = state.cycleProgress;
  if (progress < 0.3) {
    // Buy SR/L if affordable
    const targets = state.assets.filter(a => (a.rarity === 'SR' || a.rarity === 'L'));
    targets.sort((a, b) => a.price - b.price);
    for (const t of targets.slice(0, 3)) {
      if (npc.capital > t.price * 2) {
        npcOrder(npc, t, 'buy', t.price * 1.05, 1);
      }
    }
  } else if (progress > 0.7) {
    // Sell legendary holdings if profit > 30%
    for (const [aid] of npc.portfolio) {
      const a = state.assets.find(x => x.id === aid);
      if (!a) continue;
      if (recentChangePct(a, 600) > 0.3 && a.rarity === 'L') {
        npcOrder(npc, a, 'sell', a.price * 0.95, 1);
      }
    }
  }
}

// 2. RIZE-X — momentum bot
function rizeBehavior(npc) {
  for (const a of state.assets) {
    const ch = recentChangePct(a, 300);
    if (ch > 0.10 && npc.capital > a.price * 1.05) {
      npcOrder(npc, a, 'buy', a.price * 1.02, 1);
    }
    if (ch > 0.25 && ownedQty(npc, a) > 0) {
      npcOrder(npc, a, 'sell', a.price * 0.98, 1);
    }
  }
}

// 3. NIGHTOWL — counter-trend hunter
function nightowlBehavior(npc) {
  for (const a of state.assets) {
    const ch = recentChangePct(a, 300);
    if (ch < -0.30 && npc.capital > a.price) {
      npcOrder(npc, a, 'buy', a.price * 1.0, 1);
    }
    const owned = ownedQty(npc, a);
    if (owned > 0 && ch > 0.40) {
      npcOrder(npc, a, 'sell', a.price * 0.97, 1);
    }
  }
}

// 4. MAMA-SHIN — trait collector, never sells
function mamaShinBehavior(npc) {
  if (!npc.pinnedTrait) {
    // Pin a random trait at first tick of cycle
    const cats = ['hair', 'outfit', 'accessory', 'background', 'aura'];
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const sample = state.assets[Math.floor(Math.random() * state.assets.length)];
    npc.pinnedTrait = { cat, value: sample.traits[cat] };
  }
  const { cat, value } = npc.pinnedTrait;
  for (const a of state.assets) {
    if (a.traits[cat] === value && ownedQty(npc, a) === 0 && npc.capital > a.price) {
      npcOrder(npc, a, 'buy', a.price * 1.10, 1);
    }
  }
}

// 5. JUNK_BOI — FOMO retail
function junkBehavior(npc) {
  // Pick the hottest by recent volume / change
  let hottest = null;
  let hotMetric = 0;
  for (const a of state.assets) {
    const ch = recentChangePct(a, 120);
    if (ch > hotMetric) { hotMetric = ch; hottest = a; }
  }
  if (!hottest) return;
  if (hotMetric > 0.15 && npc.capital > hottest.price * 1.05) {
    npcOrder(npc, hottest, 'buy', hottest.price * 1.05, 1);
  }
  // Stop-loss
  for (const [aid] of npc.portfolio) {
    const a = state.assets.find(x => x.id === aid);
    if (!a) continue;
    const ch = recentChangePct(a, 60);
    if (ch < -0.05) {
      npcOrder(npc, a, 'sell', a.price * 0.98, 1);
    }
  }
}

// 6. ORACLE-3 — leaks information (simplified: trades on volatility outliers)
function oracleBehavior(npc) {
  // In the absence of telegraphed events, trade on the asset with biggest pending move.
  const scored = state.assets.map(a => ({
    a,
    score: Math.abs(a.lastChange) * (a.tradeCount + 1),
  })).sort((x, y) => y.score - x.score);
  const target = scored[0].a;
  if (target.lastChange > 0 && npc.capital > target.price) {
    npcOrder(npc, target, 'buy', target.price * 1.02, 1);
  } else if (ownedQty(npc, target) > 0) {
    npcOrder(npc, target, 'sell', target.price * 0.98, 1);
  }
}

// 7. WHALE_77 — large block, infrequent
function whaleBehavior(npc) {
  const action = Math.random() < 0.5 ? 'buy' : 'sell';
  const targets = state.assets.slice().sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3));
  for (const t of targets) {
    const qty = 3 + Math.floor(Math.random() * 5);
    if (action === 'buy' && npc.capital > t.price * qty) {
      npcOrder(npc, t, 'buy', t.price * 1.05, qty);
    } else if (action === 'sell' && ownedQty(npc, t) > 0) {
      npcOrder(npc, t, 'sell', t.price * 0.95, Math.min(qty, ownedQty(npc, t)));
    }
  }
}

// 8. KIRA-12 — collects rare assets, rarely sells
function kiraBehavior(npc) {
  for (const a of state.assets) {
    if ((a.rarity === 'SR' || a.rarity === 'L') &&
        ownedQty(npc, a) === 0 &&
        npc.capital > a.price) {
      npcOrder(npc, a, 'buy', a.price * 1.05, 1);
      return;
    }
  }
}

// 9. KOJI — gambler, big bet on a pinned asset per cycle
function kojiBehavior(npc) {
  if (!npc.pinnedAsset) {
    npc.pinnedAsset = state.assets[Math.floor(Math.random() * state.assets.length)].id;
    npc.kojiInvested = false;
  }
  const a = state.assets.find(x => x.id === npc.pinnedAsset);
  if (!a) return;
  if (!npc.kojiInvested) {
    const qty = Math.max(1, Math.floor((npc.capital * 0.8) / a.price));
    if (qty >= 1) {
      npcOrder(npc, a, 'buy', a.price * 1.15, qty);
      npc.kojiInvested = true;
    }
  } else {
    const owned = ownedQty(npc, a);
    if (owned > 0) {
      const ch = recentChangePct(a, 300);
      if (ch > 0.5 || ch < -0.5) {
        npcOrder(npc, a, 'sell', a.price * 0.97, owned);
        npc.pinnedAsset = null;
      }
    }
  }
}

// 10. SISTER — buys most-traded then releases below market
function sisterBehavior(npc) {
  const mostTraded = state.assets.slice().sort((a, b) => b.tradeCount - a.tradeCount)[0];
  if (mostTraded.tradeCount > 5 && npc.capital > mostTraded.price) {
    npcOrder(npc, mostTraded, 'buy', mostTraded.price * 0.95, 1);
    // Schedule release: sell next tick at 70% of market.
    setTimeout(() => {
      const owned = ownedQty(npc, mostTraded);
      if (owned > 0) npcOrder(npc, mostTraded, 'sell', mostTraded.price * 0.7, owned);
    }, 30000 / Math.max(1, state.speed));
  }
}

export function makeNPCs() {
  return [
    makeNPC('KAGE',     50, 60, kageBehavior),
    makeNPC('RIZE-X',   30, 30, rizeBehavior),
    makeNPC('NIGHTOWL', 18, 45, nightowlBehavior),
    makeNPC('MAMA-SHIN',40, 90, mamaShinBehavior),
    makeNPC('JUNK_BOI',  5, 20, junkBehavior),
    makeNPC('ORACLE-3', 22, 75, oracleBehavior),
    makeNPC('WHALE_77', 80, 600, whaleBehavior),
    makeNPC('KIRA-12',  15, 120, kiraBehavior),
    makeNPC('KOJI',     10, 60, kojiBehavior),
    makeNPC('SISTER',   25, 180, sisterBehavior),
  ];
}

export function tickNPCs(npcs, dtSec) {
  for (const npc of npcs) {
    npc.nextTickAt -= dtSec;
    if (npc.nextTickAt <= 0) {
      try { npc.behavior(npc); } catch (e) { console.warn('NPC error', npc.id, e); }
      // Stagger next tick with small jitter
      npc.nextTickAt = npc.intervalSec * (0.7 + Math.random() * 0.6);
    }
  }
}

export function resetNPCsForCycle(npcs) {
  for (const npc of npcs) {
    npc.pinnedTrait = null;
    npc.pinnedAsset = null;
    npc.kojiInvested = false;
  }
}
