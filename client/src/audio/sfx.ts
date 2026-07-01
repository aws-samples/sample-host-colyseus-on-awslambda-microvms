/**
 * Procedural skill SFX — synthesised with the Web Audio API, sharing the
 * AudioContext from bgm.ts (so they unlock on the same user gesture and fall
 * silent when the player mutes audio).
 *
 * No audio files: each effect is a tiny burst of oscillators + noise shaped by
 * gain envelopes and filters.
 */

import { getAudioContext, isBgmMuted } from './bgm';

// A short noise buffer reused for whooshes / fire crackle.
let noiseBuf: AudioBuffer | null = null;
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = Math.floor(ctx.sampleRate * 1.2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

/** Fireball: a whoosh of filtered noise + a downward pitched "fwoom". */
export function playFireball() {
  const ctx = getAudioContext();
  if (!ctx || isBgmMuted()) return;
  const now = ctx.currentTime;

  // --- Whoosh: band-passed noise sweeping up then out. ---
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(500, now);
  bp.frequency.exponentialRampToValueAtTime(2600, now + 0.18);
  bp.Q.value = 0.8;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0, now);
  nGain.gain.linearRampToValueAtTime(0.35, now + 0.04);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  noise.connect(bp).connect(nGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.55);

  // --- Fwoom: a body tone that drops in pitch for "launch" weight. ---
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.4);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  const oGain = ctx.createGain();
  oGain.gain.setValueAtTime(0.0001, now);
  oGain.gain.linearRampToValueAtTime(0.3, now + 0.03);
  oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  osc.connect(lp).connect(oGain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.5);
}

/** Whirlwind: a sustained airy vortex — looping noise through a swept bandpass
 *  with a subtle amplitude wobble, fading in and out over ~1s. */
export function playWhirlwind() {
  const ctx = getAudioContext();
  if (!ctx || isBgmMuted()) return;
  const now = ctx.currentTime;
  const dur = 1.1;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.loop = true;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(420, now);
  bp.frequency.linearRampToValueAtTime(900, now + dur * 0.5);
  bp.frequency.linearRampToValueAtTime(380, now + dur);
  bp.Q.value = 4;

  const out = ctx.createGain();
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(0.3, now + 0.15);
  out.gain.setValueAtTime(0.3, now + dur * 0.6);
  out.gain.exponentialRampToValueAtTime(0.001, now + dur);

  // Spinning amplitude wobble (the "swoosh-swoosh" of rotation).
  const wob = ctx.createOscillator();
  wob.frequency.setValueAtTime(7, now);
  wob.frequency.linearRampToValueAtTime(12, now + dur);
  const wobGain = ctx.createGain();
  wobGain.gain.value = 0.12;
  wob.connect(wobGain).connect(out.gain);

  noise.connect(bp).connect(out).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + dur + 0.05);
  wob.start(now);
  wob.stop(now + dur + 0.05);
}

/** Basic melee swing: a quick high whoosh. */
export function playSwing() {
  const ctx = getAudioContext();
  if (!ctx || isBgmMuted()) return;
  const now = ctx.currentTime;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(1200, now);
  bp.frequency.exponentialRampToValueAtTime(3500, now + 0.12);
  bp.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.18, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  noise.connect(bp).connect(g).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.25);
}
