/**
 * إعدادات التطبيق الأساسية (App settings) — مُستخرج من storage.ts (R24).
 */
import { dbStorage } from '../../database/dbStorage';
import type { AppSettings } from '../../types';
import { STORAGE_KEYS } from './keys';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultYear: 2024,
  skipCancelled: true,
  defaultCurrency: 'ريال',
  enableNotifications: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.defaultYear === 'number') {
        return { ...DEFAULT_APP_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return DEFAULT_APP_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}
