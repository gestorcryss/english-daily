import type { SupabaseClient } from '@supabase/supabase-js';

export type ServerStatus = 'not-configured' | 'connected' | 'unreachable';

/** Reads one row of the public `app_config` table to confirm the app can reach the database. */
export async function checkServerStatus(client: SupabaseClient | null): Promise<ServerStatus> {
  if (!client) return 'not-configured';

  try {
    const { data, error } = await client
      .from('app_config')
      .select('key')
      .eq('key', 'catalog_version')
      .maybeSingle();
    return !error && data ? 'connected' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}
