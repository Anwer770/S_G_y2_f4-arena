// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import {
  DEFAULT_ROUTINES,
  DEFAULT_ROUTINE_CATEGORIES,
  DEFAULT_ROUTINE_EXECUTIONS,
  DEFAULT_ROUTINE_OCCURRENCES,
  DEFAULT_ROUTINE_SETTINGS,
  DEFAULT_ROUTINE_TAGS,
  DEFAULT_ROUTINE_TEMPLATES,
} from '../../src/data/defaultRoutines';
import type { RoutineAuditLog, RoutineException } from '../../src/types/routines';
import {
  loadRoutineAuditLogs,
  loadRoutineCategories,
  loadRoutineExceptions,
  loadRoutineExecutions,
  loadRoutineOccurrences,
  loadRoutineSettings,
  loadRoutineTags,
  loadRoutineTemplates,
  loadRoutines,
  logRoutineAudit,
  saveRoutineAuditLogs,
  saveRoutineCategories,
  saveRoutineExceptions,
  saveRoutineExecutions,
  saveRoutineOccurrences,
  saveRoutineSettings,
  saveRoutineTags,
  saveRoutineTemplates,
  saveRoutines,
} from '../../src/utils/storage/routines';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

const exception: RoutineException = {
  id: 'EX-R66',
  routineId: 'rtn-001',
  date: '2026-11-07',
  originalDate: '2026-11-07',
  action: 'SKIP',
  reason: 'اختبار الاستمرارية',
  createdAt: '2026-11-01T00:00:00.000Z',
};

beforeEach(() => {
  dbStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
});

