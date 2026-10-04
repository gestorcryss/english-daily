import { router } from 'expo-router';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Notice } from '@/components/ui';
import { learningStats, userWordsStore } from '@/features/learning/user-words';
import { useI18n } from '@/i18n';
import { useStore } from '@/lib/store';

export default function PracticeScreen() {
  const { t } = useI18n();
  const userWords = useStore(userWordsStore);
  const stats = learningStats(userWords, new Date());

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        {t('practice.title')}
      </AppText>

      {stats.learning === 0 ? (
        <Notice title={t('practice.emptyTitle')} text={t('practice.emptyHelp')} />
      ) : (
        <>
          <Card variant="tint">
            <AppText variant="heading" tone="onPrimaryTint">
              {t('practice.dueTitle', { count: stats.due })}
            </AppText>
            <AppText variant="caption" tone="onPrimaryTint">
              {t('practice.dueHelp')}
            </AppText>
            {stats.due ? (
              <Button label={t('practice.startReview')} onPress={() => router.push('/review')} />
            ) : null}
          </Card>

          <Card>
            <AppText variant="heading">{t('practice.extraTitle')}</AppText>
            <AppText variant="caption" tone="muted">
              {t('practice.extraHelp')}
            </AppText>
            <Button
              variant="secondary"
              label={t('practice.startExtra')}
              onPress={() => router.push({ pathname: '/review', params: { mode: 'extra' } })}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}
