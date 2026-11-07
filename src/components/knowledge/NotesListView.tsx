import React, { useState, useMemo } from 'react';
import {
  NoteFolder,
  NotePriority,
  NoteRecord,
  NoteStatus,
  NoteTagItem,
  NoteType,
} from '../../types';
import {
  Search,
  Filter,
  Grid,
  List as ListIcon,
  Columns3,
  Calendar as CalendarIcon,
  Clock,
  FolderTree,
  Pin,
  Star,
  Lock,
  CheckSquare,
  Paperclip,
  MoreVertical,
  Edit3,
  Trash2,
  Tag,
  Folder,
  Plus,
  ArrowUpDown,
  Check,
  ChevronDown,
  Archive,
  RefreshCw,
  Eye,
  Download,
  Share2,
} from 'lucide-react';
import { filterNotes } from '../../utils/notes';

export type NoteViewMode = 'grid' | 'list' | 'kanban' | 'calendar' | 'timeline' | 'folders';

interface NotesListViewProps {
  notes: NoteRecord[];
  folders: NoteFolder[];
  tagsList: NoteTagItem[];
  selectedFolderId?: string;
  selectedTag?: string;
  viewMode: NoteViewMode;
  onChangeViewMode: (mode: NoteViewMode) => void;
  onSelectNote: (note: NoteRecord) => void;
  onEditNote: (note: NoteRecord) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleTaskItem: (noteId: string, taskId: string) => void;
  onOpenNewNote: () => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
  onBulkMoveFolder?: (ids: string[], folderId: string) => void;
}

