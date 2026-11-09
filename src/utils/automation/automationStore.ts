/**
 * تخزين سجل تشغيل الأتمتة (R31).
 *
 * مفتاح مستقل داخل فضاء `workos_v1_` حتى يبقى السجل قابلاً للمسح بلا لمس بيانات العمل،
 * ويُقرأ عبر مستودع المجموعات نفسه الذي تقرأ به بقية الوحدات (IndexedDB + ذاكرة).
 */
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import { KEYS } from '../workos/workosKeys';
import { pruneRuns } from './automationRules';
import type { AutomationRun } from './automationTypes';

const MAX_RUNS = 200;

/** سجل التشغيل: الفراغ مقبول، والقصّ إلى 200 سطر يقع عند الحفظ. */
const runsRepo = createCollectionRepository<AutomationRun>({
  key: KEYS.AUTOMATION_RUNS,
  fallback: [],
});

export function loadAutomationRuns(): AutomationRun[] {
  return runsRepo.read();
}

export function saveAutomationRuns(runs: AutomationRun[]): void {
  runsRepo.write(pruneRuns(runs, MAX_RUNS));
}

/** آخر تشغيل لقاعدة معيّنة (لعرضه في شاشة الأتمتة). */
export function lastRunForRule(ruleId: string, runs: AutomationRun[] = loadAutomationRuns()): AutomationRun | null {
  return runs.find((run) => run.ruleId === ruleId) ?? null;
}
