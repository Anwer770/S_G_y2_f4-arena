/**
 * Storage Engine Interface
 * Defines the contract for persistence adapters (LocalStorage, SQLite, IndexedDB, Memory)
 * enabling future transition without touching UI components.
 */
export interface IStorageEngine {
  getItem<T>(key: string, defaultValue?: T): Promise<T | null>;
  getItemSync<T>(key: string, defaultValue?: T): T | null;
  setItem<T>(key: string, value: T): Promise<void>;
  setItemSync<T>(key: string, value: T): void;
  removeItem(key: string): Promise<void>;
  removeItemSync(key: string): void;
  clear(): Promise<void>;
  clearSync(): void;
  hasKey(key: string): boolean;
  getAllKeys(): string[];
}
