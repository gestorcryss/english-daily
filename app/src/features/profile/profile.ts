import type { CefrLevel, Topic } from '@/features/words/types';
import type { AppLocale } from '@/i18n';
import { createPersistentStore } from '@/lib/store';

export type Profile = {
  /** Language of the translations (ISO 639-1). */
  nativeLang: string;
  /** Interface language; null follows the device. */
  uiLocale: AppLocale | null;
  level: CefrLevel;
  levelAuto: boolean;
  topics: Topic[];
  wordsPerDay: 1 | 2 | 3;
  /** HH:MM, local time. */
  notifyTime: string;
  reviewReminder: boolean;
  reviewTime: string;
  onboardedAt: string | null;
  /** True while the latest changes have not reached the server. */
  dirty: boolean;
};

export const DEFAULT_PROFILE: Profile = {
  nativeLang: 'pt',
  uiLocale: null,
  level: 'A2',
  levelAuto: true,
  topics: [],
  wordsPerDay: 1,
  notifyTime: '08:00',
  reviewReminder: true,
  reviewTime: '20:00',
  onboardedAt: null,
  dirty: false,
};

export const profileStore = createPersistentStore<Profile>('profile', DEFAULT_PROFILE);

export function updateProfile(changes: Partial<Omit<Profile, 'dirty'>>): void {
  profileStore.set((current) => ({ ...current, ...changes, dirty: true }));
}

/** Languages offered for translations. Coverage comes from Wiktionary and varies by language. */
export const NATIVE_LANGUAGES: { code: string; name: string }[] = [
  { code: 'pt', name: 'Português' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'ru', name: 'Русский' },
  { code: 'uk', name: 'Українська' },
  { code: 'pl', name: 'Polski' },
  { code: 'ro', name: 'Română' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ar', name: 'العربية' },
  { code: 'fa', name: 'فارسی' },
  { code: 'he', name: 'עברית' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ไทย' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'cs', name: 'Čeština' },
  { code: 'hu', name: 'Magyar' },
  { code: 'sv', name: 'Svenska' },
  { code: 'da', name: 'Dansk' },
  { code: 'no', name: 'Norsk' },
  { code: 'fi', name: 'Suomi' },
];
