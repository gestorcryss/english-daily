import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Fonts, Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const LETTERS = ['A', 'B', 'C', 'D'];

type Props = {
  options: string[];
  /** Index picked by the person, or null. */
  selected: number | null;
  /** Once set, the answer is locked and the right and wrong options are marked. */
  correctIndex: number | null;
  onSelect: (index: number) => void;
};

/** Multiple-choice options with letter badges (level test and review exercises). */
export function OptionList({ options, selected, correctIndex, onSelect }: Props) {
  const theme = useTheme();
  const revealed = correctIndex !== null;

  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      {options.map((option, index) => {
        const isSelected = selected === index;
        const isCorrect = revealed && index === correctIndex;
        const isWrong = revealed && isSelected && !isCorrect;
        const accent = isCorrect ? theme.success : isWrong ? theme.danger : theme.primary;
        const highlighted = isSelected || isCorrect;
        return (
          <Pressable
            key={`${index}-${option}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled: revealed }}
            disabled={revealed}
            onPress={() => onSelect(index)}
            style={[
              styles.option,
              { backgroundColor: theme.surface },
              highlighted
                ? { borderColor: accent, borderWidth: 2 }
                : { borderColor: theme.border, borderWidth: 1 },
            ]}>
            <View
              style={[
                styles.letter,
                { backgroundColor: highlighted ? accent : theme.surfaceMuted },
              ]}>
              <AppText
                style={[
                  styles.letterText,
                  { color: highlighted ? theme.onPrimary : theme.textMuted },
                ]}>
                {LETTERS[index]}
              </AppText>
            </View>
            <AppText style={[styles.text, highlighted && { fontFamily: Fonts.semibold }]}>
              {option}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  option: {
    minHeight: 56,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: { fontFamily: Fonts.bold, fontSize: 14 },
  text: { flexGrow: 1, flexShrink: 1, fontFamily: Fonts.medium },
});
