import React, { useState, useEffect } from 'react';
import { WorkTask, WorkProject, WorkOSViewMode } from '../../types/workos';
import {
  Search,
  CheckSquare,
  FolderKanban,
  Zap,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Printer,
  Clock,
} from 'lucide-react';

export interface WorkOSCommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: WorkTask[];
  projects?: WorkProject[];
  onSelectTask?: (task: WorkTask) => void;
  onSelectView?: (view: WorkOSViewMode) => void;
  onNavigate?: (view: any) => void;
  onSelectProject?: (project: WorkProject) => void;
  onOpenQuickAdd?: (type?: string) => void;
  onOpenAI?: () => void;
  onOpenPrintReport?: () => void;
}

export const WorkOSCommandPaletteModal: React.FC<WorkOSCommandPaletteModalProps> = ({
  isOpen,
  onClose,
  tasks = [],
  projects = [],
  onSelectTask,
  onSelectView,
  onNavigate,
  onSelectProject,
  onOpenQuickAdd,
  onOpenAI,
  onOpenPrintReport,
}) => {
  // Hooks called unconditionally at top of component
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Safe handler actions
  const handleOpenAdd = (type: string) => {
    if (typeof onOpenQuickAdd === 'function') {
      onOpenQuickAdd(type);
    }
    onClose();
  };

  const handleOpenAI = () => {
    if (typeof onOpenAI === 'function') {
      onOpenAI();
    }
    onClose();
  };

  const handleOpenPrint = () => {
    if (typeof onOpenPrintReport === 'function') {
      onOpenPrintReport();
    }
    onClose();
  };

  const handleNavigate = (view: any) => {
    if (typeof onSelectView === 'function') {
      onSelectView(view);
    }
    if (typeof onNavigate === 'function') {
      onNavigate(view);
    }
    onClose();
  };

  const handleSelectTask = (task: WorkTask) => {
    if (typeof onSelectTask === 'function') {
      onSelectTask(task);
    }
    onClose();
  };

  const handleSelectProj = (proj: WorkProject) => {
    if (typeof onSelectProject === 'function') {
      onSelectProject(proj);
    } else if (typeof onNavigate === 'function') {
      onNavigate('projects');
    } else if (typeof onSelectView === 'function') {
      onSelectView('projects');
    }
    onClose();
  };

  // Only return null AFTER all hooks are defined
  if (!isOpen) return null;

  const quickActions = [
    { label: 'إضافة مهمة تشغيلية جديدة (N)', icon: Plus, action: () => handleOpenAdd('task') },
    { label: 'طباعة وتصدير تقرير الإنجاز الرسمي (P)', icon: Printer, action: () => handleOpenPrint() },
    { label: 'استشارة المساعد الذكي AI Copilot', icon: Sparkles, action: () => handleOpenAI() },
    { label: 'الانتقال إلى التخطيط اليومي الموحد', icon: Clock, action: () => handleNavigate('planner') },
    { label: 'الانتقال إلى صندوق الوارد (Inbox)', icon: Zap, action: () => handleNavigate('inbox') },
    { label: 'الانتقال إلى لوحة كانبان المهام', icon: CheckSquare, action: () => handleNavigate('tasks') },
    { label: 'الانتقال إلى الروتين اليومي وجلسة التقييم', icon: Calendar, action: () => handleNavigate('routine') },
    { label: 'الانتقال إلى المشاريع والمبادرات', icon: FolderKanban, action: () => handleNavigate('projects') },
  ];

  const matchedTasks = (tasks || []).filter((t) =>
    t && (
      (t.title && t.title.toLowerCase().includes(query.toLowerCase())) ||
      (t.taskNumber && t.taskNumber.toLowerCase().includes(query.toLowerCase()))
    )
  ).slice(0, 5);

  const matchedProjects = (projects || []).filter((p) =>
    p && (
      (p.name && p.name.toLowerCase().includes(query.toLowerCase())) ||
      (p.code && p.code.toLowerCase().includes(query.toLowerCase()))
    )
  ).slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/70 backdrop-blur-sm"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search input bar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن مهمة، مشروع، أو اكتب أمراً سريعاً... (Esc للإغلاق)"
            className="w-full text-sm font-medium border-none focus:outline-hidden text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-500 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results / Suggestions */}
        <div className="p-3 max-h-80 overflow-y-auto space-y-3 text-xs">
          {/* Quick Actions */}
          {!query && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider block">
                إجراءات سريعة واختصارات
              </span>
              {quickActions.map((qa, i) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={i}
                    onClick={qa.action}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer text-right"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs">{qa.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 rotate-180" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Matched Tasks */}
          {matchedTasks.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider block">
                المهام المطابقة
              </span>
              {matchedTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTask(t)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-800 dark:text-slate-200 transition cursor-pointer text-right"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">
                      {t.taskNumber}
                    </span>
                    <span className="font-bold text-xs">{t.title}</span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{t.dueDate}</span>
                </button>
              ))}
            </div>
          )}

          {/* Matched Projects */}
          {matchedProjects.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider block">
                المشاريع المطابقة
              </span>
              {matchedProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProj(p)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 transition cursor-pointer text-right"
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-xs">{p.name}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{p.code}</span>
                </button>
              ))}
            </div>
          )}

          {query && matchedTasks.length === 0 && matchedProjects.length === 0 && (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500">لا توجد نتائج تطابق "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
};
