/**
 * إعدادات التطبيق الأساسية (App settings) — مُستخرج من storage.ts (R24).
 * R38: القراءة/الكتابة عبر `createObjectRepository` مع الحفاظ على السلوك:
 * المحفوظ يُدمج فوق الافتراضي، وأي كائن بلا `defaultYear` رقمي = قيمة تالفة
 * ⇒ تُعاد الإعدادات الافتراضية كاملة.
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

const settingsRepo = createObjectRepository<AppSettings>({
  key: STORAGE_KEYS.SETTINGS,
  defaults: DEFAULT_APP_SETTINGS,
  isValid: (value) => typeof value.defaultYear === 'number',
});

export function loadSettings(): AppSettings {
  return settingsRepo.read();
}

export function saveSettings(settings: AppSettings): void {
  settingsRepo.write(settings);
}
