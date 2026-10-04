import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { Fonts, Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { AppText } from './app-text';

type Variant = 'primary' | 'secondary';
type Size = 'large' | 'medium';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
};

export function Button({
  label,
  variant = 'primary',
  size = 'large',
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'large' ? styles.large : styles.medium,
        isPrimary
          ? { backgroundColor: theme.primary }
          : { backgroundColor: theme.surface, borderColor: theme.borderStrong, borderWidth: 1 },
        (pressed || disabled) && { opacity: disabled ? 0.5 : 0.85 },
        style,
      ]}
      {...rest}>
      <AppText
        tone={isPrimary ? 'onPrimary' : 'default'}
        style={[styles.label, size === 'medium' && styles.labelMedium]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  large: {
    minHeight: 52,
    borderRadius: Radius.lg,
  },
  medium: {
    minHeight: 44,
    borderRadius: Radius.md,
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  labelMedium: {
    fontSize: 15,
  },
});
