/**
 * محرّك ترحيل المخططات (R33) — منطق نقي بالكامل مع حقن التخزين.
 *
 * الضمانات:
 *   1. **لا فقدان بيانات**: القيمة الأصلية تُنسخ إلى `key::pre-migration` قبل أي تغيير.
 *   2. **idempotent**: تشغيله مرتين لا يُغيّر شيئاً (الإصدار المخزَّن يمنع إعادة التطبيق).
 *   3. **لا رجوع للخلف**: بيانات بإصدار أحدث من الكود تُترك كما هي (`skipped-future`)
 *      بدل أن تُفسدها ترحيلات قديمة (مستخدم فتح نسخة أقدم من التطبيق).
 *   4. **لا انهيار**: أي ترحيل يفشل ⇒ يُسجَّل ويُترك المفتاح كما هو، ويستمر الباقي.
 *   5. **لا كتابة بلا داعٍ**: المفتاح الفارغ غير الموجود لا يُنشأ له سجل.
 */
import type {
  MigrationContext,
  MigrationReport,
  MigrationOutcome,
  SchemaEntry,
  SchemaStorage,
  SchemaValue,
  SchemaVersions,
} from './types';
import { BACKUP_SUFFIX, SCHEMA_META_KEY } from './types';

/** يقرأ خريطة الإصدارات من التخزين، ويتعافى من قيمة تالفة. */
export function readVersions(storage: SchemaStorage): SchemaVersions {
  try {
    const raw = storage.getItem(SCHEMA_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const versions: SchemaVersions = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value)) versions[key] = value;
    }
    return versions;
  } catch {
    return {};
  }
}

/** يكتب خريطة الإصدارات. */
export function writeVersions(storage: SchemaStorage, versions: SchemaVersions): void {
  storage.setItem(SCHEMA_META_KEY, JSON.stringify(versions));
}

/**
 * يُرحّل قيمة واحدة من `from` إلى `entry.version` بتطبيق الترحيلات بالترتيب.
 * يُعيد `{ value, applied }` — أو يرمي الخطأ ليقرّره المستدعي.
 */
export function migrateValue(
  value: SchemaValue,
  entry: SchemaEntry,
  from: number,
  ctx: MigrationContext
): { value: SchemaValue; applied: number } {
  let current = value;
  let applied = 0;

  for (let version = Math.max(from, 0); version < entry.version; version += 1) {
    const migration = entry.migrations[version];
    if (!migration) {
      throw new Error(`لا يوجد ترحيل من الإصدار ${version} إلى ${version + 1} للمفتاح «${entry.key}»`);
    }
    current = migration(current, ctx);
    applied += 1;
  }

  return { value: current, applied };
}

export interface RunOptions {
  storage: SchemaStorage;
  entries: SchemaEntry[];
  ctx: MigrationContext;
  /** تعطيل النسخة الاحتياطية (للاختبارات أو للمفاتيح الصغيرة جداً). */
  keepBackup?: boolean;
}

/**
 * يُشغّل الترحيلات لكل المفاتيح المسجّلة.
 * لا يرمي أبداً: كل فشل يُلتقط ويُسجَّل في التقرير.
 */
export function runMigrations(options: RunOptions): MigrationReport {
  const { storage, entries, ctx } = options;
  const keepBackup = options.keepBackup !== false;
  const report: MigrationReport = { upgraded: 0, current: 0, failed: 0, outcomes: [] };
  const versions = readVersions(storage);
  let versionsChanged = false;

  for (const entry of entries) {
    const raw = storage.getItem(entry.key);
    if (raw === null || raw === undefined || raw === '') {
      report.outcomes.push({ key: entry.key, from: 0, to: entry.version, applied: 0, status: 'skipped-empty' });
      continue;
    }

    const from = versions[entry.key] ?? 0;

    if (from > entry.version) {
      report.outcomes.push({
        key: entry.key,
        from,
        to: entry.version,
        applied: 0,
        status: 'skipped-future',
      });
      continue;
    }

    if (from === entry.version) {
      report.current += 1;
      report.outcomes.push({ key: entry.key, from, to: entry.version, applied: 0, status: 'current' });
      continue;
    }

    let parsed: SchemaValue;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      report.failed += 1;
      report.outcomes.push({
        key: entry.key,
        from,
        to: entry.version,
        applied: 0,
        status: 'failed',
        error: `JSON تالف: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    const backupKey = `${entry.key}${BACKUP_SUFFIX}`;
    try {
      const { value, applied } = migrateValue(parsed, entry, from, ctx);
      const serialized = JSON.stringify(value);

      if (keepBackup) storage.setItem(backupKey, raw);
      storage.setItem(entry.key, serialized);
      versions[entry.key] = entry.version;
      versionsChanged = true;

      report.upgraded += 1;
      report.outcomes.push({
        key: entry.key,
        from,
        to: entry.version,
        applied,
        backupKey: keepBackup ? backupKey : undefined,
        status: 'upgraded',
      });
      ctx.logger?.(`schema: ${entry.key} ${from} ⇒ ${entry.version} (${applied} ترحيل)`);
    } catch (err) {
      report.failed += 1;
      report.outcomes.push({
        key: entry.key,
        from,
        to: entry.version,
        applied: 0,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      });
      ctx.logger?.(`schema: فشل ترحيل ${entry.key} — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (versionsChanged) writeVersions(storage, versions);
  return report;
}

/** إصدار مفتاح معيّن كما هو مخزَّن (0 إن لم يُرحَّل بعد). */
export function storedVersion(storage: SchemaStorage, key: string): number {
  return readVersions(storage)[key] ?? 0;
}

/** يُعيد تقريراً فارغاً (للتهيئة). */
export function emptyReport(): MigrationReport {
  return { upgraded: 0, current: 0, failed: 0, outcomes: [] };
}

export type { MigrationOutcome };
