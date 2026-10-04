import { fetchLevelPack } from '@/features/session/api';
import { createPersistentStore } from '@/lib/store';

import { nextLevel, type CefrLevel, type WordSummary } from './types';

/**
 * Short entries of every word of the learner's level (and the next one), kept on the device.
 * Used for dictionary search without a connection and as wrong answers in the exercises.
 */
export type PackState = {
  lang: string | null;
  levels: Partial<Record<CefrLevel, WordSummary[]>>;
};

export const packStore = createPersistentStore<PackState>('level-pack', { lang: null, levels: {} });

export function packWords(state: PackState): WordSummary[] {
  return Object.values(state.levels).flat();
}

/** Downloads the packs that are missing for this level and language. */
export async function ensureLevelPacks(level: CefrLevel, lang: string): Promise<void> {
  const wanted = [level, nextLevel(level)].filter((item): item is CefrLevel => item !== null);
  const current = packStore.get();
  const levels = current.lang === lang ? { ...current.levels } : {};

  for (const item of wanted) {
    if (!levels[item]) levels[item] = await fetchLevelPack(item, lang);
  }
  // Drop levels that are no longer needed, to keep local storage small.
  for (const stored of Object.keys(levels) as CefrLevel[]) {
    if (!wanted.includes(stored)) delete levels[stored];
  }
  packStore.set({ lang, levels });
}

/** Prefix search over the stored packs, most frequent words first (the pack is already sorted). */
export function searchPack(state: PackState, query: string, limit = 20): WordSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const matches = packWords(state).filter((word) => word.lemma.toLowerCase().startsWith(needle));
  return [
    ...matches.filter((word) => word.lemma.toLowerCase() === needle),
    ...matches.filter((word) => word.lemma.toLowerCase() !== needle),
  ].slice(0, limit);
}
