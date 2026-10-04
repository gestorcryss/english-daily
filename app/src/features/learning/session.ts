import { packStore, packWords } from '@/features/words/level-pack';
import type { WordCard, WordSummary } from '@/features/words/types';

import { buildExercise, type ChoiceExercise } from './exercises';
import { dueWords, userWordsStore, type UserWord } from './user-words';

/** Most reviews in one sitting; the rest stay due for the next session. */
export const MAX_SESSION_WORDS = 20;
const EXTRA_PRACTICE_WORDS = 10;

/** One step of a review session: a multiple-choice exercise, or plain recall when none can be built. */
export type SessionItem = { word: WordCard; exercise: ChoiceExercise | null };

function toSummary(word: UserWord): WordSummary {
  return {
    id: word.card.id,
    lemma: word.card.lemma,
    pos: word.card.pos,
    level: word.card.level,
    translation: word.card.translation[0] ?? null,
    gloss: word.card.senses[0]?.gloss ?? '',
  };
}

/** Words that can be used as wrong answers: the level packs plus the learner's own words. */
function distractorPool(): WordSummary[] {
  return [
    ...packWords(packStore.get()),
    ...Object.values(userWordsStore.get().words).map(toSummary),
  ];
}

function toItems(words: UserWord[]): SessionItem[] {
  const pool = distractorPool();
  return words.map((word) => ({ word: word.card, exercise: buildExercise(word.card, pool) }));
}

/** The words due now, oldest first. */
export function reviewSession(now = new Date()): SessionItem[] {
  return toItems(dueWords(userWordsStore.get(), now).slice(0, MAX_SESSION_WORDS));
}

/** A single word, practised on request from its page. */
export function singleWordSession(wordId: number): SessionItem[] {
  const word = userWordsStore.get().words[wordId];
  return word ? toItems([word]) : [];
}

/** Extra practice: a random handful of the words in study, due or not. */
export function extraSession(): SessionItem[] {
  const learning = Object.values(userWordsStore.get().words).filter(
    (word) => word.status === 'learning' && word.review,
  );
  const shuffled = [...learning].sort(() => Math.random() - 0.5);
  return toItems(shuffled.slice(0, EXTRA_PRACTICE_WORDS));
}
