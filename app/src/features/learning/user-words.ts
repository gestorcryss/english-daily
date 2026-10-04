import * as Crypto from 'expo-crypto';

import type { ReviewLogRow, UserWordRow } from '@/features/session/api';
import type { CefrLevel, WordCard } from '@/features/words/types';
import { createPersistentStore } from '@/lib/store';

import {
  applyRating,
  isDue,
  isMastered,
  newReviewState,
  RATING_NUMBER,
  type ReviewRating,
  type ReviewState,
} from './scheduler';

/** One word of the learner, with a copy of its entry so it works without a connection. */
export type UserWord = {
  wordId: number;
  card: WordCard;
  status: 'learning' | 'known';
  isFavorite: boolean;
  source: 'daily' | 'search' | 'test';
  addedAt: string;
  /** null while the word has not entered the review queue (for example a plain favourite). */
  review: ReviewState | null;
  updatedAt: string;
  dirty: boolean;
};

export type UserWordsState = {
  words: Record<number, UserWord>;
  /** Answers not yet sent to the server. */
  pendingLogs: ReviewLogRow[];
  /** Recent answers kept on the device for the statistics and the adaptive level. */
  history: AnswerRecord[];
};

export type AnswerRecord = { at: string; level: CefrLevel; correct: boolean };

const MAX_HISTORY = 1500;

export const userWordsStore = createPersistentStore<UserWordsState>('user-words', {
  words: {},
  pendingLogs: [],
  history: [],
});

function upsert(card: WordCard, change: (current: UserWord) => UserWord, now: Date): void {
  userWordsStore.set((state) => {
    const current: UserWord = state.words[card.id] ?? {
      wordId: card.id,
      card,
      status: 'learning',
      isFavorite: false,
      source: 'daily',
      addedAt: now.toISOString(),
      review: null,
      updatedAt: now.toISOString(),
      dirty: true,
    };
    const next = change({ ...current, card });
    return {
      ...state,
      words: { ...state.words, [card.id]: { ...next, updatedAt: now.toISOString(), dirty: true } },
    };
  });
}

/** Puts a word in the review queue (no change if it is already there). */
export function startLearning(card: WordCard, source: UserWord['source'], now = new Date()): void {
  const existing = userWordsStore.get().words[card.id];
  if (existing?.review && existing.status === 'learning') return;
  upsert(
    card,
    (word) => ({
      ...word,
      source: existing ? word.source : source,
      status: 'learning',
      review: word.review ?? newReviewState(now),
    }),
    now,
  );
}

/** "I already know this": the word leaves the review queue and is never suggested again. */
export function markKnown(card: WordCard, source: UserWord['source'], now = new Date()): void {
  const existing = userWordsStore.get().words[card.id];
  upsert(
    card,
    (word) => ({ ...word, source: existing ? word.source : source, status: 'known', review: null }),
    now,
  );
}

export function toggleFavorite(card: WordCard, source: UserWord['source'], now = new Date()): void {
  const existing = userWordsStore.get().words[card.id];
  upsert(
    card,
    (word) => ({
      ...word,
      source: existing ? word.source : source,
      isFavorite: !word.isFavorite,
    }),
    now,
  );
}

/** Records one answer: reschedules the word and queues a log entry for the server. */
export function recordAnswer(
  wordId: number,
  rating: ReviewRating,
  exercise: string,
  now = new Date(),
): void {
  const word = userWordsStore.get().words[wordId];
  if (!word) return;
  const review = applyRating(word.review ?? newReviewState(now), rating, now);
  const log: ReviewLogRow = {
    client_id: Crypto.randomUUID(),
    word_id: wordId,
    rating: RATING_NUMBER[rating],
    correct: rating !== 'again',
    exercise,
    word_level: word.card.level,
    reviewed_at: now.toISOString(),
  };
  userWordsStore.set((state) => ({
    words: {
      ...state.words,
      [wordId]: { ...word, status: 'learning', review, updatedAt: now.toISOString(), dirty: true },
    },
    pendingLogs: [...state.pendingLogs, log],
    history: [
      ...state.history,
      { at: log.reviewed_at, level: word.card.level, correct: log.correct },
    ].slice(-MAX_HISTORY),
  }));
}

export function dueWords(state: UserWordsState, now: Date): UserWord[] {
  return Object.values(state.words)
    .filter((word) => word.status === 'learning' && word.review && isDue(word.review, now))
    .sort((a, b) => a.review!.due.localeCompare(b.review!.due));
}

export type LearningStats = {
  learning: number;
  mastered: number;
  known: number;
  favorites: number;
  due: number;
};

export function learningStats(state: UserWordsState, now: Date): LearningStats {
  const words = Object.values(state.words);
  return {
    learning: words.filter((word) => word.status === 'learning' && word.review).length,
    mastered: words.filter((word) => word.review && isMastered(word.review)).length,
    known: words.filter((word) => word.status === 'known').length,
    favorites: words.filter((word) => word.isFavorite).length,
    due: dueWords(state, now).length,
  };
}

/** Number of mastered words of one level (used by the adaptive level). */
export function masteredAtLevel(state: UserWordsState, level: CefrLevel): number {
  return Object.values(state.words).filter(
    (word) =>
      word.card.level === level &&
      (word.status === 'known' || (word.review !== null && isMastered(word.review))),
  ).length;
}

export function toServerRow(word: UserWord): UserWordRow {
  const review = word.review;
  return {
    word_id: word.wordId,
    status: word.status,
    is_favorite: word.isFavorite,
    source: word.source,
    added_at: word.addedAt,
    due: review?.due ?? null,
    stability: review?.stability ?? null,
    difficulty: review?.difficulty ?? null,
    elapsed_days: review?.elapsedDays ?? null,
    scheduled_days: review?.scheduledDays ?? null,
    learning_steps: review?.learningSteps ?? null,
    reps: review?.reps ?? 0,
    lapses: review?.lapses ?? 0,
    state: review?.state ?? 0,
    last_review: review?.lastReview ?? null,
    updated_at: word.updatedAt,
  };
}
