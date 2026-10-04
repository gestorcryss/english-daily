import type { Profile } from '@/features/profile/profile';
import type { CefrLevel, WordCard, WordSummary } from '@/features/words/types';
import { getSupabase } from '@/lib/supabase';

export class ApiError extends Error {
  constructor(
    public readonly kind: 'not-configured' | 'network' | 'server',
    message: string,
  ) {
    super(message);
  }
}

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError('not-configured', 'Supabase is not configured');
  return supabase;
}

function fail(error: { message: string }): never {
  const offline = /network|fetch|failed to/i.test(error.message);
  throw new ApiError(offline ? 'network' : 'server', error.message);
}

/** Makes sure there is a signed-in user; creates an anonymous account on first use. */
export async function ensureSession(): Promise<string> {
  const supabase = client();
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return existing.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) fail(error ?? { message: 'no user returned' });
  return data.user.id;
}

export async function pushProfile(profile: Profile): Promise<void> {
  const userId = await ensureSession();
  const { error } = await client().from('profiles').upsert({
    id: userId,
    native_lang: profile.nativeLang,
    level: profile.level,
    level_auto: profile.levelAuto,
    topics: profile.topics,
    words_per_day: profile.wordsPerDay,
    notify_time: profile.notifyTime,
    review_reminder: profile.reviewReminder,
    review_time: profile.reviewTime,
    onboarded_at: profile.onboardedAt,
    updated_at: new Date().toISOString(),
  });
  if (error) fail(error);
}

export type DailyWordRow = { day: string; position: number; word: WordCard };

export async function fetchDailyWords(from: string, days: number): Promise<DailyWordRow[]> {
  await ensureSession();
  const { data, error } = await client().rpc('get_daily_words', { p_from: from, p_days: days });
  if (error) fail(error);
  return (data ?? []) as DailyWordRow[];
}

export async function resetFutureDailyWords(from: string): Promise<void> {
  await ensureSession();
  const { error } = await client().rpc('reset_future_daily_words', { p_from: from });
  if (error) fail(error);
}

export async function fetchWordCard(wordId: number, lang: string): Promise<WordCard | null> {
  const { data, error } = await client().rpc('word_card', { p_word_id: wordId, p_lang: lang });
  if (error) fail(error);
  return (data as WordCard | null) ?? null;
}

export async function searchWords(query: string, lang: string): Promise<WordSummary[]> {
  const { data, error } = await client().rpc('search_words', {
    p_query: query,
    p_lang: lang,
    p_limit: 20,
  });
  if (error) fail(error);
  return (data ?? []) as WordSummary[];
}

export async function fetchLevelPack(level: CefrLevel, lang: string): Promise<WordSummary[]> {
  const { data, error } = await client().rpc('level_pack', { p_level: level, p_lang: lang });
  if (error) fail(error);
  return (data ?? []) as WordSummary[];
}

export type PlacementItem = {
  level: CefrLevel;
  wordId: number;
  lemma: string;
  ipa: string | null;
  answer: string;
  distractors: string[];
};

export async function fetchPlacementItems(lang: string): Promise<PlacementItem[]> {
  const { data, error } = await client().rpc('placement_items', { p_lang: lang, p_per_level: 5 });
  if (error) fail(error);
  return (data ?? []) as PlacementItem[];
}

export type UserWordRow = {
  word_id: number;
  status: 'learning' | 'known';
  is_favorite: boolean;
  source: 'daily' | 'search' | 'test';
  added_at: string;
  due: string | null;
  stability: number | null;
  difficulty: number | null;
  elapsed_days: number | null;
  scheduled_days: number | null;
  learning_steps: number | null;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  updated_at: string;
};

export async function pushUserWords(rows: UserWordRow[]): Promise<void> {
  if (!rows.length) return;
  const userId = await ensureSession();
  const { error } = await client()
    .from('user_words')
    .upsert(rows.map((row) => ({ ...row, user_id: userId })));
  if (error) fail(error);
}

export type ReviewLogRow = {
  client_id: string;
  word_id: number;
  rating: number;
  correct: boolean;
  exercise: string;
  word_level: CefrLevel;
  reviewed_at: string;
};

export async function pushReviewLogs(rows: ReviewLogRow[]): Promise<void> {
  if (!rows.length) return;
  const userId = await ensureSession();
  const { error } = await client()
    .from('review_logs')
    .upsert(
      rows.map((row) => ({ ...row, user_id: userId })),
      { onConflict: 'user_id,client_id', ignoreDuplicates: true },
    );
  if (error) fail(error);
}

export async function deleteAccount(): Promise<void> {
  const supabase = client();
  const { error } = await supabase.rpc('delete_my_account');
  if (error) fail(error);
  await supabase.auth.signOut({ scope: 'local' });
}
