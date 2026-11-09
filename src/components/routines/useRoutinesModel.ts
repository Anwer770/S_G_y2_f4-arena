/**
 * نموذج وحدة الروتين (R30) — الحالة والمحسوبات والمعالِجات، مستخرجة حرفياً
 * من `RoutinesModule.tsx` (نفس الترتيب ونفس الاعتماديات).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  RoutineCategoryItem,
  RoutineExecution,
  RoutineOccurrence,
  RoutineRecord,
  RoutineSettings,
  RoutineTagItem,
  RoutineTemplateItem,
} from '../../types/routines';
import {
  calculateHabitStreaksList,
  calculateRoutineKPIs,
  detectScheduleConflicts,
  generateOccurrencesForDateRange,
} from '../../utils/routines';
import {
  loadRoutineCategories,
  loadRoutineExecutions,
  loadRoutineOccurrences,
  loadRoutineSettings,
  loadRoutineTags,
  loadRoutineTemplates,
  loadRoutines,
  saveRoutineExecutions,
  saveRoutineOccurrences,
  saveRoutines,
} from '../../utils/storage';
import { parseRoutinesExcelFile } from '../../utils/universalImporters';
import { Filter, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

export function useRoutinesModel() {
  // State
  const [activeTab, setActiveTab] = useState<'today' | 'habits' | 'routines' | 'calendar' | 'analytics' | 'history'>(
    'today'
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Data State
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);
  const [occurrences, setOccurrences] = useState<RoutineOccurrence[]>([]);
  const [executions, setExecutions] = useState<RoutineExecution[]>([]);
  const [categories, setCategories] = useState<RoutineCategoryItem[]>([]);
  const [tags, setTags] = useState<RoutineTagItem[]>([]);
  const [templates, setTemplates] = useState<RoutineTemplateItem[]>([]);
  const [settings, setSettings] = useState<RoutineSettings | null>(null);

  // Search & Filter for "all routines" tab
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardEditData, setWizardEditData] = useState<RoutineRecord | null>(null);

  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [activeTimerRoutine, setActiveTimerRoutine] = useState<RoutineRecord | null>(null);
  const [activeTimerOccurrence, setActiveTimerOccurrence] = useState<RoutineOccurrence | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeDetailRoutine, setActiveDetailRoutine] = useState<RoutineRecord | null>(null);

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const [isPostponeOpen, setIsPostponeOpen] = useState(false);
  const [postponeOccurrence, setPostponeOccurrence] = useState<RoutineOccurrence | null>(null);
  const [postponeRoutine, setPostponeRoutine] = useState<RoutineRecord | null>(null);

  const [isSkipOpen, setIsSkipOpen] = useState(false);
  const [skipOccurrence, setSkipOccurrence] = useState<RoutineOccurrence | null>(null);
  const [skipRoutine, setSkipRoutine] = useState<RoutineRecord | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportFile = async (file: File) => {
    const result = await parseRoutinesExcelFile(file);
    if (result.count === 0) {
      return { success: false, message: 'الملف لا يحتوي على روتينات صالحة.' };
    }

    const map = new Map<string, RoutineRecord>();
    routines.forEach((r) => map.set(r.id, r));
    result.routines.forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values());

    setRoutines(merged);
    saveRoutines(merged);

    const occs = generateOccurrencesForDateRange(merged, selectedDate, selectedDate);
    setOccurrences((prev) => [...occs, ...prev.filter((p) => p.date !== selectedDate)]);

    return {
      success: true,
      message: `تم استيراد ${result.count} روتين وعادة بنجاح!`,
    };
  };

  const handleExportExcel = () => {
    const rows = routines.map((r) => ({
      المعرف: r.id,
      الكود: r.code,
      'اسم الروتين': r.name,
      الوصف: r.description || '',
      النوع: r.type === 'HABIT' ? 'عادة مستمرة' : 'نشاط روتيني',
      التكرار: r.recurrence?.frequency || 'DAILY',
      'وقت البدء': r.schedule?.startTime || '08:00',
      'المدة المقدرة (دقيقة)': r.schedule?.estimatedDurationMinutes || 30,
      الأولوية: r.priority || 'MEDIUM',
      الحالة: r.status === 'ACTIVE' ? 'نشط' : 'معطل',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    if (!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ rightToLeft: true });
    XLSX.utils.book_append_sheet(wb, ws, 'دليل_الروتينات');
    XLSX.writeFile(wb, `سجل_الروتين_والعادات_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Load data on mount
  useEffect(() => {
    const loadedRoutines = loadRoutines();
    const loadedOccurrences = loadRoutineOccurrences();
    const loadedExecutions = loadRoutineExecutions();
    const loadedCategories = loadRoutineCategories();
    const loadedTags = loadRoutineTags();
    const loadedTemplates = loadRoutineTemplates();
    const loadedSettings = loadRoutineSettings();

    setRoutines(loadedRoutines);
    setExecutions(loadedExecutions);
    setCategories(loadedCategories);
    setTags(loadedTags);
    setTemplates(loadedTemplates);
    setSettings(loadedSettings);

    // Auto-generate / synchronize occurrences for the month if needed
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];

    const generated = generateOccurrencesForDateRange(loadedRoutines, startOfMonth, endOfMonth, loadedOccurrences);
    setOccurrences(generated);
    saveRoutineOccurrences(generated);
  }, []);

  // Save changes helpers
  const handleSaveRoutine = (routine: RoutineRecord) => {
    const exists = routines.some((r) => r.id === routine.id);
    let updated: RoutineRecord[];
    if (exists) {
      updated = routines.map((r) => (r.id === routine.id ? routine : r));
    } else {
      updated = [routine, ...routines];
    }
    setRoutines(updated);
    saveRoutines(updated);

    // Regenerate occurrences
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
    const updatedOccurrences = generateOccurrencesForDateRange(updated, startOfMonth, endOfMonth, occurrences);
    setOccurrences(updatedOccurrences);
    saveRoutineOccurrences(updatedOccurrences);
  };

  const handleDeleteRoutine = (routineId: string) => {
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);
    saveRoutines(updated);

    const updatedOccurrences = occurrences.filter((o) => o.routineId !== routineId);
    setOccurrences(updatedOccurrences);
    saveRoutineOccurrences(updatedOccurrences);
  };

  const handleDuplicateRoutine = (routine: RoutineRecord) => {
    const cloned: RoutineRecord = {
      ...routine,
      id: `rtn-${Date.now()}`,
      code: `RTN-${Math.floor(100 + Math.random() * 900)}`,
      name: `${routine.name} (نسخة)`,
      shortName: `${routine.shortName} (نسخة)`.slice(0, 15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
    };
    handleSaveRoutine(cloned);
  };

  const handleToggleRoutineActive = (routineId: string) => {
    const updated = routines.map((r) => {
      if (r.id === routineId) {
        const nextActive = !r.isActive;
        return { ...r, isActive: nextActive, status: (nextActive ? 'ACTIVE' : 'PAUSED') as RoutineRecord['status'] };
      }
      return r;
    });
    setRoutines(updated);
    saveRoutines(updated);
  };

  // Execution Complete Handler
  const handleCompleteExecution = (execution: RoutineExecution) => {
    const updatedExecs = [execution, ...executions];
    setExecutions(updatedExecs);
    saveRoutineExecutions(updatedExecs);

    // Mark corresponding occurrence as completed
    const updatedOccurrences = occurrences.map((occ) => {
      if (occ.id === execution.occurrenceId || (occ.routineId === execution.routineId && occ.date === execution.date)) {
        return {
          ...occ,
          status: 'COMPLETED' as const,
          completedAt: execution.actualEnd,
          actualDuration: execution.actualDuration,
          actualStart: execution.actualStart,
          actualEnd: execution.actualEnd,
          completionRate: execution.completionRate,
          energyLevel: execution.energyLevel,
          focusLevel: execution.focusLevel,
          notes: execution.notes,
        };
      }
      return occ;
    });
    setOccurrences(updatedOccurrences);
    saveRoutineOccurrences(updatedOccurrences);

    // Update routine streak
    const updatedRoutines = routines.map((r) => {
      if (r.id === execution.routineId) {
        const nextStreak = (r.currentStreak || 0) + 1;
        const longest = Math.max(r.longestStreak || 0, nextStreak);
        return {
          ...r,
          currentStreak: nextStreak,
          longestStreak: longest,
          totalExecutions: (r.totalExecutions || 0) + 1,
          completedExecutions: (r.completedExecutions || 0) + 1,
          lastExecutedAt: execution.actualEnd,
        };
      }
      return r;
    });
    setRoutines(updatedRoutines);
    saveRoutines(updatedRoutines);
  };

  // Quick Complete Toggle
  const handleToggleQuickComplete = (occurrence: RoutineOccurrence) => {
    const isAlreadyCompleted = occurrence.status === 'COMPLETED';
    const now = new Date().toISOString();

    const updatedOccurrences = occurrences.map((occ) => {
      if (occ.id === occurrence.id) {
        return {
          ...occ,
          status: (isAlreadyCompleted ? 'PENDING' : 'COMPLETED') as RoutineOccurrence['status'],
          completedAt: isAlreadyCompleted ? undefined : now,
        };
      }
      return occ;
    });
    setOccurrences(updatedOccurrences);
    saveRoutineOccurrences(updatedOccurrences);

    if (!isAlreadyCompleted) {
      const routine = routines.find((r) => r.id === occurrence.routineId);
      if (routine) {
        const quickExec: RoutineExecution = {
          id: `exec-quick-${Date.now()}`,
          routineId: routine.id,
          routineName: routine.name,
          occurrenceId: occurrence.id,
          date: occurrence.date,
          plannedStart: occurrence.plannedStart,
          plannedEnd: occurrence.plannedEnd,
          actualStart: now,
          actualEnd: now,
          plannedDuration: routine.duration,
          actualDuration: routine.duration,
          status: 'COMPLETED',
          completionRate: 100,
          completedStepsCount: routine.steps?.length || 1,
          totalStepsCount: routine.steps?.length || 1,
          skippedStepsCount: 0,
          postponeCount: occurrence.postponeCount || 0,
          pauseCount: 0,
          sessions: [],
          createdAt: now,
          updatedAt: now,
        };
        const updatedExecs = [quickExec, ...executions];
        setExecutions(updatedExecs);
        saveRoutineExecutions(updatedExecs);

        // Update streak
        const updatedRoutines = routines.map((r) => {
          if (r.id === routine.id) {
            const nextStreak = (r.currentStreak || 0) + 1;
            return {
              ...r,
              currentStreak: nextStreak,
              longestStreak: Math.max(r.longestStreak || 0, nextStreak),
              totalExecutions: (r.totalExecutions || 0) + 1,
              completedExecutions: (r.completedExecutions || 0) + 1,
            };
          }
          return r;
        });
        setRoutines(updatedRoutines);
        saveRoutines(updatedRoutines);
      }
    }
  };

  // Postpone Handler
  const handleConfirmPostpone = (occurrenceId: string, newTime: string, newDate?: string, reason?: string) => {
    const updatedOccurrences = occurrences.map((occ) => {
      if (occ.id === occurrenceId) {
        return {
          ...occ,
          plannedStart: newTime,
          date: newDate || occ.date,
          postponeCount: (occ.postponeCount || 0) + 1,
          notes: reason ? `تم التأجيل: ${reason}` : occ.notes,
        };
      }
      return occ;
    });
    setOccurrences(updatedOccurrences);
    saveRoutineOccurrences(updatedOccurrences);
  };

  // Skip Handler
  const handleConfirmSkip = (occurrenceId: string, reason: string) => {
    const updatedOccurrences = occurrences.map((occ) => {
      if (occ.id === occurrenceId) {
        return {
          ...occ,
          status: 'SKIPPED' as const,
          skipReason: reason,
        };
      }
      return occ;
    });
    setOccurrences(updatedOccurrences);
    saveRoutineOccurrences(updatedOccurrences);
  };

  // Delete History Execution
  const handleDeleteExecution = (id: string) => {
    const updated = executions.filter((e) => e.id !== id);
    setExecutions(updated);
    saveRoutineExecutions(updated);
  };

  // Export / Import Data
  const handleExportJSON = () => {
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      routines,
      occurrences,
      executions,
      categories,
      tags,
      templates,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routines_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Computed Values
  const conflicts = useMemo(() => detectScheduleConflicts(occurrences, routines), [occurrences, routines]);
  const kpis = useMemo(
    () => calculateRoutineKPIs(routines, occurrences, executions),
    [routines, occurrences, executions]
  );
  const habitsStreakList = useMemo(() => calculateHabitStreaksList(routines, occurrences), [routines, occurrences]);

  const filteredRoutinesList = routines.filter((r) => {
    if (
      searchTerm &&
      !r.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !r.code.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (categoryFilter !== 'ALL' && r.categoryId !== categoryFilter) return false;
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    return true;
  });

  return {
    activeDetailRoutine,
    activeTab,
    activeTimerOccurrence,
    activeTimerRoutine,
    categories,
    categoryFilter,
    conflicts,
    executions,
    filteredRoutinesList,
    habitsStreakList,
    handleCompleteExecution,
    handleConfirmPostpone,
    handleConfirmSkip,
    handleDeleteExecution,
    handleDeleteRoutine,
    handleDuplicateRoutine,
    handleExportExcel,
    handleExportJSON,
    handleImportFile,
    handleSaveRoutine,
    handleToggleQuickComplete,
    handleToggleRoutineActive,
    isAIOpen,
    isDetailOpen,
    isImportModalOpen,
    isPostponeOpen,
    isSkipOpen,
    isTemplatesOpen,
    isTimerOpen,
    isWizardOpen,
    kpis,
    occurrences,
    postponeOccurrence,
    postponeRoutine,
    routines,
    searchTerm,
    selectedDate,
    setActiveDetailRoutine,
    setActiveTab,
    setActiveTimerOccurrence,
    setActiveTimerRoutine,
    setCategoryFilter,
    setIsAIOpen,
    setIsDetailOpen,
    setIsImportModalOpen,
    setIsPostponeOpen,
    setIsSkipOpen,
    setIsTemplatesOpen,
    setIsTimerOpen,
    setIsWizardOpen,
    setPostponeOccurrence,
    setPostponeRoutine,
    setSearchTerm,
    setSelectedDate,
    setSkipOccurrence,
    setSkipRoutine,
    setTypeFilter,
    setWizardEditData,
    skipOccurrence,
    skipRoutine,
    tags,
    templates,
    typeFilter,
    wizardEditData,
  };
}

export type RoutinesModel = ReturnType<typeof useRoutinesModel>;
