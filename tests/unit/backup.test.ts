/**
 * اختبارات وحدة للنسخ الاحتياطي والاستعادة (R51).
 *
 * لماذا؟ لأن `src/utils/storage/backup.ts` (572 سطراً) و`services/backup/*` كانت
 * **خارج مقام التغطية**: إدخالها بلا اختبارات أنزل الإجمالي من 100% إلى **82.57% أسطر**.
 * وهذا أخطر ما تبقّى: خطأ في الاستعادة لا يعطي رصيداً خاطئاً بل يُفقد بيانات المستخدم.
 *
 * هنا يُقاس **الذهاب والعودة**: تُنشأ نسخة من حالة معروفة، تُغيَّر البيانات، ثم يُسترجَع
 * الملف فتُقارَن الحقول — لا مجرّد «الدالة لم ترمِ».
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllData,
  getUnifiedBackupState,
  loadEmergencyBackup,
  restoreDefaultData,
  restoreUnifiedBackupState,
  createUnifiedBackup,
  resetAllModuleData,
  restoreUnifiedBackup,
} from '../../src/utils/storage/backup';
import { BackupService } from '../../src/services/backup/BackupService';
import { auditService } from '../../src/core/audit/AuditService';
import { loadCustomers, saveCustomers } from '../../src/utils/storage/customers';
import { loadDebts, saveDebts } from '../../src/utils/storage/debts';
import { loadNotes, saveNotes } from '../../src/utils/storage/knowledge';
import { loadSettings, saveSettings, DEFAULT_APP_SETTINGS } from '../../src/utils/storage/settings';
import {
  loadStockRecords,
  loadStockSeq,
  loadProducts,
  saveStockRecords,
  saveStockSeq,
} from '../../src/utils/storage/stock';
import { loadTasks, saveTasks } from '../../src/utils/storage/tasks';
import { loadSystemAuditLogs, saveSystemAuditLogs } from '../../src/utils/storage/system';
import { APP_VERSION } from '../../src/constants/appMeta';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';
import { dbStorage } from '../../src/database/dbStorage';
import type { UnifiedBackupState } from '../../src/types';

/** يفرّغ مفاتيح الوحدات التي تلمسها هذه الاختبارات فقط. */
const RESET_KEYS = [
  STORAGE_KEYS.STOCK_RECORDS,
  STORAGE_KEYS.STOCK_SEQ,
  STORAGE_KEYS.CUSTOMERS_ITEMS,
  STORAGE_KEYS.DEBTS_RECORDS,
  STORAGE_KEYS.KNOWLEDGE_NOTES,
  STORAGE_KEYS.TASKS_ITEMS,
  STORAGE_KEYS.UNIFIED_BACKUP,
];

beforeEach(() => {
  for (const key of RESET_KEYS) dbStorage.removeItem(key);
  auditService.clearLogs();
  saveSystemAuditLogs([]);
});

const sample = () => ({
  customers: [{ id: 'C-1', name: 'عميل الاختبار' }] as never,
  debts: [{ id: 'D-1', name: 'التزام الاختبار' }] as never,
  notes: [{ id: 'N-1', title: 'ملاحظة الاختبار' }] as never,
  tasks: [{ id: 'T-1', title: 'مهمة الاختبار' }] as never,
  records: [{ id: 'IN-0100', subId: 'IN-0100', items: { 'صنف أ': 2 } }] as never,
});

describe('getUnifiedBackupState — ماذا يحتوي الملف فعلاً', () => {
  it('يحمل إصدار التطبيق الحقيقي لا رقماً جامداً، وبصمة وتاريخاً صالحين', () => {
    const backup = getUnifiedBackupState();

    expect(backup.version).toBe(APP_VERSION);
    expect(backup.checksum).toMatch(/^CHK-[0-9A-Z]+$/);
    expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false);
    expect(backup.app).toContain('مخزون');
  });

  it('يضمّ الوحدات العشر كلها وهيكلها كما يتوقّعه المستورد', () => {
    const { modules } = getUnifiedBackupState();

    expect(Object.keys(modules).sort()).toEqual(
      [
        'custody',
        'customers',
        'debts',
        'doctors',
        'financial',
        'knowledge',
        'links',
        'lookups',
        'routines',
        'settings',
        'stock',
        'systemLogs',
        'tasks',
        'workos',
      ].sort()
    );
    expect(modules.stock).toHaveProperty('seq');
    expect(modules.tasks).toHaveProperty('auditLogs');
    expect(modules.routines).toHaveProperty('settings');
  });

  it('الأسماء المستعارة (createUnifiedBackup) تُنتج نفس الشكل', () => {
    expect(createUnifiedBackup().modules).toHaveProperty('stock');
  });
});

