import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { RadioRow } from '@/components/ui';
import { useI18n } from '@/i18n';
import { Fonts, Radius, Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { NATIVE_LANGUAGES } from './profile';

/** Searchable list of translation languages (onboarding and settings). */
export function LanguageList({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const theme = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const languages = NATIVE_LANGUAGES.filter(
    (language) =>
      !needle || language.name.toLowerCase().includes(needle) || language.code === needle,
  );

  return (
    <View style={styles.list}>
      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="search" color={theme.textMuted} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('onboarding.languageSearch')}
          placeholderTextColor={theme.textMuted}
          accessibilityLabel={t('onboarding.languageSearch')}
          autoCorrect={false}
          style={[styles.input, { color: theme.text }]}
        />
      </View>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {languages.map((language) => (
          <RadioRow
            key={language.code}
            title={language.name}
            selected={language.code === value}
            onPress={() => onChange(language.code)}
          />
        ))}
      </View>
      {languages.length === 0 ? (
        <AppText tone="muted">{t('dictionary.noResults', { query })}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  search: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: 16, paddingVertical: 10 },
});
