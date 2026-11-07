import { IStorageEngine } from '../types/StorageEngine';
import { indexedDBStorage } from '../adapters/IndexedDBAdapter';

export interface Identifiable {
  id?: string;
  subId?: string;
}

/**
 * BaseRepository
 * Generic base repository implementing CRUD operations on persistent collections
 * with zero UI coupling, supporting both sync (backward compatibility) and async APIs.
 */
export class BaseRepository<T extends Identifiable> {
  protected storageKey: string;
  protected defaultData: T[];
  protected storage: IStorageEngine;

  constructor(
    storageKey: string,
    defaultData: T[] = [],
    storage: IStorageEngine = indexedDBStorage
  ) {
    this.storageKey = storageKey;
    this.defaultData = defaultData;
    this.storage = storage;
  }

  public getAll(): T[] {
    const data = this.storage.getItemSync<T[]>(this.storageKey);
    if (!data || !Array.isArray(data)) {
      this.storage.setItemSync(this.storageKey, this.defaultData);
      return [...this.defaultData];
    }
    return data;
  }

  public async getAllAsync(): Promise<T[]> {
    return this.getAll();
  }

  public getById(id: string): T | null {
    const items = this.getAll();
    return items.find((item) => item.id === id || item.subId === id) || null;
  }

  public find(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  public findOne(predicate: (item: T) => boolean): T | null {
    return this.getAll().find(predicate) || null;
  }

  public saveAll(items: T[]): void {
    this.storage.setItemSync(this.storageKey, items);
  }

  public async saveAllAsync(items: T[]): Promise<void> {
    this.saveAll(items);
  }

  public add(item: T): T {
    const items = this.getAll();
    const updated = [item, ...items];
    this.saveAll(updated);
    return item;
  }

  public update(id: string, updatedItem: Partial<T>): T | null {
    const items = this.getAll();
    const index = items.findIndex((i) => i.id === id || i.subId === id);
    if (index === -1) return null;

    const merged = { ...items[index], ...updatedItem } as T;
    items[index] = merged;
    this.saveAll(items);
    return merged;
  }

  public upsert(item: T): T {
    const id = item.id || item.subId;
    if (!id) return this.add(item);

    const items = this.getAll();
    const index = items.findIndex((i) => (i.id && i.id === id) || (i.subId && i.subId === id));
    if (index >= 0) {
      items[index] = { ...items[index], ...item };
      this.saveAll(items);
      return items[index];
    } else {
      return this.add(item);
    }
  }

  public delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((i) => i.id !== id && i.subId !== id);
    if (filtered.length !== items.length) {
      this.saveAll(filtered);
      return true;
    }
    return false;
  }

  public bulkDelete(ids: string[]): number {
    const idSet = new Set(ids);
    const items = this.getAll();
    const filtered = items.filter((i) => !idSet.has(i.id || '') && !idSet.has(i.subId || ''));
    const deletedCount = items.length - filtered.length;
    if (deletedCount > 0) {
      this.saveAll(filtered);
    }
    return deletedCount;
  }

  public count(): number {
    return this.getAll().length;
  }

  public clear(): void {
    this.saveAll([]);
  }

  public resetToDefault(): void {
    this.saveAll([...this.defaultData]);
  }
}
