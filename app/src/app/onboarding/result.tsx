import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { updateProfile } from '@/features/profile/profile';
import { CEFR_LEVELS, type CefrLevel } from '@/features/words/types';
import { useI18n } from '@/i18n';
import { Fonts, Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function PlacementResult() {
  const theme = useTheme();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ level?: string; correct?: string; total?: string }>();
  const level: CefrLevel = CEFR_LEVELS.includes(params.level as CefrLevel)
    ? (params.level as CefrLevel)
    : 'A2';
  const reached = CEFR_LEVELS.indexOf(level);

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <>
          <Button
            label={t('common.continue')}
            onPress={() => {
              updateProfile({ level });
              router.replace('/onboarding/topics');
            }}
          />
          <Button
            variant="secondary"
            label={t('placement.chooseOther')}
            onPress={() => router.replace('/onboarding/level')}
          />
        </>
      }>
      <View style={styles.top}>
        <AppText variant="label" tone="muted">
          {t('placement.resultLabel')}
        </AppText>
        <View
          accessible
          accessibilityLabel={`${level}, ${t(`placement.levelName.${level}`)}`}
          style={[
            styles.circle,
            { backgroundColor: theme.primaryTint, borderColor: theme.primary },
          ]}>
          <AppText tone="onPrimaryTint" style={styles.level}>
            {level}
          </AppText>
          <AppText variant="caption" tone="onPrimaryTint" style={styles.levelName}>
            {t(`placement.levelName.${level}`)}
          </AppText>
        </View>
        <AppText variant="title" accessibilityRole="header">
          {t('placement.resultTitle')}
        </AppText>
        <AppText tone="muted" style={styles.center}>
          {t('placement.resultText', {
            correct: params.correct ?? '0',
            total: params.total ?? '0',
            level,
          })}
        </AppText>
      </View>

      <Card>
        <View style={styles.scale}>
          {CEFR_LEVELS.map((item, index) => (
            <View key={item} style={styles.scaleItem}>
              <View
                style={[
                  styles.scaleBar,
                  { backgroundColor: index <= reached ? theme.primary : theme.border },
                ]}
              />
              <AppText
                variant="caption"
                tone={item === level ? 'primary' : 'muted'}
                style={item === level ? styles.bold : undefined}>
                {item}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.info}>
        <View style={[styles.infoIcon, { backgroundColor: theme.primaryTint }]}>
          <Icon name="trend" color={theme.primaryText} size={20} />
        </View>
        <AppText variant="caption" tone="muted" style={styles.grow}>
          {t('placement.resultInfo')}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', gap: Spacing.lg, paddingTop: Spacing.xxl },
  circle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  level: { fontFamily: Fonts.display, fontSize: 52, lineHeight: 58 },
  levelName: { fontFamily: Fonts.semibold },
  center: { textAlign: 'center' },
  scale: { flexDirection: 'row', gap: Spacing.xs },
  scaleItem: { flex: 1, alignItems: 'center', gap: 6 },
  scaleBar: { height: 10, borderRadius: 5, alignSelf: 'stretch' },
  bold: { fontFamily: Fonts.bold },
  info: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flexGrow: 1, flexShrink: 1 },
});
