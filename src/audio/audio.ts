/**
 * Procedural audio via WebAudio: no audio files required. Music and effects have independent volumes.
 */
import { settings } from '../core/settings';

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let currentMood = '';
let musicTimer: number | null = null;
let nodes: AudioNode[] = [];

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const AC = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  musicGain = ctx!.createGain();
  sfxGain = ctx!.createGain();
  musicGain.connect(ctx!.destination);
  sfxGain.connect(ctx!.destination);
  applyVolumes();
  return ctx;
}

export function applyVolumes(): void {
  if (musicGain) musicGain.gain.value = settings().musicVolume * 0.5;
  if (sfxGain) sfxGain.gain.value = settings().sfxVolume;
}

export function unlockAudio(): void {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, out: GainNode | null, when = 0, attack = 0.01, detune = 0): void {
  const c = ensure();
  if (!c || !out) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(out);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise(dur: number, gain: number, filterFreq: number, when = 0): void {
  const c = ensure();
  if (!c || !sfxGain) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = filterFreq;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(f); f.connect(g); g.connect(sfxGain);
  src.start(c.currentTime + when);
}

export type Sfx = 'click' | 'dice' | 'hit' | 'miss' | 'crit' | 'heal' | 'spell' | 'bell' | 'door' | 'explosion' | 'levelup' | 'quest' | 'step' | 'down' | 'coin';

export function sfx(kind: Sfx): void {
  if (!ensure() || settings().sfxVolume <= 0) return;
  switch (kind) {
    case 'click': tone(660, 0.06, 'triangle', 0.15, sfxGain); break;
    case 'dice': for (let i = 0; i < 5; i++) noise(0.04, 0.25, 3000, i * 0.05); break;
    case 'hit': noise(0.15, 0.5, 900); tone(110, 0.15, 'square', 0.15, sfxGain); break;
    case 'miss': noise(0.2, 0.15, 4000); break;
    case 'crit': noise(0.25, 0.6, 1200); tone(220, 0.3, 'sawtooth', 0.2, sfxGain); tone(330, 0.4, 'sawtooth', 0.15, sfxGain, 0.05); break;
    case 'heal': [523, 659, 784].forEach((f, i) => tone(f, 0.4, 'sine', 0.15, sfxGain, i * 0.08)); break;
    case 'spell': tone(880, 0.35, 'sine', 0.12, sfxGain, 0, 0.02, 0); tone(1320, 0.3, 'sine', 0.08, sfxGain, 0.05); noise(0.3, 0.1, 6000); break;
    case 'bell': [1, 2.4, 3, 4.2, 5.4].forEach((m, i) => tone(110 * m, 4 - i * 0.6, 'sine', 0.25 / (i + 1), sfxGain, 0, 0.005)); break;
    case 'door': tone(90, 0.3, 'square', 0.1, sfxGain); noise(0.3, 0.2, 500); break;
    case 'explosion': noise(0.8, 0.9, 400); tone(55, 0.6, 'sawtooth', 0.3, sfxGain); break;
    case 'levelup': [392, 494, 587, 784].forEach((f, i) => tone(f, 0.5, 'triangle', 0.15, sfxGain, i * 0.1)); break;
    case 'quest': [587, 784].forEach((f, i) => tone(f, 0.5, 'triangle', 0.15, sfxGain, i * 0.12)); break;
    case 'step': noise(0.03, 0.05, 800); break;
    case 'down': tone(196, 0.6, 'sawtooth', 0.15, sfxGain); tone(147, 0.8, 'sawtooth', 0.12, sfxGain, 0.2); break;
    case 'coin': tone(1568, 0.15, 'square', 0.06, sfxGain); tone(2093, 0.2, 'square', 0.05, sfxGain, 0.06); break;
  }
}

const MOODS: Record<string, { scale: number[]; base: number; tempo: number; wave: OscillatorType; drone: number; density: number }> = {
  festival: { scale: [0, 2, 4, 7, 9, 12, 14], base: 293.66, tempo: 260, wave: 'triangle', drone: 0.04, density: 0.8 },
  tavern: { scale: [0, 2, 3, 5, 7, 10, 12], base: 220, tempo: 300, wave: 'triangle', drone: 0.03, density: 0.7 },
  fog: { scale: [0, 1, 5, 7, 8, 12], base: 146.83, tempo: 900, wave: 'sine', drone: 0.08, density: 0.35 },
  dungeon: { scale: [0, 3, 5, 6, 7, 10], base: 110, tempo: 1100, wave: 'sine', drone: 0.09, density: 0.3 },
  boss: { scale: [0, 1, 3, 6, 7, 8], base: 98, tempo: 330, wave: 'sawtooth', drone: 0.1, density: 0.7 },
  combat: { scale: [0, 2, 3, 7, 8, 10], base: 130.81, tempo: 300, wave: 'square', drone: 0.07, density: 0.6 },
  menu: { scale: [0, 2, 3, 7, 10, 12, 14], base: 196, tempo: 800, wave: 'sine', drone: 0.06, density: 0.5 },
  forest: { scale: [0, 2, 5, 7, 9, 12], base: 174.61, tempo: 700, wave: 'triangle', drone: 0.05, density: 0.45 },
  city: { scale: [0, 2, 4, 5, 7, 9, 11], base: 246.94, tempo: 380, wave: 'triangle', drone: 0.03, density: 0.6 },
  ruins: { scale: [0, 1, 4, 5, 7, 8, 11], base: 130.81, tempo: 850, wave: 'sine', drone: 0.08, density: 0.4 },
};

export function playMusic(mood: string): void {
  if (mood === currentMood) return;
  stopMusic();
  currentMood = mood;
  const c = ensure();
  const m = MOODS[mood];
  if (!c || !m || !musicGain) return;
  // Drone
  for (const mult of [0.5, 0.75]) {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine'; o.frequency.value = m.base * mult; g.gain.value = m.drone;
    o.connect(g); g.connect(musicGain); o.start(); nodes.push(o, g);
  }
  let step = 0;
  const tick = () => {
    if (Math.random() < m.density) {
      const deg = m.scale[Math.floor(Math.random() * m.scale.length)];
      const f = m.base * 2 ** (deg / 12) * (Math.random() < 0.2 ? 2 : 1);
      tone(f, m.tempo / 1000 * 2.2, m.wave, m.wave === 'sine' ? 0.12 : 0.05, musicGain, 0, 0.02);
    }
    if (mood === 'boss' && step % 16 === 0) [1, 2.4, 3].forEach((mm, i) => tone(55 * mm, 3, 'sine', 0.12 / (i + 1), musicGain, 0, 0.005));
    step++;
  };
  musicTimer = (globalThis as any).setInterval(tick, m.tempo);
}

export function stopMusic(): void {
  if (musicTimer !== null) (globalThis as any).clearInterval(musicTimer);
  musicTimer = null;
  for (const n of nodes) { try { (n as any).stop?.(); n.disconnect(); } catch { /* */ } }
  nodes = [];
  currentMood = '';
}
