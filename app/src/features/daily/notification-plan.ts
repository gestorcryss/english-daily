import { meaningOf, type WordCard } from '@/features/words/types';
import { atTime } from '@/lib/dates';

import type { DailyState } from './daily-words';

/** Hours between the words of the same day when the person asked for more than one. */
const HOURS_BETWEEN_WORDS = 4;

export type PlannedNotification = {
  at: Date;
  day: string;
  word: WordCard;
  title: string;
  body: string;
};

/**
 * Works out which word notifications to schedule: one per stored word, at the chosen time,
 * only for moments still in the future.
 */
export function planWordNotifications(
  daily: DailyState,
  notifyTime: string,
  now: Date,
  titleFor: (word: WordCard) => string,
): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  for (const [day, words] of Object.entries(daily.days).sort(([a], [b]) => a.localeCompare(b))) {
    words.forEach((word, index) => {
      const at = atTime(day, notifyTime);
      at.setHours(at.getHours() + index * HOURS_BETWEEN_WORDS);
      if (at.getTime() <= now.getTime()) return;
      planned.push({
        at,
        day,
        word,
        title: titleFor(word),
        body: [word.ipa, meaningOf(word)].filter(Boolean).join(' · '),
      });
    });
  }
  return planned;
}
