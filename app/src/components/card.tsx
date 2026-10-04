import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Variant = 'surface' | 'tint';

export function Card({ variant = 'surface', style, ...rest }: ViewProps & { variant?: Variant }) {
  const theme = useTheme();
  const variantStyle =
    variant === 'tint'
      ? { backgroundColor: theme.primaryTint }
      : { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 };

  return <View style={[styles.base, variantStyle, style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
});
