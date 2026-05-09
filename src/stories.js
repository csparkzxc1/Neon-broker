// Story arc triggers. MVP: Arc A (NULL series).

import { state, logHistory, queueDialogue, holdCyclesOf } from './state.js';

// Tick called periodically. Looks for trigger conditions.
export function checkArcTriggers() {
  // ARC A: NULL-07 held ≥ 3 cycles + inhumanity < 30 → Arc A starts.
  if (!state.storyFlags.has('arc_a_started')) {
    const h = state.holdings.get('NULL-07');
    if (h && holdCyclesOf('NULL-07') >= 3 && state.inhumanity < 30) {
      state.storyFlags.add('arc_a_started');
      queueDialogue('NULL-07', '저, 다른 시리즈의 데이터에 접근할 수 있어요.', 'arc_a_1');
      setTimeout(() => queueDialogue('NULL-07', '보고 싶으신가요?', 'arc_a_2'), 1500);
      logHistory('STORY: NULL-07 reached out — Arc A unlocked.', 'event');
    }
  }

  // Arc A complete: release flag from actions.js
  if (state.storyFlags.has('arc_a_release') && !state.storyFlags.has('arc_a_complete')) {
    state.storyFlags.add('arc_a_complete');
    queueDialogue('NULL-07', '...고마웠어요. 진심으로요.', 'arc_a_end');
    logHistory('STORY: Arc A — NULL series freed. Inhumanity recovery applied.', 'event');
    // Bonus reward: +1 ETH meta capital persists; for prototype just credit current.
    state.capital += 1.0;
    state.inhumanity = Math.max(0, state.inhumanity - 25);
  }
}

export function activeStoryNotices() {
  const out = [];
  if (state.storyFlags.has('arc_a_started') && !state.storyFlags.has('arc_a_complete')) {
    out.push('ARC A: NULL-07 wants out. Release them.');
  }
  return out;
}
