// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';
import {
  DEFAULT_SYSTEM_SETTINGS,
  LEGACY_SETTINGS_STORAGE_KEY,
  getCurrentUserProfile,
  loadCompleteSystemSettings,
  saveCompleteSystemSettings,
  SETTINGS_UPDATED_EVENT,
  updateCurrentUserName,
} from '../../src/utils/settingsStorage';

const SETTINGS_KEY = STORAGE_KEYS.SETTINGS;

describe('R57 — إعدادات النظام: تطبيع آمن وترحيل بلا فقدان', () => {
  beforeEach(() => {
    dbStorage.clear();
  });

  afterEach(() => {
    dbStorage.clear();
    vi.restoreAllMocks();
  });

  it('يرحّل المفتاح القديم إلى المفتاح الموحّد ولا يستبدل إعداداً صريحاً بالموروث', () => {
    dbStorage.setItem(
      LEGACY_SETTINGS_STORAGE_KEY,
      JSON.stringify({ general: { currentUserName: 'اسم موروث', currentUserTitle: 'لقب موروث' } })
    );
    expect(loadCompleteSystemSettings().general.currentUserName).toBe('اسم موروث');
    expect(JSON.parse(dbStorage.getItem(SETTINGS_KEY) ?? '{}')).toMatchObject({
      general: { currentUserName: 'اسم موروث', currentUserTitle: 'لقب موروث' },
    });

    dbStorage.setItem(SETTINGS_KEY, JSON.stringify({ general: { currentUserName: 'اسم صريح' } }));
    expect(loadCompleteSystemSettings().general.currentUserName).toBe('اسم صريح');
  });

  it('لا يسمح لتعديل المستخدم أن يلوّث الكائن الافتراضي المشترك، وينشر حدث الحفظ', () => {
    const onUpdate = vi.fn();
    window.addEventListener(SETTINGS_UPDATED_EVENT, onUpdate);

    updateCurrentUserName('هدى', 'مديرة العمليات');
    expect(getCurrentUserProfile()).toEqual({ name: 'هدى', title: 'مديرة العمليات', initial: 'ه' });
    expect(onUpdate).toHaveBeenCalledTimes(1);

    dbStorage.clear();
    const afterReset = loadCompleteSystemSettings();
    expect(afterReset.general.currentUserName).toBe('محمد العولقي');
    expect(afterReset.users[0].name).toBe('محمد العولقي');
    expect(DEFAULT_SYSTEM_SETTINGS.general.currentUserName).toBe('محمد العولقي');
    window.removeEventListener(SETTINGS_UPDATED_EVENT, onUpdate);
  });

  it('يبقي القسم السليم ويستبدل فقط الحقول والأقسام المشوّهة', () => {
    dbStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        company: { nameAr: 7, nameEn: 'شركة محفوظة' },
        general: { currentUserName: 7, currentUserTitle: null },
        inventory: {
          warehouses: [{ id: 'wh', name: 'مخزن' }],
          productCategories: ['فئة صالحة'],
          units: ['وحدة صالحة'],
          reorderPointDefault: 8,
        },
        users: [
          null,
          {},
          { id: 7 },
          { id: 'id' },
          { id: 'id', name: 'اسم' },
          { id: 'id', name: 'اسم', email: 'mail' },
          { id: 'id', name: 'اسم', email: 'mail', role: 'viewer' },
          { id: 'id', name: 'اسم', email: 'mail', role: 'viewer', status: 'active' },
          { id: 'usr-1', name: 'مدير النظام', email: 'admin', role: 'admin', status: 'active', createdAt: '2026' },
          { id: 'usr-2', name: 'مستخدم خامل', email: 'idle', role: 'viewer', status: 'inactive', createdAt: '2026' },
        ],
        rolePermissions: { viewer: ['fin_view'], reject: [7] },
        customRoles: [
          null,
          {},
          { id: 7 },
          { id: 'missing-label' },
          { id: 'bad-permissions', label: 'سيئ', permissions: 'x' },
          { id: 'bad-array', label: 'سيئ', permissions: [7] },
          { id: 'missing-date', label: 'سيئ', permissions: [] },
          { id: 'custom', label: 'دور صالح', permissions: ['fin_view'], createdAt: '2026-11-07' },
        ],
      })
    );

    const loaded = loadCompleteSystemSettings();
    expect(loaded.company.nameAr).toBe(DEFAULT_SYSTEM_SETTINGS.company.nameAr);
    expect(loaded.company.nameEn).toBe('شركة محفوظة');
    expect(loaded.general.currentUserName).toBe('محمد العولقي');
    expect(loaded.general.currentUserTitle).toBe('مدير النظام التنفيذي');
    expect(loaded.inventory.warehouses).toEqual([{ id: 'wh', name: 'مخزن' }]);
    expect(loaded.inventory.productCategories).toEqual(['فئة صالحة']);
    expect(loaded.inventory.units).toEqual(['وحدة صالحة']);
    expect(loaded.inventory.reorderPointDefault).toBe(8);
    expect(loaded.users).toEqual([
      expect.objectContaining({ id: 'usr-1', name: 'محمد العولقي', avatarInitial: 'م' }),
      expect.objectContaining({ id: 'usr-2', status: 'inactive' }),
    ]);
    expect(loaded.rolePermissions).toEqual({ ...DEFAULT_SYSTEM_SETTINGS.rolePermissions, viewer: ['fin_view'] });
    expect(loaded.customRoles).toEqual([
      { id: 'custom', label: 'دور صالح', permissions: ['fin_view'], createdAt: '2026-11-07' },
    ]);
  });

  it('لا يغيّر مستخدماً غير إداري، ويستعيد الاسم عند تمرير فراغ بلا لقب جديد', () => {
    saveCompleteSystemSettings({
      ...DEFAULT_SYSTEM_SETTINGS,
      users: [{ ...DEFAULT_SYSTEM_SETTINGS.users[1], id: 'viewer-only', role: 'viewer' }],
    });
    updateCurrentUserName('   ');
    expect(JSON.parse(dbStorage.getItem(SETTINGS_KEY) ?? '{}')).toMatchObject({
      general: { currentUserName: 'محمد العولقي' },
    });
    const loaded = loadCompleteSystemSettings();
    expect(loaded.general.currentUserName).toBe('محمد العولقي');
    expect(loaded.users[0].name).toBe('محاسب رئيسي');

    saveCompleteSystemSettings({
      ...loaded,
      users: [{ ...loaded.users[0], id: 'usr-1', role: 'viewer' }],
    });
    updateCurrentUserName('ريم', '');
    expect(loadCompleteSystemSettings().users[0]).toMatchObject({ name: 'ريم', avatarInitial: 'ر' });
  });

  it('يعيد الافتراضي إن أخفق وسيط التخزين، ويحفظ حتى خارج المتصفح', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(Object, 'keys').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    expect(loadCompleteSystemSettings()).toEqual(DEFAULT_SYSTEM_SETTINGS);
    error.mockRestore();
    vi.restoreAllMocks();

    vi.stubGlobal('window', undefined);
    expect(() => saveCompleteSystemSettings(DEFAULT_SYSTEM_SETTINGS)).not.toThrow();
    vi.unstubAllGlobals();
  });

  it('يعالج JSON التالف وملفات التعريف القديمة أو الفارغة دون استثناء أو اسم افتراضي قديم', () => {
    dbStorage.setItem(SETTINGS_KEY, '{ملف تالف');
    expect(loadCompleteSystemSettings()).toEqual(DEFAULT_SYSTEM_SETTINGS);

    dbStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ general: { currentUserName: 'مدير النظام', currentUserTitle: 'مدير عام المنظومة والعمليات' } })
    );
    expect(getCurrentUserProfile()).toEqual({ name: 'محمد العولقي', title: 'مدير النظام التنفيذي', initial: 'م' });

    saveCompleteSystemSettings({
      ...loadCompleteSystemSettings(),
      general: { ...loadCompleteSystemSettings().general, currentUserName: '', currentUserTitle: '' },
    });
    expect(getCurrentUserProfile()).toEqual({ name: 'محمد العولقي', title: 'مدير النظام التنفيذي', initial: 'م' });
  });
});
