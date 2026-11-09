/**
 * مخزن وحدة المخزون (Stock) — مُستخرج من storage.ts (R24).
 * المفاتيح تأتي من keys.ts كي تبقى ثابتة ولا يتغيّر أي مفتاح تخزين.
 *
 * R37: كل قراءة/كتابة عبر مستودع، مع الحفاظ على **سلوكين حرفياً**:
 *  1. **الهجرة التدريجية:** إن غاب المفتاح الحالي تُقرأ المفاتيح القديمة
 *     (`stock_ledger_*_v1`) — عبر `legacyKeys`، والكتابة تذهب للمفتاح الحالي وحده.
 *  2. **عدّاد التسلسل:** لا يُدمج جزئياً. كائن بلا `IN`/`OUT` رقميين = عدّاد تالف
 *     ⇒ يُعاد الافتراضي كاملاً (`isValid`)، وإلا لتولّدت حركة برقم مكرّر.
 */
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import { createObjectRepository } from '../../database/repositories/ObjectRepository';
import type { MovementRecord, Product } from '../../types';
import {
  DEFAULT_CATEGORIES as DEFAULT_STOCK_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_STATUSES as DEFAULT_STOCK_STATUSES,
} from '../../data/defaultProducts';
import { INITIAL_RECORDS } from '../../data/defaultRecords';
import { STORAGE_KEYS } from './keys';

export const DEFAULT_STOCK_SEQ = {
  IN: 4,
  OUT: 299,
};

/** المفاتيح القديمة التي كانت تُقرأ قبل توحيد المفاتيح (R24). */
const LEGACY_PRODUCTS = 'stock_ledger_products_v1';
const LEGACY_RECORDS = 'stock_ledger_records_v1';
const LEGACY_CATEGORIES = 'stock_ledger_categories_v1';
const LEGACY_STATUSES = 'stock_ledger_statuses_v1';
const LEGACY_SEQ = 'stock_ledger_seq_v1';

const productsRepo = createCollectionRepository<Product>({
  key: STORAGE_KEYS.STOCK_PRODUCTS,
  fallback: DEFAULT_PRODUCTS,
  fallbackOnEmpty: true,
  legacyKeys: [LEGACY_PRODUCTS],
});

const recordsRepo = createCollectionRepository<MovementRecord>({
  key: STORAGE_KEYS.STOCK_RECORDS,
  fallback: INITIAL_RECORDS,
  fallbackOnEmpty: true,
  legacyKeys: [LEGACY_RECORDS],
});

const categoriesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.STOCK_CATEGORIES,
  fallback: DEFAULT_STOCK_CATEGORIES,
  fallbackOnEmpty: true,
  legacyKeys: [LEGACY_CATEGORIES],
});

const statusesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.STOCK_STATUSES,
  fallback: DEFAULT_STOCK_STATUSES,
  fallbackOnEmpty: true,
  legacyKeys: [LEGACY_STATUSES],
});

/** عدّاد التسلسل: كائن مفرد لا يقبل الدمج الجزئي. */
const seqRepo = createObjectRepository<{ IN: number; OUT: number }>({
  key: STORAGE_KEYS.STOCK_SEQ,
  defaults: DEFAULT_STOCK_SEQ,
  noMerge: true,
  isValid: (value) => typeof value.IN === 'number' && typeof value.OUT === 'number',
  legacyKeys: [LEGACY_SEQ],
});

export function loadProducts(): Product[] {
  return productsRepo.read();
}

export function saveProducts(products: Product[]): void {
  productsRepo.write(products);
}

export function loadStockRecords(): MovementRecord[] {
  return recordsRepo.read();
}

export function saveStockRecords(records: MovementRecord[]): void {
  recordsRepo.write(records);
}

export function loadStockCategories(): string[] {
  return categoriesRepo.read();
}

export function saveStockCategories(cats: string[]): void {
  categoriesRepo.write(cats);
}

export function loadStockStatuses(): string[] {
  return statusesRepo.read();
}

export function saveStockStatuses(stats: string[]): void {
  statusesRepo.write(stats);
}

export function loadStockSeq(): { IN: number; OUT: number } {
  return seqRepo.read();
}

export function saveStockSeq(seq: { IN: number; OUT: number }): void {
  seqRepo.write(seq);
}

export function loadRecords(): MovementRecord[] {
  return loadStockRecords();
}

export function saveRecords(records: MovementRecord[]): void {
  saveStockRecords(records);
}

export function loadCategories(): string[] {
  return loadStockCategories();
}

export function saveCategories(cats: string[]): void {
  saveStockCategories(cats);
}

export function loadStatuses(): string[] {
  return loadStockStatuses();
}

export function saveStatuses(stats: string[]): void {
  saveStockStatuses(stats);
}

export function loadSeq(): { IN: number; OUT: number } {
  return loadStockSeq();
}

export function saveSeq(seq: { IN: number; OUT: number }): void {
  saveStockSeq(seq);
}
