/**
 * واجهة وحدة مشغّل أحداث الأتمتة (R31).
 */
export * from './automationTypes';
export * from './automationEvents';
export * from './automationRules';
export * from './automationDerive';
export * from './automationStore';
export * from './automationNotifier';
export * from './automationRunner';
export {
  getLastSweepResult,
  isAutomationRuntimeStarted,
  startAutomationRuntime,
  stopAutomationRuntime,
  getAutomationDiagnostics,
} from './automationRuntime';
