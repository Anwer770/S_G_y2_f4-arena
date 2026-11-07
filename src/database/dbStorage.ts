import { indexedDBStorage } from './adapters/IndexedDBAdapter';

/**
 * Universal dbStorage bridge
 * Transparent drop-in replacement for localStorage that stores all data
 * in high-capacity, non-blocking IndexedDB with memory cache acceleration
 * and automatic one-time migration.
 */
export const dbStorage = {
  getItem: (key: string): string | null => {
    const raw = indexedDBStorage.getRawSync(key);
    if (raw !== null && raw !== undefined) {
      return raw;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      indexedDBStorage.setRawSync(key, value);
    } catch (err) {
      console.warn(`dbStorage: failed to set key "${key}"`, err);
    }
  },
  removeItem: (key: string): void => {
    indexedDBStorage.removeItemSync(key);
  },
  clear: (): void => {
    indexedDBStorage.clearSync();
  },
  getStats: () => indexedDBStorage.getStorageStats(),
};
