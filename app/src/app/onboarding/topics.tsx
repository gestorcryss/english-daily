import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Chip, Notice, Segmented, TimeStepper } from '@/components/ui';
import {
  notificationsSupported,
  requestNotificationPermission,
} from '@/features/daily/notifications';
import { OnboardingHeader } from '@/features/onboarding/onboarding-header';
import { profileStore, updateProfile } from '@/features/profile/profile';
import { errorMessageKey, refreshEverything } from '@/features/session/setup';
import { TOPICS, type Topic } from '@/features/words/types';
import { useI18n } from '@/i18n';
import { useStore } from '@/lib/store';
import { Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function TopicsStep() {
  const theme = useTheme();
  const { t } = useI18n();
  const profile = useStore(profileStore);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const toggleTopic = (topic: Topic) => {
    // Read the stored value, not the rendered one, so two quick taps do not overwrite each other.
    const topics = profileStore.get().topics;
    updateProfile({
      topics: topics.includes(topic) ? topics.filter((item) => item !== topic) : [...topics, topic],
    });
  };

  const finish = async (askPermission: boolean) => {
    setBusy(true);
    setErrorKey(null);
    try {
      if (askPermission) await requestNotificationPermission();
      await refreshEverything(t);
      updateProfile({ onboardedAt: new Date().toISOString() });
      router.replace('/');
    } catch (error) {
      setErrorKey(errorMessageKey(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={theme.primary} />
            <AppText tone="muted">{t('onboarding.preparing')}</AppText>
          </View>
        ) : notificationsSupported ? (
          <>
            <Button label={t('onboarding.enableNotifications')} onPress={() => finish(true)} />
            <Button
              variant="secondary"
              label={t('onboarding.notNow')}
              onPress={() => finish(false)}
            />
          </>
        ) : (
          <Button label={t('onboarding.finish')} onPress={() => finish(false)} />
        )
      }>
      <OnboardingHeader step={3} />

      <View style={styles.titles}>
        <AppText variant="title" accessibilityRole="header">
          {t('onboarding.topicsTitle')}
        </AppText>
        <AppText tone="muted">{t('onboarding.topicsHelp')}</AppText>
      </View>

      <View style={styles.chips}>
        {TOPICS.map((topic) => (
          <Chip
            key={topic}
            label={t(`topics.${topic}`)}
            selected={profile.topics.includes(topic)}
            onPress={() => toggleTopic(topic)}
          />
        ))}
      </View>

      <AppText variant="heading" accessibilityRole="header" style={styles.when}>
        {t('onboarding.whenTitle')}
      </AppText>
      <TimeStepper
        value={profile.notifyTime}
        onChange={(notifyTime) => updateProfile({ notifyTime })}
        label={t('onboarding.time')}
        earlierLabel={t('onboarding.earlier')}
        laterLabel={t('onboarding.later')}
      />
      <View style={styles.field}>
        <AppText variant="caption" tone="muted">
          {t('onboarding.wordsPerDay')}
        </AppText>
        <Segmented
          label={t('onboarding.wordsPerDay')}
          value={profile.wordsPerDay}
          onChange={(wordsPerDay) => updateProfile({ wordsPerDay })}
          options={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
          ]}
        />
      </View>

      {notificationsSupported ? (
        <Card style={styles.info}>
          <View style={[styles.infoIcon, { backgroundColor: theme.primaryTint }]}>
            <Icon name="bell" color={theme.primaryText} size={20} />
          </View>
          <AppText variant="caption" tone="muted" style={styles.grow}>
            {t('onboarding.notificationsInfo')}
          </AppText>
        </Card>
      ) : null}

      {errorKey ? <Notice text={t(errorKey)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titles: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  when: { marginTop: Spacing.sm },
  field: { gap: Spacing.xs },
  info: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flexGrow: 1, flexShrink: 1 },
  busy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    minHeight: 52,
  },
});
