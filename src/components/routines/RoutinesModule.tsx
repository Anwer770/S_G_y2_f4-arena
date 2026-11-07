import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Flame,
  Plus,
  Sparkles,
  Layers,
  BarChart3,
  FileText,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Check,
  Edit,
  Trash2,
  Copy,
  Zap,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';
import { downloadRoutinesExcelTemplate } from '../../utils/universalDataTemplates';
import { parseRoutinesExcelFile } from '../../utils/universalImporters';
import {
  RoutineRecord,
  RoutineOccurrence,
  RoutineExecution,
  RoutineCategoryItem,
  RoutineTagItem,
  RoutineTemplateItem,
  RoutineSettings,
} from '../../types/routines';
import {
  loadRoutines,
  saveRoutines,
  loadRoutineOccurrences,
  saveRoutineOccurrences,
  loadRoutineExecutions,
  saveRoutineExecutions,
  loadRoutineCategories,
  saveRoutineCategories,
  loadRoutineTags,
  saveRoutineTags,
  loadRoutineTemplates,
  saveRoutineTemplates,
  loadRoutineSettings,
  saveRoutineSettings,
} from '../../utils/storage';
import {
  generateOccurrencesForDateRange,
  detectScheduleConflicts,
  calculateRoutineKPIs,
  calculateHabitStreaksList,
  formatDurationArabic,
} from '../../utils/routines';

// Subcomponents
import { RoutineOccurrencesList } from './RoutineOccurrencesList';
import { HabitsStreakView } from './HabitsStreakView';
import { RoutineCalendarView } from './RoutineCalendarView';
import { RoutineAnalyticsView } from './RoutineAnalyticsView';
import { RoutineExecutionsHistory } from './RoutineExecutionsHistory';
import { RoutineWizardModal } from './RoutineWizardModal';
import { RoutineTimerModal } from './RoutineTimerModal';
import { RoutineDetailModal } from './RoutineDetailModal';
import { RoutineTemplatesModal } from './RoutineTemplatesModal';
import { RoutineAIAssistantModal } from './RoutineAIAssistantModal';
import { RoutinePostponeModal } from './RoutinePostponeModal';
import { RoutineSkipModal } from './RoutineSkipModal';

