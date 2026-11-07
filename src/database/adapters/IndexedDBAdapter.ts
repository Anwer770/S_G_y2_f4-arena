import { IStorageEngine } from '../types/StorageEngine';

/**
 * IndexedDBAdapter
 * High-performance, unlimited-capacity persistent storage engine
 * using native browser IndexedDB with in-memory sync cache
 * and automatic one-time migration from localStorage.
 */
export class IndexedDBAdapter implements IStorageEngine {
  private dbName: string = 'PrimoERP_IndexedDB';
  private storeName: string = 'keyval';
  private dbVersion: number = 1;
  private db: IDBDatabase | null = null;
  private memoryCache: Map<string, string> = new Map();
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  /** اكتمل تحميل بيانات IndexedDB إلى الذاكرة المؤقتة (بوابة الجاهزية) */
  private hydrated: boolean = false;
  /** مفاتيح كُتبت قبل اكتمال الجاهزية — للمراقبة فقط (بلا تغيير سلوك) */
  private preHydrationWrites: Set<string> = new Set();

  constructor() {
    // Populate cache synchronously from localStorage as initial boot layer
    this.populateInitialCacheFromLocalStorage();
    // Initialize IndexedDB in the background
    this.initPromise = this.initDB();
  }

  private populateInitialCacheFromLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const val = window.localStorage.getItem(key);
          if (val !== null) {
            this.memoryCache.set(key, val);
          }
        }
      }
    } catch (e) {
      console.warn('IndexedDBAdapter: could not read initial localStorage cache', e);
    }
  }

  public async initDB(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available in current environment. Using memory fallback.');
      this.isInitialized = true;
      this.hydrated = true;
      this.reportPreHydrationWrites();
      return;
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };

        request.onsuccess = async (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isInitialized = true;

          // Hydrate memoryCache from IndexedDB
          await this.loadAllFromIndexedDB();

          // If IndexedDB had 0 keys but localStorage had data, do automatic migration!
          if (this.memoryCache.size === 0 && typeof window !== 'undefined' && window.localStorage?.length > 0) {
            await this.migrateFromLocalStorage();
          }

          this.hydrated = true;
          this.reportPreHydrationWrites();
          resolve();
        };

        request.onerror = (err) => {
          console.error('IndexedDBAdapter: Failed to open IndexedDB:', err);
          this.isInitialized = true; // Fallback to memoryCache
          this.hydrated = true;
          this.reportPreHydrationWrites();
          resolve();
        };
      } catch (err) {
        console.error('IndexedDBAdapter: Exception opening DB', err);
        this.isInitialized = true;
        this.hydrated = true;
        this.reportPreHydrationWrites();
        resolve();
      }
    });
  }

  private async loadAllFromIndexedDB(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.openCursor();

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            this.memoryCache.set(cursor.key as string, cursor.value as string);
            cursor.continue();
          } else {
            resolve();
          }
        };

        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private async migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      console.log('IndexedDBAdapter: Migrating existing data from localStorage to IndexedDB...');
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const val = window.localStorage.getItem(key);
          if (val !== null) {
            this.memoryCache.set(key, val);
            await this.persistToIDB(key, val);
          }
        }
      }
      console.log('IndexedDBAdapter: Migration completed successfully.');
    } catch (e) {
      console.warn('IndexedDBAdapter: Migration partial failure', e);
    }
  }

  private async persistToIDB(key: string, valueStr: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(valueStr, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  private async deleteFromIDB(key: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * بوابة الجاهزية: تنتظر اكتمال فتح IndexedDB وتحميل بياناته إلى الذاكرة المؤقتة.
   * تُستدعى من نقطة إقلاع التطبيق قبل تركيب الواجهة، لأن كل دوال القراءة
   * (utils/storage.ts وطبقة repositories) متزامنة ولا تنتظر التهيئة.
   */
  public ready(): Promise<void> {
    return this.initPromise ?? Promise.resolve();
  }

  /** هل اكتمل تحميل بيانات IndexedDB؟ (مراقبة/تشخيص) */
  public isReady(): boolean {
    return this.hydrated;
  }

  private reportPreHydrationWrites(): void {
    if (this.preHydrationWrites.size === 0) return;
    console.warn(
      'IndexedDBAdapter: writes before hydration completed for keys:',
      Array.from(this.preHydrationWrites).join(', ')
    );
    this.preHydrationWrites.clear();
  }

  public getRawSync(key: string): string | null {
    const raw = this.memoryCache.get(key);
    if (raw !== undefined && raw !== null) {
      return raw;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const lsRaw = window.localStorage.getItem(key);
      if (lsRaw !== null) {
        this.memoryCache.set(key, lsRaw);
        return lsRaw;
      }
    }
    return null;
  }

  public setRawSync(key: string, valueStr: string): void {
    if (!this.hydrated) this.preHydrationWrites.add(key);
    this.memoryCache.set(key, valueStr);
    this.persistToIDB(key, valueStr).catch((err) => {
      console.warn(`IndexedDBAdapter: async persist failed for key "${key}"`, err);
    });
    if (typeof window !== 'undefined' && window.localStorage && valueStr.length < 500000) {
      try {
        window.localStorage.setItem(key, valueStr);
      } catch {}
    }
  }

  public getItemSync<T>(key: string, defaultValue?: T): T | null {
    try {
      const raw = this.memoryCache.get(key);
      if (raw === undefined || raw === null) {
        // Fallback to localStorage if not in cache
        if (typeof window !== 'undefined' && window.localStorage) {
          const lsRaw = window.localStorage.getItem(key);
          if (lsRaw !== null) {
            this.memoryCache.set(key, lsRaw);
            try {
              return JSON.parse(lsRaw) as T;
            } catch {
              return lsRaw as unknown as T;
            }
          }
        }
        return defaultValue ?? null;
      }
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch {
      return defaultValue ?? null;
    }
  }

  public async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    if (this.initPromise) {
      await this.initPromise;
    }
    return this.getItemSync<T>(key, defaultValue);
  }

  public setItemSync<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (!this.hydrated) this.preHydrationWrites.add(key);
      this.memoryCache.set(key, serialized);

      // Async write to IndexedDB
      this.persistToIDB(key, serialized).catch((err) => {
        console.warn(`IndexedDBAdapter: async persist failed for key "${key}"`, err);
      });

      // Dual-write to localStorage for redundancy if small enough
      if (typeof window !== 'undefined' && window.localStorage && serialized.length < 500000) {
        try {
          window.localStorage.setItem(key, serialized);
        } catch {
          // localStorage quota exceeded; IndexedDB handles it safely!
        }
      }
    } catch (err) {
      console.error(`IndexedDBAdapter: Failed to set key "${key}"`, err);
    }
  }

  public async setItem<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    this.memoryCache.set(key, serialized);

    if (this.initPromise) {
      await this.initPromise;
    }

    await this.persistToIDB(key, serialized);

    if (typeof window !== 'undefined' && window.localStorage && serialized.length < 500000) {
      try {
        window.localStorage.setItem(key, serialized);
      } catch {
        // Quota safety
      }
    }
  }

  public removeItemSync(key: string): void {
    this.memoryCache.delete(key);
    this.deleteFromIDB(key).catch(() => {});
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
  }

  public async removeItem(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.initPromise) {
      await this.initPromise;
    }
    await this.deleteFromIDB(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
  }

  public clearSync(): void {
    this.memoryCache.clear();
    if (this.db) {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).clear();
      } catch {}
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {}
    }
  }

  public async clear(): Promise<void> {
    this.clearSync();
  }

  public hasKey(key: string): boolean {
    return this.memoryCache.has(key);
  }

  public getAllKeys(): string[] {
    return Array.from(this.memoryCache.keys());
  }

  public getStorageStats(): {
    engine: string;
    totalKeys: number;
    estimatedBytes: number;
    isIndexedDBActive: boolean;
  } {
    let estimatedBytes = 0;
    for (const [_, val] of this.memoryCache.entries()) {
      estimatedBytes += val.length * 2; // UTF-16 approximate
    }
    return {
      engine: this.db ? 'IndexedDB (مخزن دائم غير محدود)' : 'Memory Cache Fallback',
      totalKeys: this.memoryCache.size,
      estimatedBytes,
      isIndexedDBActive: !!this.db,
    };
  }
}

// Global Singleton Instance
export const indexedDBStorage = new IndexedDBAdapter();
