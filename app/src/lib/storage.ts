/**
 * Local key/value storage for JSON documents.
 * On device it is backed by the localStorage that expo-sqlite installs (see the root layout);
 * in tests, where no localStorage exists, it falls back to memory.
 */
const memory = new Map<string, string>();
const PREFIX = 'ed:';

function backend(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
}

export function readJson<T>(key: string): T | null {
  const raw = backend()?.getItem(PREFIX + key) ?? memory.get(key) ?? null;
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  const store = backend();
  if (store) store.setItem(PREFIX + key, raw);
  else memory.set(key, raw);
}

export function removeKey(key: string): void {
  backend()?.removeItem(PREFIX + key);
  memory.delete(key);
}

/** Test helper: clears the in-memory fallback. */
export function clearMemoryStorage(): void {
  memory.clear();
}
