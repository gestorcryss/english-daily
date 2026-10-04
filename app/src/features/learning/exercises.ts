import { meaningOf, type WordCard, type WordSummary } from '@/features/words/types';

export type ChoiceExercise = {
  kind: 'meaning' | 'gap';
  wordId: number;
  /** What is shown as the question: the English word, or a sentence with a gap. */
  prompt: string;
  /** Translation of the sentence, shown as a hint in gap exercises. */
  hint: string | null;
  options: string[];
  correctIndex: number;
};

type Random = () => number;

function shuffle<T>(items: T[], random: Random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function withOptions(correct: string, wrong: string[], random: Random) {
  const options = shuffle([correct, ...wrong], random);
  return { options, correctIndex: options.indexOf(correct) };
}

/** "Choose the meaning": the word in English, four meanings in the learner's language. */
export function meaningExercise(
  word: WordCard,
  pool: WordSummary[],
  random: Random = Math.random,
): ChoiceExercise | null {
  const correct = meaningOf(word);
  if (!correct) return null;
  const useTranslation = word.translation.length > 0;
  const candidates = pool
    .filter((other) => other.id !== word.id && other.pos === word.pos)
    .map((other) => (useTranslation ? other.translation : other.gloss))
    .filter((text): text is string => !!text && text !== correct);
  const wrong = shuffle([...new Set(candidates)], random).slice(0, 3);
  if (wrong.length < 3) return null;
  return {
    kind: 'meaning',
    wordId: word.id,
    prompt: word.lemma,
    hint: null,
    ...withOptions(correct, wrong, random),
  };
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** "Complete the sentence": an example with the word removed, four English words to choose from. */
export function gapExercise(
  word: WordCard,
  pool: WordSummary[],
  random: Random = Math.random,
): ChoiceExercise | null {
  const forms = [word.lemma, ...word.forms.map((form) => form.form)].sort(
    (a, b) => b.length - a.length,
  );
  const pattern = new RegExp(`\\b(${forms.map(escapeRegExp).join('|')})\\b`, 'i');
  const example = word.examples.find((item) => pattern.test(item.text));
  if (!example) return null;

  const used = example.text.match(pattern)![0];
  const candidates = pool
    .filter((other) => other.id !== word.id && other.pos === word.pos && !/\s/.test(other.lemma))
    .map((other) => other.lemma)
    .filter((lemma) => lemma.toLowerCase() !== used.toLowerCase());
  const wrong = shuffle([...new Set(candidates)], random).slice(0, 3);
  if (wrong.length < 3) return null;
  return {
    kind: 'gap',
    wordId: word.id,
    // Every occurrence is hidden, otherwise the sentence itself gives the answer away.
    prompt: example.text.replace(new RegExp(pattern.source, 'gi'), '_____'),
    hint: example.translation,
    ...withOptions(used.toLowerCase(), wrong, random),
  };
}

/** Picks an exercise for a word, alternating types when both are possible. */
export function buildExercise(
  word: WordCard,
  pool: WordSummary[],
  random: Random = Math.random,
): ChoiceExercise | null {
  const builders = random() < 0.5 ? [gapExercise, meaningExercise] : [meaningExercise, gapExercise];
  for (const build of builders) {
    const exercise = build(word, pool, random);
    if (exercise) return exercise;
  }
  return null;
}
