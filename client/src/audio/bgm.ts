/**
 * Audio bootstrap + mute state.
 *
 * This sample ships no music file (to stay asset-free / MIT-0). What remains is
 * the shared Web Audio AudioContext that the procedural skill SFX use
 * (fireball / whirlwind / swing in sfx.ts) — it is created and unlocked on the
 * first user gesture via startBgm(), and the mute toggle silences SFX.
 *
 * To add your own (CC0 / royalty-free) background music: drop a file in
 * client/public/, load it into an HTMLAudioElement here, and play/pause it in
 * startBgm() / setBgmMuted().
 */

let ctx: AudioContext | null = null;
let started = false;
let muted = false;

// Called from the title-screen buttons (and a one-shot gesture listener on the
// menu). Browsers block audio until a user gesture, so this both creates and
// resumes the shared AudioContext used by the SFX graph.
export function startBgm() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('[audio] AudioContext unavailable', e);
    }
  }
  ctx?.resume().catch(() => {});
  started = true;
}

export function setBgmMuted(m: boolean) {
  muted = m;
}

export function isBgmMuted(): boolean {
  return muted;
}

/** True once the first user gesture has unlocked audio. */
export function isAudioStarted(): boolean {
  return started;
}

/**
 * Shared AudioContext so SFX play through the Web Audio graph. Returns null
 * before the first user gesture has unlocked audio.
 */
export function getAudioContext(): AudioContext | null {
  return ctx;
}
