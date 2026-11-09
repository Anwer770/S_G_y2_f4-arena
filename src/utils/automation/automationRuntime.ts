/**
 * إقلاع مشغّل الأتمتة (R31): اشتراك واحد في ناقل الأحداث + مسح زمني عند الإقلاع.
 *
 * يُستدعى مرة واحدة من `App.tsx`؛ الاستدعاء المتكرّر لا يُكرّر الاشتراك (idempotent)،
 * ويعيد دالة إيقاف تُستخدم عند إلغاء تحميل المكوّن.
 */
import { subscribeDomainEvents, countDomainEventListeners } from './automationEvents';
import { processDomainEvent, sweepOverdueTasks, defaultAutomationDeps } from './automationRunner';
import { loadAutomationRuns, saveAutomationRuns } from './automationStore';
import { createValueRepository } from '../../database/repositories/ValueRepository';
import { publishDomainEvent } from './automationEvents';
import type { AutomationSweepResult } from './automationTypes';

const BOOT_DATE_KEY = 'workos_v1_automation_boot_date';

/** تاريخ آخر إقلاع يُخزَّن **نصاً خاماً** (`2026-11-07`) لا JSON — مستودع القيمة. */
const bootDateRepo = createValueRepository({ key: BOOT_DATE_KEY });

let started = false;
let unsubscribe: (() => void) | null = null;
let lastSweep: AutomationSweepResult | null = null;

/** آخر حصيلة مسح (لعرضها في التشخيص/البوابة). */
export function getLastSweepResult(): AutomationSweepResult | null {
  return lastSweep;
}

export function isAutomationRuntimeStarted(): boolean {
  return started;
}

/** يوم آخر إقلاع (لمنع تكرار `daily_plan_start` أكثر من مرة في اليوم). */
function readBootDate(): string | null {
  return bootDateRepo.readRaw();
}

function writeBootDate(date: string): void {
  bootDateRepo.write(date);
}

/**
 * يبدأ المشغّل: اشتراك في كل الأحداث + مسح المتأخرات + حدث بداية الخطة اليومية.
 * @param todayStr تاريخ اليوم بصيغة YYYY-MM-DD (قابل للحقن في الاختبارات)
 */
export function startAutomationRuntime(
  todayStr: string = new Date().toISOString().slice(0, 10),
  deps = defaultAutomationDeps
): () => void {
  if (started && unsubscribe) return unsubscribe;

  unsubscribe = subscribeDomainEvents((event) => {
    try {
      processDomainEvent(event, deps);
    } catch (err) {
      console.warn('automation: processDomainEvent failed', err);
    }
  });
  started = true;

  // 1) مسح المتأخرات — يعمل حتى لو لم يفتح المستخدم شاشة الأتمتة
  try {
    lastSweep = sweepOverdueTasks(todayStr, deps);
  } catch (err) {
    console.warn('automation: overdue sweep failed', err);
  }

  // 2) حدث بداية اليوم — مرة واحدة فقط لكل يوم
  try {
    if (readBootDate() !== todayStr) {
      writeBootDate(todayStr);
      publishDomainEvent({
        type: 'daily_plan_start',
        entityType: 'system',
        entityId: todayStr,
        title: `خطة يوم ${todayStr}`,
        origin: 'system',
        data: { today: todayStr },
      });
    }
  } catch (err) {
    console.warn('automation: daily plan event failed', err);
  }

  return () => {
    stopAutomationRuntime();
  };
}

/** إيقاف الاشتراك (يُستخدم في الاختبارات ولإعادة التركيب). */
export function stopAutomationRuntime(): void {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  started = false;
}

/** تشخيص سريع: هل المشغّل يعمل؟ كم مستمعاً؟ كم تشغيلاً مسجّلاً؟ */
export function getAutomationDiagnostics(): {
  started: boolean;
  listeners: number;
  runs: number;
} {
  let runs = 0;
  try {
    runs = loadAutomationRuns().length;
  } catch {
    runs = 0;
  }
  return { started, listeners: countDomainEventListeners(), runs };
}

export { saveAutomationRuns };
