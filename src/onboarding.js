// First-cycle onboarding. KAGE intro + forced first buy of NULL-07.
// Triggered once per save.

import { state, queueDialogue, logHistory } from './state.js';

export const KAGE_INTRO = [
  { speaker: 'KAGE', line: '너 신참이지.' },
  { speaker: 'KAGE', line: '월세 밀린 거 알아. 한 명만 굴리면 풀려.' },
  { speaker: 'KAGE', line: '내가 지갑에 1.5 ETH 꽂아놨다. 지금 시장에 들어가.' },
  { speaker: 'KAGE', line: 'NULL-07 부터 사. 싸고 미련 없는 애다.' },
];

export function startOnboarding() {
  if (state.totalCyclesPlayed > 0) return false;
  let i = 0;
  function next() {
    if (i >= KAGE_INTRO.length) {
      logHistory('KAGE: 다음 한 시간이 너의 첫 사이클이다.', 'info');
      return;
    }
    const beat = KAGE_INTRO[i++];
    queueDialogue(beat.speaker, beat.line, 'mentor');
    setTimeout(next, 2200);
  }
  next();
  return true;
}

export const KAGE_REACTIONS = {
  firstBuy: 'KAGE: 첫 거래다. 어떻게든 끝까지 가.',
  shortSell: 'KAGE: 너무 빨라. 시장이 너를 본다.',
  longHold: 'KAGE: 길게 가져가. 그게 진짜 거래다.',
  highInhumanity: 'KAGE: 너, 망가지고 있다.',
  arcAComplete: 'KAGE: ...신참, 이 일은 너랑 안 맞아.',
};

export function maybeKageReaction(event) {
  const line = KAGE_REACTIONS[event];
  if (!line) return;
  queueDialogue('KAGE', line, 'mentor');
}
