import { dailyStore } from '@/features/daily/daily-words';
import { activityStore } from '@/features/learning/activity';
import { userWordsStore } from '@/features/learning/user-words';
import { DEFAULT_PROFILE, profileStore } from '@/features/profile/profile';
import { packStore } from '@/features/words/level-pack';
import { removeKey } from '@/lib/storage';

/** Erases everything the app keeps on the device and returns it to the first-launch state. */
export function wipeLocalData(): void {
  profileStore.set(DEFAULT_PROFILE);
  userWordsStore.set({ words: {}, pendingLogs: [], history: [] });
  dailyStore.set({ days: {}, signature: null, fetchedAt: null });
  activityStore.set({ days: {} });
  packStore.set({ lang: null, levels: {} });
  removeKey('word-cache');
  removeKey('recent-searches');
}
