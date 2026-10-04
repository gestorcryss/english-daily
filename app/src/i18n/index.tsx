import { getLocales } from 'expo-localization';
import { I18n, type TranslateOptions } from 'i18n-js';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import en from './locales/en';
import pt from './locales/pt';

/** Languages of the app interface (not the translation language of words). */
export const SUPPORTED_LOCALES = ['pt', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

const i18n = new I18n({ pt, en });
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

export function resolveLocale(languageCode: string | null | undefined): AppLocale {
  return SUPPORTED_LOCALES.find((locale) => locale === languageCode) ?? 'en';
}

export function detectDeviceLocale(): AppLocale {
  return resolveLocale(getLocales()[0]?.languageCode);
}

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (scope: string, options?: TranslateOptions) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
  locale: controlledLocale,
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
  /** When given, the language follows this value (the app passes the one chosen in Settings). */
  locale?: AppLocale;
}) {
  const [ownLocale, setLocale] = useState<AppLocale>(() => initialLocale ?? detectDeviceLocale());
  const locale = controlledLocale ?? ownLocale;

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (scope, options) => i18n.t(scope, { locale, ...options }),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside <I18nProvider>');
  }
  return context;
}
