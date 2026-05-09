// Player actions on owned personas: Mission, Rumor, Collab, Release.
// Inhumanity penalties applied per inhumanity.js formulas.

import { state, findAsset, logHistory, queueDialogue, holdCyclesOf, removeHolding } from './state.js';
import { round } from './data.js';
import {
  applyInhumanity, deltaForForceMission, deltaForRumor, deltaForCollab,
  deltaForRelease, canForceMission, canTradeNew
} from './inhumanity.js';
import { pickDialogue } from './personas.js';

// MISSION — time-delayed price boost.
// Risk: if persona ego ≥ 50 and inhumanity ≥ 30, requires force.
export function startMission(assetId) {
  const asset = findAsset(assetId);
  if (!asset) return { ok: false, reason: 'not_found' };
  if (!state.holdings.has(assetId)) return { ok: false, reason: 'not_owned' };

  const persona = asset.persona;
  const ego = persona.ego;
  const passives = persona.passives || [];

  // Check if persona refuses
  const refuses = ego >= 50 && state.inhumanity >= 25;
  if (refuses && !canForceMission(asset)) {
    queueDialogue(persona.id, '...거부할게요.', 'refusal');
    return { ok: false, reason: 'refused' };
  }

  // Force? Apply inhumanity penalty.
  if (refuses) {
    const d = deltaForForceMission(asset);
    applyInhumanity(d, `force_mission ${persona.id}`);
    queueDialogue(persona.id, '...억지로 시키시는군요.', 'reluctant');
  } else {
    queueDialogue(persona.id, pickDialogue(persona, state.inhumanity), 'mission_accept');
  }

  // Determine success rate + payoff
  let successRate = 0.7;
  let payoutMultiplier = 1.0;
  if (passives.includes('mission_+40')) successRate += 0.20;
  if (passives.includes('mission_+25')) successRate += 0.15;
  if (passives.includes('mission_+20')) successRate += 0.12;
  if (passives.includes('mission_+10')) successRate += 0.08;
  if (passives.includes('mission_high_risk')) {
    successRate -= 0.20;
    payoutMultiplier = 1.30;
  }
  successRate = Math.min(0.99, Math.max(0.20, successRate));

  // Schedule completion in 60..120 game seconds.
  const completesAt = state.cycleElapsedSec + 60 + Math.random() * 60;
  state.pendingMissions.push({
    assetId,
    completesAt,
    successRate,
    payoutMultiplier,
    forced: refuses,
  });
  logHistory(`MISSION dispatched: ${assetId} (success ${Math.round(successRate*100)}%)`, 'action');
  return { ok: true };
}

// Resolve missions whose time has come.
export function resolveMissions() {
  const remaining = [];
  for (const m of state.pendingMissions) {
    if (state.cycleElapsedSec < m.completesAt) {
      remaining.push(m);
      continue;
    }
    const asset = findAsset(m.assetId);
    if (!asset) continue;
    const success = Math.random() < m.successRate;
    if (success) {
      // Bump price by 5..12% × payoutMultiplier.
      const bump = (0.05 + Math.random() * 0.07) * m.payoutMultiplier;
      asset.price = round(asset.price * (1 + bump), 4);
      asset.lastChange = bump;
      logHistory(`MISSION SUCCESS: ${m.assetId} +${(bump * 100).toFixed(1)}%`, 'action');
      queueDialogue(m.assetId, '끝냈어요.', 'mission_done');
    } else {
      const drop = 0.03 + Math.random() * 0.04;
      asset.price = round(asset.price * (1 - drop), 4);
      asset.lastChange = -drop;
      logHistory(`MISSION FAILED: ${m.assetId} -${(drop * 100).toFixed(1)}%`, 'action');
      queueDialogue(m.assetId, '...실패했어요.', 'mission_fail');
    }
  }
  state.pendingMissions = remaining;
}

