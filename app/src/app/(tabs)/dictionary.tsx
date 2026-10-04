import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ListGroup, ListRow, SectionTitle } from '@/components/ui';
import { learningStats, userWordsStore } from '@/features/learning/user-words';
import { profileStore } from '@/features/profile/profile';
import { searchWords } from '@/features/session/api';
import { packStore, searchPack } from '@/features/words/level-pack';
import type { WordSummary } from '@/features/words/types';
import { useI18n } from '@/i18n';
import { createPersistentStore, useStore } from '@/lib/store';
import { Fonts, Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const SEARCH_DELAY_MS = 300;
const MAX_RECENT = 8;

const recentStore = createPersistentStore<{ id: number; lemma: string }[]>('recent-searches', []);

type Result = WordSummary & { onDevice: boolean };

export default function DictionaryScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const pack = useStore(packStore);
  const recent = useStore(recentStore);
  const userWords = useStore(userWordsStore);
  const [query, setQuery] = useState('');
  const [online, setOnline] = useState<{ query: string; words: WordSummary[] } | null>(null);
  const [offlineOnly, setOfflineOnly] = useState(false);

  const needle = query.trim();
  const local = searchPack(pack, needle);

  // The device answers at once; the server is asked after a short pause in typing.
  useEffect(() => {
    if (!needle) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchWords(needle, profileStore.get().nativeLang)
        .then((words) => {
          if (cancelled) return;
          setOnline({ query: needle, words });
          setOfflineOnly(false);
        })
        .catch(() => {
          if (!cancelled) setOfflineOnly(true);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [needle]);

  const localIds = new Set(local.map((word) => word.id));
  const fromServer = online?.query === needle ? online.words : [];
  const serverIds = new Set(fromServer.map((word) => word.id));
  // Server order is the reference (exact match, then most used); device-only matches go after.
  const results: Result[] = fromServer.length
    ? [
        ...fromServer.map((word) => ({ ...word, onDevice: localIds.has(word.id) })),
        ...local
          .filter((word) => !serverIds.has(word.id))
          .map((word) => ({ ...word, onDevice: true })),
      ]
    : local.map((word) => ({ ...word, onDevice: true }));
  const searched = online?.query === needle || offlineOnly;

  const open = (word: { id: number; lemma: string }) => {
    recentStore.set((items) =>
      [{ id: word.id, lemma: word.lemma }, ...items.filter((item) => item.id !== word.id)].slice(
        0,
        MAX_RECENT,
      ),
    );
    router.push(`/word/${word.id}`);
  };

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        {t('tabs.dictionary')}
      </AppText>

      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
        <Icon name="search" color={theme.textMuted} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('dictionary.searchPlaceholder')}
          placeholderTextColor={theme.textMuted}
          accessibilityLabel={t('dictionary.searchLabel')}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: theme.text }]}
        />
        {query ? (
          <IconButton
            icon="close"
            size={40}
            accessibilityLabel={t('dictionary.clear')}
            onPress={() => setQuery('')}
          />
        ) : null}
      </View>

      {needle ? (
        <>
          {offlineOnly ? (
            <AppText variant="caption" tone="muted">
              {t('dictionary.offlineOnly')}
            </AppText>
          ) : null}
          {results.length ? (
            <ListGroup>
              {results.map((word, index) => (
                <ListRow
                  key={word.id}
                  title={word.lemma}
                  description={`${t(`wordClass.${word.pos}`)} · ${word.translation ?? word.gloss}`}
                  value={word.onDevice ? t('dictionary.offline') : t('dictionary.online')}
                  last={index === results.length - 1}
                  onPress={() => open(word)}
                />
              ))}
            </ListGroup>
          ) : searched ? (
            <AppText tone="muted">{t('dictionary.noResults', { query: needle })}</AppText>
          ) : null}
        </>
      ) : (
        <>
          <AppText tone="muted">{t('dictionary.hint')}</AppText>

          {recent.length ? (
            <>
              <SectionTitle>{t('dictionary.recent')}</SectionTitle>
              <View style={styles.chips}>
                {recent.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => open(item)}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}>
                    <AppText style={styles.chipText}>{item.lemma}</AppText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <ListGroup>
            <ListRow
              icon="star"
              title={t('dictionary.favorites')}
              value={String(learningStats(userWords, new Date()).favorites)}
              onPress={() => router.push('/favorites')}
            />
            <ListRow
              icon="clock"
              title={t('dictionary.history')}
              last
              onPress={() => router.push('/history')}
            />
          </ListGroup>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 52,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderRadius: Radius.lg,
  },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: 17, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  chipText: { fontFamily: Fonts.medium, fontSize: 15 },
});
