import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/ui';
import { useI18n } from '@/i18n';

const SOURCES = ['wiktionary', 'cefrj', 'octanove', 'tatoeba', 'frequency', 'audio'] as const;

export default function CreditsScreen() {
  const { t } = useI18n();

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('credits.title')} backLabel={t('common.back')} />
      <AppText tone="muted">{t('credits.intro')}</AppText>
      {SOURCES.map((source) => (
        <Card key={source}>
          <AppText>{t(`credits.${source}`)}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
