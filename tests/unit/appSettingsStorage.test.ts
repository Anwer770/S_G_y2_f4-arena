// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import {
  DEFAULT_SYSTEM_SETTINGS,
  loadCompleteSystemSettings,
  saveCompleteSystemSettings,
} from '../../src/utils/settingsStorage';
import { DEFAULT_APP_SETTINGS, loadSettings, saveSettings } from '../../src/utils/storage/settings';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

const APP_SETTINGS_KEY = STORAGE_KEYS.APP_SETTINGS;

const completeSettings = () => ({
  ...DEFAULT_SYSTEM_SETTINGS,
  company: { ...DEFAULT_SYSTEM_SETTINGS.company, nameAr: 'شركة الإعدادات الكاملة R76' },
  general: { ...DEFAULT_SYSTEM_SETTINGS.general, currentUserName: 'مدير الإعدادات R76' },
});

beforeEach(() => {
  dbStorage.clear();
});

afterEach(() => {
  dbStorage.clear();
});

describe('R76 — استمرارية إعدادات التطبيق الأساسية', () => {
  it('لا يسمح لحفظ إعدادات التطبيق أن يستبدل إعدادات النظام الكاملة ذات المفتاح الموحد', () => {
    saveCompleteSystemSettings(completeSettings());
    const appSettings = {
      ...DEFAULT_APP_SETTINGS,
      defaultYear: 2031,
      skipCancelled: false,
      enableNotifications: false,
    };

    saveSettings(appSettings);

    expect(loadSettings()).toEqual(appSettings);
    expect(loadCompleteSystemSettings()).toMatchObject({
      company: { nameAr: 'شركة الإعدادات الكاملة R76' },
      general: { currentUserName: 'مدير الإعدادات R76' },
    });
    expect(JSON.parse(dbStorage.getItem(STORAGE_KEYS.SETTINGS) ?? '{}')).toMatchObject({
      general: { currentUserName: 'مدير الإعدادات R76' },
    });
    expect(JSON.parse(dbStorage.getItem(APP_SETTINGS_KEY) ?? '{}')).toEqual(appSettings);
  });

  it('يرحّل إعدادات التطبيق القديمة من المفتاح الموحد مرة واحدة إلى مفتاحها المستقل', () => {
    const legacy = {
      ...DEFAULT_APP_SETTINGS,
      defaultYear: 2030,
      defaultCurrency: 'دولار',
      debtAlertDaysWindow: 14,
      confirmDelete: false,
    };
    dbStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(legacy));

    expect(loadSettings()).toEqual(legacy);
    expect(JSON.parse(dbStorage.getItem(APP_SETTINGS_KEY) ?? '{}')).toEqual(legacy);
    expect(loadCompleteSystemSettings()).toEqual(DEFAULT_SYSTEM_SETTINGS);
  });

  it('يرحّل إعدادات التطبيق القديمة حتى عندما تبدأ إعدادات النظام الكاملة أولاً', () => {
    const legacy = { ...DEFAULT_APP_SETTINGS, defaultYear: 2028, skipCancelled: false };
    dbStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(legacy));

    expect(loadCompleteSystemSettings()).toEqual(DEFAULT_SYSTEM_SETTINGS);
    expect(loadSettings()).toEqual(legacy);
    expect(JSON.parse(dbStorage.getItem(APP_SETTINGS_KEY) ?? '{}')).toEqual(legacy);
    expect(JSON.parse(dbStorage.getItem(STORAGE_KEYS.SETTINGS) ?? '{}')).toEqual(DEFAULT_SYSTEM_SETTINGS);
  });

  it('يدمج المحفوظ الجزئي فوق الافتراضي إذا حمل defaultYear رقمياً', () => {
    dbStorage.setItem(APP_SETTINGS_KEY, JSON.stringify({ defaultYear: 2032, skipCancelled: false }));

    expect(loadSettings()).toEqual({ ...DEFAULT_APP_SETTINGS, defaultYear: 2032, skipCancelled: false });
  });

  it('يعيد الافتراضي عند الغياب أو JSON التالف أو الشكل غير الكائني أو defaultYear غير الرقمي', () => {
    expect(loadSettings()).toEqual(DEFAULT_APP_SETTINGS);

    dbStorage.setItem(APP_SETTINGS_KEY, '{تالف');
    expect(loadSettings()).toEqual(DEFAULT_APP_SETTINGS);

    dbStorage.setItem(APP_SETTINGS_KEY, JSON.stringify([]));
    expect(loadSettings()).toEqual(DEFAULT_APP_SETTINGS);

    dbStorage.setItem(APP_SETTINGS_KEY, JSON.stringify({ defaultYear: '2032' }));
    expect(loadSettings()).toEqual(DEFAULT_APP_SETTINGS);
  });

  it('لا يفسر إعدادات النظام الكاملة كتطبيقية عندما لا يوجد إعداد تطبيق مستقل', () => {
    saveCompleteSystemSettings(completeSettings());

    expect(loadSettings()).toEqual(DEFAULT_APP_SETTINGS);
    expect(dbStorage.getItem(APP_SETTINGS_KEY)).toBeNull();
  });

  it('يعزل الافتراضيات ومدخل الحفظ والقراءة التالية عن تعديل المستهلك بلا حفظ صريح', () => {
    const defaults = loadSettings();
    defaults.defaultYear = 1900;
    defaults.defaultCurrency = 'تعديل خارجي';
    expect(DEFAULT_APP_SETTINGS.defaultYear).toBe(2024);
    expect(DEFAULT_APP_SETTINGS.defaultCurrency).toBe('ريال');
    expect(loadSettings()).toEqual(DEFAULT_APP_SETTINGS);

    const saved = { ...DEFAULT_APP_SETTINGS, defaultYear: 2029, confirmDelete: true };
    saveSettings(saved);
    saved.defaultYear = 1901;
    const read = loadSettings();
    read.defaultCurrency = 'تعديل قراءة';
    expect(loadSettings()).toEqual({ ...DEFAULT_APP_SETTINGS, defaultYear: 2029, confirmDelete: true });
  });
});
