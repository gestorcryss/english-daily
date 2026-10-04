import 'expo-sqlite/localStorage/install';

import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { profileStore } from '@/features/profile/profile';
import { useBootstrap } from '@/features/session/use-bootstrap';
import { detectDeviceLocale, I18nProvider } from '@/i18n';
import { useStore } from '@/lib/store';
import { Colors } from '@/theme/tokens';
import { useColorSchemeName } from '@/theme/use-theme';

SplashScreen.preventAutoHideAsync();

function Navigation() {
  useBootstrap();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="review" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorSchemeName();
  const colors = Colors[scheme];
  const uiLocale = useStore(profileStore).uiLocale;
  const [loaded, error] = useFonts({
    Fraunces_600SemiBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const baseTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primaryText,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <I18nProvider locale={uiLocale ?? detectDeviceLocale()}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Navigation />
      </ThemeProvider>
    </I18nProvider>
  );
}
