/**
 * Plays recorded narration during dialogue. One clip at a time; it continues across the nodes it
 * covers and stops when the player moves past them or the dialogue closes. Music is ducked meanwhile.
 */
import { settings } from '../core/settings';
import { narrationFor, type NarrationClip } from '../data/narration';
import { duckMusic } from './audio';

let audio: HTMLAudioElement | null = null;
let playing: NarrationClip | null = null;

/** Call whenever a dialogue node is shown. */
export function narrate(treeId: string, nodeId: string): void {
  const clip = narrationFor(treeId, nodeId);
  if (clip && clip === playing) return; // same recording, still reading
  stopNarration();
  if (!clip || settings().voiceVolume <= 0 || typeof Audio === 'undefined') return;
  try {
    const a = new Audio(`${import.meta.env.BASE_URL}audio/narration/${clip.file}`);
    a.volume = Math.max(0, Math.min(1, settings().voiceVolume));
    const done = () => { if (audio === a) { audio = null; playing = null; duckMusic(false); } };
    a.addEventListener('ended', done);
    a.addEventListener('error', done); // missing or unplayable file: stay silent
    audio = a; playing = clip;
    duckMusic(true);
    void a.play().catch(done); // e.g. the browser refuses autoplay
  } catch { stopNarration(); }
}

export function stopNarration(): void {
  if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
  audio = null; playing = null;
  duckMusic(false);
}

/** Apply a changed narration volume to the clip that is playing. */
export function applyNarrationVolume(): void {
  if (!audio) return;
  if (settings().voiceVolume <= 0) stopNarration();
  else audio.volume = Math.min(1, settings().voiceVolume);
}
