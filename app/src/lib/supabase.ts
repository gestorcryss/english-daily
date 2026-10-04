import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

let client: SupabaseClient | null = null;

/**
 * Returns the Supabase client, or null while the project is not configured
 * (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing in .env).
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  // `localStorage` is installed by expo-sqlite in the root layout, before any screen runs.
  client = createClient(url, key, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      client?.auth.startAutoRefresh();
    } else {
      client?.auth.stopAutoRefresh();
    }
  });

  return client;
}
