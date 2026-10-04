export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export type WordClass =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'determiner'
  | 'conjunction'
  | 'number'
  | 'interjection'
  | 'other';

export const TOPICS = [
  'daily',
  'business',
  'travel',
  'technology',
  'health',
  'study',
  'emotions',
  'food',
  'sport',
  'culture',
] as const;
export type Topic = (typeof TOPICS)[number];

export type WordExample = {
  text: string;
  /** Translation into the learner's native language, when one exists. */
  translation: string | null;
  source: 'wiktionary' | 'tatoeba' | 'generated';
};

/** Full word entry, as returned by the `word_card` database function. */
export type WordCard = {
  id: number;
  lemma: string;
  pos: WordClass;
  level: CefrLevel;
  ipa: string | null;
  audioUrl: string | null;
  forms: { form: string; tags: string[] }[];
  synonyms: string[];
  topics: Topic[];
  /** Translations of the word into the learner's native language (may be empty). */
  translation: string[];
  senses: { gloss: string }[];
  examples: WordExample[];
};

/** Short entry used in search results and as wrong answers in exercises. */
export type WordSummary = {
  id: number;
  lemma: string;
  pos: WordClass;
  level: CefrLevel;
  translation: string | null;
  gloss: string;
};

export function nextLevel(level: CefrLevel): CefrLevel | null {
  return CEFR_LEVELS[CEFR_LEVELS.indexOf(level) + 1] ?? null;
}

export function previousLevel(level: CefrLevel): CefrLevel | null {
  return CEFR_LEVELS[CEFR_LEVELS.indexOf(level) - 1] ?? null;
}

/** What to show as "the meaning" of a word: its translation, or the English definition. */
export function meaningOf(word: Pick<WordCard, 'translation' | 'senses'>): string {
  return word.translation.length ? word.translation.join(', ') : (word.senses[0]?.gloss ?? '');
}
