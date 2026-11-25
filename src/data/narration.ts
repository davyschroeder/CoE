/**
 * Recorded narration for Dungeon Master text (voiced with ElevenLabs). Each clip covers one or more
 * consecutive nodes of a dialogue tree and keeps playing while the player stays on those nodes.
 * Audio files live in public/audio/narration/ and are optional: a missing file is simply silent.
 */
export interface NarrationClip {
  /** File name in public/audio/narration/. */
  file: string;
  /** Dialogue nodes this recording reads, in order. */
  nodes: string[];
  /** Who voices it (for credits). */
  voice: string;
}

export const NARRATION: Record<string, NarrationClip> = {
  // "Arrival": the road into Hollowmere, the first two screens of the game.
  intro: { file: 'prologue-arrival.mp3', nodes: ['a', 'b'], voice: 'Darren (ElevenLabs)' },
};

/** The clip that belongs to a dialogue node, if any. */
export function narrationFor(treeId: string, nodeId: string): NarrationClip | null {
  const clip = NARRATION[treeId];
  return clip && clip.nodes.includes(nodeId) ? clip : null;
}
