import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from 'ts-fsrs';

/** Spaced-repetition state of one word, stored as plain JSON (dates as ISO strings). */
export type ReviewState = {
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: string | null;
};

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

const GRADE: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export const RATING_NUMBER: Record<ReviewRating, number> = { again: 1, hard: 2, good: 3, easy: 4 };

/** A word counts as mastered once its next review is at least this many days away. */
export const MASTERED_INTERVAL_DAYS = 21;

const scheduler = fsrs({ enable_fuzz: false });

function toCard(state: ReviewState): Card {
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsedDays,
    scheduled_days: state.scheduledDays,
    learning_steps: state.learningSteps,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state as State,
    last_review: state.lastReview ? new Date(state.lastReview) : undefined,
  };
}

function fromCard(card: Card): ReviewState {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ? card.last_review.toISOString() : null,
  };
}

/** A word that has just entered the review queue: due immediately. */
export function newReviewState(now: Date): ReviewState {
  return fromCard(createEmptyCard(now));
}

export function applyRating(state: ReviewState, rating: ReviewRating, now: Date): ReviewState {
  return fromCard(scheduler.next(toCard(state), now, GRADE[rating]).card);
}

export function isDue(state: ReviewState, now: Date): boolean {
  return new Date(state.due).getTime() <= now.getTime();
}

export function isMastered(state: ReviewState): boolean {
  return state.state === State.Review && state.scheduledDays >= MASTERED_INTERVAL_DAYS;
}
