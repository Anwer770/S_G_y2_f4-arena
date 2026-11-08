/**
 * مخزن وحدة «routines» — مُستخرج من storage.ts (R26).
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
import { dbStorage } from '../../database/dbStorage';
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

export function loadRoutines(): RoutineRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading routines:', e);
  }
  return DEFAULT_ROUTINES;
}

export function saveRoutines(routines: RoutineRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_ITEMS, JSON.stringify(routines));
  } catch (e) {
    console.error('Error saving routines:', e);
  }
}

export function loadRoutineOccurrences(): RoutineOccurrence[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_OCCURRENCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine occurrences:', e);
  }
  return DEFAULT_ROUTINE_OCCURRENCES;
}

export function saveRoutineOccurrences(occurrences: RoutineOccurrence[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_OCCURRENCES, JSON.stringify(occurrences));
  } catch (e) {
    console.error('Error saving routine occurrences:', e);
  }
}

export function loadRoutineExecutions(): RoutineExecution[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_EXECUTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine executions:', e);
  }
  return DEFAULT_ROUTINE_EXECUTIONS;
}

export function saveRoutineExecutions(executions: RoutineExecution[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_EXECUTIONS, JSON.stringify(executions));
  } catch (e) {
    console.error('Error saving routine executions:', e);
  }
}

export function loadRoutineCategories(): RoutineCategoryItem[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine categories:', e);
  }
  return DEFAULT_ROUTINE_CATEGORIES;
}

export function saveRoutineCategories(categories: RoutineCategoryItem[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving routine categories:', e);
  }
}

export function loadRoutineTags(): RoutineTagItem[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_TAGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine tags:', e);
  }
  return DEFAULT_ROUTINE_TAGS;
}

export function saveRoutineTags(tags: RoutineTagItem[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_TAGS, JSON.stringify(tags));
  } catch (e) {
    console.error('Error saving routine tags:', e);
  }
}

export function loadRoutineTemplates(): RoutineTemplate[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine templates:', e);
  }
  return DEFAULT_ROUTINE_TEMPLATES;
}

export function saveRoutineTemplates(templates: RoutineTemplate[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving routine templates:', e);
  }
}

export function loadRoutineExceptions(): RoutineException[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_EXCEPTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine exceptions:', e);
  }
  return [];
}

export function saveRoutineExceptions(exceptions: RoutineException[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_EXCEPTIONS, JSON.stringify(exceptions));
  } catch (e) {
    console.error('Error saving routine exceptions:', e);
  }
}

export function loadRoutineAuditLogs(): RoutineAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading routine audit logs:', e);
  }
  return [
    {
      id: 'LOG-ROUTINE-1',
      timestamp: new Date().toISOString(),
      action: 'تهيئة',
      routineName: 'وحدة إدارة الروتين',
      details: 'تمت تهيئة وحدة إدارة الروتين والعادات والجدولة مع النماذج الافتراضية بنجاح',
    },
  ];
}

export function saveRoutineAuditLogs(logs: RoutineAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving routine audit logs:', e);
  }
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
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ROUTINES_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_ROUTINE_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading routine settings:', e);
  }
  return DEFAULT_ROUTINE_SETTINGS;
}

export function saveRoutineSettings(settings: RoutineModuleSettings): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving routine settings:', e);
  }
}
