/**
 * اختبارات وحدة لحساب المخزون وأرقام المستندات (R50).
 *
 * لماذا؟ لأن `src/utils/stock.ts` (229 سطراً) و`src/utils/storage/stock.ts` و
 * `src/services/inventory/InventoryService.ts` كانت **خارج مقام التغطية** كلها:
 * إدخالها في المقام بلا اختبارات أنزل الإجمالي من 100% إلى **87.64% أسطر**.
 * وهي الطبقة التي تُحسب منها الكميات وتُولَّد منها أرقام الأذون (`IN-0004`)، وأي خطأ
 * فيها يعني رصيداً خاطئاً أو رقم مستند مكرراً.
 *
 * هنا يُقاس السلوك لا الشكل: كل رصيد يُحسب بمعادلة معلنة، وكل رقم مستند يُطابق نصّاً
 * دقيقاً، وكل حالة «بيانات ناقصة» لها نتيجة صريحة.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateStock,
  canDeleteProduct,
  cascadeRenameProduct,
  getMovementsForProduct,
  getNextSubId,
  normalizeArabicDigits,
  normalizeDate,
} from '../../src/utils/stock';
import {
  DEFAULT_STOCK_SEQ,
  loadStockCategories,
  loadStockRecords,
  loadStockSeq,
  loadStockStatuses,
  loadProducts,
  saveStockCategories,
  saveStockRecords,
  saveStockSeq,
  saveStockStatuses,
  saveProducts,
} from '../../src/utils/storage/stock';
import { inventoryService } from '../../src/services/inventory/InventoryService';
import { dbStorage } from '../../src/database/dbStorage';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';
import type { AppSettings, MovementRecord, Product } from '../../src/types';

const settings: AppSettings = {
  defaultYear: 2024,
  skipCancelled: true,
  defaultCurrency: 'ريال',
  enableNotifications: true,
};

const product = (over: Partial<Product> = {}): Product =>
  ({
    id: 'p-1',
    name: 'صنف أ',
    openingStock: 10,
    isActive: true,
    unit: 'حبة',
    ...over,
  }) as Product;

const movement = (over: Partial<MovementRecord> = {}): MovementRecord =>
  ({
    id: 'IN-0001',
    mainId: 'Categ-1001',
    subId: 'IN-0001',
    date: '2026-01-01',
    beneficiary: 'مورد',
    description: '',
    movementType: 'توريد',
    status: 'تم التنفيذ',
    category: 'مشتريات',
    items: { 'صنف أ': 5 },
    ...over,
  }) as MovementRecord;

describe('normalizeArabicDigits — الأرقام العربية والفارسية', () => {
  it('يحوّل الأرقام الهندية والفارسية إلى لاتينية', () => {
    expect(normalizeArabicDigits('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890');
    expect(normalizeArabicDigits('۱۲۳۴۵')).toBe('12345');
    expect(normalizeArabicDigits('IN-٠٠١٢')).toBe('IN-0012');
  });

  it('النصّ الفارغ يعيد سلسلة فارغة لا خطأ', () => {
    expect(normalizeArabicDigits('')).toBe('');
  });
});

describe('normalizeDate — كل صيغة إلى YYYY-MM-DD', () => {
  it('الصيغة الكاملة تُكمَّل بأصفار', () => {
    expect(normalizeDate('2026-1-5')).toBe('2026-01-05');
    expect(normalizeDate('2026-11-07')).toBe('2026-11-07');
  });

  it('DD-MM-YYYY تُقلَب إلى YYYY-MM-DD', () => {
    expect(normalizeDate('05-01-2026')).toBe('2026-01-05');
    expect(normalizeDate('5/1/2026')).toBe('2026-01-05');
  });

  it('DD-MM الناقصة تُكمَّل بالسنة الافتراضية أو الممرَّرة', () => {
    expect(normalizeDate('5-10')).toBe('2024-10-05');
    expect(normalizeDate('5-10', 2027)).toBe('2027-10-05');
  });

  it('MM-YYYY تُصبح أول الشهر', () => {
    expect(normalizeDate('12-2024')).toBe('2024-12-01');
  });

  it('الأرقام العربية تُطبَّع قبل التحليل', () => {
    expect(normalizeDate('٥/١٠/٢٠٢٦')).toBe('2026-10-05');
  });

  it('ما لا يُطابق أي صيغة يُعاد منظَّفاً بلا رمي (لا «Invalid Date»)', () => {
    expect(normalizeDate('نص غير صالح')).toBe('نص غير صالح');
    expect(normalizeDate('')).toBe('');
  });
});

describe('calculateStock — معادلة الرصيد', () => {
  it('الرصيد الحالي = افتتاحي + توريد − صرف', () => {
    const stock = calculateStock(
      [product({ openingStock: 10 })],
      [
        movement({ items: { 'صنف أ': 5 } }),
        movement({ subId: 'OUT-0001', movementType: 'صرف', items: { 'صنف أ': 2 } }),
      ],
      settings
    );

    expect(stock).toHaveLength(1);
    expect(stock[0]).toMatchObject({
      name: 'صنف أ',
      openingStock: 10,
      totalIn: 5,
      totalOut: 2,
      currentStock: 13,
      movementCount: 2,
    });
  });

  it('الحركات الملغاة تُستثنى افتراضياً و تُحسب حين يُطلب', () => {
    const records = [movement({ status: 'ملغي', items: { 'صنف أ': 100 } })];
    expect(calculateStock([product()], records, settings)[0].totalIn).toBe(0);
    expect(calculateStock([product()], records, { ...settings, skipCancelled: false })[0].totalIn).toBe(100);
  });

  it('صنف غير مسجَّل في القائمة يظهر برصيده لا يُسقَط', () => {
    const stock = calculateStock([], [movement({ items: { 'صنف مجهول': 3 } })], settings);

    expect(stock).toHaveLength(1);
    expect(stock[0].name).toBe('صنف مجهول');
    expect(stock[0].id).toMatch(/^PROD-/);
    expect(stock[0].unit).toBe('حبة');
    expect(stock[0].isActive).toBe(true);
    expect(stock[0].currentStock).toBe(3);
  });

  it('الكميات غير الصالحة أو غير الموجبة تُتخطّى بلا كسر الرصيد', () => {
    const records = [
      movement({ items: { 'صنف أ': 0 } as never }),
      movement({ items: { 'صنف أ': -4 } as never }),
      movement({ items: { 'صنف أ': 'غير رقم' } as never }),
    ];
    const [row] = calculateStock([product()], records, settings);

    expect(row.totalIn).toBe(0);
    expect(row.movementCount).toBe(0);
    expect(row.currentStock).toBe(10);
  });

  it('حركة بلا items أو بحقل مالي غير رقمي لا ترمي', () => {
    const records = [movement({ items: undefined as never })];
    const [row] = calculateStock([product({ openingStock: 'غير رقم' as never })], records, settings);

    expect(row.openingStock).toBe(0);
    expect(row.currentStock).toBe(0);
    expect(row.isActive).toBe(true);
    expect(row.unit).toBe('حبة');
  });

  it('إعدادات مفقودة لا تُسقط الدالة — الافتراضي هو استثناء الملغى', () => {
    const records = [movement({ status: 'ملغي', items: { 'صنف أ': 7 } })];
    const stock = calculateStock([product()], records);

    expect(stock[0].totalIn).toBe(0);
  });
});

describe('getNextSubId — أرقام المستندات', () => {
  it('يبدأ من عدّاد التسلسل حين لا سجلات', () => {
    const { subId, nextSeq } = getNextSubId('توريد', [], { IN: 4, OUT: 299 });
    expect(subId).toBe('IN-0004');
    expect(nextSeq).toEqual({ IN: 5, OUT: 299 });
  });

  it('يتجاوز أعلى رقم موجود في السجلات ويُكمّل الأصفار', () => {
    const records = [movement({ subId: 'IN-0009' }), movement({ subId: 'IN-0010' })];
    const { subId, nextSeq } = getNextSubId('توريد', records, { IN: 4, OUT: 299 });

    expect(subId).toBe('IN-0011');
    expect(nextSeq.IN).toBe(12);
  });

  it('الصرف له بادئة مستقلة ولا يتأثر بأرقام التوريد', () => {
    const records = [movement({ subId: 'IN-0050' })];
    const { subId, nextSeq } = getNextSubId('صرف', records, { IN: 4, OUT: 299 });

    expect(subId).toBe('OUT-0299');
    expect(nextSeq).toEqual({ IN: 4, OUT: 300 });
  });

  it('السجلات التي لا تتبع النمط أو بلا subId تُتجاهل', () => {
    const records = [
      movement({ subId: 'OUT-0007' }),
      movement({ subId: 'نص حر' }),
      movement({ subId: undefined as never }),
      movement({ subId: 'IN-XXXX' }),
    ];
    expect(getNextSubId('توريد', records, { IN: 1, OUT: 1 }).subId).toBe('IN-0001');
  });
});

describe('cascadeRenameProduct — إعادة التسمية على البيانات', () => {
  it('يغيّر اسم الصنف في القائمة وفي مفاتيح items معاً', () => {
    const { updatedProducts, updatedRecords } = cascadeRenameProduct(
      'صنف أ',
      'صنف أ الجديد',
      [product({ name: 'صنف أ' })],
      [movement({ items: { 'صنف أ': 5, 'صنف ب': 2 } })]
    );

    expect(updatedProducts[0].name).toBe('صنف أ الجديد');
    expect(updatedRecords[0].items).toEqual({ 'صنف أ الجديد': 5, 'صنف ب': 2 });
  });

  it('السجلات التي لا تحوي الاسم تُعاد كما هي (بلا نسخ)', () => {
    const record = movement({ items: { 'صنف ب': 1 } });
    const { updatedRecords } = cascadeRenameProduct('صنف أ', 'جديد', [], [record]);
    expect(updatedRecords[0]).toBe(record);

    const withoutItems = movement({ items: undefined as never });
    expect(cascadeRenameProduct('صنف أ', 'جديد', [], [withoutItems]).updatedRecords[0]).toBe(withoutItems);
  });
});

describe('سياسة حذف الصنف', () => {
  it('getMovementsForProduct: يطابق الاسم منظَّفاً ويتجاهل الفراغ', () => {
    const records = [movement({ items: { 'صنف أ': 1 } }), movement({ items: { 'صنف ب': 1 } })];

    expect(getMovementsForProduct(records, '  صنف أ  ')).toHaveLength(1);
    expect(getMovementsForProduct(records, '')).toEqual([]);
    expect(getMovementsForProduct(records, '   ')).toEqual([]);
  });

  it('canDeleteProduct: بلا حركات مسموح، ومعها ممنوع بوصف صريح', () => {
    expect(canDeleteProduct([], 'صنف أ')).toEqual({ allowed: true, linkedCount: 0 });

    const blocked = canDeleteProduct([movement({ items: { 'صنف أ': 1 } })], 'صنف أ');
    expect(blocked.allowed).toBe(false);
    expect(blocked.linkedCount).toBe(1);
    expect(blocked.reason).toContain('إيقاف الصنف');
  });
});

describe('مخزن وحدة المخزون — عقود القراءة والكتابة', () => {
  beforeEach(() => {
    for (const key of [
      STORAGE_KEYS.STOCK_PRODUCTS,
      STORAGE_KEYS.STOCK_RECORDS,
      STORAGE_KEYS.STOCK_CATEGORIES,
      STORAGE_KEYS.STOCK_STATUSES,
      STORAGE_KEYS.STOCK_SEQ,
    ]) {
      dbStorage.removeItem(key);
    }
  });

  it('القراءة الأولى تُعيد البذور ولا تكتب فوق بيانات موجودة', () => {
    expect(loadProducts().length).toBeGreaterThan(0);
    const mine = [product({ id: 'mine', name: 'صنفي' })];
    saveProducts(mine);
    expect(loadProducts()).toEqual(mine);
  });

  it('عدّاد التسلسل: الكائن التالف يعود إلى الافتراضي كاملاً لا جزئياً', () => {
    expect(loadStockSeq()).toEqual(DEFAULT_STOCK_SEQ);

    dbStorage.setItem(STORAGE_KEYS.STOCK_SEQ, JSON.stringify({ IN: '٤' }));
    expect(loadStockSeq()).toEqual(DEFAULT_STOCK_SEQ);

    saveStockSeq({ IN: 20, OUT: 40 });
    expect(loadStockSeq()).toEqual({ IN: 20, OUT: 40 });
  });

  it('القوائم النصية (تصنيفات · حالات) تُقرأ وتُكتب على مفاتيحها', () => {
    expect(loadStockCategories().length).toBeGreaterThan(0);
    saveStockCategories(['تصنيف واحد']);
    expect(loadStockCategories()).toEqual(['تصنيف واحد']);

    expect(loadStockStatuses().length).toBeGreaterThan(0);
    saveStockStatuses(['حالة واحدة']);
    expect(loadStockStatuses()).toEqual(['حالة واحدة']);
  });

  it('سجلات الحركة: المحفوظ يُقرأ كما هو', () => {
    const records = [movement({ subId: 'IN-0777', items: { 'صنف أ': 3 } })];
    saveStockRecords(records);
    expect(loadStockRecords()).toEqual(records);
  });
});

describe('InventoryService — تجميع الطبقات', () => {
  beforeEach(() => {
    dbStorage.removeItem(STORAGE_KEYS.STOCK_PRODUCTS);
    dbStorage.removeItem(STORAGE_KEYS.STOCK_RECORDS);
    dbStorage.removeItem(STORAGE_KEYS.STOCK_SEQ);
  });

  it('calculateCurrentStock يمرّر الإعدادات ويحسب الرصيد', () => {
    saveProducts([product({ openingStock: 4 })]);
    saveStockRecords([movement({ items: { 'صنف أ': 6 } })]);

    const [row] = inventoryService.calculateCurrentStock(undefined, undefined, settings);
    expect(row.currentStock).toBe(10);
  });

  it('saveMovement الجديد يُضاف ويُرقّم التسلسل تلقائياً', () => {
    saveProducts([product()]);
    const updates: { IN: number; OUT: number }[] = [];

    const saved = inventoryService.saveMovement(
      movement({ subId: 'IN-0012', items: { 'صنف أ': 2 } }),
      { IN: 12, OUT: 0 },
      (next) => updates.push(next)
    );

    expect(saved.subId).toBe('IN-0012');
    expect(inventoryService.getAllMovements().some((m) => m.subId === 'IN-0012')).toBe(true);
    expect(updates).toEqual([{ IN: 13, OUT: 0 }]);
  });

  it('saveMovement لرقم موجود يُحدّث ولا يُكرّر', () => {
    saveProducts([product()]);
    saveStockRecords([movement({ id: 'IN-0001', subId: 'IN-0001', items: { 'صنف أ': 5 } })]);

    inventoryService.saveMovement(movement({ id: 'IN-0001', subId: 'IN-0001', items: { 'صنف أ': 9 } }), {
      IN: 2,
      OUT: 2,
    });

    const rows = inventoryService.getAllMovements().filter((m) => m.subId === 'IN-0001');
    expect(rows).toHaveLength(1);
    expect(rows[0].items).toEqual({ 'صنف أ': 9 });
  });

  it('cloneMovement يُنشئ رقماً جديداً ويحفظه', () => {
    saveProducts([product()]);
    saveStockRecords([movement({ subId: 'IN-0004', items: { 'صنف أ': 1 } })]);

    const cloned = inventoryService.cloneMovement(movement({ subId: 'IN-0004' }), inventoryService.getAllMovements(), {
      IN: 4,
      OUT: 0,
    });

    expect(cloned.subId).toBe('IN-0005');
    expect(cloned.id).toBe('IN-0005');
    expect(inventoryService.getAllMovements().some((m) => m.subId === 'IN-0005')).toBe(true);
  });

  it('renameProduct يغيّر الاسم في الأصناف والأذون معاً', () => {
    saveProducts([product({ id: 'p-1', name: 'صنف أ' })]);
    saveStockRecords([movement({ items: { 'صنف أ': 1 } })]);

    const result = inventoryService.renameProduct('صنف أ', product({ id: 'p-1', name: 'صنف جديد' }));

    expect(result.updatedProducts[0].name).toBe('صنف جديد');
    expect(inventoryService.getAllProducts()[0].name).toBe('صنف جديد');
    expect(inventoryService.getAllMovements()[0].items).toEqual({ 'صنف جديد': 1 });
  });

  it('renameProduct بلا تغيير اسم يحدّث الصنف وحده', () => {
    saveProducts([product({ id: 'p-1', name: 'صنف أ', unit: 'حبة' })]);
    const result = inventoryService.renameProduct('صنف أ', product({ id: 'p-1', name: 'صنف أ', unit: 'كرتون' }));

    expect(result.updatedProducts[0].unit).toBe('كرتون');
    expect(inventoryService.getAllProducts()[0].unit).toBe('كرتون');
  });
});

/**
 * R50 — الفروع الدفاعية في طبقة المخزون.
 * بيانات مُستوردة قديمة تُنتج حقولاً غائبة أو فارغة: `isActive` بلا قيمة، `unit` فارغ،
 * أرقام أذون أقل من العدّاد، حركة تحمل `subId` موجوداً و`id` مختلفاً، وأرقام لا تتبع النمط.
 */