// RUMOR — instant price boost, detection chance.
export function spreadRumor(assetId) {
  const asset = findAsset(assetId);
  if (!asset) return { ok: false, reason: 'not_found' };
  if (!state.holdings.has(assetId)) return { ok: false, reason: 'not_owned' };

  const persona = asset.persona;
  const passives = persona.passives || [];

  if (passives.includes('rumor_refuse')) {
    queueDialogue(persona.id, '...루머는 안 할게요.', 'refusal');
    applyInhumanity(5, `rumor_refused ${persona.id}`);
    return { ok: false, reason: 'persona_refused' };
  }

  let efficacy = 1.0;
  let detectionRate = 0.30;
  if (passives.includes('rumor_+30')) efficacy = 1.30;
  if (passives.includes('rumor_+50')) efficacy = 1.50;
  if (passives.includes('rumor_stealth')) detectionRate = 0.10;

  const detected = Math.random() < detectionRate;
  if (detected) {
    const drop = 0.10 + Math.random() * 0.10;
    asset.price = round(asset.price * (1 - drop), 4);
    asset.lastChange = -drop;
    applyInhumanity(deltaForRumor({ detected: true }), `rumor_detected ${persona.id}`);
    logHistory(`RUMOR DETECTED: ${assetId} -${(drop * 100).toFixed(1)}%`, 'action');
    queueDialogue(persona.id, '들켰어요...', 'rumor_caught');
    return { ok: true, detected: true };
  } else {
    const bump = (0.06 + Math.random() * 0.08) * efficacy;
    asset.price = round(asset.price * (1 + bump), 4);
    asset.lastChange = bump;
    applyInhumanity(deltaForRumor({ detected: false }), `rumor_success ${persona.id}`);
    logHistory(`RUMOR: ${assetId} +${(bump * 100).toFixed(1)}%`, 'action');
    return { ok: true, detected: false };
  }
}

// COLLAB — combine two owned personas to morph one trait.
// Simplified MVP: pick random other holding, swap one trait at random.
export function collab(assetId) {
  const asset = findAsset(assetId);
  if (!asset) return { ok: false, reason: 'not_found' };
  if (!state.holdings.has(assetId)) return { ok: false, reason: 'not_owned' };

  const others = [...state.holdings.keys()].filter(id => id !== assetId);
  if (others.length === 0) {
    return { ok: false, reason: 'need_two_holdings' };
  }
  const partnerId = others[Math.floor(Math.random() * others.length)];
  const partner = findAsset(partnerId);
  if (!partner) return { ok: false, reason: 'partner_missing' };

  // Force determination: either persona has ego ≥ 70 → forced
  const forced = asset.persona.ego >= 70 || partner.persona.ego >= 70;
  applyInhumanity(deltaForCollab({ forced }), `collab ${assetId} x ${partnerId}`);

  // Swap a random trait
  const cats = Object.keys(asset.traits);
  const cat = cats[Math.floor(Math.random() * cats.length)];
  const oldTrait = asset.traits[cat];
  asset.traits = { ...asset.traits, [cat]: partner.traits[cat] };
  // Bump price slightly
  const bump = 0.02 + Math.random() * 0.04;
  asset.price = round(asset.price * (1 + bump), 4);
  asset.lastChange = bump;

  logHistory(`COLLAB: ${assetId} ${cat}: ${oldTrait} → ${partner.traits[cat]} (+${(bump*100).toFixed(1)}%)`, 'action');
  queueDialogue(assetId, forced ? '...섞이는 게 싫어요.' : '재미있네요.', 'collab');
  return { ok: true, partnerId, cat, newTrait: partner.traits[cat] };
}

// RELEASE — voluntary liberation. Capital recovery 0, inhumanity drops.
export function release(assetId) {
  const asset = findAsset(assetId);
  if (!asset) return { ok: false, reason: 'not_found' };
  const holding = state.holdings.get(assetId);
  if (!holding) return { ok: false, reason: 'not_owned' };

  const cycles = holdCyclesOf(assetId);
  const delta = deltaForRelease(asset, cycles);
  applyInhumanity(delta, `release ${assetId}`);
  removeHolding(assetId, holding.qty);
  logHistory(`RELEASED: ${assetId} (Inhumanity ${delta})`, 'action');
  queueDialogue(assetId, asset.persona.onSell.release || '...고마워요.', 'release');

  // Story arc A trigger: NULL-07 released after 5+ cycles & inhumanity < 30
  if (assetId === 'NULL-07' && cycles >= 3 && state.inhumanity < 30) {
    state.storyFlags.add('arc_a_release');
  }
  return { ok: true, delta };
}

// Trade-block check: refuse player buy/sell on certain personas at high inhumanity.
export function canPlayerTrade(asset) {
  return canTradeNew(asset);
}
