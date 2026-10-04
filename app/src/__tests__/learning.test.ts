import {
  activityStore,
  currentStreak,
  lastWeek,
  recordActivity,
} from '@/features/learning/activity';
import {
  levelProgress,
  MIN_ANSWERS,
  MIN_MASTERED_TO_LEVEL_UP,
  suggestLevelChange,
} from '@/features/learning/adaptive-level';
import { buildExercise, gapExercise, meaningExercise } from '@/features/learning/exercises';
import {
  estimateLevel,
  nextPlacementLevel,
  PLACEMENT_LENGTH,
  type PlacementAnswer,
} from '@/features/learning/placement';
import { applyRating, isDue, isMastered, newReviewState } from '@/features/learning/scheduler';
import {
  dueWords,
  learningStats,
  markKnown,
  recordAnswer,
  startLearning,
  toggleFavorite,
  toServerRow,
  userWordsStore,
  type AnswerRecord,
} from '@/features/learning/user-words';
import type { CefrLevel, WordCard, WordSummary } from '@/features/words/types';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}` };
});

const NOW = new Date(2026, 9, 5, 9, 0, 0);
const DAY = 86_400_000;

function card(id: number, lemma: string, overrides: Partial<WordCard> = {}): WordCard {
  return {
    id,
    lemma,
    pos: 'noun',
    level: 'B1',
    ipa: null,
    audioUrl: null,
    forms: [],
    synonyms: [],
    topics: [],
    translation: [`${lemma}-pt`],
    senses: [{ gloss: `meaning of ${lemma}` }],
    examples: [],
    ...overrides,
  };
}

function summary(id: number, lemma: string, pos: WordSummary['pos'] = 'noun'): WordSummary {
  return { id, lemma, pos, level: 'B1', translation: `${lemma}-pt`, gloss: `meaning of ${lemma}` };
}

const POOL = [
  summary(11, 'budget'),
  summary(12, 'invoice'),
  summary(13, 'salary'),
  summary(14, 'profit'),
];

describe('placement test', () => {
  const run = (knows: (level: CefrLevel) => boolean) => {
    const answers: PlacementAnswer[] = [];
    for (let level = nextPlacementLevel(answers); level; level = nextPlacementLevel(answers)) {
      answers.push({ level, correct: knows(level) });
    }
    return answers;
  };

  test('starts at A2 and stops after the fixed number of questions', () => {
    expect(nextPlacementLevel([])).toBe('A2');
    expect(run(() => true)).toHaveLength(PLACEMENT_LENGTH);
  });

  test('moves up after a right answer and down after a wrong one, within A1–C2', () => {
    expect(nextPlacementLevel([{ level: 'A2', correct: true }])).toBe('B1');
    expect(nextPlacementLevel([{ level: 'A2', correct: false }])).toBe('A1');
    expect(nextPlacementLevel([{ level: 'A1', correct: false }])).toBe('A1');
    expect(nextPlacementLevel([{ level: 'C2', correct: true }])).toBe('C2');
  });

  test('someone who knows words up to B1 is placed at B1', () => {
    expect(estimateLevel(run((level) => ['A1', 'A2', 'B1'].includes(level)))).toBe('B1');
  });

  test('someone who knows nothing is placed at A1 and someone who knows everything at C2', () => {
    expect(estimateLevel(run(() => false))).toBe('A1');
    expect(estimateLevel(run(() => true))).toBe('C2');
  });
});

describe('adaptive level', () => {
  const answers = (count: number, correct: number, level: CefrLevel = 'B1'): AnswerRecord[] =>
    Array.from({ length: count }, (_, index) => ({
      at: new Date(NOW.getTime() - index * 3_600_000).toISOString(),
      level,
      correct: index < correct,
    }));

  test('does nothing with too few answers', () => {
    expect(suggestLevelChange('B1', answers(MIN_ANSWERS - 1, MIN_ANSWERS - 1), 50, NOW)).toBeNull();
  });

  test('moves up with high accuracy and enough mastered words', () => {
    expect(suggestLevelChange('B1', answers(20, 18), MIN_MASTERED_TO_LEVEL_UP, NOW)).toEqual({
      from: 'B1',
      to: 'B2',
      direction: 'up',
    });
  });

  test('stays when accuracy is high but few words are mastered', () => {
    expect(suggestLevelChange('B1', answers(20, 18), MIN_MASTERED_TO_LEVEL_UP - 1, NOW)).toBeNull();
  });

  test('moves down when accuracy is low', () => {
    expect(suggestLevelChange('B1', answers(20, 10), 0, NOW)?.to).toBe('A2');
  });

  test('never leaves the A1–C2 range', () => {
    expect(suggestLevelChange('A1', answers(20, 2, 'A1'), 0, NOW)).toBeNull();
    expect(suggestLevelChange('C2', answers(20, 20, 'C2'), 99, NOW)).toBeNull();
  });

  test('ignores answers older than 30 days and answers at other levels', () => {
    const old = answers(20, 20).map((answer) => ({
      ...answer,
      at: new Date(NOW.getTime() - 40 * DAY).toISOString(),
    }));
    expect(suggestLevelChange('B1', old, 50, NOW)).toBeNull();
    expect(suggestLevelChange('B1', answers(20, 20, 'A2'), 50, NOW)).toBeNull();
  });

  test('progress goes from 0 to 100', () => {
    expect(levelProgress('B1', [], 0, NOW)).toBe(0);
    expect(levelProgress('B1', answers(20, 20), MIN_MASTERED_TO_LEVEL_UP, NOW)).toBe(100);
  });
});

describe('streak and weekly activity', () => {
  const days = (...offsets: number[]) => ({
    days: Object.fromEntries(
      offsets.map((offset) => {
        const date = new Date(NOW.getTime() - offset * DAY);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return [key, 1];
      }),
    ),
  });

  test('counts consecutive days ending today', () => {
    expect(currentStreak(days(0, 1, 2), NOW)).toBe(3);
  });

  test('still counts when today has no activity yet', () => {
    expect(currentStreak(days(1, 2), NOW)).toBe(2);
  });

  test('forgives one missed day, but not two', () => {
    expect(currentStreak(days(0, 1, 3, 4), NOW)).toBe(4);
    expect(currentStreak(days(0, 1, 4, 5), NOW)).toBe(2);
  });

  test('is zero after two days without activity', () => {
    expect(currentStreak(days(2, 3), NOW)).toBe(0);
    expect(currentStreak({ days: {} }, NOW)).toBe(0);
  });

  test('records answers per day and lists the last seven days', () => {
    activityStore.set({ days: {} });
    recordActivity(3, NOW);
    recordActivity(2, NOW);
    const week = lastWeek(activityStore.get(), NOW);
    expect(week).toHaveLength(7);
    expect(week[6]).toEqual({ day: '2026-10-05', answers: 5 });
    expect(week[0].day).toBe('2026-09-29');
  });
});

describe('spaced repetition', () => {
  test('a new word is due at once and comes back later after a good answer', () => {
    const fresh = newReviewState(NOW);
    expect(isDue(fresh, NOW)).toBe(true);
    const after = applyRating(fresh, 'good', NOW);
    expect(isDue(after, NOW)).toBe(false);
    expect(new Date(after.due).getTime()).toBeGreaterThan(NOW.getTime());
  });

  test('"easy" schedules further away than "again"', () => {
    const fresh = newReviewState(NOW);
    const easy = new Date(applyRating(fresh, 'easy', NOW).due).getTime();
    const again = new Date(applyRating(fresh, 'again', NOW).due).getTime();
    expect(easy).toBeGreaterThan(again);
  });

  test('a word becomes mastered after repeated good answers', () => {
    let state = newReviewState(NOW);
    let now = NOW;
    for (let i = 0; i < 12 && !isMastered(state); i++) {
      state = applyRating(state, 'good', now);
      now = new Date(new Date(state.due).getTime() + 1000);
    }
    expect(isMastered(state)).toBe(true);
  });
});

describe('learner words', () => {
  beforeEach(() => userWordsStore.set({ words: {}, pendingLogs: [], history: [] }));

  test('a word in study is due, and an answer reschedules it and logs the answer', () => {
    const word = card(1, 'deadline');
    startLearning(word, 'daily', NOW);
    expect(dueWords(userWordsStore.get(), NOW).map((item) => item.wordId)).toEqual([1]);

    recordAnswer(1, 'good', 'meaning', NOW);
    const state = userWordsStore.get();
    expect(dueWords(state, NOW)).toHaveLength(0);
    expect(state.pendingLogs).toHaveLength(1);
    expect(state.pendingLogs[0]).toMatchObject({
      word_id: 1,
      rating: 3,
      correct: true,
      word_level: 'B1',
    });
    expect(state.history).toEqual([{ at: NOW.toISOString(), level: 'B1', correct: true }]);
    expect(state.words[1].dirty).toBe(true);
  });

  test('"I know this" removes the word from the reviews', () => {
    const word = card(2, 'commute');
    startLearning(word, 'daily', NOW);
    markKnown(word, 'daily', NOW);
    const state = userWordsStore.get();
    expect(state.words[2].status).toBe('known');
    expect(dueWords(state, NOW)).toHaveLength(0);
    expect(learningStats(state, NOW)).toMatchObject({ learning: 0, known: 1 });
  });

  test('a favourite is not put in the reviews by itself', () => {
    toggleFavorite(card(3, 'reliable'), 'search', NOW);
    const state = userWordsStore.get();
    expect(state.words[3]).toMatchObject({ isFavorite: true, review: null, source: 'search' });
    expect(learningStats(state, NOW)).toMatchObject({ favorites: 1, learning: 0, due: 0 });
    toggleFavorite(card(3, 'reliable'), 'search', NOW);
    expect(userWordsStore.get().words[3].isFavorite).toBe(false);
  });

  test('converts to the server row format', () => {
    startLearning(card(4, 'invoice'), 'search', NOW);
    const row = toServerRow(userWordsStore.get().words[4]);
    expect(row).toMatchObject({
      word_id: 4,
      status: 'learning',
      source: 'search',
      is_favorite: false,
      reps: 0,
    });
    expect(row.due).toBe(NOW.toISOString());
  });
});

describe('exercises', () => {
  const sequence = (...values: number[]) => {
    let index = 0;
    return () => values[index++ % values.length];
  };

  test('meaning exercise offers the translation and three other translations', () => {
    const exercise = meaningExercise(card(1, 'deadline'), POOL, sequence(0.1, 0.7, 0.3));
    expect(exercise).not.toBeNull();
    expect(exercise!.options).toHaveLength(4);
    expect(exercise!.options[exercise!.correctIndex]).toBe('deadline-pt');
    expect(new Set(exercise!.options).size).toBe(4);
  });

  test('uses English definitions when the word has no translation', () => {
    const exercise = meaningExercise(card(1, 'deadline', { translation: [] }), POOL);
    expect(exercise!.options[exercise!.correctIndex]).toBe('meaning of deadline');
    expect(exercise!.options.every((option) => option.startsWith('meaning of'))).toBe(true);
  });

  test('is not built without enough wrong answers of the same word class', () => {
    expect(meaningExercise(card(1, 'deadline'), POOL.slice(0, 2))).toBeNull();
    expect(meaningExercise(card(1, 'deadline'), [summary(21, 'quick', 'adjective')])).toBeNull();
  });

  test('gap exercise hides the word, including inflected forms', () => {
    const word = card(1, 'deadline', {
      forms: [{ form: 'deadlines', tags: ['plural'] }],
      examples: [
        {
          text: 'We have two deadlines this week.',
          translation: 'Temos dois prazos.',
          source: 'tatoeba',
        },
      ],
    });
    const exercise = gapExercise(word, POOL);
    expect(exercise!.prompt).toBe('We have two _____ this week.');
    expect(exercise!.hint).toBe('Temos dois prazos.');
    expect(exercise!.options[exercise!.correctIndex]).toBe('deadlines');
  });

  test('gap exercise hides every occurrence of the word', () => {
    const word = card(1, 'law', {
      examples: [
        {
          text: 'The law of life encompasses the law of death.',
          translation: null,
          source: 'tatoeba',
        },
      ],
    });
    expect(gapExercise(word, POOL)!.prompt).toBe(
      'The _____ of life encompasses the _____ of death.',
    );
  });

  test('falls back to the other exercise type, or to none', () => {
    expect(buildExercise(card(1, 'deadline'), POOL)!.kind).toBe('meaning');
    expect(buildExercise(card(1, 'deadline'), [])).toBeNull();
  });
});
