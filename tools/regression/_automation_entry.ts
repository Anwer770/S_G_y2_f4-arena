/**
 * مدخل تجزيء لبوابة الأتمتة (R31).
 *
 * يجمع — في حزمة واحدة — المشغّل الحقيقي وطبقة التخزين الحقيقية حتى تتاح للبوابة
 * استدعاء **نفس المسار الإنتاجي** (saveTasks ⇒ أحداث ⇒ قواعد ⇒ إجراءات) داخل DOM وهمي،
 * بلا حاجة إلى برمجة واجهة هشّة بالنقر.
 */
export {
  startAutomationRuntime,
  stopAutomationRuntime,
  publishDomainEvent,
  processDomainEvent,
  sweepOverdueTasks,
  runRuleManually,
  loadAutomationRuns,
  saveAutomationRuns,
  getAutomationDiagnostics,
  getLastSweepResult,
  subscribeDomainEvents,
  countDomainEventListeners,
  withAutomationOrigin,
  ruleMatchesEvent,
  planRuleAction,
} from '../../src/utils/automation';

export {
  loadTasks,
  saveTasks,
  loadProjects,
  saveProjects,
  loadAutomations,
  saveAutomations,
  loadOrders,
  saveOrders,
  loadActivity,
} from '../../src/utils/workos/workosLoaders';
