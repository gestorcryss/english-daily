import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Share, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import {
  Chip,
  ListGroup,
  ListRow,
  Notice,
  ScreenHeader,
  SectionTitle,
  Segmented,
  TimeStepper,
} from '@/components/ui';
import { dailyStore } from '@/features/daily/daily-words';
import {
  notificationsGranted,
  notificationsSupported,
  requestNotificationPermission,
} from '@/features/daily/notifications';
import { activityStore } from '@/features/learning/activity';
import { userWordsStore } from '@/features/learning/user-words';
import { NATIVE_LANGUAGES, profileStore, updateProfile } from '@/features/profile/profile';
import { ServerStatusCard } from '@/features/server/server-status-card';
import { deleteAccount } from '@/features/session/api';
import { wipeLocalData } from '@/features/session/local-data';
import { rescheduleFromLocal } from '@/features/session/setup';
import { CEFR_LEVELS, TOPICS, type Topic } from '@/features/words/types';
import { useI18n, type AppLocale } from '@/i18n';
import { useStore } from '@/lib/store';
import { Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type UiChoice = AppLocale | 'auto';

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const profile = useStore(profileStore);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    notificationsGranted().then(setGranted);
  }, []);

  // Times and the reminder switch only change what is scheduled on the device.
  const changeSchedule = (changes: Parameters<typeof updateProfile>[0]) => {
    updateProfile(changes);
    rescheduleFromLocal(t).catch(() => undefined);
  };

  const toggleTopic = (topic: Topic) => {
    // Read the stored value, not the rendered one, so two quick taps do not overwrite each other.
    const topics = profileStore.get().topics;
    updateProfile({
      topics: topics.includes(topic) ? topics.filter((item) => item !== topic) : [...topics, topic],
    });
  };

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      profile: profileStore.get(),
      words: Object.values(userWordsStore.get().words).map(({ card, ...word }) => ({
        ...word,
        lemma: card.lemma,
        level: card.level,
      })),
      answers: userWordsStore.get().history,
      activity: activityStore.get().days,
      dailyWords: Object.fromEntries(
        Object.entries(dailyStore.get().days).map(([day, words]) => [
          day,
          words.map((word) => word.lemma),
        ]),
      ),
    };
    void Share.share({ message: JSON.stringify(data, null, 2), title: 'English Daily' });
  };

  const erase = async () => {
    setDeleteError(false);
    try {
      await deleteAccount();
      wipeLocalData();
      router.replace('/onboarding');
    } catch {
      setDeleteError(true);
    }
  };

  const confirmErase = () => {
    if (Platform.OS === 'web') {
      if (
        globalThis.confirm?.(
          `${t('settings.deleteConfirmTitle')}\n\n${t('settings.deleteConfirmText')}`,
        )
      ) {
        void erase();
      }
      return;
    }
    Alert.alert(t('settings.deleteConfirmTitle'), t('settings.deleteConfirmText'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.deleteConfirm'), style: 'destructive', onPress: () => void erase() },
    ]);
  };

  const languageName =
    NATIVE_LANGUAGES.find((language) => language.code === profile.nativeLang)?.name ??
    profile.nativeLang;

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.title')} backLabel={t('common.back')} />

      <SectionTitle>{t('settings.learning')}</SectionTitle>
      <View style={styles.field}>
        <AppText variant="caption" tone="muted">
          {t('settings.level')}
        </AppText>
        <Segmented
          label={t('settings.level')}
          value={profile.level}
          onChange={(level) => updateProfile({ level })}
          options={CEFR_LEVELS.map((level) => ({ value: level, label: level }))}
        />
      </View>
      <ListGroup>
        <ListRow
          title={t('settings.levelAuto')}
          description={t('settings.levelAutoHelp')}
          last
          right={
            <Switch
              value={profile.levelAuto}
              onValueChange={(levelAuto) => updateProfile({ levelAuto })}
              accessibilityLabel={t('settings.levelAuto')}
              trackColor={{ true: theme.primary }}
            />
          }
        />
      </ListGroup>
      <View style={styles.field}>
        <AppText variant="caption" tone="muted">
          {t('settings.topics')}
        </AppText>
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
      </View>
      <View style={styles.field}>
        <AppText variant="caption" tone="muted">
          {t('settings.wordsPerDay')}
        </AppText>
        <Segmented
          label={t('settings.wordsPerDay')}
          value={profile.wordsPerDay}
          onChange={(wordsPerDay) => updateProfile({ wordsPerDay })}
          options={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
          ]}
        />
      </View>

      <SectionTitle>{t('settings.notifications')}</SectionTitle>
      {notificationsSupported && granted === false ? (
        <Notice
          text={t('settings.notificationsOff')}
          action={
            <Button
              size="medium"
              label={t('settings.allowNotifications')}
              onPress={async () => {
                const allowed = await requestNotificationPermission();
                setGranted(allowed);
                if (allowed) rescheduleFromLocal(t).catch(() => undefined);
                else void Linking.openSettings();
              }}
            />
          }
        />
      ) : null}
      <TimeStepper
        value={profile.notifyTime}
        onChange={(notifyTime) => changeSchedule({ notifyTime })}
        label={t('settings.wordTime')}
        earlierLabel={t('onboarding.earlier')}
        laterLabel={t('onboarding.later')}
      />
      <ListGroup>
        <ListRow
          title={t('settings.reviewReminder')}
          right={
            <Switch
              value={profile.reviewReminder}
              onValueChange={(reviewReminder) => changeSchedule({ reviewReminder })}
              accessibilityLabel={t('settings.reviewReminder')}
              trackColor={{ true: theme.primary }}
            />
          }
        />
        <ListRow
          title={t('settings.notificationsHelp')}
          last
          onPress={() => setShowHelp((value) => !value)}
        />
      </ListGroup>
      {profile.reviewReminder ? (
        <TimeStepper
          value={profile.reviewTime}
          onChange={(reviewTime) => changeSchedule({ reviewTime })}
          label={t('settings.reviewTime')}
          earlierLabel={t('onboarding.earlier')}
          laterLabel={t('onboarding.later')}
        />
      ) : null}
      {showHelp ? <Notice text={t('settings.notificationsHelpText')} /> : null}

      <SectionTitle>{t('settings.language')}</SectionTitle>
      <ListGroup>
        <ListRow
          title={t('settings.nativeLang')}
          value={languageName}
          last
          onPress={() => router.push('/language')}
        />
      </ListGroup>
      <View style={styles.field}>
        <AppText variant="caption" tone="muted">
          {t('settings.uiLang')}
        </AppText>
        <Segmented<UiChoice>
          label={t('settings.uiLang')}
          value={profile.uiLocale ?? 'auto'}
          onChange={(choice) => updateProfile({ uiLocale: choice === 'auto' ? null : choice })}
          options={[
            { value: 'auto', label: t('settings.uiLangAuto') },
            { value: 'pt', label: 'Português' },
            { value: 'en', label: 'English' },
          ]}
        />
      </View>

      <SectionTitle>{t('settings.account')}</SectionTitle>
      <ListGroup>
        <ListRow title={t('settings.exportData')} onPress={exportData} />
        <ListRow title={t('settings.deleteAccount')} danger last onPress={confirmErase} />
      </ListGroup>
      {deleteError ? <Notice text={t('settings.deleteFailed')} /> : null}

      <SectionTitle>{t('settings.about')}</SectionTitle>
      <ListGroup>
        <ListRow title={t('settings.credits')} onPress={() => router.push('/credits')} />
        <ListRow title={t('settings.version')} value={Constants.expoConfig?.version ?? ''} last />
      </ListGroup>
      <ServerStatusCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
