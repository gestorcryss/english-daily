import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { RadioRow } from '@/components/ui';
import { OnboardingHeader } from '@/features/onboarding/onboarding-header';
import { profileStore, updateProfile } from '@/features/profile/profile';
import type { CefrLevel } from '@/features/words/types';
import { useI18n } from '@/i18n';
import { useStore } from '@/lib/store';
import { Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const CHOICES: { level: CefrLevel; title: string; help: string; range: string }[] = [
  {
    level: 'A1',
    title: 'onboarding.levelBeginner',
    help: 'onboarding.levelBeginnerHelp',
    range: 'A1–A2',
  },
  { level: 'B1', title: 'onboarding.levelGetBy', help: 'onboarding.levelGetByHelp', range: 'B1' },
  {
    level: 'B2',
    title: 'onboarding.levelConfident',
    help: 'onboarding.levelConfidentHelp',
    range: 'B2',
  },
  {
    level: 'C1',
    title: 'onboarding.levelFluent',
    help: 'onboarding.levelFluentHelp',
    range: 'C1–C2',
  },
];

/** Self-assessment rows cover ranges: A2 belongs to the first row, C2 to the last. */
function choiceFor(level: CefrLevel): CefrLevel {
  if (level === 'A2') return 'A1';
  if (level === 'C2') return 'C1';
  return level;
}

export default function LevelStep() {
  const theme = useTheme();
  const { t } = useI18n();
  const profile = useStore(profileStore);

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <Button label={t('common.continue')} onPress={() => router.push('/onboarding/topics')} />
      }>
      <OnboardingHeader step={2} />

      <View style={styles.titles}>
        <AppText variant="title" accessibilityRole="header">
          {t('onboarding.levelTitle')}
        </AppText>
        <AppText tone="muted">{t('onboarding.levelHelp')}</AppText>
      </View>

      <Card variant="tint">
        <View style={styles.testRow}>
          <View style={[styles.testIcon, { backgroundColor: theme.surface }]}>
            <Icon name="clock" color={theme.primaryText} />
          </View>
          <View style={styles.grow}>
            <AppText variant="heading" tone="onPrimaryTint">
              {t('onboarding.testCardTitle')}
            </AppText>
            <AppText variant="caption" tone="onPrimaryTint">
              {t('onboarding.testCardInfo')} · {t('onboarding.recommended')}
            </AppText>
          </View>
        </View>
        <Button
          label={t('onboarding.takeTest')}
          size="medium"
          onPress={() => router.push('/onboarding/placement')}
        />
      </Card>

      <AppText variant="caption" tone="muted" style={styles.or}>
        {t('onboarding.orChoose')}
      </AppText>

      <View accessibilityRole="radiogroup" style={styles.list}>
        {CHOICES.map((choice) => (
          <RadioRow
            key={choice.level}
            title={t(choice.title)}
            description={t(choice.help)}
            trailing={choice.range}
            selected={choiceFor(profile.level) === choice.level}
            onPress={() => updateProfile({ level: choice.level })}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titles: { gap: 6 },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  testIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flexGrow: 1, flexShrink: 1 },
  or: { textAlign: 'center' },
  list: { gap: Spacing.sm },
});
