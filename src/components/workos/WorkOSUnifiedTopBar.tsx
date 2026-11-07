import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  FolderKanban,
  CheckSquare,
  Users,
  Calendar,
  Target,
  FileText,
  ShoppingCart,
  Coins,
  Clock,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { ActiveTimerState, WorkTask, WorkProject } from '../../types/workos';

interface WorkOSUnifiedTopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenQuickAdd?: (type: 'project' | 'task' | 'meeting' | 'appointment' | 'goal' | 'note' | 'order' | 'commitment' | 'habit') => void;
  onOpenAddModal?: (type: any) => void;
  tasks?: WorkTask[];
  projects?: WorkProject[];
  activeTimer: ActiveTimerState | null;
  onToggleTimer?: () => void;
  onStopTimer?: () => void;
  overdueTasksCount?: number;
  urgentTasksCount?: number;
  density?: 'comfortable' | 'compact';
  onDensityChange?: (density: 'comfortable' | 'compact') => void;
  onChangeDensity?: (density: 'comfortable' | 'compact') => void;
  hideCompleted?: boolean;
  showCompleted?: boolean;
  onToggleHideCompleted?: () => void;
  onToggleShowCompleted?: () => void;
  onFilterByOverdue?: () => void;
  onFilterByUrgent?: () => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
}

