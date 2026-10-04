import { useSyncExternalStore } from 'react';

import { readJson, writeJson } from './storage';

export type PersistentStore<T> = {
  get: () => T;
  set: (next: T | ((current: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  /** Re-reads the value from storage (used after wiping local data). */
  reload: () => void;
};

/** A small observable value that is saved to local storage on every change. */
export function createPersistentStore<T>(key: string, initial: T): PersistentStore<T> {
  let loaded = false;
  let value = initial;
  const listeners = new Set<() => void>();

  const load = () => {
    const stored = readJson<T>(key);
    // Stored objects are merged over the defaults so that new fields get a value after an update.
    value =
      stored !== null && typeof initial === 'object' && initial !== null && !Array.isArray(initial)
        ? { ...initial, ...stored }
        : (stored ?? initial);
    loaded = true;
  };

  const get = () => {
    if (!loaded) load();
    return value;
  };

  return {
    get,
    set(next) {
      const current = get();
      value = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      writeJson(key, value);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reload() {
      load();
      listeners.forEach((listener) => listener());
    },
  };
}

export function useStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
