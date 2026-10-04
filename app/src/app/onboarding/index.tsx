import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { OnboardingHeader } from '@/features/onboarding/onboarding-header';
import { LanguageList } from '@/features/profile/language-list';
import { profileStore, updateProfile } from '@/features/profile/profile';
import { useI18n } from '@/i18n';
import { useStore } from '@/lib/store';
import { Fonts } from '@/theme/tokens';

export default function LanguageStep() {
  const { t } = useI18n();
  const profile = useStore(profileStore);

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <Button label={t('common.continue')} onPress={() => router.push('/onboarding/level')} />
      }>
      <OnboardingHeader step={1} />

      <Card>
        <AppText variant="label" tone="primary">
          {t('onboarding.tagline')}
        </AppText>
        <AppText style={styles.sample}>serendipity</AppText>
      </Card>

      <View style={styles.titles}>
        <AppText variant="title" accessibilityRole="header">
          {t('onboarding.languageTitle')}
        </AppText>
        <AppText tone="muted">{t('onboarding.languageHelp')}</AppText>
      </View>

      <LanguageList
        value={profile.nativeLang}
        onChange={(nativeLang) => updateProfile({ nativeLang })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sample: { fontFamily: Fonts.display, fontSize: 32, lineHeight: 38 },
  titles: { gap: 6 },
});