export const NotesListView: React.FC<NotesListViewProps> = ({
  notes,
  folders,
  tagsList,
  selectedFolderId,
  selectedTag,
  viewMode,
  onChangeViewMode,
  onSelectNote,
  onEditNote,
  onDeleteNote,
  onTogglePin,
  onToggleFavorite,
  onToggleTaskItem,
  onOpenNewNote,
  onBulkDelete,
  onBulkArchive,
  onBulkMoveFolder,
}) => {
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [folderFilter, setFolderFilter] = useState<string>(selectedFolderId || 'all');
  const [tagFilter, setTagFilter] = useState<string>(selectedTag || 'all');
  const [hasTasksOnly, setHasTasksOnly] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'updatedAt' | 'title' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Sync props if changed
  React.useEffect(() => {
    if (selectedFolderId) setFolderFilter(selectedFolderId);
  }, [selectedFolderId]);

  React.useEffect(() => {
    if (selectedTag) setTagFilter(selectedTag);
  }, [selectedTag]);

  // Categories list
  const categoriesList = useMemo(() => {
    return ['all', ...Array.from(new Set(notes.map((n) => n.category).filter(Boolean)))];
  }, [notes]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const result = filterNotes(notes, {
      query: searchQuery,
      type: typeFilter !== 'all' ? (typeFilter as NoteType) : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      priority: priorityFilter !== 'all' ? (priorityFilter as NotePriority) : undefined,
      status: statusFilter !== 'all' ? (statusFilter as NoteStatus) : undefined,
      folderId: folderFilter !== 'all' ? folderFilter : undefined,
      tags: tagFilter !== 'all' ? [tagFilter] : undefined,
      hasTasks: hasTasksOnly ? true : undefined,
      isPinned: pinnedOnly ? true : undefined,
      isFavorite: favoritesOnly ? true : undefined,
      needsReview: overdueOnly ? true : undefined,
      sortBy,
      sortOrder,
    });

    return result;
  }, [
    notes,
    searchQuery,
    typeFilter,
    categoryFilter,
    priorityFilter,
    statusFilter,
    folderFilter,
    tagFilter,
    hasTasksOnly,
    pinnedOnly,
    favoritesOnly,
    overdueOnly,
    sortBy,
    sortOrder,
  ]);

  // Handle Multi-selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredNotes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotes.map((n) => n.id));
    }
  };

  const handleToggleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
    setFolderFilter('all');
    setTagFilter('all');
    setHasTasksOnly(false);
    setPinnedOnly(false);
    setFavoritesOnly(false);
    setOverdueOnly(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300" dir="rtl">
      {/* Top Search & Filter Controls Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input with quick clear */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث شامل في العناوين، النصوص، الوسوم، التكليفات، والعملاء..."
              className="w-full pl-4 pr-10 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick Filter Toggles & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Buttons */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onChangeViewMode('grid')}
                title="عرض الشبكة (Grid)"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onChangeViewMode('list')}
                title="عرض القائمة (List)"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onChangeViewMode('kanban')}
                title="عرض كانبان (Kanban)"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Columns3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onChangeViewMode('timeline')}
                title="التسلسل الزمني (Timeline)"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onChangeViewMode('folders')}
                title="شجرة المجلدات (Folders Tree)"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'folders'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FolderTree className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Toggle Drawer Button */}
            <button
              type="button"
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                showFiltersDrawer ||
                typeFilter !== 'all' ||
                categoryFilter !== 'all' ||
                folderFilter !== 'all' ||
                tagFilter !== 'all' ||
                hasTasksOnly ||
                pinnedOnly ||
                favoritesOnly ||
                overdueOnly
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>تصفية متقدمة</span>
            </button>

            {/* Create New Note Button */}
            <button
              type="button"
              onClick={onOpenNewNote}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>ملاحظة جديدة</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
          <button
            onClick={() => {
              setPinnedOnly(!pinnedOnly);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              pinnedOnly
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Pin className="w-3 h-3" />
            <span>المثبتة فقط</span>
          </button>

          <button
            onClick={() => {
              setFavoritesOnly(!favoritesOnly);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              favoritesOnly
                ? 'bg-yellow-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Star className="w-3 h-3" />
            <span>المفضلة فقط</span>
          </button>

          <button
            onClick={() => {
              setHasTasksOnly(!hasTasksOnly);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              hasTasksOnly
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            <span>تحتوي مهام</span>
          </button>

          <button
            onClick={() => {
              setOverdueOnly(!overdueOnly);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              overdueOnly
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>مستحقة المراجعة</span>
          </button>

          {(searchQuery ||
            typeFilter !== 'all' ||
            categoryFilter !== 'all' ||
            folderFilter !== 'all' ||
            tagFilter !== 'all' ||
            hasTasksOnly ||
            pinnedOnly ||
            favoritesOnly ||
            overdueOnly) && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-500 font-bold hover:underline mr-auto"
            >
              إلغاء كل الفلاتر
            </button>
          )}
        </div>

        {/* Extended Filter Drawer */}
        {showFiltersDrawer && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-150 text-xs">
            {/* Type */}
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-semibold block">نوع الملاحظة</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              >
                <option value="all">كل الأنواع</option>
                <option value="عامة">عامة</option>
                <option value="فكرة">فكرة</option>
                <option value="اجتماع">اجتماع</option>
                <option value="اتصال">اتصال</option>
                <option value="زيارة">زيارة</option>
                <option value="قرار">قرار</option>
                <option value="بحث">بحث</option>
                <option value="مشكلة">مشكلة</option>
                <option value="تذكير">تذكير</option>
              </select>
            </div>

            {/* Folder */}
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-semibold block">المجلد</label>
              <select
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              >
                <option value="all">كل المجلدات</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-semibold block">الأولوية</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              >
                <option value="all">كل الأولويات</option>
                <option value="عالية">عالية</option>
                <option value="متوسطة">متوسطة</option>
                <option value="منخفضة">منخفضة</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-semibold block">الحالة</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              >
                <option value="all">كل الحالات</option>
                <option value="نشطة">نشطة</option>
                <option value="جديدة">جديدة</option>
                <option value="مسودة">مسودة</option>
                <option value="قيد المراجعة">قيد المراجعة</option>
                <option value="مكتملة">مكتملة</option>
                <option value="مؤرشفة">مؤرشفة</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar if items selected */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <span>تم تحديد {selectedIds.length} ملاحظة</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {onBulkArchive && (
              <button
                onClick={() => {
                  onBulkArchive(selectedIds);
                  setSelectedIds([]);
                }}
                className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100"
              >
                أرشفة
              </button>
            )}

            {onBulkDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} ملاحظة؟`)) {
                    onBulkDelete(selectedIds);
                    setSelectedIds([]);
                  }
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
              >
                حذف المحدد
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* RENDER VIEWS BASED ON VIEW MODE */}

      {/* 1. GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold">لم يتم العثور على أي ملاحظات مطابقة لمعايير البحث والتصفية.</p>
              <button
                onClick={onOpenNewNote}
                className="mt-3 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100"
              >
                + إنشاء ملاحظة جديدة
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`p-4 rounded-xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-2xs hover:shadow-md ${
                  note.isPinned
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded">
                        {note.type}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded">
                        {note.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onTogglePin(note.id)}
                        className={`p-1 rounded transition-colors ${
                          note.isPinned ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onToggleFavorite(note.id)}
                        className={`p-1 rounded transition-colors ${
                          note.isFavorite ? 'text-yellow-500' : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>

                      {note.isLocked && <Lock className="w-3.5 h-3.5 text-rose-500" />}
                    </div>
                  </div>

                  {/* Title & Excerpt */}
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {note.title}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {note.summary || note.content}
                  </p>

                  {/* Connected Entity pill if any */}
                  {(note.linkedCustomerName || note.linkedDoctorName || note.linkedProject) && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1 truncate">
                      <span>🔗</span>
                      <span className="font-semibold truncate">
                        {note.linkedCustomerName || note.linkedDoctorName || note.linkedProject}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>{note.date}</span>

                  <div className="flex items-center gap-2">
                    {note.tasks && note.tasks.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckSquare className="w-3 h-3" />
                        {note.tasks.filter((t) => t.completed).length}/{note.tasks.length}
                      </span>
                    )}

                    {note.attachments && note.attachments.length > 0 && (
                      <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                        <Paperclip className="w-3 h-3" />
                        {note.attachments.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. LIST VIEW (Detailed Table) */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-right text-xs min-w-[820px] print:min-w-0">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredNotes.length && filteredNotes.length > 0}
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-indigo-600 dark:text-indigo-400"
                  />
                </th>
                <th className="p-3 font-bold">العنوان والمحتوى</th>
                <th className="p-3 font-bold">النوع</th>
                <th className="p-3 font-bold">المجلد / التصنيف</th>
                <th className="p-3 font-bold">الأولوية</th>
                <th className="p-3 font-bold">الحالة</th>
                <th className="p-3 font-bold">المهام</th>
                <th className="p-3 font-bold">التاريخ</th>
                <th className="p-3 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotes.map((note) => (
                <tr
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(note.id)}
                      onChange={() => handleToggleSelectId(note.id)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 dark:text-indigo-400"
                    />
                  </td>

                  <td className="p-3 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      {note.isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                      {note.isFavorite && <Star className="w-3 h-3 text-yellow-500 shrink-0" />}
                      {note.isLocked && <Lock className="w-3 h-3 text-rose-500 shrink-0" />}
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {note.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {note.summary || note.content}
                    </p>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold rounded">
                      {note.type}
                    </span>
                  </td>

                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {note.folderName || note.category}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-xs ${
                        note.priority === 'عالية'
                          ? 'bg-rose-100 text-rose-700'
                          : note.priority === 'متوسطة'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {note.priority}
                    </span>
                  </td>

                  <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                    {note.status}
                  </td>

                  <td className="p-3 text-slate-500 dark:text-slate-400">
                    {note.tasks && note.tasks.length > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {note.tasks.filter((t) => t.completed).length}/{note.tasks.length}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="p-3 text-slate-400 dark:text-slate-500 text-xs">{note.date}</td>

                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditNote(note)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('حذف الملاحظة؟')) onDeleteNote(note.id);
                        }}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto">
          {(['جديدة', 'نشطة', 'قيد المراجعة', 'مكتملة'] as NoteStatus[]).map((colStatus) => {
            const colNotes = filteredNotes.filter((n) => n.status === colStatus);
            return (
              <div
                key={colStatus}
                className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3 flex flex-col max-h-[75vh]"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {colStatus}
                  </span>
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg shadow-2xs">
                    {colNotes.length}
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {colNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onSelectNote(note)}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer transition-all space-y-2 shadow-2xs group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded">
                          {note.type}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{note.date}</span>
                      </div>

                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {note.title}
                      </h5>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {note.summary || note.content}
                      </p>

                      {note.tasks && note.tasks.length > 0 && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          <span>
                            {note.tasks.filter((t) => t.completed).length} من {note.tasks.length} مهام
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="relative border-r-2 border-indigo-200 dark:border-indigo-900 mr-4 space-y-6">
            {filteredNotes.map((note, index) => (
              <div key={note.id} className="relative pr-6 group">
                <div className="absolute -right-[9px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 shadow-sm" />

                <div
                  onClick={() => onSelectNote(note)}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{note.date}</span>
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-xs">
                      {note.type}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {note.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {note.summary || note.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. FOLDERS TREE VIEW */}
      {viewMode === 'folders' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {folders.map((folder) => {
            const folderNotes = filteredNotes.filter((n) => n.folderId === folder.id);
            return (
              <div
                key={folder.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{folder.icon}</span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{folder.name}</h4>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded">
                    {folderNotes.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {folderNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onSelectNote(note)}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer text-xs space-y-1 transition-colors"
                    >
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {note.title}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{note.date}</div>
                    </div>
                  ))}
                  {folderNotes.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">لا توجد ملاحظات بهذا المجلد</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
