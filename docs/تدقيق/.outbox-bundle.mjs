// src/database/adapters/IndexedDBAdapter.ts
var IndexedDBAdapter = class {
  constructor() {
    this.dbName = "PrimoERP_IndexedDB";
    this.storeName = "keyval";
    this.dbVersion = 1;
    this.db = null;
    this.memoryCache = /* @__PURE__ */ new Map();
    this.isInitialized = false;
    this.initPromise = null;
    /** اكتمل تحميل بيانات IndexedDB إلى الذاكرة المؤقتة (بوابة الجاهزية) */
    this.hydrated = false;
    /** مفاتيح كُتبت قبل اكتمال الجاهزية — للمراقبة فقط (بلا تغيير سلوك) */
    this.preHydrationWrites = /* @__PURE__ */ new Set();
    this.populateInitialCacheFromLocalStorage();
    this.initPromise = this.initDB();
  }
  populateInitialCacheFromLocalStorage() {
    if (typeof window === "undefined" || !window.localStorage) return;
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
      console.warn("IndexedDBAdapter: could not read initial localStorage cache", e);
    }
  }
  async initDB() {
    if (typeof window === "undefined" || !window.indexedDB) {
      console.warn("IndexedDB not available in current environment. Using memory fallback.");
      this.isInitialized = true;
      this.hydrated = true;
      this.reportPreHydrationWrites();
      return;
    }
    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(this.dbName, this.dbVersion);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
        request.onsuccess = async (event) => {
          this.db = event.target.result;
          this.isInitialized = true;
          await this.loadAllFromIndexedDB();
          if (this.memoryCache.size === 0 && typeof window !== "undefined" && window.localStorage?.length > 0) {
            await this.migrateFromLocalStorage();
          }
          this.hydrated = true;
          this.reportPreHydrationWrites();
          resolve();
        };
        request.onerror = (err) => {
          console.error("IndexedDBAdapter: Failed to open IndexedDB:", err);
          this.isInitialized = true;
          this.hydrated = true;
          this.reportPreHydrationWrites();
          resolve();
        };
      } catch (err) {
        console.error("IndexedDBAdapter: Exception opening DB", err);
        this.isInitialized = true;
        this.hydrated = true;
        this.reportPreHydrationWrites();
        resolve();
      }
    });
  }
  async loadAllFromIndexedDB() {
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            this.memoryCache.set(cursor.key, cursor.value);
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
  async migrateFromLocalStorage() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      console.log("IndexedDBAdapter: Migrating existing data from localStorage to IndexedDB...");
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
      console.log("IndexedDBAdapter: Migration completed successfully.");
    } catch (e) {
      console.warn("IndexedDBAdapter: Migration partial failure", e);
    }
  }
  async persistToIDB(key, valueStr) {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        const req = store.put(valueStr, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }
  async deleteFromIDB(key) {
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, "readwrite");
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
  ready() {
    return this.initPromise ?? Promise.resolve();
  }
  /** هل اكتمل تحميل بيانات IndexedDB؟ (مراقبة/تشخيص) */
  isReady() {
    return this.hydrated;
  }
  reportPreHydrationWrites() {
    if (this.preHydrationWrites.size === 0) return;
    console.warn(
      "IndexedDBAdapter: writes before hydration completed for keys:",
      Array.from(this.preHydrationWrites).join(", ")
    );
    this.preHydrationWrites.clear();
  }
  getRawSync(key) {
    const raw = this.memoryCache.get(key);
    if (raw !== void 0 && raw !== null) {
      return raw;
    }
    if (typeof window !== "undefined" && window.localStorage) {
      const lsRaw = window.localStorage.getItem(key);
      if (lsRaw !== null) {
        this.memoryCache.set(key, lsRaw);
        return lsRaw;
      }
    }
    return null;
  }
  setRawSync(key, valueStr) {
    if (!this.hydrated) this.preHydrationWrites.add(key);
    this.memoryCache.set(key, valueStr);
    this.persistToIDB(key, valueStr).catch((err) => {
      console.warn(`IndexedDBAdapter: async persist failed for key "${key}"`, err);
    });
    if (typeof window !== "undefined" && window.localStorage && valueStr.length < 5e5) {
      try {
        window.localStorage.setItem(key, valueStr);
      } catch {
      }
    }
  }
  getItemSync(key, defaultValue) {
    try {
      const raw = this.memoryCache.get(key);
      if (raw === void 0 || raw === null) {
        if (typeof window !== "undefined" && window.localStorage) {
          const lsRaw = window.localStorage.getItem(key);
          if (lsRaw !== null) {
            this.memoryCache.set(key, lsRaw);
            try {
              return JSON.parse(lsRaw);
            } catch {
              return lsRaw;
            }
          }
        }
        return defaultValue ?? null;
      }
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    } catch {
      return defaultValue ?? null;
    }
  }
  async getItem(key, defaultValue) {
    if (this.initPromise) {
      await this.initPromise;
    }
    return this.getItemSync(key, defaultValue);
  }
  setItemSync(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (!this.hydrated) this.preHydrationWrites.add(key);
      this.memoryCache.set(key, serialized);
      this.persistToIDB(key, serialized).catch((err) => {
        console.warn(`IndexedDBAdapter: async persist failed for key "${key}"`, err);
      });
      if (typeof window !== "undefined" && window.localStorage && serialized.length < 5e5) {
        try {
          window.localStorage.setItem(key, serialized);
        } catch {
        }
      }
    } catch (err) {
      console.error(`IndexedDBAdapter: Failed to set key "${key}"`, err);
    }
  }
  async setItem(key, value) {
    const serialized = JSON.stringify(value);
    this.memoryCache.set(key, serialized);
    if (this.initPromise) {
      await this.initPromise;
    }
    await this.persistToIDB(key, serialized);
    if (typeof window !== "undefined" && window.localStorage && serialized.length < 5e5) {
      try {
        window.localStorage.setItem(key, serialized);
      } catch {
      }
    }
  }
  removeItemSync(key) {
    this.memoryCache.delete(key);
    this.deleteFromIDB(key).catch(() => {
    });
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
      }
    }
  }
  async removeItem(key) {
    this.memoryCache.delete(key);
    if (this.initPromise) {
      await this.initPromise;
    }
    await this.deleteFromIDB(key);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
      }
    }
  }
  clearSync() {
    this.memoryCache.clear();
    if (this.db) {
      try {
        const tx = this.db.transaction(this.storeName, "readwrite");
        tx.objectStore(this.storeName).clear();
      } catch {
      }
    }
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {
      }
    }
  }
  async clear() {
    this.clearSync();
  }
  hasKey(key) {
    return this.memoryCache.has(key);
  }
  getAllKeys() {
    return Array.from(this.memoryCache.keys());
  }
  getStorageStats() {
    let estimatedBytes = 0;
    for (const [_, val] of this.memoryCache.entries()) {
      estimatedBytes += val.length * 2;
    }
    return {
      engine: this.db ? "IndexedDB (\u0645\u062E\u0632\u0646 \u062F\u0627\u0626\u0645 \u063A\u064A\u0631 \u0645\u062D\u062F\u0648\u062F)" : "Memory Cache Fallback",
      totalKeys: this.memoryCache.size,
      estimatedBytes,
      isIndexedDBActive: !!this.db
    };
  }
};
var indexedDBStorage = new IndexedDBAdapter();

