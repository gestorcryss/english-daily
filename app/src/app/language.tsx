import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/ui';
import { LanguageList } from '@/features/profile/language-list';
import { profileStore, updateProfile } from '@/features/profile/profile';
import { useI18n } from '@/i18n';
import { useStore } from '@/lib/store';

export default function LanguageScreen() {
  const { t } = useI18n();
  const profile = useStore(profileStore);

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.nativeLang')} backLabel={t('common.back')} />
      <LanguageList
        value={profile.nativeLang}
        onChange={(nativeLang) => updateProfile({ nativeLang })}
      />
    </Screen>
  );
}