export const WorkOSUnifiedTopBar: React.FC<WorkOSUnifiedTopBarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenQuickAdd,
  onOpenAddModal,
  tasks = [],
  projects: _projects = [],
  activeTimer,
  onToggleTimer,
  onStopTimer: _onStopTimer,
  overdueTasksCount,
  urgentTasksCount,
  density = 'comfortable',
  onDensityChange,
  onChangeDensity,
  hideCompleted,
  showCompleted,
  onToggleHideCompleted,
  onToggleShowCompleted,
  onFilterByOverdue,
  onFilterByUrgent,
  userName: _userName,
  userRole: _userRole,
  userAvatar: _userAvatar,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Safe handler for opening quick add modal
  const handleOpenAdd = (type: 'project' | 'task' | 'meeting' | 'appointment' | 'goal' | 'note' | 'order' | 'commitment' | 'habit') => {
    if (typeof onOpenQuickAdd === 'function') {
      onOpenQuickAdd(type);
    } else if (typeof onOpenAddModal === 'function') {
      onOpenAddModal(type);
    }
  };

  const handleDensityChange = (newDensity: 'comfortable' | 'compact') => {
    if (typeof onDensityChange === 'function') onDensityChange(newDensity);
    if (typeof onChangeDensity === 'function') onChangeDensity(newDensity);
  };

  const handleToggleCompleted = () => {
    if (typeof onToggleHideCompleted === 'function') onToggleHideCompleted();
    if (typeof onToggleShowCompleted === 'function') onToggleShowCompleted();
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const computedOverdue = typeof overdueTasksCount === 'number'
    ? overdueTasksCount
    : tasks.filter((t) => t && t.status !== 'completed' && t.dueDate && t.dueDate < todayStr).length;

  const computedUrgent = typeof urgentTasksCount === 'number'
    ? urgentTasksCount
    : tasks.filter((t) => t && t.status !== 'completed' && t.priority === 'urgent').length;

  const totalAlerts = computedOverdue + computedUrgent;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-700/80 sticky top-0 z-30 shadow-2xs px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Page Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs shrink-0">
            <CheckSquare className="w-5 h-5 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                إدارة العمل
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/80 font-mono">
                الموحدة
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              متابعة المشاريع والمهام وأداء الفريق
            </p>
          </div>
        </div>

        {/* Global Search & Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Global Search Input */}
          <div className="relative flex-1 sm:w-64 md:w-72">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="بحث شامل... (Ctrl+K)"
              className="w-full pr-9 pl-14 py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200/80 dark:border-slate-700/80 focus:border-teal-600 focus:outline-hidden transition"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-block absolute left-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/70 dark:bg-slate-800 rounded border border-slate-300/60 dark:border-slate-700 pointer-events-none">
                ⌘K
              </span>
            )}
          </div>

          {/* Active Timer Indicator (if running) */}
          {activeTimer && activeTimer.isRunning && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-mono font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate max-w-[120px]">{activeTimer.taskTitle}</span>
              {onToggleTimer && (
                <button
                  onClick={onToggleTimer}
                  className="hover:text-emerald-950 p-0.5 cursor-pointer"
                  title="إيقاف المؤقت"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* SINGLE PRIMARY ADD BUTTON («+ إضافة») */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setIsAddMenuOpen((prev) => !prev)}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              title="إضافة عنصر جديد (أو اضغط N)"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة</span>
              <span className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono bg-teal-800 text-teal-200 rounded">N</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Options */}
            {isAddMenuOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                  اختر نوع العنصر الجديد:
                </div>
                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    handleOpenAdd('project');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-xl transition cursor-pointer text-right"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <FolderKanban className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block">مشروع جديد</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">مبادرة أو مشروع تنفيذي</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    handleOpenAdd('order');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 rounded-xl transition cursor-pointer text-right"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block">طلبية / توريد (ربط ثلاثي)</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">طلبية عميل + مهمة تسليم + التزام</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    handleOpenAdd('commitment');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 rounded-xl transition cursor-pointer text-right"
                >
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block">التزام مالي ومستحقات</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">تحصيل / سداد / فواتير</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    handleOpenAdd('task');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 rounded-xl transition cursor-pointer text-right"
                >
                  <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block">مهمة جديدة</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">إجراء عمل مع استحقاق ومسؤول</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    handleOpenAdd('note');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 rounded-xl transition cursor-pointer text-right"
                >
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block">عمل أو التزام مستقل</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">تعهد أو متابعة عمل رسمية</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    handleOpenAdd('goal');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 rounded-xl transition cursor-pointer text-right"
                >
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block">هدف أو خطة</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">هدف استراتيجي ومؤشرات OKR</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    handleOpenAdd('appointment');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-700 dark:hover:text-sky-300 rounded-xl transition cursor-pointer text-right"
                >
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block">موعد أو لقاء</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">لقاء مع عميل أو موعد تقويم</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    handleOpenAdd('meeting');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 rounded-xl transition cursor-pointer text-right"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold block">محضر اجتماع</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">جلسة عمل وتوصيات فريق</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
              title="التنبيهات والإشعارات"
            >
              <Bell className="w-4 h-4" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[11px] font-bold font-mono flex items-center justify-center animate-pulse">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">التنبيهات العاجلة</span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 font-mono">
                    {totalAlerts} تنبيه
                  </span>
                </div>

                <div className="space-y-2">
                  {overdueTasksCount > 0 ? (
                    <div
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        if (onFilterByOverdue) onFilterByOverdue();
                      }}
                      className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 border border-rose-200/70 dark:border-rose-800/70 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <div>
                          <span className="font-bold block">مهام متأخرة</span>
                          <span className="text-xs text-rose-600 dark:text-rose-400">تجاوزت تاريخ الاستحقاق المحدد</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-xs font-bold">
                        {overdueTasksCount}
                      </span>
                    </div>
                  ) : null}

                  {urgentTasksCount > 0 ? (
                    <div
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        if (onFilterByUrgent) onFilterByUrgent();
                      }}
                      className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-200/70 dark:border-amber-800/70 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold block">مهام عاجلة وحرجة</span>
                          <span className="text-xs text-amber-700 dark:text-amber-300">تتطلب إجراءات فورية ذات أولوية</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-mono text-xs font-bold">
                        {urgentTasksCount}
                      </span>
                    </div>
                  ) : null}

                  {totalAlerts === 0 && (
                    <div className="text-center py-4 text-slate-400 dark:text-slate-500">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                      <p className="font-medium">جميع المهام تسير بانتظام دون أي تأخيرات!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Display Settings Button */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
              title="إعدادات العرض"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Display Settings Popover */}
            {isSettingsOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  تفضيلات العرض
                </div>

                {/* Density Setting */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">كثافة عرض الجداول:</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => handleDensityChange('comfortable')}
                      className={`py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        density === 'comfortable' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      مريح (افتراضي)
                    </button>
                    <button
                      onClick={() => handleDensityChange('compact')}
                      className={`py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        density === 'compact' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      مضغوط
                    </button>
                  </div>
                </div>

                {/* Hide Completed Tasks Setting */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">إخفاء المهام المنجزة</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">تقليل الازدحام البصري</span>
                  </div>
                  <button
                    onClick={handleToggleCompleted}
                    className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                      (hideCompleted ?? (showCompleted === false)) ? 'bg-teal-700' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white dark:bg-slate-900 shadow-xs transition-transform absolute top-0.5 ${
                        (hideCompleted ?? (showCompleted === false)) ? 'right-5.5' : 'right-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>


        </div>
      </div>
    </header>
  );
};
