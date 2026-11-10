import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAuthSession,
  loadAuditLogs,
  loadSystemAuditLogs,
  logAudit,
  logSystemAudit,
  saveAuditLogs,
  saveSystemAuditLogs,
  loadAuthGuardState,
  loadAuthSession,
  saveAuthGuardState,
  saveAuthSession,
} from '../../src/utils/storage/system';
import type { AuditLog } from '../../src/types';
import { dbStorage } from '../../src/database/dbStorage';
import { auditService } from '../../src/core/audit/AuditService';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

beforeEach(() => {
  dbStorage.removeItem(STORAGE_KEYS.AUTH_GUARD);
  dbStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
});

describe('تخزين حماية الدخول — صلابة ضد التلف', () => {
  it('الحالة الافتراضية فارغة', () => {
    expect(loadAuthGuardState()).toEqual({});
    expect(loadAuthSession()).toBeNull();
  });

  it('يحفظ ويقرأ سجل الإقفال', () => {
    saveAuthGuardState({ u1: { failures: 2, lockedUntil: 0, lastFailureAt: 123 } });
    expect(loadAuthGuardState().u1.failures).toBe(2);
  });

  it('JSON تالف أو مصفوفة ⇒ يعود لفراغ بلا انهيار', () => {
    dbStorage.setItem(STORAGE_KEYS.AUTH_GUARD, '{ليس JSON');
    expect(loadAuthGuardState()).toEqual({});
    dbStorage.setItem(STORAGE_KEYS.AUTH_GUARD, '[1,2,3]');
    expect(loadAuthGuardState()).toEqual({});
  });

  it('الجلسة تُحفظ وتُقرأ وتُمسح', () => {
    const session = { userId: 'u1', loginTime: new Date().toISOString(), expiresAt: Date.now() + 1000, remember: true };
    saveAuthSession(session);
    expect(loadAuthSession()?.userId).toBe('u1');
    clearAuthSession();
    expect(loadAuthSession()).toBeNull();
  });

  it('جلسة تالفة أو بلا معرّف تُرفض', () => {
    dbStorage.setItem(STORAGE_KEYS.AUTH_SESSION, '{ليس JSON');
    expect(loadAuthSession()).toBeNull();
    dbStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify({ loginTime: 'x' }));
    expect(loadAuthSession()).toBeNull();
  });
});

/* ───────────────────────── سجل النظام والتدقيق (R46) ───────────────────────── */

describe('سجل النظام — البذرة والفراغ والسقف', () => {
  const AUDIT_KEY = STORAGE_KEYS.SYSTEM_AUDIT_LOGS;

  beforeEach(() => {
    dbStorage.removeItem(AUDIT_KEY);
  });

  it('غياب المفتاح ⇒ سطر تهيئة واحد (بذرة) بلا كتابة', () => {
    const logs = loadSystemAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ id: 'LOG-001', module: 'نظام', action: 'تهيئة' });
    expect(dbStorage.getItem(AUDIT_KEY)).toBeNull();
  });

  it('الفراغ [ ] مقبول ولا يُستبدل بالبذرة', () => {
    dbStorage.setItem(AUDIT_KEY, '[]');
    expect(loadSystemAuditLogs()).toEqual([]);
  });

  it('التالف يُرجع البذرة ولا يمسح الخام', () => {
    dbStorage.setItem(AUDIT_KEY, '{ليس JSON');
    expect(loadSystemAuditLogs()).toHaveLength(1);
    expect(dbStorage.getItem(AUDIT_KEY)).toBe('{ليس JSON');
  });

  it('القيمة غير المصفوفية ⇒ البذرة', () => {
    dbStorage.setItem(AUDIT_KEY, '{"a":1}');
    expect(loadSystemAuditLogs()).toHaveLength(1);
  });

  it('الحفظ والقراءة يعيدان السجل نفسه', () => {
    const logs: AuditLog[] = [
      { id: 'L1', timestamp: '2026-11-07 10:00', module: 'نظام', action: 'اختبار', details: 'أ' },
    ];
    saveSystemAuditLogs(logs);
    expect(loadSystemAuditLogs()).toEqual(logs);
  });

  it('السقف 1000 سطر ويُقصّ من الأقدم', () => {
    const many = Array.from({ length: 1005 }, (_, i) => ({
      id: `L${i}`,
      timestamp: '2026-11-07 10:00',
      module: 'نظام' as const,
      action: 'اختبار',
      details: `سطر ${i}`,
    }));
    saveSystemAuditLogs(many);
    const stored = loadSystemAuditLogs();
    expect(stored).toHaveLength(1000);
    // القصّ من النهاية ⇒ أول 1000 تبقى، وآخر خمسة تُسقَط
    expect(stored[0].id).toBe('L0');
    expect(stored[999].id).toBe('L999');
  });
});

