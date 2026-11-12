// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import {
  EXPORT_REMINDER_DAYS,
  formatBytes,
  getExportReminderState,
  getLastExportAt,
  getPersistState,
  getStorageHealth,
  LAST_EXPORT_KEY,
  markDataExported,
  PERSIST_STATE_KEY,
  requestPersistentStorage,
} from '../../src/utils/storagePersistence';

const NOW = new Date('2026-11-07T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

const withStorageManager = (storage: Record<string, unknown>) => {
  vi.stubGlobal('navigator', { storage });
};

beforeEach(() => {
  dbStorage.removeItem(PERSIST_STATE_KEY);
  dbStorage.removeItem(LAST_EXPORT_KEY);
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  dbStorage.removeItem(PERSIST_STATE_KEY);
  dbStorage.removeItem(LAST_EXPORT_KEY);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('R77 — ديمومة التخزين وتذكير التصدير', () => {
  it('يسجل unsupported عند غياب مدير التخزين، وتبقى صحة التخزين آمنة', async () => {
    vi.stubGlobal('navigator', undefined);

    await expect(requestPersistentStorage()).resolves.toBe(false);
    expect(getPersistState()).toBe('unsupported');
    await expect(getStorageHealth()).resolves.toMatchObject({
      supported: false,
      persisted: false,
      state: 'unsupported',
      usage: 0,
      quota: 0,
      usageRatio: 0,
      exportReminderDue: true,
    });
  });

  it('يحترم الديمومة القائمة، ويطلبها عند الحاجة، ويسجل الرفض أو غياب الواجهة', async () => {
    const alreadyPersisted = vi.fn().mockResolvedValue(true);
    const shouldNotRun = vi.fn().mockResolvedValue(true);
    withStorageManager({ persisted: alreadyPersisted, persist: shouldNotRun });

    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(getPersistState()).toBe('granted');
    expect(shouldNotRun).not.toHaveBeenCalled();

    const request = vi.fn().mockResolvedValue(false);
    withStorageManager({ persisted: vi.fn().mockResolvedValue(false), persist: request });
    await expect(requestPersistentStorage()).resolves.toBe(false);
    expect(getPersistState()).toBe('denied');
    expect(request).toHaveBeenCalledTimes(1);

    const newlyGranted = vi.fn().mockResolvedValue(true);
    withStorageManager({ persist: newlyGranted });
    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(getPersistState()).toBe('granted');
    expect(newlyGranted).toHaveBeenCalledTimes(1);

    withStorageManager({ persisted: vi.fn().mockResolvedValue(false) });
    await expect(requestPersistentStorage()).resolves.toBe(false);
    expect(getPersistState()).toBe('unsupported');
  });

  it('يعيد unknown ولا يرمي عندما تفشل واجهة طلب الديمومة', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    withStorageManager({ persisted: vi.fn().mockRejectedValue(new Error('محجوب')) });

    await expect(requestPersistentStorage()).resolves.toBe(false);
    expect(getPersistState()).toBe('unknown');
    expect(warning).toHaveBeenCalledWith('storagePersistence: تعذّر طلب التخزين الدائم', expect.any(Error));
  });

  it('يحفظ تاريخ التصدير كنص ISO ويعيد الغياب أو التاريخ التالف كقيمة آمنة', () => {
    expect(getLastExportAt()).toBeNull();

    markDataExported(new Date('2026-11-01T08:30:00.000Z'));
    expect(dbStorage.getItem(LAST_EXPORT_KEY)).toBe('2026-11-01T08:30:00.000Z');
    expect(getLastExportAt()).toBe('2026-11-01T08:30:00.000Z');

    dbStorage.setItem(LAST_EXPORT_KEY, 'ليس تاريخاً');
    expect(getLastExportAt()).toBeNull();

    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(() => markDataExported(new Date('invalid'))).not.toThrow();
    expect(warning).toHaveBeenCalledWith('storagePersistence: تعذّر تسجيل تاريخ التصدير', expect.any(RangeError));
  });

  it('يفصل تذكير التصدير الحديث والمتأخر ويمنع عداد أيام سالباً مع ساعة مستقبلية', () => {
    markDataExported(new Date(NOW.getTime() - (EXPORT_REMINDER_DAYS - 1) * DAY));
    expect(getExportReminderState()).toEqual({
      due: false,
      daysSinceExport: EXPORT_REMINDER_DAYS - 1,
      lastExportAt: '2026-11-01T12:00:00.000Z',
    });

    markDataExported(new Date(NOW.getTime() - EXPORT_REMINDER_DAYS * DAY));
    expect(getExportReminderState()).toMatchObject({ due: true, daysSinceExport: EXPORT_REMINDER_DAYS });

    markDataExported(new Date(NOW.getTime() + DAY));
    expect(getExportReminderState()).toMatchObject({ due: false, daysSinceExport: 0 });
  });

  it('يقرأ الحصة الصحيحة، يطبع القيم غير المنتهية بأمان، ويحتوي فشل قراءة المتصفح', async () => {
    withStorageManager({
      estimate: vi.fn().mockResolvedValue({ usage: 1_500, quota: 1_000 }),
      persisted: vi.fn().mockResolvedValue(false),
    });
    await expect(getStorageHealth()).resolves.toMatchObject({
      supported: true,
      usage: 1_500,
      quota: 1_000,
      usageRatio: 1,
      persisted: false,
    });

    withStorageManager({
      estimate: vi.fn().mockResolvedValue({ usage: Infinity, quota: -1 }),
      persisted: vi.fn().mockResolvedValue(true),
    });
    await expect(getStorageHealth()).resolves.toMatchObject({ usage: 0, quota: 0, usageRatio: 0, persisted: true });

    withStorageManager({ estimate: vi.fn().mockResolvedValue({ usage: 0, quota: 0 }) });
    await expect(getStorageHealth()).resolves.toMatchObject({ usage: 0, quota: 0, usageRatio: 0 });

    withStorageManager({});
    await expect(getStorageHealth()).resolves.toMatchObject({ supported: true, usage: 0, quota: 0, usageRatio: 0 });

    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    withStorageManager({ estimate: vi.fn().mockRejectedValue(new Error('estimate blocked')) });
    await expect(getStorageHealth()).resolves.toMatchObject({ supported: true, usage: 0, quota: 0, usageRatio: 0 });
    expect(warning).toHaveBeenCalledWith('storagePersistence: تعذّر قراءة إحصاءات التخزين', expect.any(Error));
  });

  it('ينسق البايتات الصحيحة والحدود والقيم غير الصالحة بلا وحدة مفقودة', () => {
    expect(formatBytes(0)).toBe('0 بايت');
    expect(formatBytes(-1)).toBe('0 بايت');
    expect(formatBytes(Number.NaN)).toBe('0 بايت');
    expect(formatBytes(0.5)).toBe('1 بايت');
    expect(formatBytes(1_536)).toBe('1.5 كيلوبايت');
    expect(formatBytes(1024 ** 4)).toBe('1.0 تيرابايت');
  });
});
