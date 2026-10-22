const MUTE_KEY = "bar3d-muted";

let audioContext = null;
let muted = readMuted();

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function getContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function tone(ctx, { frequency, type = "sine", volume, attack = 0.005, decay, delay = 0 }) {
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + attack + decay + 0.05);
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    return;
  }
}

export function playClick() {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, { frequency: 880, type: "triangle", volume: 0.08, decay: 0.06 });
  tone(ctx, { frequency: 1320, type: "sine", volume: 0.04, decay: 0.05, delay: 0.01 });
}

export function playGlass() {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  tone(ctx, { frequency: 1760, volume: 0.12, decay: 0.9 });
  tone(ctx, { frequency: 2640, volume: 0.06, decay: 0.6 });
  tone(ctx, { frequency: 4200, volume: 0.03, decay: 0.35 });
  tone(ctx, { frequency: 2093, volume: 0.07, decay: 0.7, delay: 0.09 });
}
