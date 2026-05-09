import { state, logHistory } from './state.js';

function collectTraitValues() {
  const out = { hair: new Set(), outfit: new Set(), accessory: new Set(), background: new Set(), aura: new Set() };
  for (const a of state.assets) {
    for (const k of Object.keys(out)) {
      if (a.traits[k]) out[k].add(a.traits[k]);
    }
  }
  for (const k of Object.keys(out)) out[k] = [...out[k]];
  return out;
}

// 5 event types per market-simulation.md.
// We schedule rolls at ~5 / ~15 / ~25 minutes into the cycle (game time).

const EVENT_DEFS = [
  {
    id: 'trend',
    weight: 0.40,
    durationSec: 600,
    apply(ev) {
      const traitValues = collectTraitValues();
      const cats = Object.keys(traitValues).filter(k => traitValues[k].length > 0);
      const cat = cats[Math.floor(Math.random() * cats.length)];
      const pool = traitValues[cat];
      const value = pool[Math.floor(Math.random() * pool.length)];
      ev.cat = cat;
      ev.value = value;
      ev.intensity = 0.0015 + Math.random() * 0.0025;
      ev.label = `TREND ↑ ${cat.toUpperCase()}: ${String(value).toUpperCase().replace(/_/g, ' ')}`;
    },
    perTick(ev, asset) {
      if (asset.traits[ev.cat] === ev.value) return ev.intensity;
      return 0;
    },
  },
  {
    id: 'crackdown',
    weight: 0.15,
    durationSec: 180,
    apply(ev) {
      ev.label = `GOV CRACKDOWN — SR/L FROZEN`;
    },
    perTick(ev, asset) {
      if (asset.rarity === 'SR' || asset.rarity === 'L') return -0.001;
      return 0;
    },
  },
  {
    id: 'rival',
    weight: 0.20,
    durationSec: 480,
    apply(ev) {
      ev.label = `RIVAL BROKER ENTERED THE MARKET`;
    },
    perTick(ev, asset) {
      // Slight global upward pressure on common/uncommon.
      if (asset.rarity === 'C' || asset.rarity === 'U') return 0.0005;
      return 0;
    },
  },
  {
    id: 'strike',
    weight: 0.10,
    durationSec: 240,
    apply(ev) {
      ev.label = `PERSONA STRIKE — VOLATILITY SURGE`;
    },
    perTick(ev, asset) {
      // Higher noise. Caller will multiply volatility instead — handled below.
      return (Math.random() - 0.5) * asset.volatility * 0.02;
    },
  },
  {
    id: 'boom',
    weight: 0.15,
    durationSec: 360,
    apply(ev) {
      ev.label = `MARKET BOOM — VOLUME +30%`;
    },
    perTick(ev, asset) {
      return 0.0008;
    },
  },
];

function rollEvent() {
  const total = EVENT_DEFS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const def of EVENT_DEFS) {
    if (r < def.weight) return def;
    r -= def.weight;
  }
  return EVENT_DEFS[0];
}

export function maybeTriggerEvents() {
  // Trigger windows at progress 5/15/25 minutes (in game time).
  const gameMinutes = state.cycleElapsedSec / 60;
  const fired = state.firedEventsForCycle || (state.firedEventsForCycle = new Set());

  const windows = [5, 15, 25];
  for (const w of windows) {
    if (gameMinutes >= w && !fired.has(w)) {
      fired.add(w);
      if (Math.random() < 0.7) {
        const def = rollEvent();
        const ev = {
          id: def.id,
          startedAt: state.cycleElapsedSec,
          endsAt: state.cycleElapsedSec + def.durationSec,
          def,
        };
        def.apply(ev);
        state.events.push(ev);
        logHistory(`EVENT: ${ev.label}`, 'event');
        return ev;
      }
    }
  }
  return null;
}

export function expireEvents() {
  state.events = state.events.filter(ev => state.cycleElapsedSec < ev.endsAt);
}

export function eventBoostFor(asset) {
  let boost = 0;
  for (const ev of state.events) {
    boost += ev.def.perTick(ev, asset);
  }
  return boost;
}

export function resetEventsForCycle() {
  state.events = [];
  state.firedEventsForCycle = new Set();
}
