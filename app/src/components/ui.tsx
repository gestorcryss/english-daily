import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Fonts, Radius, Spacing, TouchTarget } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { IconButton } from './icon-button';

/** Top bar with a back button, used on screens outside the tabs. */
export function ScreenHeader({
  title,
  backLabel,
  right,
  onBack,
}: {
  title?: string;
  backLabel: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      <IconButton
        icon="back"
        accessibilityLabel={backLabel}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        style={styles.headerBack}
      />
      {title ? (
        <AppText variant="title" accessibilityRole="header" style={styles.headerTitle}>
          {title}
        </AppText>
      ) : (
        <View style={styles.grow} />
      )}
      {right}
    </View>
  );
}

export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  const theme = useTheme();
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: value }}
      style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
      <View style={[styles.fill, { width: `${value}%`, backgroundColor: theme.primary }]} />
    </View>
  );
}

/** Dashes showing the current step of a short flow. */
export function StepDots({ current, total }: { current: number; total: number }) {
  const theme = useTheme();
  return (
    <View style={styles.steps}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.step, { backgroundColor: index < current ? theme.primary : theme.border }]}
        />
      ))}
    </View>
  );
}

/** Pill that can be switched on and off (topics). */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: theme.primaryTint, borderColor: theme.primary, borderWidth: 2 }
          : { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
      ]}>
      {selected ? (
        <Icon name="check" color={theme.onPrimaryTint} size={16} strokeWidth={2.5} />
      ) : null}
      <AppText
        tone={selected ? 'onPrimaryTint' : 'default'}
        style={{ fontFamily: selected ? Fonts.semibold : Fonts.medium, fontSize: 15 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** One option of a single-choice list. */
export function RadioRow({
  title,
  description,
  trailing,
  selected,
  onPress,
}: {
  title: string;
  description?: string;
  trailing?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.radioRow,
        { backgroundColor: theme.surface },
        selected
          ? { borderColor: theme.primary, borderWidth: 2 }
          : { borderColor: theme.border, borderWidth: 1 },
      ]}>
      <View
        style={[styles.radioOuter, { borderColor: selected ? theme.primary : theme.borderStrong }]}>
        {selected ? <View style={[styles.radioInner, { backgroundColor: theme.primary }]} /> : null}
      </View>
      <View style={styles.grow}>
        <AppText variant="bodyStrong">{title}</AppText>
        {description ? (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      {trailing ? (
        <AppText
          variant="caption"
          tone={selected ? 'primary' : 'muted'}
          numberOfLines={1}
          style={styles.bold}>
          {trailing}
        </AppText>
      ) : null}
    </Pressable>
  );
}

/** Small set of mutually exclusive options shown side by side. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.segmented, { backgroundColor: theme.surfaceMuted }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.surface }]}>
            <AppText
              tone={selected ? 'default' : 'muted'}
              style={{ fontFamily: selected ? Fonts.bold : Fonts.semibold, fontSize: 15 }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Time of day changed in 30-minute steps (no native picker needed). */
export function TimeStepper({
  value,
  onChange,
  label,
  earlierLabel,
  laterLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  earlierLabel: string;
  laterLabel: string;
}) {
  const theme = useTheme();
  const shift = (minutes: number) => {
    const [hours, mins] = value.split(':').map(Number);
    const total = (hours * 60 + mins + minutes + 1440) % 1440;
    onChange(
      `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`,
    );
  };
  return (
    <View
      style={[styles.timeStepper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <IconButton
        icon="minus"
        accessibilityLabel={`${label}: ${earlierLabel}`}
        onPress={() => shift(-30)}
      />
      <View style={styles.timeValue} accessible accessibilityLabel={`${label} ${value}`}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText style={styles.timeText}>{value}</AppText>
      </View>
      <IconButton
        icon="plus"
        accessibilityLabel={`${label}: ${laterLabel}`}
        onPress={() => shift(30)}
      />
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <AppText variant="label" tone="muted" accessibilityRole="header" style={styles.sectionTitle}>
      {children}
    </AppText>
  );
}

/** Group of rows with a shared border (settings, lists). */
export function ListGroup({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.listGroup,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}>
      {children}
    </View>
  );
}

export function ListRow({
  title,
  description,
  value,
  icon,
  danger,
  right,
  onPress,
  last,
}: {
  title: string;
  description?: string;
  value?: string;
  icon?: IconName;
  danger?: boolean;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const theme = useTheme();
  const content = (
    <>
      {icon ? <Icon name={icon} color={theme.textMuted} size={20} /> : null}
      <View style={styles.grow}>
        <AppText
          style={[styles.rowTitle, danger && { color: theme.danger, fontFamily: Fonts.semibold }]}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="caption" tone="muted">
          {value}
        </AppText>
      ) : null}
      {right}
      {onPress && !right && !danger ? (
        <Icon name="chevron" color={theme.textMuted} size={18} />
      ) : null}
    </>
  );
  const rowStyle = [
    styles.listRow,
    !last && { borderBottomColor: theme.surfaceMuted, borderBottomWidth: 1 },
  ];
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={rowStyle}>
      {content}
    </Pressable>
  ) : (
    <View style={rowStyle}>{content}</View>
  );
}

/** Message shown instead of content: empty list, error with retry, loading. */
export function Notice({
  title,
  text,
  action,
}: {
  title?: string;
  text: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {title ? <AppText variant="heading">{title}</AppText> : null}
      <AppText tone="muted">{text}</AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1, flexShrink: 1 },
  bold: { fontFamily: Fonts.bold },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: TouchTarget,
  },
  headerBack: { marginLeft: -10 },
  headerTitle: { flexGrow: 1, flexShrink: 1, fontSize: 22 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 5, borderRadius: 3 },
  chip: {
    minHeight: TouchTarget,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
  },
  radioRow: {
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  segmented: { flexDirection: 'row', padding: 3, gap: 4, borderRadius: Radius.md },
  segment: {
    flex: 1,
    minHeight: TouchTarget - 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: Spacing.sm,
  },
  timeStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xs,
    minHeight: 64,
  },
  timeValue: { flex: 1, alignItems: 'center' },
  timeText: { fontFamily: Fonts.bold, fontSize: 22, lineHeight: 28 },
  sectionTitle: { marginLeft: Spacing.xs, marginTop: Spacing.sm },
  listGroup: { borderWidth: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  listRow: {
    minHeight: 54,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowTitle: { fontFamily: Fonts.medium },
  notice: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.sm },
});
