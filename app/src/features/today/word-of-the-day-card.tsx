import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { IconButton } from '@/components/icon-button';
import { meaningOf, type WordCard } from '@/features/words/types';
import { useI18n } from '@/i18n';
import { Fonts, Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Props = {
  word: WordCard;
  isFavorite?: boolean;
  onOpen?: () => void;
  onListen?: () => void;
  onToggleFavorite?: () => void;
};

export function WordOfTheDayCard({
  word,
  isFavorite = false,
  onOpen,
  onListen,
  onToggleFavorite,
}: Props) {
  const theme = useTheme();
  const { t } = useI18n();
  const hasTranslation = word.translation.length > 0;

  return (
    <Card style={styles.card}>
      <View style={styles.badges}>
        <AppText variant="label" tone="primary" style={styles.grow}>
          {t('today.wordOfTheDay')}
        </AppText>
        <View style={[styles.badge, { backgroundColor: theme.primaryTint }]}>
          <AppText variant="label" tone="onPrimaryTint" style={styles.badgeText}>
            {word.level}
          </AppText>
        </View>
        {word.topics.slice(0, 1).map((topic) => (
          <View key={topic} style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
            <AppText variant="label" tone="muted" style={styles.badgeText}>
              {t(`topics.${topic}`)}
            </AppText>
          </View>
        ))}
      </View>

      <AppText variant="display" accessibilityRole="header">
        {word.lemma}
      </AppText>

      <View style={styles.row}>
        <AppText variant="caption" tone="muted">
          {t(`wordClass.${word.pos}`)}
          {word.ipa ? ` · ${word.ipa}` : ''}
        </AppText>
        <IconButton
          icon="speaker"
          variant="tint"
          size={40}
          accessibilityLabel={t('today.listen')}
          onPress={onListen}
        />
      </View>

      {word.senses[0] ? <AppText>{word.senses[0].gloss}</AppText> : null}

      {hasTranslation ? (
        <View style={[styles.translation, { backgroundColor: theme.background }]}>
          <AppText variant="bodyStrong">{meaningOf(word)}</AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button label={t('today.seeWord')} onPress={onOpen} style={styles.grow} />
        <IconButton
          icon="star"
          variant="outline"
          size={52}
          active={isFavorite}
          accessibilityLabel={isFavorite ? t('today.unsave') : t('today.save')}
          onPress={onToggleFavorite}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
    gap: Spacing.md,
    borderRadius: Radius.xxl,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeText: {
    letterSpacing: 0,
    textTransform: 'none',
    fontFamily: Fonts.bold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  translation: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  grow: {
    flexGrow: 1,
    flexShrink: 1,
  },
});
