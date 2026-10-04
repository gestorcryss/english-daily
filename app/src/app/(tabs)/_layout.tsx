import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { profileStore } from '@/features/profile/profile';
import { useI18n } from '@/i18n';
import { useStore } from '@/lib/store';
import { Fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

function tabIcon(name: IconName) {
  function TabBarIcon({ color }: { color: ColorValue }) {
    return <Icon name={name} color={color} />;
  }
  return TabBarIcon;
}

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useI18n();
  const onboarded = useStore(profileStore).onboardedAt !== null;

  if (!onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primaryText,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarLabelStyle: { fontFamily: Fonts.semibold, fontSize: 12 },
      }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.today'), tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen
        name="dictionary"
        options={{ title: t('tabs.dictionary'), tabBarIcon: tabIcon('book') }}
      />
      <Tabs.Screen
        name="practice"
        options={{ title: t('tabs.practice'), tabBarIcon: tabIcon('target') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('user') }}
      />
    </Tabs>
  );
}