export const RoutinesModule: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'today' | 'habits' | 'routines' | 'calendar' | 'analytics' | 'history'>('today');
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
      'المعرف': r.id,
      'الكود': r.code,
      'اسم الروتين': r.name,
      'الوصف': r.description || '',
      'النوع': r.type === 'HABIT' ? 'عادة مستمرة' : 'نشاط روتيني',
      'التكرار': r.recurrence?.frequency || 'DAILY',
      'وقت البدء': r.schedule?.startTime || '08:00',
      'المدة المقدرة (دقيقة)': r.schedule?.estimatedDurationMinutes || 30,
      'الأولوية': r.priority || 'MEDIUM',
      'الحالة': r.status === 'ACTIVE' ? 'نشط' : 'معطل',
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

    const generated = generateOccurrencesForDateRange(
      loadedRoutines,
      startOfMonth,
      endOfMonth,
      loadedOccurrences
    );
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
  const handleConfirmPostpone = (
    occurrenceId: string,
    newTime: string,
    newDate?: string,
    reason?: string
  ) => {
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
  const kpis = useMemo(() => calculateRoutineKPIs(routines, occurrences, executions), [routines, occurrences, executions]);
  const habitsStreakList = useMemo(() => calculateHabitStreaksList(routines, occurrences), [routines, occurrences]);

  const filteredRoutinesList = routines.filter((r) => {
    if (searchTerm && !r.name.toLowerCase().includes(searchTerm.toLowerCase()) && !r.code.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== 'ALL' && r.categoryId !== categoryFilter) return false;
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    return true;
  });

  return (
    <div id="routines-module-container" className="space-y-6" dir="rtl">
      {/* Top Banner Header */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs animate-fade-in-up stagger-1">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  ادارة الروتين والعادات
                </h1>
                <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                  التركيز العالي
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                هندسة الأنشطة المتكررة، ربط العادات بالأهداف، جلسات التركيز الموقوتة، وسلاسل الالتزام
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300 dark:border-slate-700 shadow-2xs"
              title="استيراد وتصدير الروتينات والعادات Excel"
            >
              <FileSpreadsheet size={15} className="text-teal-600 dark:text-teal-400" />
              <span>استيراد Excel</span>
            </button>

            <button
              id="btn-new-routine-wizard"
              onClick={() => {
                setWizardEditData(null);
                setIsWizardOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus size={15} /> <span>روتين جديد</span>
            </button>

            <button
              id="btn-open-ai-builder"
              onClick={() => setIsAIOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              <Sparkles size={14} className="text-amber-500" /> <span>المساعد الذكي</span>
            </button>

            <button
              id="btn-open-templates-lib"
              onClick={() => setIsTemplatesOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              <BookOpen size={14} className="text-teal-600 dark:text-teal-400" /> <span>القوالب</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition cursor-pointer border border-slate-200/60 dark:border-slate-700"
              title="تصدير نسخة احتياطية من الروتينات"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 dark:border-slate-800 pb-2 text-xs font-black no-scrollbar">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'today'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock size={15} /> <span>جدول اليوم والمؤقت</span>
        </button>

        <button
          onClick={() => setActiveTab('habits')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'habits'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flame size={15} className={activeTab === 'habits' ? 'fill-white' : 'text-amber-500'} /> <span>متتبع العادات</span>
        </button>

        <button
          onClick={() => setActiveTab('routines')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'routines'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers size={15} /> <span>دليل الروتينات ({routines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar size={15} /> <span>التقويم والجدولة</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 size={15} /> <span>مؤشرات الأداء والتحليلات</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText size={15} /> <span>سجل التنفيذ ({executions.length})</span>
        </button>
      </div>

      {/* Tab View Content */}
      {activeTab === 'today' && (
        <RoutineOccurrencesList
          occurrences={occurrences}
          routines={routines}
          conflicts={conflicts}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onStartTimer={(routine, occ) => {
            setActiveTimerRoutine(routine);
            setActiveTimerOccurrence(occ);
            setIsTimerOpen(true);
          }}
          onToggleQuickComplete={handleToggleQuickComplete}
          onPostponeClick={(occ, routine) => {
            setPostponeOccurrence(occ);
            setPostponeRoutine(routine);
            setIsPostponeOpen(true);
          }}
          onSkipClick={(occ, routine) => {
            setSkipOccurrence(occ);
            setSkipRoutine(routine);
            setIsSkipOpen(true);
          }}
          onViewDetail={(routine) => {
            setActiveDetailRoutine(routine);
            setIsDetailOpen(true);
          }}
        />
      )}

      {activeTab === 'habits' && (
        <HabitsStreakView
          habits={habitsStreakList}
          routines={routines}
          onSelectRoutine={(routineId) => {
            const r = routines.find((item) => item.id === routineId);
            if (r) {
              setActiveDetailRoutine(r);
              setIsDetailOpen(true);
            }
          }}
          onStartTimer={(routine) => {
            setActiveTimerRoutine(routine);
            setActiveTimerOccurrence(null);
            setIsTimerOpen(true);
          }}
        />
      )}

      {activeTab === 'routines' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في الروتينات والعادات والرموز..."
                className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              >
                <option value="ALL">كافة التصنيفات</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              >
                <option value="ALL">كافة أنماط التكرار</option>
                <option value="DAILY">يومي</option>
                <option value="WEEKDAYS">أيام العمل</option>
                <option value="WEEKLY">أسبوعي</option>
                <option value="MONTHLY">شهري</option>
              </select>
            </div>
          </div>

          {/* Routines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutinesList.map((rtn) => {
              const isPaused = !rtn.isActive;

              return (
                <div
                  key={rtn.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 ${
                    isPaused
                      ? 'opacity-60 border-slate-200 dark:border-slate-800'
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                          {rtn.icon || '⚡'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {rtn.code}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{rtn.categoryName}</span>
                          </div>
                          <h3
                            onClick={() => {
                              setActiveDetailRoutine(rtn);
                              setIsDetailOpen(true);
                            }}
                            className="text-sm font-bold text-slate-800 dark:text-white hover:text-emerald-600 cursor-pointer transition mt-0.5"
                          >
                            {rtn.name}
                          </h3>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {rtn.startTime}
                      </span>
                    </div>

                    {rtn.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {rtn.description}
                      </p>
                    )}

                    {/* Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Clock size={11} /> {rtn.duration} دقيقة
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {rtn.frequency}
                      </span>
                      {rtn.currentStreak > 0 && (
                        <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Flame size={11} className="fill-amber-500 text-amber-500" />
                          {rtn.currentStreak} يوم
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveTimerRoutine(rtn);
                        setActiveTimerOccurrence(null);
                        setIsTimerOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
                    >
                      <Play size={12} className="fill-white" /> بدء الجلسة
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setWizardEditData(rtn);
                          setIsWizardOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="تعديل الروتين"
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        onClick={() => handleDuplicateRoutine(rtn)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="استنساخ الروتين"
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        onClick={() => handleToggleRoutineActive(rtn.id)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                          rtn.isActive
                            ? 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-600'
                            : 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                        }`}
                        title={rtn.isActive ? 'إيقاف مؤقت' : 'تفعيل'}
                      >
                        <Zap size={14} />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من حذف الروتين "${rtn.name}"؟`)) {
                            handleDeleteRoutine(rtn.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <RoutineCalendarView
          occurrences={occurrences}
          routines={routines}
          onSelectDate={(dStr) => {
            setSelectedDate(dStr);
            setActiveTab('today');
          }}
          onSelectRoutine={(routine) => {
            setActiveDetailRoutine(routine);
            setIsDetailOpen(true);
          }}
        />
      )}

      {activeTab === 'analytics' && (
        <RoutineAnalyticsView kpis={kpis} routines={routines} executions={executions} />
      )}

      {activeTab === 'history' && (
        <RoutineExecutionsHistory
          executions={executions}
          routines={routines}
          onDeleteExecution={handleDeleteExecution}
        />
      )}

      {/* MODALS */}
      {/* 1. Wizard Modal */}
      <RoutineWizardModal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardEditData(null);
        }}
        initialData={wizardEditData}
        categories={categories}
        tags={tags}
        onSave={handleSaveRoutine}
      />

      {/* 2. Timer Modal */}
      <RoutineTimerModal
        isOpen={isTimerOpen}
        onClose={() => {
          setIsTimerOpen(false);
          setActiveTimerRoutine(null);
          setActiveTimerOccurrence(null);
        }}
        routine={activeTimerRoutine}
        occurrence={activeTimerOccurrence}
        onComplete={handleCompleteExecution}
      />

      {/* 3. Detail Modal */}
      <RoutineDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setActiveDetailRoutine(null);
        }}
        routine={activeDetailRoutine}
        executions={executions}
        onStartTimer={(routine) => {
          setIsDetailOpen(false);
          setActiveTimerRoutine(routine);
          setActiveTimerOccurrence(null);
          setIsTimerOpen(true);
        }}
        onEdit={(routine) => {
          setIsDetailOpen(false);
          setWizardEditData(routine);
          setIsWizardOpen(true);
        }}
        onDuplicate={(routine) => {
          handleDuplicateRoutine(routine);
        }}
        onDelete={handleDeleteRoutine}
      />

      {/* 4. Templates Modal */}
      <RoutineTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        templates={templates}
        onApplyTemplate={(tpl) => {
          const startTime = tpl.suggestedStartTime || tpl.defaultStartTime || '08:00';
          const duration = tpl.suggestedDuration || tpl.defaultDuration || 30;
          const [h, m] = startTime.split(':').map(Number);
          const endMinutes = (h * 60 + m + duration) % 1440;
          const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

          const newRoutine: RoutineRecord = {
            id: `rtn-${Date.now()}`,
            code: `RTN-${Math.floor(100 + Math.random() * 900)}`,
            name: tpl.name || tpl.title || 'روتين جديد',
            shortName: (tpl.name || tpl.title || 'روتين').slice(0, 15),
            description: tpl.description,
            categoryId: categories[0]?.id || 'cat-work',
            categoryName: tpl.category,
            type: 'DAILY',
            frequency: 'يومي',
            selectedDays: [6, 0, 1, 2, 3, 4],
            startDate: new Date().toISOString().split('T')[0],
            startTime,
            endTime,
            duration,
            priority: 4,
            importance: 4,
            status: 'ACTIVE',
            isActive: true,
            color: 'emerald',
            icon: tpl.icon,
            owner: 'الإدارة',
            reminderSettings: {
              enabled: true,
              offsetsMinutes: [10],
              notifyOnLate: true,
              notifyAtStart: true,
            },
            completionRule: 'REQUIRED_ONLY',
            steps: tpl.steps.map((s, idx) => ({
              id: s.id || `st-${idx + 1}`,
              title: s.title,
              duration: s.duration,
              isRequired: s.isRequired,
              description: s.description,
              order: idx + 1,
            })),
            tags: tpl.tags,
            currentStreak: 0,
            longestStreak: 0,
            totalExecutions: 0,
            completedExecutions: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          handleSaveRoutine(newRoutine);
        }}
      />

      {/* 5. AI Assistant Modal */}
      <RoutineAIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onRoutineGenerated={(genRoutine) => {
          handleSaveRoutine(genRoutine);
        }}
      />

      {/* 6. Postpone Modal */}
      <RoutinePostponeModal
        isOpen={isPostponeOpen}
        onClose={() => {
          setIsPostponeOpen(false);
          setPostponeOccurrence(null);
          setPostponeRoutine(null);
        }}
        occurrence={postponeOccurrence}
        routine={postponeRoutine}
        onPostpone={handleConfirmPostpone}
      />

      {/* 7. Skip Modal */}
      <RoutineSkipModal
        isOpen={isSkipOpen}
        onClose={() => {
          setIsSkipOpen(false);
          setSkipOccurrence(null);
          setSkipRoutine(null);
        }}
        occurrence={skipOccurrence}
        routine={skipRoutine}
        onSkip={handleConfirmSkip}
      />

      {/* 8. Universal Data Exchange Modal for Routines */}
      <UniversalDataExchangeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="الروتين والعادات"
        itemTypeName="الروتينات والعادات اليومية والأسبوعية"
        icon={Clock}
        themeColor="teal"
        supportedColumnsText="الكود، اسم الروتين، الوصف، النوع (HABIT/ROUTINE)، التكرار، وقت البدء، المدة بالدقائق، الأولوية، والحالة"
        onDownloadTemplate={downloadRoutinesExcelTemplate}
        onImportFile={handleImportFile}
        onExportExcel={handleExportExcel}
        excelSubtitle="ملف إكسل كامل بسجل الروتينات والعادات اليومية والأسبوعية"
        onExportJSON={handleExportJSON}
        jsonSubtitle="نسخة احتياطية JSON متكاملة (الروتينات، التكرارات، وسجل التنفيذ)"
      />
    </div>
  );
};
