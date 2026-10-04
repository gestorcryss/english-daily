import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { I18nProvider, resolveLocale, useI18n } from '@/i18n';
import en from '@/i18n/locales/en';
import pt from '@/i18n/locales/pt';

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null
      ? keysOf(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

function Probe({ scope, count }: { scope: string; count?: number }) {
  const { t } = useI18n();
  return <Text>{t(scope, { count, minutes: 4 })}</Text>;
}

describe('i18n', () => {
  test('resolveLocale falls back to English for unsupported languages', () => {
    expect(resolveLocale('pt')).toBe('pt');
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('fr')).toBe('en');
    expect(resolveLocale(null)).toBe('en');
  });

  test('Portuguese and English define the same keys', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(pt).sort());
  });

  test('pluralises in Portuguese', async () => {
    await render(
      <I18nProvider initialLocale="pt">
        <Probe scope="today.reviewSummary" count={8} />
      </I18nProvider>,
    );
    expect(screen.getByText('8 palavras · cerca de 4 min')).toBeTruthy();
  });

  test('uses the singular form for one item', async () => {
    await render(
      <I18nProvider initialLocale="en">
        <Probe scope="today.wordsLearned" count={1} />
      </I18nProvider>,
    );
    expect(screen.getByText('1 word in study')).toBeTruthy();
  });
});
