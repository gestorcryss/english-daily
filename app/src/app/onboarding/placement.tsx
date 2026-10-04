import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Notice, ProgressBar, ScreenHeader } from '@/components/ui';
import { OptionList } from '@/features/learning/option-list';
import {
  estimateLevel,
  nextPlacementLevel,
  PLACEMENT_LENGTH,
  type PlacementAnswer,
} from '@/features/learning/placement';
import { profileStore } from '@/features/profile/profile';
import { fetchPlacementItems, type PlacementItem } from '@/features/session/api';
import { errorMessageKey } from '@/features/session/setup';
import { CEFR_LEVELS, type CefrLevel } from '@/features/words/types';
import { useI18n } from '@/i18n';
import { Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Question = { item: PlacementItem; options: string[]; correctIndex: number };

function toQuestion(item: PlacementItem): Question {
  const options = [item.answer, ...item.distractors].sort(() => Math.random() - 0.5);
  return { item, options, correctIndex: options.indexOf(item.answer) };
}

/** Next unused item of the wanted level, or of the closest level that still has items. */
function takeItem(items: PlacementItem[], asked: number[], level: CefrLevel): PlacementItem | null {
  const wanted = CEFR_LEVELS.indexOf(level);
  const free = items.filter((item) => !asked.includes(item.wordId));
  free.sort(
    (a, b) =>
      Math.abs(CEFR_LEVELS.indexOf(a.level) - wanted) -
      Math.abs(CEFR_LEVELS.indexOf(b.level) - wanted),
  );
  return free[0] ?? null;
}

export default function PlacementTest() {
  const theme = useTheme();
  const { t } = useI18n();
  const [items, setItems] = useState<PlacementItem[] | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  /** Ids of the words already shown, so none is repeated. */
  const [asked, setAsked] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchPlacementItems(profileStore.get().nativeLang)
      .then((loaded) => {
        if (cancelled) return;
        const first = takeItem(loaded, [], nextPlacementLevel([])!);
        if (!first) {
          setErrorKey('common.serverError');
          return;
        }
        setAsked([first.wordId]);
        setItems(loaded);
        setQuestion(toQuestion(first));
      })
      .catch((error) => {
        if (!cancelled) setErrorKey(errorMessageKey(error));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const answer = (correct: boolean) => {
    if (!items || !question) return;
    const nextAnswers = [...answers, { level: question.item.level, correct }];
    const level = nextPlacementLevel(nextAnswers);
    const item = level ? takeItem(items, asked, level) : null;
    if (!item) {
      router.replace({
        pathname: '/onboarding/result',
        params: {
          level: estimateLevel(nextAnswers),
          correct: String(nextAnswers.filter((entry) => entry.correct).length),
          total: String(nextAnswers.length),
        },
      });
      return;
    }
    setAsked([...asked, item.wordId]);
    setAnswers(nextAnswers);
    setQuestion(toQuestion(item));
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        question ? (
          <Button
            variant="secondary"
            label={t('placement.dontKnow')}
            onPress={() => answer(false)}
          />
        ) : null
      }>
      <ScreenHeader
        title={t('placement.title')}
        backLabel={t('common.close')}
        right={
          <AppText variant="caption" tone="muted">
            {t('common.step', {
              current: Math.min(answers.length + 1, PLACEMENT_LENGTH),
              total: PLACEMENT_LENGTH,
            })}
          </AppText>
        }
      />
      <ProgressBar
        percent={(answers.length / PLACEMENT_LENGTH) * 100}
        label={t('placement.title')}
      />
      <AppText variant="caption" tone="muted">
        {t('placement.intro')}
      </AppText>

      {errorKey ? (
        <Notice
          text={t(errorKey)}
          action={
            <Button
              label={t('common.retry')}
              size="medium"
              onPress={() => {
                setErrorKey(null);
                setAttempt((value) => value + 1);
              }}
            />
          }
        />
      ) : !question ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} accessibilityLabel={t('common.loading')} />
        </View>
      ) : (
        <>
          <Card style={styles.wordCard}>
            <AppText variant="label" tone="muted">
              {t('placement.question')}
            </AppText>
            <AppText variant="display" accessibilityRole="header">
              {question.item.lemma}
            </AppText>
            {question.item.ipa ? <AppText tone="muted">{question.item.ipa}</AppText> : null}
          </Card>
          <OptionList
            key={question.item.wordId}
            options={question.options}
            selected={null}
            correctIndex={null}
            onSelect={(index) => answer(index === question.correctIndex)}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  wordCard: { alignItems: 'center', paddingVertical: Spacing.xxl },
});
