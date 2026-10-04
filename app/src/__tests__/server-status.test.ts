import type { SupabaseClient } from '@supabase/supabase-js';

import { checkServerStatus } from '@/features/server/server-status';

function fakeClient(result: { data: unknown; error: unknown } | Error): SupabaseClient {
  const maybeSingle =
    result instanceof Error
      ? jest.fn().mockRejectedValue(result)
      : jest.fn().mockResolvedValue(result);
  const builder = { select: () => builder, eq: () => builder, maybeSingle };
  return { from: () => builder } as unknown as SupabaseClient;
}

describe('checkServerStatus', () => {
  test('reports not-configured when there is no client', async () => {
    expect(await checkServerStatus(null)).toBe('not-configured');
  });

  test('reports connected when the config row is returned', async () => {
    const client = fakeClient({ data: { key: 'catalog_version' }, error: null });
    expect(await checkServerStatus(client)).toBe('connected');
  });

  test('reports unreachable when the query returns an error', async () => {
    const client = fakeClient({ data: null, error: { message: 'relation does not exist' } });
    expect(await checkServerStatus(client)).toBe('unreachable');
  });

  test('reports unreachable when the row is missing', async () => {
    expect(await checkServerStatus(fakeClient({ data: null, error: null }))).toBe('unreachable');
  });

  test('reports unreachable when the network fails', async () => {
    expect(await checkServerStatus(fakeClient(new Error('Network request failed')))).toBe(
      'unreachable',
    );
  });
});
