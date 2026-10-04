import { fireEvent, render, screen } from '@testing-library/react-native';

import { WordOfTheDayCard } from '@/features/today/word-of-the-day-card';
import type { WordCard } from '@/features/words/types';
import { I18nProvider } from '@/i18n';

const DEADLINE: WordCard = {
  id: 1,
  lemma: 'deadline',
  pos: 'noun',
  level: 'B1',
  ipa: '/ˈdɛdˌlaɪn/',
  audioUrl: null,
  forms: [{ form: 'deadlines', tags: ['plural'] }],
  synonyms: [],
  topics: ['business'],
  translation: ['prazo final', 'data-limite'],
  senses: [{ gloss: 'A date on or before which something must be completed.' }],
  examples: [],
};

describe('<WordOfTheDayCard />', () => {
  test('shows the word, its level, topic, definition and translation', async () => {
    await render(
      <I18nProvider initialLocale="pt">
        <WordOfTheDayCard word={DEADLINE} />
      </I18nProvider>,
    );

    expect(screen.getByText('deadline')).toBeTruthy();
    expect(screen.getByText('B1')).toBeTruthy();
    expect(screen.getByText('Negócios')).toBeTruthy();
    expect(screen.getByText('A date on or before which something must be completed.')).toBeTruthy();
    expect(screen.getByText('prazo final, data-limite')).toBeTruthy();
    expect(screen.getByText('nome · /ˈdɛdˌlaɪn/')).toBeTruthy();
  });

  test('hides the translation box when the language has no translation', async () => {
    await render(
      <I18nProvider initialLocale="pt">
        <WordOfTheDayCard word={{ ...DEADLINE, translation: [] }} />
      </I18nProvider>,
    );
    expect(screen.queryByText('prazo final, data-limite')).toBeNull();
  });

  test('icon buttons have spoken labels and call their handlers', async () => {
    const onListen = jest.fn();
    const onToggleFavorite = jest.fn();
    await render(
      <I18nProvider initialLocale="pt">
        <WordOfTheDayCard word={DEADLINE} onListen={onListen} onToggleFavorite={onToggleFavorite} />
      </I18nProvider>,
    );

    await fireEvent.press(screen.getByLabelText('Ouvir a pronúncia'));
    await fireEvent.press(screen.getByLabelText('Guardar nos favoritos'));

    expect(onListen).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