describe('تسجيل التدقيق — الترويسة والمعرّف والتفويض', () => {
  const AUDIT_KEY = STORAGE_KEYS.SYSTEM_AUDIT_LOGS;

  beforeEach(() => {
    dbStorage.removeItem(AUDIT_KEY);
  });

  it('logSystemAudit يُضيف السطر في المقدمة بمعرّف فريد', () => {
    saveSystemAuditLogs([
      { id: 'OLD', timestamp: '2026-11-06 09:00', module: 'نظام', action: 'قديم', details: 'سابق' },
    ]);
    logSystemAudit('ديون', 'إضافة', 'تسجيل ذمة جديدة', 'DEBT-1');

    const logs = loadSystemAuditLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      module: 'ديون',
      action: 'إضافة',
      details: 'تسجيل ذمة جديدة',
      recordId: 'DEBT-1',
    });
    expect(logs[0].id).toMatch(/^LOG-\d+-/);
    expect(logs[0].timestamp).toBeTruthy();
    expect(logs[1].id).toBe('OLD');
  });

  it('لا تصادم في المعرّفات: كل سطر جديد فريد (والبذرة تبقى)', () => {
    logSystemAudit('نظام', 'أ', 'أول');
    logSystemAudit('نظام', 'ب', 'ثانٍ');
    const ids = loadSystemAuditLogs().map((l) => l.id);
    expect(ids).toHaveLength(3); // سطران جديدان + سطر التهيئة
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toMatch(/^LOG-\d+-/);
    expect(ids[1]).toMatch(/^LOG-\d+-/);
  });

  it('logAudit يكتب في وحدة «مخزون» وينقل recordId', () => {
    logAudit('تعديل', 'تحديث صنف', 'P-9');
    const [first] = loadSystemAuditLogs();
    expect(first).toMatchObject({ module: 'مخزون', action: 'تعديل', recordId: 'P-9' });
  });

  it('التسجيل فوق بذرة الغياب يحفظ البذرة لا يستبدلها', () => {
    logSystemAudit('نظام', 'تشغيل', 'سطر جديد');
    const logs = loadSystemAuditLogs();
    expect(logs).toHaveLength(2);
    expect(logs[1].id).toBe('LOG-001');
  });

  it('loadAuditLogs/saveAuditLogs أسماء بديلة للمفتاح نفسه', () => {
    const logs: AuditLog[] = [
      { id: 'AL-1', timestamp: '2026-11-07 10:00', module: 'نظام', action: 'بديل', details: 'س' },
    ];
    saveAuditLogs(logs);
    expect(loadAuditLogs()).toEqual(logs);
    expect(loadSystemAuditLogs()).toEqual(logs);
  });
});

/**
 * R51 — الفصل بين سجل النظام والسجل المركزي.
 *
 * قبل R51 كان المفتاح `suite_unified_audit_v2` يحمل شكلين مختلفين معاً: `AuditLog`
 * (سجل النظام) و`CentralAuditEntry` (السجل المركزي). فكل كتابة في أحدهما كانت تُفسد
 * الآخر — وكل استرجاع نسخة احتياطية كان يمحو تاريخ التدقيق المركزي.
 */
describe('R51 — سجل النظام لا يمسّ السجل المركزي', () => {
  beforeEach(() => {
    dbStorage.removeItem(STORAGE_KEYS.SYSTEM_AUDIT_LOGS);
    dbStorage.removeItem(STORAGE_KEYS.SYSTEM_AUDIT);
    auditService.clearLogs();
  });

  it('كتابة سطر نظام لا تمحو السجل المركزي، وكتابة سطر مركزي لا تدخل سجل النظام', () => {
    auditService.log({ action: 'Create', entity: 'Customer', recordId: 'C-1', details: 'إنشاء عميل' });
    logSystemAudit('نظام', 'استرجاع', 'اختبار الفصل');

    const central = auditService.getLogsByEntity('Customer');
    expect(central).toHaveLength(1);
    expect(central[0].action).toBe('Create');

    const system = loadSystemAuditLogs();
    expect(system[0]).toMatchObject({ module: 'نظام', action: 'استرجاع' });
    expect(system.every((row) => typeof row.module === 'string')).toBe(true);
    expect(system).not.toContainEqual(expect.objectContaining({ entity: 'Customer' }));
  });

  it('المفتاح القديم يُقرأ كـlegacy: أسطره ذات module تظهر، والأسطر المركزية تُرشَّح', () => {
    dbStorage.setItem(
      STORAGE_KEYS.SYSTEM_AUDIT,
      JSON.stringify([
        { id: 'L-old', timestamp: '2026-01-01', module: 'نظام', action: 'تهيئة قديمة', details: 'قديم' },
        { id: 'audit_1', timestamp: '2026-01-01T00:00:00.000Z', action: 'Create', entity: 'Customer' },
      ])
    );

    const logs = loadSystemAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe('L-old');
  });

  it('الكتابة الجديدة تذهب للمفتاح الجديد وحده', () => {
    logSystemAudit('نظام', 'مسح', 'اختبار');

    const legacy = dbStorage.getItem(STORAGE_KEYS.SYSTEM_AUDIT);
    expect(legacy === null || !legacy.includes('اختبار')).toBe(true);
    expect(dbStorage.getItem(STORAGE_KEYS.SYSTEM_AUDIT_LOGS)).toContain('اختبار');
  });
});