// src/core/audit/AuditService.ts
var AUDIT_STORAGE_KEY = "suite_unified_audit_v2";
var MAX_LOGS = 500;
var CentralAuditService = class _CentralAuditService {
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }
  static getInstance() {
    if (!_CentralAuditService.instance) {
      _CentralAuditService.instance = new _CentralAuditService();
    }
    return _CentralAuditService.instance;
  }
  getOrCreateDeviceId() {
    const KEY = "suite_device_id_v1";
    let id = indexedDBStorage.getItemSync(KEY);
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
      indexedDBStorage.setItemSync(KEY, id);
    }
    return id;
  }
  getDeviceId() {
    return this.deviceId;
  }
  log(entry) {
    const fullEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      deviceId: this.deviceId,
      userId: entry.userId || "admin",
      action: entry.action,
      entity: entry.entity,
      recordId: entry.recordId,
      details: entry.details,
      oldValue: entry.oldValue,
      newValue: entry.newValue
    };
    try {
      const logs = this.getAllLogs();
      const updated = [fullEntry, ...logs].slice(0, MAX_LOGS);
      indexedDBStorage.setItemSync(AUDIT_STORAGE_KEY, updated);
    } catch (e) {
      console.error("AuditService: Failed to record audit log", e);
    }
    return fullEntry;
  }
  getAllLogs() {
    const logs = indexedDBStorage.getItemSync(AUDIT_STORAGE_KEY);
    return Array.isArray(logs) ? logs : [];
  }
  getLogsByEntity(entity) {
    return this.getAllLogs().filter((l) => l.entity === entity);
  }
  clearLogs() {
    indexedDBStorage.setItemSync(AUDIT_STORAGE_KEY, []);
  }
};
var auditService = CentralAuditService.getInstance();

