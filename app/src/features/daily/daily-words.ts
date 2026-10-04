import type { Profile } from '@/features/profile/profile';
import { fetchDailyWords, resetFutureDailyWords } from '@/features/session/api';
import type { WordCard } from '@/features/words/types';
import { addDays, toDayString } from '@/lib/dates';
import { createPersistentStore } from '@/lib/store';

/** How many days of words are kept on the device, so notifications work without a connection. */
export const DAYS_AHEAD = 7;

export type DailyState = {
  /** day (YYYY-MM-DD) → words of that day, in order. */
  days: Record<string, WordCard[]>;
  /** Settings the stored words were chosen for; a change means the future words must be redone. */
  signature: string | null;
  fetchedAt: string | null;
};

export const dailyStore = createPersistentStore<DailyState>('daily', {
  days: {},
  signature: null,
  fetchedAt: null,
});

export function profileSignature(profile: Profile): string {
  return [
    profile.nativeLang,
    profile.level,
    [...profile.topics].sort().join('+'),
    profile.wordsPerDay,
  ].join('|');
}

export function wordsOfDay(state: DailyState, day: string): WordCard[] {
  return state.days[day] ?? [];
}

/** Number of stored days from today on; the app refreshes when this gets low. */
export function daysCovered(state: DailyState, now: Date): number {
  let count = 0;
  while (count < DAYS_AHEAD && state.days[toDayString(addDays(now, count))]?.length) count++;
  return count;
}

/**
 * Downloads the words of the next days. Past days are kept (for the history),
 * and when the profile changed the words from tomorrow on are chosen again.
 */
export async function refreshDailyWords(profile: Profile, now = new Date()): Promise<DailyState> {
  const today = toDayString(now);
  const signature = profileSignature(profile);
  const current = dailyStore.get();

  if (current.signature !== null && current.signature !== signature) {
    await resetFutureDailyWords(toDayString(addDays(now, 1)));
  }

  const rows = await fetchDailyWords(today, DAYS_AHEAD);
  const days: Record<string, WordCard[]> = {};
  for (const [day, words] of Object.entries(current.days)) {
    if (day < today) days[day] = words;
  }
  for (const row of rows) (days[row.day] ??= []).push(row.word);

  // Keep roughly two months of history.
  const oldest = toDayString(addDays(now, -60));
  for (const day of Object.keys(days)) if (day < oldest) delete days[day];

  const next: DailyState = { days, signature, fetchedAt: now.toISOString() };
  dailyStore.set(next);
  return next;
}
