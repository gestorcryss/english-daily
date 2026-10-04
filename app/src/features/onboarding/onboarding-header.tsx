import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { IconButton } from '@/components/icon-button';
import { StepDots } from '@/components/ui';
import { useI18n } from '@/i18n';
import { Fonts, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export const ONBOARDING_STEPS = 3;

/** Logo or back button, step counter and step dots at the top of each onboarding screen. */
export function OnboardingHeader({ step }: { step: number }) {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {step === 1 ? (
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: theme.primary }]}>
              <AppText tone="onPrimary" style={styles.logoText}>
                Ed
              </AppText>
            </View>
            <AppText variant="heading">English Daily</AppText>
          </View>
        ) : (
          <IconButton
            icon="back"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={styles.back}
          />
        )}
        <AppText variant="caption" tone="muted">
          {t('common.step', { current: step, total: ONBOARDING_STEPS })}
        </AppText>
      </View>
      <StepDots current={step} total={ONBOARDING_STEPS} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: Fonts.display, fontSize: 17 },
  back: { marginLeft: -10 },
  spacer: { height: Spacing.sm },
});
