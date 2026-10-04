import { dailyStore, refreshDailyWords } from '@/features/daily/daily-words';
import { rescheduleNotifications, type NotificationTexts } from '@/features/daily/notifications';
import { profileStore } from '@/features/profile/profile';
import { ensureLevelPacks } from '@/features/words/level-pack';

import { ApiError, ensureSession } from './api';
import { syncToServer } from './sync';

type Translate = (scope: string, options?: Record<string, unknown>) => string;

export function notificationTexts(t: Translate): NotificationTexts {
  return {
    wordChannel: t('notifications.wordChannel'),
    reviewChannel: t('notifications.reviewChannel'),
    wordTitle: (word) => t('notifications.wordTitle', { word: word.lemma }),
    actionKnown: t('notifications.actionKnown'),
    actionSave: t('notifications.actionSave'),
    reviewTitle: t('notifications.reviewTitle'),
    reviewBody: t('notifications.reviewBody'),
  };
}

/** Translation key for the message that explains a failed request. */
export function errorMessageKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === 'network') return 'common.offline';
    if (error.kind === 'not-configured') return 'common.notConfigured';
  }
  return 'common.serverError';
}

/**
 * Brings the device up to date with the server: sends local changes, downloads the words
 * of the next days and the level packs, and reschedules the notifications.
 * Throws when the words could not be downloaded.
 */
export async function refreshEverything(t: Translate, now = new Date()): Promise<void> {
  await ensureSession();
  await syncToServer();
  const profile = profileStore.get();
  const daily = await refreshDailyWords(profile, now);
  await rescheduleNotifications(daily, profile, notificationTexts(t), now);
  // The packs are a convenience (offline search, exercises); a failure here must not block the app.
  await ensureLevelPacks(profile.level, profile.nativeLang).catch(() => undefined);
}

/** Reschedules notifications from what is already on the device (no network needed). */
export async function rescheduleFromLocal(t: Translate, now = new Date()): Promise<void> {
  await rescheduleNotifications(dailyStore.get(), profileStore.get(), notificationTexts(t), now);
}