afterEach(() => {
  dbStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('R66 — استمرارية الروتين وإعداداته', () => {
  it('يفصل الغياب عن المصفوفة الفارغة: القوائم الأساسية تعود للبذور، والتنفيذات تقبل الفراغ', () => {
    expect(loadRoutines()).toEqual(DEFAULT_ROUTINES);
    expect(loadRoutineCategories()).toEqual(DEFAULT_ROUTINE_CATEGORIES);
    expect(loadRoutineTags()).toEqual(DEFAULT_ROUTINE_TAGS);
    expect(loadRoutineTemplates()).toEqual(DEFAULT_ROUTINE_TEMPLATES);
    expect(loadRoutineOccurrences()).toEqual(DEFAULT_ROUTINE_OCCURRENCES);
    expect(loadRoutineExecutions()).toEqual(DEFAULT_ROUTINE_EXECUTIONS);
    expect(loadRoutineExceptions()).toEqual([]);
    expect(loadRoutineAuditLogs()).toEqual([expect.objectContaining({ id: 'LOG-ROUTINE-1', action: 'تهيئة' })]);

    expect(dbStorage.getItem(STORAGE_KEYS.ROUTINES_ITEMS)).toBeNull();
    saveRoutines([]);
    saveRoutineCategories([]);
    saveRoutineTags([]);
    saveRoutineTemplates([]);
    expect(loadRoutines()).toEqual(DEFAULT_ROUTINES);
    expect(loadRoutineCategories()).toEqual(DEFAULT_ROUTINE_CATEGORIES);
    expect(loadRoutineTags()).toEqual(DEFAULT_ROUTINE_TAGS);
    expect(loadRoutineTemplates()).toEqual(DEFAULT_ROUTINE_TEMPLATES);

    saveRoutineOccurrences([]);
    saveRoutineExecutions([]);
    saveRoutineExceptions([]);
    saveRoutineAuditLogs([]);
    expect(loadRoutineOccurrences()).toEqual([]);
    expect(loadRoutineExecutions()).toEqual([]);
    expect(loadRoutineExceptions()).toEqual([]);
    expect(loadRoutineAuditLogs()).toEqual([]);
  });

  it('يحفظ ويقرأ كل دفتر مستقل على مفتاحه ولا يخلط التكرار بالتنفيذ أو القوائم', () => {
    const routine = { ...DEFAULT_ROUTINES[0]!, id: 'RTN-R66', name: 'روتين محفوظ' };
    const occurrence = { ...DEFAULT_ROUTINE_OCCURRENCES[0]!, id: 'OCC-R66', routineId: routine.id };
    const execution = { ...DEFAULT_ROUTINE_EXECUTIONS[0]!, id: 'EXE-R66', routineId: routine.id };
    const category = { ...DEFAULT_ROUTINE_CATEGORIES[0]!, id: 'CAT-R66', name: 'فئة محفوظة' };
    const tag = { ...DEFAULT_ROUTINE_TAGS[0]!, id: 'TAG-R66', name: 'وسم محفوظ' };
    const template = { ...DEFAULT_ROUTINE_TEMPLATES[0]!, id: 'TMPL-R66', title: 'قالب محفوظ' };

    saveRoutines([routine]);
    saveRoutineOccurrences([occurrence]);
    saveRoutineExecutions([execution]);
    saveRoutineCategories([category]);
    saveRoutineTags([tag]);
    saveRoutineTemplates([template]);
    saveRoutineExceptions([exception]);

    expect(loadRoutines()).toEqual([routine]);
    expect(loadRoutineOccurrences()).toEqual([occurrence]);
    expect(loadRoutineExecutions()).toEqual([execution]);
    expect(loadRoutineCategories()).toEqual([category]);
    expect(loadRoutineTags()).toEqual([tag]);
    expect(loadRoutineTemplates()).toEqual([template]);
    expect(loadRoutineExceptions()).toEqual([exception]);
    expect(dbStorage.getItem(STORAGE_KEYS.ROUTINES_OCCURRENCES)).not.toContain('EXE-R66');
    expect(dbStorage.getItem(STORAGE_KEYS.ROUTINES_EXECUTIONS)).not.toContain('OCC-R66');
  });

  it('يدمج الإعدادات المخزنة فوق الافتراضي ويرفض التلف أو الشكل غير الكائني', () => {
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_SETTINGS, JSON.stringify({ dayStartTime: '06:15' }));
    expect(loadRoutineSettings()).toEqual({ ...DEFAULT_ROUTINE_SETTINGS, dayStartTime: '06:15' });

    const saved = { ...DEFAULT_ROUTINE_SETTINGS, soundAlerts: false, workingDays: [0, 1] };
    saveRoutineSettings(saved);
    expect(loadRoutineSettings()).toEqual(saved);

    dbStorage.setItem(STORAGE_KEYS.ROUTINES_SETTINGS, '{broken');
    expect(loadRoutineSettings()).toEqual(DEFAULT_ROUTINE_SETTINGS);
    dbStorage.setItem(STORAGE_KEYS.ROUTINES_SETTINGS, JSON.stringify(['ليس كائناً']));
    expect(loadRoutineSettings()).toEqual(DEFAULT_ROUTINE_SETTINGS);
  });

  it('يسجل الحدث في المقدمة بمعرف وطابع ثابتين ويقص سجل الروتين عند 500 سجل', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1730000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    logRoutineAudit('تعديل', 'روتين محفوظ', 'تحديث الوقت', 'RTN-R66');

    expect(loadRoutineAuditLogs()).toEqual([
      expect.objectContaining({
        id: 'LOG-RTN-1730000000000-i',
        timestamp: '2026-11-07T12:00:00.000Z',
        action: 'تعديل',
        routineName: 'روتين محفوظ',
        routineId: 'RTN-R66',
        details: 'تحديث الوقت',
      }),
      expect.objectContaining({ id: 'LOG-ROUTINE-1' }),
    ]);

    const logs: RoutineAuditLog[] = Array.from({ length: 501 }, (_, index) => ({
      id: `LOG-${index}`,
      timestamp: '2026-11-07T12:00:00.000Z',
      action: 'فحص',
      details: String(index),
    }));
    saveRoutineAuditLogs(logs);
    expect(loadRoutineAuditLogs()).toHaveLength(500);
    expect(loadRoutineAuditLogs()[0]?.id).toBe('LOG-0');
    expect(loadRoutineAuditLogs()[499]?.id).toBe('LOG-499');
  });

  it('لا يسرّب تعديل المستهلك إلى البذور أو إلى قراءة لاحقة من الروتين والإعدادات', () => {
    const originalStep = DEFAULT_ROUTINES[0]!.steps[0]!.title;
    const originalTag = DEFAULT_ROUTINES[0]!.tags[0]!;
    const originalWorkingDays = [...DEFAULT_ROUTINE_SETTINGS.workingDays];

    const routines = loadRoutines();
    routines[0]!.steps[0]!.title = 'تعديل يجب ألا يلوّث البذرة';
    routines[0]!.tags[0] = 'وسم يجب ألا يلوّث البذرة';
    const settings = loadRoutineSettings();
    settings.workingDays.push(5);

    expect(DEFAULT_ROUTINES[0]!.steps[0]!.title).toBe(originalStep);
    expect(DEFAULT_ROUTINES[0]!.tags[0]).toBe(originalTag);
    expect(DEFAULT_ROUTINE_SETTINGS.workingDays).toEqual(originalWorkingDays);
    expect(loadRoutines()[0]!.steps[0]!.title).toBe(originalStep);
    expect(loadRoutines()[0]!.tags[0]).toBe(originalTag);
    expect(loadRoutineSettings().workingDays).toEqual(originalWorkingDays);
  });
});
