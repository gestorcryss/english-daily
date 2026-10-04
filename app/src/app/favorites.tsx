import { router } from 'expo-router';

import { Screen } from '@/components/screen';
import { ListGroup, ListRow, Notice, ScreenHeader } from '@/components/ui';
import { userWordsStore } from '@/features/learning/user-words';
import { meaningOf } from '@/features/words/types';
import { useI18n } from '@/i18n';
import { useStore } from '@/lib/store';

export default function FavoritesScreen() {
  const { t } = useI18n();
  const userWords = useStore(userWordsStore);
  const favorites = Object.values(userWords.words)
    .filter((word) => word.isFavorite)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('dictionary.favorites')} backLabel={t('common.back')} />
      {favorites.length ? (
        <ListGroup>
          {favorites.map((word, index) => (
            <ListRow
              key={word.wordId}
              title={word.card.lemma}
              description={meaningOf(word.card)}
              value={word.card.level}
              last={index === favorites.length - 1}
              onPress={() => router.push(`/word/${word.wordId}`)}
            />
          ))}
        </ListGroup>
      ) : (
        <Notice text={t('dictionary.emptyFavorites')} />
      )}
    </Screen>
  );
}
