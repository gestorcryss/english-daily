import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ListGroup, ListRow } from '@/components/ui';
import { activityStore, currentStreak, lastWeek } from '@/features/learning/activity';
import { learningStats, userWordsStore } from '@/features/learning/user-words';
import { profileStore } from '@/features/profile/profile';
import { useI18n } from '@/i18n';
import { atTime } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { Fonts, Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const CHART_HEIGHT = 84;

export default function ProfileScreen() {
  const theme = useTheme();
  const { t, locale } = useI18n();
  const profile = useStore(profileStore);
  const userWords = useStore(userWordsStore);
  const activity = useStore(activityStore);

  const now = new Date();
  const stats = learningStats(userWords, now);
  const answered = userWords.history.length;
  const accuracy = answered
    ? `${Math.round((userWords.history.filter((answer) => answer.correct).length / answered) * 100)}%`
    : t('profile.noData');
  const week = lastWeek(activity, now);
  const peak = Math.max(1, ...week.map((day) => day.answers));
  const weekday = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    weekday: 'narrow',
  });

  const tiles = [
    { label: t('profile.streakLabel'), value: String(currentStreak(activity, now)) },
    { label: t('profile.learning'), value: String(stats.learning) },
    { label: t('profile.mastered'), value: String(stats.mastered + stats.known) },
    { label: t('profile.accuracy'), value: accuracy },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header" style={styles.grow}>
          {t('profile.title')}
        </AppText>
        <IconButton
          icon="settings"
          accessibilityLabel={t('profile.settings')}
          onPress={() => router.push('/settings')}
          style={styles.settings}
        />
      </View>

      <AppText tone="muted">
        {t('today.level', { level: profile.level })}
        {profile.topics.length
          ? ` · ${profile.topics.map((topic) => t(`topics.${topic}`)).join(', ')}`
          : ''}
      </AppText>

      <View style={styles.tiles}>
        {tiles.map((tile) => (
          <View
            key={tile.label}
            accessible
            accessibilityLabel={`${tile.label}: ${tile.value}`}
            style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppText variant="caption" tone="muted">
              {tile.label}
            </AppText>
            <AppText style={styles.tileValue}>{tile.value}</AppText>
          </View>
        ))}
      </View>

      <Card>
        <View style={styles.chartHeader}>
          <AppText variant="heading" style={styles.grow}>
            {t('profile.weekTitle')}
          </AppText>
          <AppText variant="caption" tone="muted">
            {t('profile.weekUnit')}
          </AppText>
        </View>
        <View style={styles.chart}>
          {week.map((day, index) => {
            const isToday = index === week.length - 1;
            return (
              <View
                key={day.day}
                accessible
                accessibilityLabel={`${day.day}: ${day.answers}`}
                style={styles.chartColumn}>
                <AppText variant="caption" tone="muted" style={styles.chartValue}>
                  {day.answers || ''}
                </AppText>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(3, (day.answers / peak) * CHART_HEIGHT),
                      backgroundColor: day.answers ? theme.primary : theme.surfaceMuted,
                      opacity: day.answers && !isToday ? 0.45 : 1,
                    },
                  ]}
                />
                <AppText
                  variant="caption"
                  tone={isToday ? 'primary' : 'muted'}
                  style={isToday ? styles.bold : undefined}>
                  {weekday.format(atTime(day.day, '12:00'))}
                </AppText>
              </View>
            );
          })}
        </View>
      </Card>

      <ListGroup>
        <ListRow
          icon="star"
          title={t('profile.favorites')}
          value={String(stats.favorites)}
          onPress={() => router.push('/favorites')}
        />
        <ListRow
          icon="clock"
          title={t('profile.history')}
          onPress={() => router.push('/history')}
        />
        <ListRow
          icon="settings"
          title={t('profile.settings')}
          last
          onPress={() => router.push('/settings')}
        />
      </ListGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  settings: { marginRight: -10 },
  grow: { flexGrow: 1, flexShrink: 1 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    gap: 2,
  },
  tileValue: { fontFamily: Fonts.bold, fontSize: 28, lineHeight: 34 },
  chartHeader: { flexDirection: 'row', alignItems: 'baseline' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: Spacing.sm },
  chartColumn: { flex: 1, alignItems: 'center', gap: 4 },
  chartValue: { fontSize: 12, lineHeight: 16, minHeight: 16 },
  bar: { alignSelf: 'stretch', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  bold: { fontFamily: Fonts.bold },
});
