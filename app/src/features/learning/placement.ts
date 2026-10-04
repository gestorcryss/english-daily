import { CEFR_LEVELS, type CefrLevel } from '@/features/words/types';

/** Number of questions in the placement test. */
export const PLACEMENT_LENGTH = 15;
const START_LEVEL: CefrLevel = 'A2';
/** The estimate ignores the first answers, while the test is still finding the right zone. */
const WARM_UP = 5;

export type PlacementAnswer = { level: CefrLevel; correct: boolean };

/**
 * Staircase test: a right answer moves one level up, a wrong one (or "I don't know") one down.
 * Returns the level of the next question, or null when the test is over.
 */
export function nextPlacementLevel(answers: PlacementAnswer[]): CefrLevel | null {
  if (answers.length >= PLACEMENT_LENGTH) return null;
  const last = answers.at(-1);
  if (!last) return START_LEVEL;
  const index = CEFR_LEVELS.indexOf(last.level) + (last.correct ? 1 : -1);
  return CEFR_LEVELS[Math.min(Math.max(index, 0), CEFR_LEVELS.length - 1)];
}

/**
 * The staircase settles around the level where the person gets about half right.
 * The result is the level just below that point: words the person mostly knows,
 * with the next level as the stretch.
 */
export function estimateLevel(answers: PlacementAnswer[]): CefrLevel {
  if (!answers.length) return START_LEVEL;
  const settled = answers.length > WARM_UP ? answers.slice(WARM_UP) : answers;
  const mean =
    settled.reduce((sum, answer) => sum + CEFR_LEVELS.indexOf(answer.level), 0) / settled.length;
  const correctShare = settled.filter((answer) => answer.correct).length / settled.length;
  // Someone who gets nearly everything right at the top (or wrong at the bottom) has no staircase.
  if (correctShare >= 0.9) return CEFR_LEVELS[Math.min(Math.round(mean), CEFR_LEVELS.length - 1)];
  return CEFR_LEVELS[Math.max(Math.round(mean - 0.5), 0)];
}