describe('R50 — calculateStock مع حقول الأصناف الغائبة أو الفارغة', () => {
  it('isActive غائب ⇒ true، وunit فارغ ⇒ «حبة»', () => {
    const [row] = calculateStock([product({ isActive: undefined as never, unit: '' as never })], [], settings);

    expect(row.isActive).toBe(true);
    expect(row.unit).toBe('حبة');
  });

  it('رقم إذن أقل من العدّاد لا يخفض التسلسل', () => {
    const records = [movement({ subId: 'IN-0050' })];
    const { subId } = getNextSubId('توريد', records, { IN: 100, OUT: 1 });

    expect(subId).toBe('IN-0100');
  });

  it('cascadeRenameProduct يترك الأصناف ذات الاسم الآخر كما هي', () => {
    const other = product({ id: 'p-2', name: 'صنف ب' });
    const { updatedProducts } = cascadeRenameProduct('صنف أ', 'جديد', [product({ name: 'صنف أ' }), other], []);

    expect(updatedProducts[0].name).toBe('جديد');
    expect(updatedProducts[1]).toBe(other);
  });
});

describe('R50 — InventoryService: مسارات الحفظ غير السعيدة', () => {
  beforeEach(() => {
    dbStorage.removeItem(STORAGE_KEYS.STOCK_PRODUCTS);
    dbStorage.removeItem(STORAGE_KEYS.STOCK_RECORDS);
    dbStorage.removeItem(STORAGE_KEYS.STOCK_SEQ);
  });

  it('حركة بـsubId موجود وid مختلف: التحديث يفشل فيُحفظ الكائن كما هو بلا فقدان', () => {
    saveProducts([product()]);
    saveStockRecords([movement({ id: 'IN-0001', subId: 'IN-0001', items: { 'صنف أ': 5 } })]);

    const saved = inventoryService.saveMovement(movement({ id: 'id-مختلف', subId: 'IN-0001', items: { 'صنف أ': 1 } }), {
      IN: 2,
      OUT: 2,
    });

    expect(saved.id).toBe('id-مختلف');
    expect(inventoryService.getAllMovements().filter((m) => m.subId === 'IN-0001')).toHaveLength(1);
  });

  it('حركة بلا id تستعمل subId في التحديث، ورقم غير مطابق للنمط لا يُحرّك العدّاد', () => {
    saveProducts([product()]);
    saveStockRecords([movement({ id: 'IN-0001', subId: 'IN-0001', items: { 'صنف أ': 5 } })]);

    const updates: unknown[] = [];
    inventoryService.saveMovement(
      movement({ id: undefined as never, subId: 'IN-0001', items: { 'صنف أ': 8 } }),
      { IN: 2, OUT: 2 },
      (next) => updates.push(next)
    );
    expect(updates).toEqual([]);

    const saved = inventoryService.saveMovement(movement({ id: 'X', subId: 'IN-نص' }), { IN: 2, OUT: 2 }, (next) =>
      updates.push(next)
    );
    expect(saved.subId).toBe('IN-نص');
    expect(updates).toEqual([]);
  });

  it('renameProduct يترك بقية الأصناف كما هي في المسارين', () => {
    const keep = product({ id: 'p-2', name: 'صنف ب' });
    saveProducts([product({ id: 'p-1', name: 'صنف أ' }), keep]);

    const renamed = inventoryService.renameProduct('صنف أ', product({ id: 'p-1', name: 'صنف جديد' }));
    expect(renamed.updatedProducts[1]).toEqual(keep);

    const sameName = inventoryService.renameProduct(
      'صنف جديد',
      product({ id: 'p-1', name: 'صنف جديد', unit: 'كرتون' })
    );
    expect(sameName.updatedProducts[1]).toEqual(keep);
    expect(sameName.updatedRecords).toBeInstanceOf(Array);
  });
});

