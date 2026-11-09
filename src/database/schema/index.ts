/**
 * واجهة تشغيل ترحيل المخططات في التطبيق (R33).
 *
 * تُستدعى **مرة واحدة بعد جهوزية IndexedDB وقبل تركيب الواجهة** (main.tsx)،
 * لأن كل القراءات متزامنة: لو رُكِّبت الواجهة أولاً لقرأت شكلاً قديماً ثم كتبته فوق
 * الشكل المرحَّل.
 */
import { dbStorage } from '../dbStorage';
import { runMigrations } from './engine';
import { SCHEMA_ENTRIES } from './entries';
import type { MigrationReport, SchemaStorage } from './types';

let lastReport: MigrationReport | null = null;

/** آخر تقرير ترحيل (يُعرض في الإعدادات ويُقرأ في البوابة). */
export function getMigrationReport(): MigrationReport | null {
  return lastReport;
}

/** يُشغّل الترحيلات على تخزين التطبيق الحقيقي. لا يرمي أبداً. */
export function bootSchema(storage: SchemaStorage = dbStorage): MigrationReport {
  try {
    lastReport = runMigrations({
      storage,
      entries: SCHEMA_ENTRIES,
      ctx: {
        now: new Date().toISOString(),
        logger: (message) => console.info(message),
      },
    });
  } catch (err) {
    console.warn('schema: فشل تشغيل الترحيلات', err);
    lastReport = { upgraded: 0, current: 0, failed: 0, outcomes: [] };
  }
  return lastReport;
}

/** ملخّص عربي لآخر ترحيل (لعرضه للمستخدم في الإعدادات). */
export function describeMigrationReport(report: MigrationReport | null = lastReport): string {
  if (!report) return 'لم يُشغَّل ترحيل المخططات بعد';
  if (report.upgraded === 0 && report.failed === 0) {
    return `المخططات محدَّثة (${report.current} مفتاحاً)`;
  }
  const parts = [`رُحِّل ${report.upgraded} مفتاحاً`];
  if (report.failed > 0) parts.push(`فشل ${report.failed}`);
  return parts.join(' · ');
}

export * from './types';
export { runMigrations, migrateValue, readVersions, storedVersion, emptyReport } from './engine';
export { SCHEMA_ENTRIES, SCHEMA_VERSIONS } from './entries';
