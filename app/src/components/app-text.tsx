import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'label';
type Tone = 'default' | 'muted' | 'primary' | 'onPrimary' | 'onPrimaryTint' | 'streak';

export type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: Tone;
};

export function AppText({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  const color = {
    default: theme.text,
    muted: theme.textMuted,
    primary: theme.primaryText,
    onPrimary: theme.onPrimary,
    onPrimaryTint: theme.onPrimaryTint,
    streak: theme.streakText,
  }[tone];

  return <Text style={[styles[variant], { color }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: {
    fontFamily: Fonts.display,
    fontSize: 44,
    lineHeight: 50,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  heading: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 23,
  },
  bodyStrong: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    lineHeight: 23,
  },
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
