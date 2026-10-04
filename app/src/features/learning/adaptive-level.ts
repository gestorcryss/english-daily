import { nextLevel, previousLevel, type CefrLevel } from '@/features/words/types';

import type { AnswerRecord } from './user-words';

export const LEVEL_UP_ACCURACY = 0.85;
export const LEVEL_DOWN_ACCURACY = 0.6;
/** Answers at the current level needed before the level may change. */
export const MIN_ANSWERS = 20;
/** Mastered or already-known words of the current level needed to move up. */
export const MIN_MASTERED_TO_LEVEL_UP = 10;
const WINDOW_DAYS = 30;

export type LevelChange = { from: CefrLevel; to: CefrLevel; direction: 'up' | 'down' };

/**
 * Decides whether the level should change, from the answers of the last 30 days
 * on words of the current level.
 */
export function suggestLevelChange(
  level: CefrLevel,
  history: AnswerRecord[],
  masteredAtLevel: number,
  now: Date,
): LevelChange | null {
  const since = now.getTime() - WINDOW_DAYS * 86_400_000;
  const recent = history.filter(
    (answer) => answer.level === level && new Date(answer.at).getTime() >= since,
  );
  if (recent.length < MIN_ANSWERS) return null;

  const accuracy = recent.filter((answer) => answer.correct).length / recent.length;
  const up = nextLevel(level);
  const down = previousLevel(level);

  if (accuracy >= LEVEL_UP_ACCURACY && masteredAtLevel >= MIN_MASTERED_TO_LEVEL_UP && up) {
    return { from: level, to: up, direction: 'up' };
  }
  if (accuracy < LEVEL_DOWN_ACCURACY && down) {
    return { from: level, to: down, direction: 'down' };
  }
  return null;
}

/** Progress towards the next level, 0–100, for the bar on the Today screen. */
export function levelProgress(
  level: CefrLevel,
  history: AnswerRecord[],
  masteredAtLevel: number,
  now: Date,
): number {
  const since = now.getTime() - WINDOW_DAYS * 86_400_000;
  const recent = history.filter(
    (answer) => answer.level === level && new Date(answer.at).getTime() >= since,
  );
  const answersPart = Math.min(recent.length / MIN_ANSWERS, 1);
  const masteredPart = Math.min(masteredAtLevel / MIN_MASTERED_TO_LEVEL_UP, 1);
  const accuracy = recent.length
    ? recent.filter((answer) => answer.correct).length / recent.length
    : 0;
  const accuracyPart = Math.min(accuracy / LEVEL_UP_ACCURACY, 1);
  return Math.round(((answersPart + masteredPart + accuracyPart) / 3) * 100);
}
