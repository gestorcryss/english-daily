import { router } from 'expo-router';

import { Screen } from '@/components/screen';
import { ListGroup, ListRow, Notice, ScreenHeader } from '@/components/ui';
import { dailyStore } from '@/features/daily/daily-words';
import { meaningOf } from '@/features/words/types';
import { useI18n } from '@/i18n';
import { atTime, toDayString } from '@/lib/dates';
import { useStore } from '@/lib/store';

export default function HistoryScreen() {
  const { t, locale } = useI18n();
  const daily = useStore(dailyStore);
  const today = toDayString(new Date());
  const dateFormat = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
  // Only days that have already arrived: future words stay a surprise.
  const rows = Object.entries(daily.days)
    .filter(([day]) => day <= today)
    .sort(([a], [b]) => b.localeCompare(a))
    .flatMap(([day, words]) => words.map((word) => ({ day, word })));

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('profile.history')} backLabel={t('common.back')} />
      {rows.length ? (
        <ListGroup>
          {rows.map(({ day, word }, index) => (
            <ListRow
              key={`${day}-${word.id}`}
              title={word.lemma}
              description={meaningOf(word)}
              value={dateFormat.format(atTime(day, '12:00'))}
              last={index === rows.length - 1}
              onPress={() => router.push(`/word/${word.id}`)}
            />
          ))}
        </ListGroup>
      ) : (
        <Notice text={t('dictionary.emptyHistory')} />
      )}
    </Screen>
  );
}