describe('الذهاب والعودة: نسخة ← تصفير ← استعادة', () => {
  it('البيانات تُستعاد كما كانت بالضبط بعد إعادة الضبط للافتراضي', () => {
    const data = sample();
    saveCustomers(data.customers);
    saveDebts(data.debts);
    saveNotes(data.notes);
    saveTasks(data.tasks);
    saveStockRecords(data.records);
    saveStockSeq({ IN: 100, OUT: 200 });

    const backup = getUnifiedBackupState();
    expect(backup.modules.customers.customers).toEqual(data.customers);
    expect(backup.modules.stock!.records).toEqual(data.records);

    restoreDefaultData();
    expect(loadCustomers()).not.toEqual(data.customers);
    expect(loadStockSeq()).toEqual({ IN: 4, OUT: 299 });

    restoreUnifiedBackupState(backup);
    expect(loadCustomers()).toEqual(data.customers);
    expect(loadDebts()).toEqual(data.debts);
    expect(loadNotes()).toEqual(data.notes);
    expect(loadTasks()).toEqual(data.tasks);
    expect(loadStockRecords()).toEqual(data.records);
    expect(loadStockSeq()).toEqual({ IN: 100, OUT: 200 });
  });

  it('الاسم المستعار restoreUnifiedBackup يستعيد أيضاً', () => {
    saveCustomers(sample().customers);
    const backup = getUnifiedBackupState();
    restoreDefaultData();
    restoreUnifiedBackup(backup);
    expect(loadCustomers()).toEqual(sample().customers);
  });

  it('قيد معروف: مصفوفة فارغة في الملف تُعيد بذور الوحدة لا فراغاً (fallbackOnEmpty)', () => {
    /* R45 أنشأ عقد `fallbackOnEmpty`: الفراغ يعني «لا بيانات» فتُقرأ البذرة. أثره هنا أن
       مستخدماً حذف كل عملائه ثم استرجع نسخته يرى بذور التطبيق. مُوثَّق في 17-النسخ-والاستعادة.md
       ولم يُغيَّر هنا لأنه عقد يشمل كل الوحدات ولا يخصّ الاستعادة وحدها. */
    saveCustomers(sample().customers);
    const backup = getUnifiedBackupState();
    backup.modules.customers!.customers = [];

    restoreUnifiedBackupState(backup);
    expect(loadCustomers().length).toBeGreaterThan(0);
    expect(loadCustomers()).not.toContainEqual(expect.objectContaining({ id: 'C-1' }));
  });

  it('نسخة جزئية (وحدة واحدة) لا تمسّ بقية الوحدات ولا ترمي', () => {
    saveDebts(sample().debts);
    const partial = {
      app: 'جزئي',
      version: '1',
      exportedAt: '2026-01-01T00:00:00.000Z',
      checksum: 'CHK-X',
      modules: { stock: { products: [{ id: 'p-only', name: 'صنف وحيد' }] } },
    } as unknown as UnifiedBackupState;

    expect(() => restoreUnifiedBackupState(partial)).not.toThrow();
    expect(loadProducts()).toEqual([{ id: 'p-only', name: 'صنف وحيد' }]);
    expect(loadDebts()).toEqual(sample().debts);
  });

  it('lookups تالفة لا تُسقط الاستعادة: تُسجَّل وتُكمَل الوحدات الأخرى', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const boom = new Proxy(
      {},
      {
        get() {
          throw new Error('lookups معطوبة');
        },
        ownKeys() {
          throw new Error('lookups معطوبة');
        },
      }
    );
    const backup = getUnifiedBackupState();
    (backup.modules as { lookups?: unknown }).lookups = boom;
    backup.modules.customers!.customers = [{ id: 'C-2', name: 'بعد التلف' }] as never;

    expect(() => restoreUnifiedBackupState(backup)).not.toThrow();
    expect(loadCustomers()).toEqual([{ id: 'C-2', name: 'بعد التلف' }]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('كل استعادة تُسجَّل في سجل النظام بسطر واحد', () => {
    const backup = getUnifiedBackupState();
    restoreUnifiedBackupState(backup);

    const logs = loadSystemAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('استرجاع');
    expect(logs[0].details).toContain('بنجاح');
  });

  it('الاستعادة لا تمحو السجل المركزي (عيب R51 المُصلَح)', () => {
    auditService.log({ action: 'Create', entity: 'Customer', recordId: 'C-9', details: 'قبل الاستعادة' });
    const backup = getUnifiedBackupState();

    restoreUnifiedBackupState(backup);

    expect(auditService.getLogsByEntity('Customer')).toHaveLength(1);
    expect(auditService.getLogsByEntity('Customer')[0].details).toBe('قبل الاستعادة');
  });
});

describe('restoreDefaultData — التصفير إلى الأساس الأولي', () => {
  it('يُعيد الوحدات إلى بذورها ويُسجّل سطراً واحداً، والإعدادات إلى الافتراضي', () => {
    saveSettings({ ...DEFAULT_APP_SETTINGS, skipCancelled: false, defaultYear: 1999 });
    saveTasks([{ id: 'T-9' }] as never);

    restoreDefaultData();

    expect(loadSettings()).toEqual(DEFAULT_APP_SETTINGS);
    expect(loadTasks()).not.toEqual([{ id: 'T-9' }]);
    expect(loadStockSeq()).toEqual({ IN: 4, OUT: 299 });

    const logs = loadSystemAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].details).toContain('استعادة بيانات الأساس الأولية');
  });

  it('الاسم المستعار resetAllModuleData يفعل الشيء نفسه', () => {
    saveSettings({ ...DEFAULT_APP_SETTINGS, defaultYear: 1999 });
    resetAllModuleData();
    expect(loadSettings()).toEqual(DEFAULT_APP_SETTINGS);
  });
});

