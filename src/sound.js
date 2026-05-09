// Tiny Web Audio SFX. No assets — synthesized on the fly.
// Auto-bootstraps on first user gesture (browsers require this).

let ctx = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio not available', e);
  }
  return ctx;
}

export function setMuted(v) { muted = !!v; }

function tone({ freq = 880, dur = 0.08, type = 'square', gain = 0.05, slide = null }) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

function noise({ dur = 0.2, gain = 0.03 }) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() - 0.5) * 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(g).connect(c.destination);
  src.start();
}

export const sfx = {
  buy: () => { tone({ freq: 880, dur: 0.06, type: 'square', gain: 0.06, slide: 1320 }); },
  sell: () => { tone({ freq: 660, dur: 0.08, type: 'square', gain: 0.06, slide: 440 }); },
  hover: () => { tone({ freq: 1200, dur: 0.02, type: 'sine', gain: 0.02 }); },
  click: () => { tone({ freq: 1000, dur: 0.04, type: 'square', gain: 0.04 }); },
  fail: () => { tone({ freq: 200, dur: 0.18, type: 'sawtooth', gain: 0.05, slide: 100 }); },
  event: () => {
    tone({ freq: 600, dur: 0.08, type: 'square', gain: 0.06 });
    setTimeout(() => tone({ freq: 900, dur: 0.10, type: 'square', gain: 0.06 }), 80);
  },
  threshold: () => {
    noise({ dur: 0.4, gain: 0.04 });
    tone({ freq: 200, dur: 0.4, type: 'sawtooth', gain: 0.05, slide: 80 });
  },
  cycleEnd: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone({ freq: f, dur: 0.12, type: 'square', gain: 0.05 }), i * 100));
  },
  release: () => {
    [800, 1200, 1600].forEach((f, i) => setTimeout(() => tone({ freq: f, dur: 0.18, type: 'sine', gain: 0.05 }), i * 80));
  },
};

export function unlockAudio() {
  // Resume audio context after first user gesture.
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume();
}
