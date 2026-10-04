import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { dailyStore, daysCovered, profileSignature } from '@/features/daily/daily-words';
import {
  ACTION_KNOWN,
  ACTION_SAVE,
  configureNotificationHandler,
  notificationsSupported,
} from '@/features/daily/notifications';
import {
  markKnown,
  startLearning,
  toggleFavorite,
  userWordsStore,
} from '@/features/learning/user-words';
import { profileStore } from '@/features/profile/profile';
import { findLocalCard } from '@/features/words/word-cache';
import { useI18n } from '@/i18n';
import { useStore } from '@/lib/store';

import { refreshEverything, rescheduleFromLocal } from './setup';
import { syncToServer } from './sync';

/** Fewer stored days than this triggers a download of new words. */
const MIN_DAYS_STORED = 4;

function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as { wordId?: number; review?: boolean };
  if (data.review) {
    router.push('/review');
    return;
  }
  if (!data.wordId) return;

  const card = findLocalCard(data.wordId);
  if (response.actionIdentifier === ACTION_KNOWN) {
    if (card) markKnown(card, 'daily');
    void syncToServer();
  } else if (response.actionIdentifier === ACTION_SAVE) {
    if (card) {
      startLearning(card, 'daily');
      if (!userWordsStore.get().words[card.id]?.isFavorite) toggleFavorite(card, 'daily');
    }
    void syncToServer();
  } else {
    router.push(`/word/${data.wordId}`);
  }
}

/**
 * Keeps the device up to date while the app is in use: sends pending changes, downloads the words
 * of the next days when they are running out, keeps notifications scheduled and reacts to taps on them.
 */
export function useBootstrap(): void {
  const { t } = useI18n();
  const onboarded = useStore(profileStore).onboardedAt !== null;

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!onboarded) return;

    const run = () => {
      const now = new Date();
      const daily = dailyStore.get();
      const stale =
        daysCovered(daily, now) < MIN_DAYS_STORED ||
        daily.signature !== profileSignature(profileStore.get());
      if (stale) {
        refreshEverything(t, now).catch(() => rescheduleFromLocal(t, now).catch(() => undefined));
      } else {
        void syncToServer();
        rescheduleFromLocal(t, now).catch(() => undefined);
      }
    };

    run();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => subscription.remove();
  }, [onboarded, t]);

  useEffect(() => {
    if (!notificationsSupported || !onboarded) return;

    // A tap that opened the app from a closed state arrives here.
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      handleNotificationResponse(last);
      Notifications.clearLastNotificationResponse();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
      Notifications.clearLastNotificationResponse();
    });
    return () => subscription.remove();
  }, [onboarded]);
}
