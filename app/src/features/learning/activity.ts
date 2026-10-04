import { addDays, toDayString } from '@/lib/dates';
import { createPersistentStore } from '@/lib/store';

/** Days on which the person used the app to learn: day (YYYY-MM-DD) → number of answers. */
export type ActivityState = { days: Record<string, number> };

export const activityStore = createPersistentStore<ActivityState>('activity', { days: {} });

/** Marks today as active. `answers` is the number of exercise answers to add (0 = just opened a word). */
export function recordActivity(answers = 0, now = new Date()): void {
  const day = toDayString(now);
  activityStore.set((state) => ({
    days: { ...state.days, [day]: (state.days[day] ?? 0) + answers },
  }));
}

/**
 * Consecutive active days ending today (or yesterday, if today has no activity yet).
 * One missed day inside the streak is forgiven, so a single bad day does not reset it.
 */
export function currentStreak(state: ActivityState, now: Date): number {
  const active = (offset: number) => toDayString(addDays(now, -offset)) in state.days;
  let offset = active(0) ? 0 : 1;
  if (!active(offset)) return 0;

  let streak = 0;
  let graceUsed = false;
  for (;;) {
    if (active(offset)) {
      streak++;
      offset++;
    } else if (!graceUsed && active(offset + 1)) {
      graceUsed = true;
      offset++;
    } else {
      return streak;
    }
  }
}

/** Answers per day for the last 7 days, oldest first. */
export function lastWeek(state: ActivityState, now: Date): { day: string; answers: number }[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = toDayString(addDays(now, index - 6));
    return { day, answers: state.days[day] ?? 0 };
  });
}
