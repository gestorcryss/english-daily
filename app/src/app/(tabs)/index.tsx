import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ListGroup, ListRow, Notice, ProgressBar } from '@/components/ui';
import { dailyStore, wordsOfDay } from '@/features/daily/daily-words';
import { activityStore, currentStreak } from '@/features/learning/activity';
import { levelProgress } from '@/features/learning/adaptive-level';
import {
  learningStats,
  masteredAtLevel,
  toggleFavorite,
  userWordsStore,
} from '@/features/learning/user-words';
import { profileStore } from '@/features/profile/profile';
import { errorMessageKey, refreshEverything } from '@/features/session/setup';
import { greetingKey } from '@/features/today/greeting';
import { WordOfTheDayCard } from '@/features/today/word-of-the-day-card';
import { nextLevel } from '@/features/words/types';
import { usePronunciation } from '@/features/words/use-pronunciation';
import { useI18n } from '@/i18n';
import { toDayString } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { Fonts, Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Rough time one review takes, for the "about N min" estimate. */
const SECONDS_PER_REVIEW = 25;

export default function TodayScreen() {
  const theme = useTheme();
  const { t, locale } = useI18n();
  const profile = useStore(profileStore);
  const daily = useStore(dailyStore);
  const userWords = useStore(userWordsStore);
  const activity = useStore(activityStore);
  const { playWord } = usePronunciation();
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const now = new Date();
  const words = wordsOfDay(daily, toDayString(now));
  const [main, ...others] = words;
  const stats = learningStats(userWords, now);
  const streak = currentStreak(activity, now);
  const next = nextLevel(profile.level);
  const progress = levelProgress(
    profile.level,
    userWords.history,
    masteredAtLevel(userWords, profile.level),
    now,
  );
  const dateLabel = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  const refresh = async () => {
    setBusy(true);
    setErrorKey(null);
    try {
      await refreshEverything(t);
    } catch (error) {
      setErrorKey(errorMessageKey(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: theme.primary }]}>
          <AppText tone="onPrimary" style={styles.logoText}>
            Ed
          </AppText>
        </View>
        <AppText variant="heading" style={styles.grow}>
          English Daily
        </AppText>
        <View
          accessible
          accessibilityLabel={t('today.streak', { count: streak })}
          style={[styles.streak, { backgroundColor: theme.streakBackground }]}>
          <Icon name="flame" color={theme.streakText} size={16} />
          <AppText tone="streak" style={styles.streakText}>
            {streak}
          </AppText>
        </View>
        <IconButton
          icon="settings"
          accessibilityLabel={t('common.moreOptions')}
          onPress={() => router.push('/settings')}
          style={styles.menu}
        />
      </View>

      <View style={styles.greeting}>
        <AppText variant="caption" tone="muted">
          {dateLabel}
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          {t(greetingKey(now.getHours()))}
        </AppText>
      </View>

      {main ? (
        <WordOfTheDayCard
          word={main}
          isFavorite={userWords.words[main.id]?.isFavorite ?? false}
          onOpen={() => router.push(`/word/${main.id}`)}
          onListen={() => playWord(main)}
          onToggleFavorite={() => toggleFavorite(main, 'daily')}
        />
      ) : (
        <Notice
          text={errorKey ? t(errorKey) : t('today.noWords')}
          action={
            busy ? (
              <ActivityIndicator color={theme.primary} accessibilityLabel={t('common.loading')} />
            ) : (
              <Button label={t('today.refresh')} size="medium" onPress={refresh} />
            )
          }
        />
      )}

      {others.length ? (
        <>
          <AppText variant="label" tone="muted" style={styles.sectionLabel}>
            {t('today.moreToday')}
          </AppText>
          <ListGroup>
            {others.map((word, index) => (
              <ListRow
                key={word.id}
                title={word.lemma}
                description={word.translation.join(', ') || word.senses[0]?.gloss}
                value={word.level}
                last={index === others.length - 1}
                onPress={() => router.push(`/word/${word.id}`)}
              />
            ))}
          </ListGroup>
        </>
      ) : null}

      <Card variant="tint" style={styles.reviewCard}>
        <View style={styles.grow}>
          <AppText variant="heading" tone="onPrimaryTint">
            {t('today.reviewTitle')}
          </AppText>
          <AppText variant="caption" tone="onPrimaryTint">
            {stats.due
              ? t('today.reviewSummary', {
                  count: stats.due,
                  minutes: Math.max(1, Math.round((stats.due * SECONDS_PER_REVIEW) / 60)),
                })
              : t('today.reviewNone')}
          </AppText>
        </View>
        {stats.due ? (
          <Button label={t('today.start')} size="medium" onPress={() => router.push('/review')} />
        ) : null}
      </Card>

      <Card>
        <View style={styles.levelRow}>
          <AppText variant="heading" style={styles.grow}>
            {t('today.level', { level: profile.level })}
          </AppText>
          <AppText variant="caption" tone="muted">
            {next ? t('today.levelProgress', { percent: progress, next }) : t('today.levelTop')}
          </AppText>
        </View>
        <ProgressBar
          percent={next ? progress : 100}
          label={t('today.level', { level: profile.level })}
        />
        <AppText variant="caption" tone="muted">
          {t('today.wordsLearned', { count: stats.learning })}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: Fonts.display,
    fontSize: 16,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
  },
  streakText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  menu: {
    marginRight: -10,
  },
  greeting: {
    gap: 2,
  },
  sectionLabel: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  grow: {
    flexGrow: 1,
    flexShrink: 1,
  },
});
