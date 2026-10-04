import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { Notice, ScreenHeader, SectionTitle } from '@/components/ui';
import { dailyStore } from '@/features/daily/daily-words';
import { recordActivity } from '@/features/learning/activity';
import {
  markKnown,
  startLearning,
  toggleFavorite,
  userWordsStore,
} from '@/features/learning/user-words';
import { errorMessageKey } from '@/features/session/setup';
import { syncToServer } from '@/features/session/sync';
import type { WordCard } from '@/features/words/types';
import { usePronunciation } from '@/features/words/use-pronunciation';
import { findLocalCard, loadCard } from '@/features/words/word-cache';
import { useI18n } from '@/i18n';
import { useStore } from '@/lib/store';
import { Fonts, Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

function isDailyWord(wordId: number): boolean {
  return Object.values(dailyStore.get().days).some((words) =>
    words.some((word) => word.id === wordId),
  );
}

export default function WordScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const wordId = Number(id);
  const userWords = useStore(userWordsStore);
  const { playWord, speak } = usePronunciation();
  const [card, setCard] = useState<WordCard | null>(() => findLocalCard(wordId));
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCard(wordId)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setErrorKey('word.notFound');
          return;
        }
        setCard(loaded);
        // Opening the word of the day puts it in the review queue.
        if (isDailyWord(loaded.id) && !userWordsStore.get().words[loaded.id]) {
          startLearning(loaded, 'daily');
          recordActivity();
          void syncToServer();
        }
      })
      .catch((error) => {
        if (!cancelled) setErrorKey(errorMessageKey(error));
      });
    return () => {
      cancelled = true;
    };
  }, [wordId]);

  if (!card) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader backLabel={t('common.back')} />
        {errorKey ? (
          <Notice text={t(errorKey)} />
        ) : (
          <ActivityIndicator color={theme.primary} accessibilityLabel={t('common.loading')} />
        )}
      </Screen>
    );
  }

  const own = userWords.words[card.id];
  const source = isDailyWord(card.id) ? 'daily' : 'search';
  const inReview = own?.status === 'learning' && own.review !== null;
  const known = own?.status === 'known';
  const inflections = card.forms.map((form) => form.form).filter((form) => form !== card.lemma);

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <Button
            variant="secondary"
            label={known ? t('word.knownDone') : t('word.known')}
            disabled={known}
            onPress={() => {
              markKnown(card, source);
              void syncToServer();
            }}
            style={styles.grow}
          />
          <Button
            label={inReview ? t('word.practice') : t('word.addToReview')}
            onPress={() => {
              if (inReview) {
                router.push({ pathname: '/review', params: { word: String(card.id) } });
              } else {
                startLearning(card, source);
                recordActivity();
                void syncToServer();
              }
            }}
            style={styles.grow}
          />
        </View>
      }>
      <ScreenHeader
        backLabel={t('common.back')}
        right={
          <IconButton
            icon="star"
            active={own?.isFavorite ?? false}
            accessibilityLabel={own?.isFavorite ? t('today.unsave') : t('today.save')}
            onPress={() => {
              toggleFavorite(card, source);
              void syncToServer();
            }}
          />
        }
      />

      <View style={styles.top}>
        <AppText accessibilityRole="header" style={styles.lemma}>
          {card.lemma}
        </AppText>
        <View style={styles.row}>
          {card.ipa ? <AppText tone="muted">{card.ipa}</AppText> : null}
          <IconButton
            icon="speaker"
            variant="tint"
            size={40}
            accessibilityLabel={t('today.listen')}
            onPress={() => playWord(card)}
          />
        </View>
        <View style={styles.badges}>
          <Badge label={t(`wordClass.${card.pos}`)} />
          <Badge label={card.level} tint />
          {card.topics.map((topic) => (
            <Badge key={topic} label={t(`topics.${topic}`)} />
          ))}
          {inReview ? <Badge label={t('word.inReview')} tint /> : null}
        </View>
      </View>

      <View style={[styles.translation, { backgroundColor: theme.primary }]}>
        <AppText variant="label" style={{ color: theme.onPrimary, opacity: 0.85 }}>
          {t('word.inYourLanguage')}
        </AppText>
        <AppText tone="onPrimary" style={styles.translationText}>
          {card.translation.length ? card.translation.join(', ') : t('word.noTranslation')}
        </AppText>
      </View>

      <SectionTitle>{t('word.meaning')}</SectionTitle>
      <View style={styles.senses}>
        {card.senses.map((sense, index) => (
          <AppText key={sense.gloss}>
            {card.senses.length > 1 ? `${index + 1}. ` : ''}
            {sense.gloss}
          </AppText>
        ))}
      </View>

      {card.examples.length ? (
        <>
          <SectionTitle>{t('word.examples')}</SectionTitle>
          {card.examples.map((example) => (
            <View
              key={example.text}
              style={[
                styles.example,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <View style={styles.grow}>
                <AppText>{example.text}</AppText>
                {example.translation ? (
                  <AppText variant="caption" tone="muted">
                    {example.translation}
                  </AppText>
                ) : null}
              </View>
              <IconButton
                icon="speaker"
                size={36}
                accessibilityLabel={t('word.listenExample')}
                onPress={() => speak(example.text)}
              />
            </View>
          ))}
        </>
      ) : null}

      {inflections.length ? (
        <>
          <SectionTitle>{t('word.forms')}</SectionTitle>
          <AppText>{inflections.join(' · ')}</AppText>
        </>
      ) : null}

      {card.synonyms.length ? (
        <>
          <SectionTitle>{t('word.synonyms')}</SectionTitle>
          <AppText>{card.synonyms.join(' · ')}</AppText>
        </>
      ) : null}

      <AppText variant="caption" tone="muted" style={styles.sources}>
        {t('word.sources')}
      </AppText>
    </Screen>
  );
}

function Badge({ label, tint = false }: { label: string; tint?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.badge,
        tint
          ? { backgroundColor: theme.primaryTint }
          : { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
      ]}>
      <AppText variant="caption" tone={tint ? 'onPrimaryTint' : 'muted'} style={styles.badgeText}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { gap: 10 },
  lemma: { fontFamily: Fonts.display, fontSize: 46, lineHeight: 52 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  badgeText: { fontFamily: Fonts.semibold, fontSize: 13 },
  translation: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 18,
    gap: 4,
  },
  translationText: { fontFamily: Fonts.bold, fontSize: 21, lineHeight: 28 },
  senses: { gap: Spacing.sm },
  example: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
  },
  sources: { marginTop: Spacing.sm },
  footer: { flexDirection: 'row', gap: 10 },
  grow: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
});
