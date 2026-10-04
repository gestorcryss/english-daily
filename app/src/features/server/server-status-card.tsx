import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { useI18n } from '@/i18n';
import { getSupabase } from '@/lib/supabase';
import { Spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { checkServerStatus, type ServerStatus } from './server-status';

const LABEL_KEY: Record<ServerStatus | 'checking', string> = {
  checking: 'server.checking',
  connected: 'server.connected',
  unreachable: 'server.unreachable',
  'not-configured': 'server.notConfigured',
};

/** Diagnostic card: shows whether the app reaches the Supabase database. */
export function ServerStatusCard() {
  const theme = useTheme();
  const { t } = useI18n();
  const [status, setStatus] = useState<ServerStatus | 'checking'>('checking');

  useEffect(() => {
    let cancelled = false;
    checkServerStatus(getSupabase()).then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dotColor =
    status === 'connected' ? theme.success : status === 'checking' ? theme.textMuted : theme.danger;

  return (
    <Card>
      <AppText variant="heading">{t('server.title')}</AppText>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <AppText tone="muted">{t(LABEL_KEY[status])}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
