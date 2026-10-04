import { toServerRow, userWordsStore } from '@/features/learning/user-words';
import { profileStore } from '@/features/profile/profile';

import { pushProfile, pushReviewLogs, pushUserWords } from './api';

let running: Promise<boolean> | null = null;

/**
 * Sends local changes (profile, words, answers) to the server.
 * Returns false when something could not be sent; the data stays marked and goes next time.
 */
export function syncToServer(): Promise<boolean> {
  running ??= run().finally(() => {
    running = null;
  });
  return running;
}

async function run(): Promise<boolean> {
  try {
    const profile = profileStore.get();
    if (profile.dirty) {
      await pushProfile(profile);
      // Only clear the flag if nothing changed while the request was in flight.
      profileStore.set((current) => (current === profile ? { ...current, dirty: false } : current));
    }

    const snapshot = userWordsStore.get();
    const dirtyWords = Object.values(snapshot.words).filter((word) => word.dirty);
    if (dirtyWords.length) {
      await pushUserWords(dirtyWords.map(toServerRow));
      userWordsStore.set((state) => {
        const words = { ...state.words };
        for (const sent of dirtyWords) {
          const current = words[sent.wordId];
          if (current && current.updatedAt === sent.updatedAt)
            words[sent.wordId] = { ...current, dirty: false };
        }
        return { ...state, words };
      });
    }

    const logs = userWordsStore.get().pendingLogs;
    if (logs.length) {
      await pushReviewLogs(logs);
      const sent = new Set(logs.map((log) => log.client_id));
      userWordsStore.set((state) => ({
        ...state,
        pendingLogs: state.pendingLogs.filter((log) => !sent.has(log.client_id)),
      }));
    }
    return true;
  } catch {
    return false;
  }
}
