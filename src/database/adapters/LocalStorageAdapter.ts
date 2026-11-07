import { IStorageEngine } from '../types/StorageEngine';

/**
 * LocalStorageAdapter
 * Production-grade implementation of IStorageEngine wrapping window.localStorage
 * with automatic fallback, JSON error recovery, and sync/async APIs.
 */
export class LocalStorageAdapter implements IStorageEngine {
  private memoryFallback: Map<string, string> = new Map();
  private isStorageAvailable: boolean;

  constructor() {
    this.isStorageAvailable = this.checkStorageAvailability();
  }

  private checkStorageAvailability(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      console.warn('LocalStorage is not available. Using in-memory fallback.');
      return false;
    }
  }

  public getItemSync<T>(key: string, defaultValue?: T): T | null {
    try {
      let raw: string | null = null;
      if (this.isStorageAvailable) {
        raw = window.localStorage.getItem(key);
      } else {
        raw = this.memoryFallback.get(key) || null;
      }

      if (raw === null || raw === undefined) {
        return defaultValue ?? null;
      }

      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`LocalStorageAdapter: Failed to parse key "${key}"`, err);
      return defaultValue ?? null;
    }
  }

  public async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    return this.getItemSync(key, defaultValue);
  }

  public setItemSync<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (this.isStorageAvailable) {
        window.localStorage.setItem(key, serialized);
      } else {
        this.memoryFallback.set(key, serialized);
      }
    } catch (err) {
      console.error(`LocalStorageAdapter: Failed to save key "${key}"`, err);
    }
  }

  public async setItem<T>(key: string, value: T): Promise<void> {
    this.setItemSync(key, value);
  }

  public removeItemSync(key: string): void {
    try {
      if (this.isStorageAvailable) {
        window.localStorage.removeItem(key);
      } else {
        this.memoryFallback.delete(key);
      }
    } catch (err) {
      console.error(`LocalStorageAdapter: Failed to delete key "${key}"`, err);
    }
  }

  public async removeItem(key: string): Promise<void> {
    this.removeItemSync(key);
  }

  public clearSync(): void {
    try {
      if (this.isStorageAvailable) {
        window.localStorage.clear();
      } else {
        this.memoryFallback.clear();
      }
    } catch (err) {
      console.error('LocalStorageAdapter: Failed to clear storage', err);
    }
  }

  public async clear(): Promise<void> {
    this.clearSync();
  }

  public hasKey(key: string): boolean {
    if (this.isStorageAvailable) {
      return window.localStorage.getItem(key) !== null;
    }
    return this.memoryFallback.has(key);
  }

  public getAllKeys(): string[] {
    if (this.isStorageAvailable) {
      return Object.keys(window.localStorage);
    }
    return Array.from(this.memoryFallback.keys());
  }
}

export const defaultStorage = new LocalStorageAdapter();
