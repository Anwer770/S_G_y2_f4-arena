/**
 * مخزن وحدة «routines» — مُستخرج من storage.ts (R26).
 * R36: كل قراءة/كتابة عبر مستودع (مجموعات + كائن إعدادات مفرد).
 * السلوك محفوظ: المصفوفة الفارغة ⇒ البذرة للقوائم الأساسية، والفراغ مقبول
 * للتكرارات/التنفيذات/الاستثناءات، وسجل التدقيق بسقف 500، والإعدادات تُدمَج
 * فوق الافتراضي حتى لا تفقد الحقول الجديدة قيمتها.
 */
import {
  DEFAULT_ROUTINES,
  DEFAULT_ROUTINE_CATEGORIES,
  DEFAULT_ROUTINE_EXECUTIONS,
  DEFAULT_ROUTINE_OCCURRENCES,
  DEFAULT_ROUTINE_SETTINGS,
  DEFAULT_ROUTINE_TAGS,
  DEFAULT_ROUTINE_TEMPLATES,
} from '../../data/defaultRoutines';
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import { createObjectRepository } from '../../database/repositories/ObjectRepository';
import {
  RoutineAuditLog,
  RoutineCategoryItem,
  RoutineException,
  RoutineExecution,
  RoutineModuleSettings,
  RoutineOccurrence,
  RoutineRecord,
  RoutineTagItem,
  RoutineTemplate,
} from '../../types';
import { STORAGE_KEYS } from './keys';

const routinesRepo = createCollectionRepository<RoutineRecord>({
  key: STORAGE_KEYS.ROUTINES_ITEMS,
  fallback: DEFAULT_ROUTINES,
  fallbackOnEmpty: true,
});

/** التكرارات والتنفيذات: مصفوفة فارغة **مقبولة** (تُولَّد من الجدولة) مع بذرة عند الغياب. */
const occurrencesRepo = createCollectionRepository<RoutineOccurrence>({
  key: STORAGE_KEYS.ROUTINES_OCCURRENCES,
  fallback: DEFAULT_ROUTINE_OCCURRENCES,
});

const executionsRepo = createCollectionRepository<RoutineExecution>({
  key: STORAGE_KEYS.ROUTINES_EXECUTIONS,
  fallback: DEFAULT_ROUTINE_EXECUTIONS,
});

const categoriesRepo = createCollectionRepository<RoutineCategoryItem>({
  key: STORAGE_KEYS.ROUTINES_CATEGORIES,
  fallback: DEFAULT_ROUTINE_CATEGORIES,
  fallbackOnEmpty: true,
});

const tagsRepo = createCollectionRepository<RoutineTagItem>({
  key: STORAGE_KEYS.ROUTINES_TAGS,
  fallback: DEFAULT_ROUTINE_TAGS,
  fallbackOnEmpty: true,
});

const templatesRepo = createCollectionRepository<RoutineTemplate>({
  key: STORAGE_KEYS.ROUTINES_TEMPLATES,
  fallback: DEFAULT_ROUTINE_TEMPLATES,
  fallbackOnEmpty: true,
});

const exceptionsRepo = createCollectionRepository<RoutineException>({
  key: STORAGE_KEYS.ROUTINES_EXCEPTIONS,
  fallback: [],
});

const DEFAULT_ROUTINE_AUDIT: RoutineAuditLog[] = [
  {
    id: 'LOG-ROUTINE-1',
    timestamp: new Date().toISOString(),
    action: 'تهيئة',
    routineName: 'وحدة إدارة الروتين',
    details: 'تمت تهيئة وحدة إدارة الروتين والعادات والجدولة مع النماذج الافتراضية بنجاح',
  },
];

const auditRepo = createCollectionRepository<RoutineAuditLog>({
  key: STORAGE_KEYS.ROUTINES_AUDIT,
  fallback: DEFAULT_ROUTINE_AUDIT,
  limit: 500,
});

/** إعدادات الوحدة: كائن مفرد يُدمج فوق الافتراضي (سلوك `{...DEFAULT, ...stored}`). */
const settingsRepo = createObjectRepository<RoutineModuleSettings>({
  key: STORAGE_KEYS.ROUTINES_SETTINGS,
  defaults: DEFAULT_ROUTINE_SETTINGS,
});

export function loadRoutines(): RoutineRecord[] {
  return routinesRepo.read();
}

export function saveRoutines(routines: RoutineRecord[]): void {
  routinesRepo.write(routines);
}

export function loadRoutineOccurrences(): RoutineOccurrence[] {
  return occurrencesRepo.read();
}

export function saveRoutineOccurrences(occurrences: RoutineOccurrence[]): void {
  occurrencesRepo.write(occurrences);
}

export function loadRoutineExecutions(): RoutineExecution[] {
  return executionsRepo.read();
}

export function saveRoutineExecutions(executions: RoutineExecution[]): void {
  executionsRepo.write(executions);
}

export function loadRoutineCategories(): RoutineCategoryItem[] {
  return categoriesRepo.read();
}

export function saveRoutineCategories(categories: RoutineCategoryItem[]): void {
  categoriesRepo.write(categories);
}

export function loadRoutineTags(): RoutineTagItem[] {
  return tagsRepo.read();
}

export function saveRoutineTags(tags: RoutineTagItem[]): void {
  tagsRepo.write(tags);
}

export function loadRoutineTemplates(): RoutineTemplate[] {
  return templatesRepo.read();
}

export function saveRoutineTemplates(templates: RoutineTemplate[]): void {
  templatesRepo.write(templates);
}

export function loadRoutineExceptions(): RoutineException[] {
  return exceptionsRepo.read();
}

export function saveRoutineExceptions(exceptions: RoutineException[]): void {
  exceptionsRepo.write(exceptions);
}

export function loadRoutineAuditLogs(): RoutineAuditLog[] {
  return auditRepo.read();
}

export function saveRoutineAuditLogs(logs: RoutineAuditLog[]): void {
  auditRepo.write(logs);
}

export function logRoutineAudit(action: string, routineName: string, details: string, routineId?: string): void {
  const current = loadRoutineAuditLogs();
  const newLog: RoutineAuditLog = {
    id: `LOG-RTN-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toISOString(),
    action,
    routineId,
    routineName,
    details,
  };
  saveRoutineAuditLogs([newLog, ...current]);
}

export function loadRoutineSettings(): RoutineModuleSettings {
  return settingsRepo.read();
}

export function saveRoutineSettings(settings: RoutineModuleSettings): void {
  settingsRepo.write(settings);
}
