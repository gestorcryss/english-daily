import { dailyStore } from '@/features/daily/daily-words';
import { userWordsStore } from '@/features/learning/user-words';
import { profileStore } from '@/features/profile/profile';
import { fetchWordCard } from '@/features/session/api';
import { createPersistentStore } from '@/lib/store';

import type { WordCard } from './types';

const MAX_CACHED = 150;

/** Entries opened from the dictionary, kept so they can be reopened without a connection. */
type CacheState = { lang: string | null; cards: WordCard[] };

const cacheStore = createPersistentStore<CacheState>('word-cache', { lang: null, cards: [] });

/** Finds an entry already on the device: words of the day, the learner's words, then the cache. */
export function findLocalCard(wordId: number): WordCard | null {
  for (const words of Object.values(dailyStore.get().days)) {
    const match = words.find((word) => word.id === wordId);
    if (match) return match;
  }
  const own = userWordsStore.get().words[wordId];
  if (own) return own.card;
  const cache = cacheStore.get();
  if (cache.lang !== profileStore.get().nativeLang) return null;
  return cache.cards.find((card) => card.id === wordId) ?? null;
}

/** Returns the entry from the device, or downloads it and keeps a copy. */
export async function loadCard(wordId: number): Promise<WordCard | null> {
  const local = findLocalCard(wordId);
  if (local) return local;

  const lang = profileStore.get().nativeLang;
  const card = await fetchWordCard(wordId, lang);
  if (!card) return null;
  cacheStore.set((state) => ({
    lang,
    cards: [
      card,
      ...(state.lang === lang ? state.cards : []).filter((item) => item.id !== card.id),
    ].slice(0, MAX_CACHED),
  }));
  return card;
}
