import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { Notice, ProgressBar } from '@/components/ui';
import { recordActivity } from '@/features/learning/activity';
import { suggestLevelChange, type LevelChange } from '@/features/learning/adaptive-level';
import { OptionList } from '@/features/learning/option-list';
import type { ReviewRating } from '@/features/learning/scheduler';
import {
  extraSession,
  reviewSession,
  singleWordSession,
  type SessionItem,
} from '@/features/learning/session';
import { masteredAtLevel, recordAnswer, userWordsStore } from '@/features/learning/user-words';
import { profileStore, updateProfile } from '@/features/profile/profile';
import { syncToServer } from '@/features/session/sync';
import { meaningOf } from '@/features/words/types';
import { usePronunciation } from '@/features/words/use-pronunciation';
import { useI18n } from '@/i18n';
import { Fonts, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

function buildSession(params: { word?: string; mode?: string }): SessionItem[] {
  if (params.word) return singleWordSession(Number(params.word));
  if (params.mode === 'extra') return extraSession();
  return reviewSession();
}

/** Applies the adaptive level after a session; returns the change, if any. */
function adaptLevel(): LevelChange | null {
  const profile = profileStore.get();
  if (!profile.levelAuto) return null;
  const state = userWordsStore.get();
  const change = suggestLevelChange(
    profile.level,
    state.history,
    masteredAtLevel(state, profile.level),
    new Date(),
  );
  if (change) updateProfile({ level: change.to });
  return change;
}

export default function ReviewScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ word?: string; mode?: string }>();
  const { playWord } = usePronunciation();
  // The queue is fixed when the screen opens, so answers do not reshuffle it.
  const [items] = useState(() => buildSession(params));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [levelChange, setLevelChange] = useState<LevelChange | null>(null);
  const [finished, setFinished] = useState(false);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const item = items[index];

  const finish = (total: number) => {
    recordActivity(total);
    setLevelChange(adaptLevel());
    setFinished(true);
    void syncToServer();
  };

  const goNext = () => {
    if (index + 1 >= items.length) {
      finish(items.length);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setRevealed(false);
  };

  /** Multiple choice: right counts as "good", wrong or "I don't know" as "again". */
  const check = (choice: number | null) => {
    if (!item?.exercise || revealed) return;
    const correct = choice === item.exercise.correctIndex;
    recordAnswer(item.word.id, correct ? 'good' : 'again', item.exercise.kind);
    if (correct) setCorrectCount((count) => count + 1);
    setSelected(choice);
    setRevealed(true);
  };

  /** Plain recall: the person grades themselves after seeing the meaning. */
  const grade = (rating: ReviewRating) => {
    if (!item) return;
    recordAnswer(item.word.id, rating, 'recall');
    if (rating !== 'again') setCorrectCount((count) => count + 1);
    goNext();
  };

  if (!items.length) {
    return (
      <Screen
        edges={['top', 'bottom']}
        footer={<Button label={t('common.close')} onPress={leave} />}>
        <Notice title={t('practice.emptyTitle')} text={t('practice.emptyHelp')} />
      </Screen>
    );
  }

  if (finished) {
    return (
      <Screen
        edges={['top', 'bottom']}
        footer={<Button label={t('practice.finish')} onPress={leave} />}>
        <View style={styles.done}>
          <AppText variant="title" accessibilityRole="header">
            {t('practice.doneTitle')}
          </AppText>
          <AppText style={styles.score}>
            {correctCount}/{items.length}
          </AppText>
          <AppText tone="muted">
            {t('practice.doneSummary', { correct: correctCount, total: items.length })}
          </AppText>
        </View>
        {levelChange ? (
          <Card variant="tint">
            <AppText variant="heading" tone="onPrimaryTint">
              {t(levelChange.direction === 'up' ? 'practice.levelUp' : 'practice.levelDown', {
                level: levelChange.to,
              })}
            </AppText>
          </Card>
        ) : null}
      </Screen>
    );
  }

  const exercise = item.exercise;
  const isGap = exercise?.kind === 'gap';
  const answeredRight = exercise !== null && revealed && selected === exercise.correctIndex;

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        exercise ? (
          revealed ? (
            <Button label={t('practice.next')} onPress={goNext} />
          ) : (
            <View style={styles.footerRow}>
              <Button
                variant="secondary"
                label={t('practice.dontKnow')}
                onPress={() => check(null)}
              />
              <Button
                label={t('practice.check')}
                disabled={selected === null}
                onPress={() => check(selected)}
                style={styles.grow}
              />
            </View>
          )
        ) : revealed ? (
          <View style={styles.footerRow}>
            {(['again', 'hard', 'good', 'easy'] as const).map((rating) => (
              <Button
                key={rating}
                variant={rating === 'good' ? 'primary' : 'secondary'}
                label={t(`practice.${rating}`)}
                onPress={() => grade(rating)}
                style={styles.gradeButton}
              />
            ))}
          </View>
        ) : (
          <Button label={t('practice.showAnswer')} onPress={() => setRevealed(true)} />
        )
      }>
      <View style={styles.top}>
        <IconButton
          icon="close"
          accessibilityLabel={t('practice.exit')}
          onPress={leave}
          style={styles.close}
        />
        <View style={styles.grow}>
          <ProgressBar percent={(index / items.length) * 100} label={t('practice.title')} />
        </View>
        <AppText variant="caption" tone="muted">
          {t('practice.progress', { current: index + 1, total: items.length })}
        </AppText>
      </View>

      <View style={styles.prompt}>
        <AppText variant="label" tone="muted">
          {exercise
            ? t(isGap ? 'practice.completeSentence' : 'practice.chooseMeaning')
            : t('practice.recall')}
        </AppText>
        {isGap ? (
          <>
            <AppText style={styles.sentence}>{exercise.prompt}</AppText>
            {exercise.hint ? (
              <AppText tone="muted" style={styles.center}>
                {exercise.hint}
              </AppText>
            ) : null}
          </>
        ) : (
          <>
            <AppText variant="display" accessibilityRole="header">
              {item.word.lemma}
            </AppText>
            <View style={styles.ipaRow}>
              {item.word.ipa ? <AppText tone="muted">{item.word.ipa}</AppText> : null}
              <IconButton
                icon="speaker"
                variant="tint"
                size={40}
                accessibilityLabel={t('today.listen')}
                onPress={() => playWord(item.word)}
              />
            </View>
          </>
        )}
      </View>

      {exercise ? (
        <>
          <OptionList
            key={`${item.word.id}-${index}`}
            options={exercise.options}
            selected={selected}
            correctIndex={revealed ? exercise.correctIndex : null}
            onSelect={setSelected}
          />
          {revealed ? (
            <View accessibilityLiveRegion="polite">
              <AppText
                variant="bodyStrong"
                style={{ color: answeredRight ? theme.success : theme.danger }}>
                {answeredRight
                  ? t('practice.correct')
                  : `${t('practice.wrong')} ${exercise.options[exercise.correctIndex]}`}
              </AppText>
              {isGap ? (
                <AppText tone="muted">
                  {item.word.lemma}: {meaningOf(item.word)}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </>
      ) : revealed ? (
        <Card>
          <AppText variant="bodyStrong">{meaningOf(item.word)}</AppText>
          {item.word.senses[0] && item.word.translation.length ? (
            <AppText tone="muted">{item.word.senses[0].gloss}</AppText>
          ) : null}
          {item.word.examples[0] ? (
            <AppText tone="muted">{item.word.examples[0].text}</AppText>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  close: { marginLeft: -10 },
  grow: { flexGrow: 1, flexShrink: 1 },
  prompt: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  sentence: { fontFamily: Fonts.semibold, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  center: { textAlign: 'center' },
  ipaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  footerRow: { flexDirection: 'row', gap: Spacing.sm },
  gradeButton: { flex: 1, paddingHorizontal: Spacing.xs },
  done: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.xxxl },
  score: { fontFamily: Fonts.display, fontSize: 56, lineHeight: 64 },
});
