import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Profile } from '@/features/profile/profile';
import type { WordCard } from '@/features/words/types';

import type { DailyState } from './daily-words';
import { planWordNotifications } from './notification-plan';

const WORD_CHANNEL = 'daily-word';
const REVIEW_CHANNEL = 'review-reminder';
export const WORD_CATEGORY = 'daily-word';
export const ACTION_KNOWN = 'known';
export const ACTION_SAVE = 'save';

/** Local notifications do not exist on the web build, which is only used for previews. */
export const notificationsSupported = Platform.OS !== 'web';

export type NotificationTexts = {
  wordChannel: string;
  reviewChannel: string;
  wordTitle: (word: WordCard) => string;
  actionKnown: string;
  actionSave: string;
  reviewTitle: string;
  reviewBody: string;
};

export function configureNotificationHandler(): void {
  if (!notificationsSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function notificationsGranted(): Promise<boolean> {
  if (!notificationsSupported) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Shows the system permission prompt. Call only after explaining why (onboarding step 3). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function prepare(texts: NotificationTexts): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(WORD_CHANNEL, {
      name: texts.wordChannel,
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync(REVIEW_CHANNEL, {
      name: texts.reviewChannel,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.setNotificationCategoryAsync(WORD_CATEGORY, [
    {
      identifier: ACTION_KNOWN,
      buttonTitle: texts.actionKnown,
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_SAVE,
      buttonTitle: texts.actionSave,
      options: { opensAppToForeground: false },
    },
  ]);
}

/**
 * Replaces every scheduled notification with the current plan:
 * one notification per stored word of the day, plus the daily review reminder.
 * The system fires them even when the app is closed and the phone is offline.
 */
export async function rescheduleNotifications(
  daily: DailyState,
  profile: Profile,
  texts: NotificationTexts,
  now = new Date(),
): Promise<number> {
  if (!(await notificationsGranted())) return 0;
  await prepare(texts);
  await Notifications.cancelAllScheduledNotificationsAsync();

  const planned = planWordNotifications(daily, profile.notifyTime, now, texts.wordTitle);
  for (const item of planned) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: item.body,
        categoryIdentifier: WORD_CATEGORY,
        data: { wordId: item.word.id, day: item.day },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.at,
        channelId: WORD_CHANNEL,
      },
    });
  }

  if (profile.reviewReminder) {
    const [hour, minute] = profile.reviewTime.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: texts.reviewTitle, body: texts.reviewBody, data: { review: true } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: REVIEW_CHANNEL,
      },
    });
  }
  return planned.length;
}
