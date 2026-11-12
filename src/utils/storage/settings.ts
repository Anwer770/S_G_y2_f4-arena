/**
 * إعدادات التطبيق الأساسية (App settings) — مُستخرج من storage.ts (R24).
 *
 * R76: كانت هذه الإعدادات القصيرة تشارك `SETTINGS` مع إعدادات النظام الكاملة؛
 * فكانت كتابة النسخة المختصرة تمحو الشركة والمستخدمين وبقية الأقسام. صارت تُحفظ
 * في `APP_SETTINGS`، مع ترحيل قراءة واحدة للنسخ القديمة الصحيحة من المفتاح الموحد.
 */
import { createObjectRepository } from '../../database/repositories/ObjectRepository';
import type { AppSettings } from '../../types';
import { STORAGE_KEYS } from './keys';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultYear: 2024,
  skipCancelled: true,
  defaultCurrency: 'ريال',
  enableNotifications: true,
};

/** كائن إعدادات النظام الكامل يحمل قسماً عاماً؛ لا يُقبل كإعداد تطبيق مختصر. */
const isAppSettings = (value: Record<string, unknown>): boolean =>
  typeof value.defaultYear === 'number' && !('general' in value || 'company' in value);

const settingsRepo = createObjectRepository<AppSettings>({
  key: STORAGE_KEYS.APP_SETTINGS,
  defaults: DEFAULT_APP_SETTINGS,
  isValid: isAppSettings,
});

/** قراءة الترحيل فقط: البديل `{}` يميز القيمة القديمة الصالحة عن الغياب/التلف. */
const legacySettingsRepo = createObjectRepository<Partial<AppSettings>>({
  key: STORAGE_KEYS.SETTINGS,
  defaults: {},
  noMerge: true,
  isValid: isAppSettings,
});

export function loadSettings(): AppSettings {
  if (!settingsRepo.hasCurrent()) {
    const legacy = legacySettingsRepo.read();
    if (typeof legacy.defaultYear === 'number') {
      const migrated = { ...DEFAULT_APP_SETTINGS, ...legacy };
      settingsRepo.write(migrated);
      return migrated;
    }
  }
  return settingsRepo.read();
}

export function saveSettings(settings: AppSettings): void {
  settingsRepo.write(settings);
}