describe('clearAllData + نسخة الطوارئ — الحلقة التي كانت مفتوحة', () => {
  it('يكتب لقطة طوارئ كاملة ويمسح السجلات ويُبقي الأصناف', () => {
    const data = sample();
    saveCustomers(data.customers);
    saveStockRecords(data.records);
    saveStockSeq({ IN: 55, OUT: 66 });

    clearAllData();

    const emergency = loadEmergencyBackup();
    expect(emergency).not.toBeNull();
    expect(emergency!.modules.customers!.customers).toEqual(data.customers);
    expect(emergency!.modules.stock!.records).toEqual(data.records);

    /* الفراغ يُقرأ كبذرة الوحدة (عقد fallbackOnEmpty) — المقصود أن السجل المعروف زال. */
    expect(loadStockRecords()).not.toContainEqual(expect.objectContaining({ subId: 'IN-0100' }));
    expect(loadStockSeq()).toEqual({ IN: 1, OUT: 1 });
    expect(loadCustomers()).not.toContainEqual(expect.objectContaining({ id: 'C-1' }));
    expect(loadProducts().length).toBeGreaterThan(0);

    const logs = loadSystemAuditLogs();
    expect(logs[0].action).toBe('مسح');
  });

  it('الاسترجاع من نسخة الطوارئ يعيد ما مُسح فعلاً', () => {
    const data = sample();
    saveCustomers(data.customers);
    saveStockRecords(data.records);

    clearAllData();
    expect(loadCustomers()).not.toContainEqual(expect.objectContaining({ id: 'C-1' }));

    expect(BackupService.restoreEmergencyBackup()).toBe(true);
    expect(loadCustomers()).toEqual(data.customers);
    expect(loadStockRecords()).toEqual(data.records);
  });

  it('بلا نسخة طوارئ صالحة: لا استرجاع ولا انهيار، وتحذير واحد', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(loadEmergencyBackup()).toBeNull();
    expect(BackupService.restoreEmergencyBackup()).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('BackupService — التحقّق والاسترجاع والتسجيل', () => {
  it('validateBackup يرفض غير الكائن وبلا modules ويقبل الصالح', () => {
    expect(BackupService.validateBackup(null).valid).toBe(false);
    expect(BackupService.validateBackup('نص').valid).toBe(false);
    expect(BackupService.validateBackup({}).valid).toBe(false);
    expect(BackupService.validateBackup({ modules: 'نص' }).valid).toBe(false);
    expect(BackupService.validateBackup({ modules: {} }).valid).toBe(true);
  });

  it('استعادة ناجحة بلا تاريخ تصدير ⇒ يُسجَّل تاريخ اللحظة (لا كلمة undefined)', () => {
    const backup = { ...getUnifiedBackupState(), exportedAt: '' };

    expect(BackupService.restoreBackup(backup)).toBe(true);
    const details = auditService.getLogsByEntity('SystemBackup')[0].details;
    expect(details).not.toContain('undefined');
    expect(details).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('فشل داخل الاستعادة ⇒ false بلا رمي، والتسجيل يعمل بلا exportedAt', () => {
    const backup = getUnifiedBackupState();
    const modules = {
      ...backup.modules,
      get stock(): never {
        throw new Error('ملف تالف');
      },
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(BackupService.restoreBackup({ ...backup, modules, exportedAt: '' } as never)).toBe(false);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('ملف غير صالح: يرجع false ولا يمسّ البيانات', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    saveCustomers(sample().customers);

    expect(BackupService.restoreBackup({} as never)).toBe(false);
    expect(loadCustomers()).toEqual(sample().customers);
    error.mockRestore();
  });

  it('ملف صالح: يرجع true ويُسجّل Backup ثم Restore', () => {
    const data = sample();
    saveCustomers(data.customers);
    const backup = BackupService.createBackup();

    expect(auditService.getLogsByEntity('SystemBackup').map((l) => l.action)).toEqual(['Backup']);

    restoreDefaultData();
    expect(BackupService.restoreBackup(backup)).toBe(true);
    expect(loadCustomers()).toEqual(data.customers);

    /* R51: السجل المركزي لم يعد يُمسح عند كتابة سجل النظام — الثلاثة كلها باقية. */
    expect(auditService.getLogsByEntity('SystemBackup').map((l) => l.action)).toEqual(['Restore', 'Backup', 'Backup']);
    expect(auditService.getLogsByEntity('SystemBackup')[0].details).toContain(backup.exportedAt);
  });

  it('resetSystem يعيد الافتراضي ويُسجّل Delete', () => {
    saveSettings({ ...DEFAULT_APP_SETTINGS, defaultYear: 1999 });
    BackupService.resetSystem();

    expect(loadSettings()).toEqual(DEFAULT_APP_SETTINGS);
    expect(auditService.getLogsByEntity('SystemReset')[0].action).toBe('Delete');
  });
});

/* ─────────── R51: اللقطات الجزئية لا تمحو ما ليس فيها ─────────── */
describe('الاستعادة الجزئية — الغائب لا يُمسّ', () => {
  it('ملف بلا كائنات وحدات ⇒ لا يمسح شيئاً البتة', () => {
    saveCustomers(sample().customers);
    const before = loadCustomers();

    restoreUnifiedBackupState({ ...getUnifiedBackupState(), modules: {} as never });

    expect(loadCustomers()).toEqual(before);
  });

  it('كل الوحدات حاضرة بلا سجلات ⇒ لا يُصفَّر شيء ولا تُكتب سجلات', () => {
    saveCustomers(sample().customers);
    const before = loadCustomers();
    const modules = Object.fromEntries(
      [
        'stock',
        'custody',
        'links',
        'financial',
        'tasks',
        'customers',
        'doctors',
        'debts',
        'knowledge',
        'routines',
        'workos',
      ].map((key) => [key, {}])
    );

    restoreUnifiedBackupState({ ...getUnifiedBackupState(), modules: modules as never });

    expect(loadCustomers()).toEqual(before);
  });

  it('وحدة واحدة فقط في الملف: تُستعاد هي وحدها', () => {
    const backup = getUnifiedBackupState();
    backup.modules.customers = { customers: [], visits: [] } as never;

    restoreUnifiedBackupState(backup);

    expect(loadCustomers()).not.toContainEqual(expect.objectContaining({ id: 'C-1' }));
  });
});
