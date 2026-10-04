import {
  daysCovered,
  profileSignature,
  wordsOfDay,
  type DailyState,
} from '@/features/daily/daily-words';
import { planWordNotifications } from '@/features/daily/notification-plan';
import { DEFAULT_PROFILE } from '@/features/profile/profile';
import { searchPack, type PackState } from '@/features/words/level-pack';
import { meaningOf, type WordCard, type WordSummary } from '@/features/words/types';
import { addDays, atTime, daysBetween, toDayString } from '@/lib/dates';
import { clearMemoryStorage } from '@/lib/storage';
import { createPersistentStore } from '@/lib/store';

const NOW = new Date(2026, 9, 5, 9, 0, 0);

function card(id: number, lemma: string, overrides: Partial<WordCard> = {}): WordCard {
  return {
    id,
    lemma,
    pos: 'noun',
    level: 'B1',
    ipa: '/x/',
    audioUrl: null,
    forms: [],
    synonyms: [],
    topics: [],
    translation: ['prazo'],
    senses: [{ gloss: 'a time limit' }],
    examples: [],
    ...overrides,
  };
}

function daily(days: Record<string, WordCard[]>): DailyState {
  return { days, signature: null, fetchedAt: null };
}

describe('dates', () => {
  test('uses the local calendar day', () => {
    expect(toDayString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDayString(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
    expect(atTime('2026-10-05', '08:30').getHours()).toBe(8);
    expect(daysBetween('2026-10-05', '2026-10-12')).toBe(7);
  });
});

describe('daily words', () => {
  test('counts the stored days from today on, stopping at the first gap', () => {
    const state = daily({
      '2026-10-05': [card(1, 'a')],
      '2026-10-06': [card(2, 'b')],
      '2026-10-08': [card(3, 'c')],
    });
    expect(daysCovered(state, NOW)).toBe(2);
    expect(daysCovered(daily({}), NOW)).toBe(0);
    expect(wordsOfDay(state, '2026-10-06').map((word) => word.lemma)).toEqual(['b']);
    expect(wordsOfDay(state, '2026-10-07')).toEqual([]);
  });

  test('the signature changes with level, topics, language and words per day, not with times', () => {
    const base = profileSignature(DEFAULT_PROFILE);
    expect(profileSignature({ ...DEFAULT_PROFILE, notifyTime: '21:00' })).toBe(base);
    expect(profileSignature({ ...DEFAULT_PROFILE, level: 'B2' })).not.toBe(base);
    expect(profileSignature({ ...DEFAULT_PROFILE, wordsPerDay: 2 })).not.toBe(base);
    expect(profileSignature({ ...DEFAULT_PROFILE, nativeLang: 'es' })).not.toBe(base);
    expect(profileSignature({ ...DEFAULT_PROFILE, topics: ['daily', 'business'] })).toBe(
      profileSignature({ ...DEFAULT_PROFILE, topics: ['business', 'daily'] }),
    );
  });
});

describe('notification plan', () => {
  const title = (word: WordCard) => `Palavra do dia: ${word.lemma}`;

  test('schedules one notification per word at the chosen time, skipping moments already past', () => {
    const state = daily({
      '2026-10-05': [card(1, 'deadline')],
      '2026-10-06': [card(2, 'commute')],
    });
    // Now is 09:00 on the 5th: today's 08:00 word is already past.
    const planned = planWordNotifications(state, '08:00', NOW, title);
    expect(planned.map((item) => item.word.lemma)).toEqual(['commute']);
    expect(planned[0].at).toEqual(new Date(2026, 9, 6, 8, 0, 0));
    expect(planned[0].title).toBe('Palavra do dia: commute');
    expect(planned[0].body).toBe('/x/ · prazo');
  });

  test('spreads several words of the same day four hours apart', () => {
    const state = daily({ '2026-10-06': [card(1, 'a'), card(2, 'b'), card(3, 'c')] });
    const hours = planWordNotifications(state, '08:00', NOW, title).map((item) =>
      item.at.getHours(),
    );
    expect(hours).toEqual([8, 12, 16]);
  });

  test('the body falls back to the English definition and omits a missing pronunciation', () => {
    const word = card(1, 'deadline', { translation: [], ipa: null });
    expect(meaningOf(word)).toBe('a time limit');
    const planned = planWordNotifications(daily({ '2026-10-06': [word] }), '08:00', NOW, title);
    expect(planned[0].body).toBe('a time limit');
  });
});

describe('offline dictionary search', () => {
  const entry = (id: number, lemma: string): WordSummary => ({
    id,
    lemma,
    pos: 'noun',
    level: 'B1',
    translation: null,
    gloss: '',
  });
  const pack: PackState = {
    lang: 'pt',
    levels: {
      B1: [entry(1, 'scheduled'), entry(2, 'schedule'), entry(3, 'school')],
      B2: [entry(4, 'Scheme')],
    },
  };

  test('matches by prefix, ignoring case, with the exact word first', () => {
    expect(searchPack(pack, 'sch').map((word) => word.lemma)).toEqual([
      'scheduled',
      'schedule',
      'school',
      'Scheme',
    ]);
    expect(searchPack(pack, ' Schedule ').map((word) => word.lemma)).toEqual([
      'schedule',
      'scheduled',
    ]);
    expect(searchPack(pack, '')).toEqual([]);
    expect(searchPack(pack, 'xyz')).toEqual([]);
  });
});

describe('persistent store', () => {
  beforeEach(() => clearMemoryStorage());

  test('saves changes and notifies subscribers', () => {
    const store = createPersistentStore('test-a', { count: 0 });
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    store.set((current) => ({ count: current.count + 1 }));
    expect(store.get()).toEqual({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set({ count: 5 });
    expect(listener).toHaveBeenCalledTimes(1);

    // A second store on the same key reads what was saved.
    expect(createPersistentStore('test-a', { count: 0 }).get()).toEqual({ count: 5 });
  });

  test('fills fields added after the value was saved with their defaults', () => {
    createPersistentStore<{ a: number }>('test-b', { a: 1 }).set({ a: 2 });
    const upgraded = createPersistentStore('test-b', { a: 1, b: 'new' });
    expect(upgraded.get()).toEqual({ a: 2, b: 'new' });
  });
});