describe('R50 — أسماء مستعارة في مخزن المخزون', () => {
  beforeEach(() => {
    dbStorage.removeItem(STORAGE_KEYS.STOCK_RECORDS);
    dbStorage.removeItem(STORAGE_KEYS.STOCK_CATEGORIES);
    dbStorage.removeItem(STORAGE_KEYS.STOCK_STATUSES);
    dbStorage.removeItem(STORAGE_KEYS.STOCK_SEQ);
  });

  it('loadRecords/saveRecords و loadCategories/saveCategories', async () => {
    const { loadRecords, saveRecords, loadCategories, saveCategories } = await import('../../src/utils/storage/stock');

    const records = [movement({ subId: 'IN-0500' })];
    saveRecords(records);
    expect(loadRecords()).toEqual(records);

    saveCategories(['أ', 'ب']);
    expect(loadCategories()).toEqual(['أ', 'ب']);
  });

  it('loadStatuses/saveStatuses و loadSeq/saveSeq', async () => {
    const { loadStatuses, saveStatuses, loadSeq, saveSeq } = await import('../../src/utils/storage/stock');

    saveStatuses(['تم']);
    expect(loadStatuses()).toEqual(['تم']);

    saveSeq({ IN: 7, OUT: 8 });
    expect(loadSeq()).toEqual({ IN: 7, OUT: 8 });
  });
});
