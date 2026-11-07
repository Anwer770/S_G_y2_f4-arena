import React from 'react';
import { NoteFolder, NoteRecord, NoteTagItem } from '../../types';
import {
  FileText,
  Pin,
  Star,
  Lock,
  Clock,
  CheckSquare,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Folder,
  Tag,
  Calendar,
  Layers,
  CheckCircle2,
  ListFilter,
  ArrowUpRight,
} from 'lucide-react';
import { calculateNoteStats } from '../../utils/notes';

interface NotesDashboardProps {
  notes: NoteRecord[];
  folders: NoteFolder[];
  tagsList: NoteTagItem[];
  onSelectNote: (note: NoteRecord) => void;
  onOpenNewNote: () => void;
  onSelectFolder: (folderId: string) => void;
  onSelectTag: (tag: string) => void;
  onOpenOverdueReviews: () => void;
}

export const NotesDashboard: React.FC<NotesDashboardProps> = ({
  notes,
  folders,
  tagsList,
  onSelectNote,
  onOpenNewNote,
  onSelectFolder,
  onSelectTag,
  onOpenOverdueReviews,
}) => {
  const stats = calculateNoteStats(notes);

  const activeNotes = notes.filter((n) => !n.isArchived && !n.isDeleted);
  const pinnedNotes = activeNotes.filter((n) => n.isPinned);
  const favoriteNotes = activeNotes.filter((n) => n.isFavorite);
  const recentNotes = [...activeNotes].sort((a, b) => (b.updatedAt || b.date).localeCompare(a.updatedAt || a.date)).slice(0, 6);

  // Overdue or needing review
  const today = new Date().toISOString().split('T')[0];
  const overdueNotes = activeNotes.filter(
    (n) => n.nextReviewDate && n.nextReviewDate <= today && n.status !== 'مكتملة'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Active Notes */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي الملاحظات</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalActive}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">من أصل {stats.totalNotes} مدونة</span>
          </div>
        </div>

        {/* Pinned Notes */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">المثبتة بالأعلى</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Pin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pinned}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">وصول سريع مباشر</span>
          </div>
        </div>

        {/* Favorites */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">المفضلة</span>
            <div className="p-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{stats.favorites}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">مميزة ومهمة</span>
          </div>
        </div>

        {/* Embedded Tasks */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">المهام المضمنة</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.completedTasks}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">/ {stats.totalTasks}</span>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">
              {stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% إنجاز` : 'لا توجد مهام'}
            </span>
          </div>
        </div>

        {/* Overdue Reviews */}
        <div
          onClick={onOpenOverdueReviews}
          className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-colors ${
            stats.needsReview > 0
              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100/60'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">مراجعات مستحقة</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.needsReview}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium block mt-0.5">
              {stats.needsReview > 0 ? 'تتطلب تدقيقاً ومراجعة' : 'كل المواعيد منضبطة'}
            </span>
          </div>
        </div>

        {/* Locked / Security */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">المحمية برمز PIN</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.locked}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">خصوصية وأمان تام</span>
          </div>
        </div>
      </div>

      {/* Overdue Review Alert Banner if any */}
      {overdueNotes.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                لديك {overdueNotes.length} ملاحظة مستحقة المراجعة والتحديث اليوم
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                حافظ على دقة قاعدة المعرفة من خلال مراجعة القرارات والخطط وتجديد مواعيدها
              </p>
            </div>
          </div>

          <button
            onClick={onOpenOverdueReviews}
            className="px-4 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-900 hover:bg-amber-300 rounded-xl transition-colors shrink-0"
          >
            عرض الملاحظات المستحقة
          </button>
        </div>
      )}

      {/* Folders & Categories Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folders Overview (Col 1) */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">المجلدات وهيكل التوثيق</h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">{folders.length} مجلد</span>
          </div>

          <div className="space-y-2">
            {folders.map((folder) => {
              const count = activeNotes.filter((n) => n.folderId === folder.id).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{folder.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                        {folder.name}
                      </span>
                      {folder.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{folder.description}</p>
                      )}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shadow-2xs">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories & Note Types Breakdown (Col 2) */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">توزيع الأنواع والتصنيفات</h3>
            </div>
          </div>

          {/* Type distribution bars */}
          <div className="space-y-3">
            {Object.entries(stats.byType).slice(0, 6).map(([typeName, count]) => {
              const pct = stats.totalActive > 0 ? Math.round((count / stats.totalActive) * 100) : 0;
              return (
                <div key={typeName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{typeName}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tag Cloud */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Tag className="w-3.5 h-3.5" />
              <span>الوسوم الأكثر نشاطاً:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagsList.slice(0, 10).map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTag(t.name)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-medium rounded-lg transition-colors"
                >
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pinned & High Priority Notes (Col 3) */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">الملاحظات المثبتة والعاجلة</h3>
            </div>
          </div>

          {pinnedNotes.length > 0 ? (
            <div className="space-y-2.5">
              {pinnedNotes.slice(0, 5).map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 cursor-pointer transition-all space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-amber-600 transition-colors truncate">
                      {note.title}
                    </h4>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold shrink-0">
                      {note.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {note.summary || note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              لا توجد ملاحظات مثبتة حالياً. يمكنك تثبيت أي ملاحظة مهمة للوصول السريع إليها هنا.
            </div>
          )}
        </div>
      </div>

      {/* Recent Notes Stream */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">أحدث الملاحظات المدونة</h3>
          </div>

          <button
            onClick={onOpenNewNote}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            <span>+ ملاحظة جديدة</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {recentNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer transition-all flex flex-col justify-between space-y-2 group"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded">
                    {note.type}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{note.date}</span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {note.title}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {note.summary || note.content}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>📁 {note.folderName || note.category}</span>
                {note.tasks && note.tasks.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckSquare className="w-3 h-3" />
                    {note.tasks.filter((t) => t.completed).length}/{note.tasks.length}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
