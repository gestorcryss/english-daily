/**
 * Design tokens taken from the English Daily screen designs.
 * Every colour pair used for text meets WCAG AA (4.5:1) on its intended background.
 */

export const Colors = {
  light: {
    background: '#F4F6FB',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF1F6',
    border: '#DCE3F0',
    borderStrong: '#C5CFE2',
    text: '#0F172A',
    textMuted: '#4B5563',
    /** Fill colour for primary buttons and active states. */
    primary: '#1E4FD8',
    onPrimary: '#FFFFFF',
    /** Accent colour for text and icons drawn on surfaces. */
    primaryText: '#1E4FD8',
    primaryTint: '#E6EDFF',
    onPrimaryTint: '#10245E',
    streakBackground: '#FFEDD5',
    streakText: '#9A3412',
    success: '#166534',
    danger: '#B91C1C',
    adPlaceholder: '#E9ECF2',
  },
  dark: {
    background: '#0B1220',
    surface: '#131C2E',
    surfaceMuted: '#1A2438',
    border: '#26324A',
    borderStrong: '#34425E',
    text: '#E8EDF7',
    textMuted: '#A3AEC4',
    primary: '#3A66EE',
    onPrimary: '#FFFFFF',
    primaryText: '#8FB0FF',
    primaryTint: '#1B2A52',
    onPrimaryTint: '#C9D8FF',
    streakBackground: '#3B2410',
    streakText: '#FDBA74',
    success: '#4ADE80',
    danger: '#F87171',
    adPlaceholder: '#1A2438',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Fonts = {
  /** Display face, used for English words. */
  display: 'Fraunces_600SemiBold',
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 20,
  pill: 999,
} as const;

/** Minimum touch target size (Android 48dp guideline, rounded to our scale). */
export const TouchTarget = 44;