// src/sync/Outbox.ts
var OUTBOX_KEY = "suite_sync_outbox_v1";
var OUTBOX_DROPPED_KEY = "suite_sync_outbox_dropped_v1";
var OUTBOX_MAX_ENTRIES = 2e3;
var Outbox = class _Outbox {
  static enqueue(entity, operation, recordId, payload) {
    const mutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      deviceId: auditService.getDeviceId(),
      entity,
      operation,
      recordId,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: "PENDING"
    };
    let queue = _Outbox.getAll();
    queue.push(mutation);
    if (queue.length > OUTBOX_MAX_ENTRIES) {
      const overflow = queue.length - OUTBOX_MAX_ENTRIES;
      queue = queue.slice(overflow);
      _Outbox.recordDropped(overflow);
    }
    indexedDBStorage.setItemSync(OUTBOX_KEY, queue);
    return mutation;
  }
  static getAll() {
    const data = indexedDBStorage.getItemSync(OUTBOX_KEY);
    return Array.isArray(data) ? data : [];
  }
  static remove(mutationId) {
    const queue = _Outbox.getAll().filter((m) => m.id !== mutationId);
    indexedDBStorage.setItemSync(OUTBOX_KEY, queue);
  }
  static markFailed(mutationId) {
    const queue = _Outbox.getAll().map(
      (m) => m.id === mutationId ? { ...m, status: "FAILED", retryCount: m.retryCount + 1 } : m
    );
    indexedDBStorage.setItemSync(OUTBOX_KEY, queue);
  }
  static clear() {
    indexedDBStorage.setItemSync(OUTBOX_KEY, []);
  }
  static count() {
    return _Outbox.getAll().length;
  }
  /** عدد العناصر المُسقَطة بسبب تجاوز السقف (مراقبة/تشخيص — لا يحذف بيانات المستخدم) */
  static getDroppedCount() {
    const value = indexedDBStorage.getItemSync(OUTBOX_DROPPED_KEY);
    return typeof value === "number" && value > 0 ? value : 0;
  }
  /** أقصى عدد عناصر يُحتفظ به في الطابور */
  static maxEntries() {
    return OUTBOX_MAX_ENTRIES;
  }
  static recordDropped(count) {
    const total = _Outbox.getDroppedCount() + count;
    indexedDBStorage.setItemSync(OUTBOX_DROPPED_KEY, total);
    console.warn(
      `Outbox: dropped ${count} oldest mutation(s) \u2014 queue capped at ${OUTBOX_MAX_ENTRIES}. Total dropped so far: ${total}. (\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u064F\u0641\u0631\u0650\u0651\u063A \u0644\u0644\u0645\u0632\u0627\u0645\u0646\u0629\u061B \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0645\u062D\u0641\u0648\u0638\u0629 \u0641\u064A \u0645\u062E\u0627\u0632\u0646\u0647\u0627)`
    );
    auditService.log({
      action: "Delete",
      entity: "SyncOutboxTrim",
      details: `\u062A\u0645 \u0625\u0633\u0642\u0627\u0637 ${count} \u0639\u0645\u0644\u064A\u0629 \u0642\u062F\u064A\u0645\u0629 \u0645\u0646 \u0637\u0627\u0628\u0648\u0631 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0644\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0633\u0642\u0641 (${OUTBOX_MAX_ENTRIES}). \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A: ${total}`
    });
  }
};
export {
  Outbox
};
