import { useColorScheme } from '@/hooks/use-color-scheme';

import { Colors, type ColorScheme, type ThemeColors } from './tokens';

export function useColorSchemeName(): ColorScheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function useTheme(): ThemeColors {
  return Colors[useColorSchemeName()];
}
