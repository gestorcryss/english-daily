import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { Radius, TouchTarget } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon, type IconName } from './icon';

type Variant = 'plain' | 'tint' | 'outline';

export type IconButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  icon: IconName;
  /** Required: icon-only buttons need a spoken label. */
  accessibilityLabel: string;
  variant?: Variant;
  size?: number;
  /** Draws the icon filled, in the accent colour (a saved favourite). */
  active?: boolean;
  style?: ViewStyle;
};

export function IconButton({
  icon,
  variant = 'plain',
  size = TouchTarget,
  active = false,
  style,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const variantStyle = {
    plain: { backgroundColor: 'transparent' },
    tint: { backgroundColor: theme.primaryTint, borderRadius: Radius.pill },
    outline: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: Radius.lg,
    },
  }[variant];
  const iconColor = variant === 'tint' || active ? theme.primaryText : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={size < TouchTarget ? (TouchTarget - size) / 2 : undefined}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        variantStyle,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}>
      <Icon name={icon} color={iconColor} size={Math.round(size * 0.5)} filled={active} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
