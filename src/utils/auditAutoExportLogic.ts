/** منطق نقي للتصدير التلقائي للأرشيف — بلا تخزين ولا DOM (قابل للاختبار مباشرة). */

export interface AutoExportConfig {
  enabled: boolean;
  intervalDays: number;
  keepCount: number;
  writeToFolder: boolean;
}

export interface ArchiveSnapshot {
  id: string;
  at: string;
  fileName: string;
  count: number;
  json: string;
}

export const DEFAULT_AUTO_CONFIG: AutoExportConfig = {
  enabled: true,
  intervalDays: 1,
  keepCount: 12,
  writeToFolder: false,
};

/** هل حان موعد التصدير التلقائي؟ */
export function isAutoExportDue(
  config: Pick<AutoExportConfig, 'enabled' | 'intervalDays'>,
  lastRunAt: string | undefined,
  now: Date
): boolean {
  if (!config.enabled) return false;
  const interval = Math.max(1, Math.floor(config.intervalDays || 1));
  if (!lastRunAt) return true;
  const last = Date.parse(lastRunAt);
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= interval * 86_400_000;
}

/** audit-archive-YYYY-MM-DD-HHmm.json */
export function buildArchiveFileName(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `audit-archive-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}.json`;
}

/** يُبقي آخر `keep` لقطة (الأحدث أولاً). */
export function pruneSnapshots<T extends { at: string }>(list: T[], keep: number): T[] {
  const limit = Math.max(1, Math.floor(keep || 1));
  return [...list].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
}
