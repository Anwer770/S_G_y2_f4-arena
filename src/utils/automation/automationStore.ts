/**
 * تخزين سجل تشغيل الأتمتة (R31).
 *
 * مفتاح مستقل داخل فضاء `workos_v1_` حتى يبقى السجل قابلاً للمسح بلا لمس بيانات العمل،
 * ويُقرأ بـ`dbStorage` نفسه الذي تقرأ به بقية الوحدات (IndexedDB + ذاكرة).
 */
import { dbStorage } from '../../database/dbStorage';
import { KEYS } from '../workos/workosKeys';
import { pruneRuns } from './automationRules';
import type { AutomationRun } from './automationTypes';

const MAX_RUNS = 200;

export function loadAutomationRuns(): AutomationRun[] {
  try {
    const raw = dbStorage.getItem(KEYS.AUTOMATION_RUNS);
    if (!raw || raw === 'undefined' || raw === 'null') return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AutomationRun[]) : [];
  } catch {
    return [];
  }
}

export function saveAutomationRuns(runs: AutomationRun[]): void {
  try {
    dbStorage.setItem(KEYS.AUTOMATION_RUNS, JSON.stringify(pruneRuns(runs, MAX_RUNS)));
  } catch (err) {
    console.warn('automation: failed to persist runs', err);
  }
}

/** آخر تشغيل لقاعدة معيّنة (لعرضه في شاشة الأتمتة). */
export function lastRunForRule(ruleId: string, runs: AutomationRun[] = loadAutomationRuns()): AutomationRun | null {
  return runs.find((run) => run.ruleId === ruleId) ?? null;
}
