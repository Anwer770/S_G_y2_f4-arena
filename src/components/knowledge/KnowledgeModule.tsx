import React, { useState, useEffect } from 'react';
import {
  NoteAuditLog,
  NoteFolder,
  NoteRecord,
  NoteTagItem,
  NoteTemplate,
  NoteVersion,
} from '../../types';
import {
  FileText,
  Plus,
  Sparkles,
  Search,
  BookOpen,
  Pin,
  Star,
  Clock,
  CheckSquare,
  Folder,
  Tag,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  LayoutDashboard,
  Layers,
  History,
  Zap,
  Filter,
  Send,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';
import { downloadNotesExcelTemplate } from '../../utils/universalDataTemplates';
import { parseNotesExcelFile } from '../../utils/universalImporters';
import {
  loadNoteAuditLogs,
  loadNoteFolders,
  loadNotes,
  loadNoteTags,
  loadNoteTemplates,
  logNoteAudit,
  saveNoteFolders,
  saveNotes,
  saveNoteTags,
  saveNoteTemplates,
} from '../../utils/storage';
import {
  exportNotesToCSV,
  exportNotesToExcel,
  exportNotesToJSON,
  smartAnalyzeNoteText,
} from '../../utils/notes';
import { NotesDashboard } from './NotesDashboard';
import { NotesListView, NoteViewMode } from './NotesListView';
import { NoteEditorModal } from './NoteEditorModal';
import { NoteDetailModal } from './NoteDetailModal';
import { TemplatesLibraryModal } from './TemplatesLibraryModal';
import { AIAssistantModal } from './AIAssistantModal';
import { VersionHistoryModal } from './VersionHistoryModal';

interface KnowledgeModuleProps {
  customersList?: { id: string; name: string }[];
  doctorsList?: { id: string; name: string }[];
  tasksList?: { id: string; title: string }[];
}

export type KnowledgeSubTab =
  | 'dashboard'
  | 'all_notes'
  | 'quick_notes'
  | 'pinned'
  | 'favorites'
  | 'needs_review'
  | 'templates'
  | 'folders_tags'
  | 'trash'
  | 'audit';

export const KnowledgeModule: React.FC<KnowledgeModuleProps> = ({
  customersList = [],
  doctorsList = [],
  tasksList = [],
}) => {
  // Main State
  const [notes, setNotes] = useState<NoteRecord[]>(() => loadNotes());
  const [folders, setFolders] = useState<NoteFolder[]>(() => loadNoteFolders());
  const [tagsList, setTagsList] = useState<NoteTagItem[]>(() => loadNoteTags());
  const [templates, setTemplates] = useState<NoteTemplate[]>(() => loadNoteTemplates());
  const [auditLogs, setAuditLogs] = useState<NoteAuditLog[]>(() => loadNoteAuditLogs());

  // Navigation SubTab
  const [activeSubTab, setActiveSubTab] = useState<KnowledgeSubTab>('dashboard');
  const [viewMode, setViewMode] = useState<NoteViewMode>('grid');

  // Quick Capture Bar State
  const [quickText, setQuickText] = useState('');
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<NoteRecord | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteRecord | null>(null);

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTargetNote, setHistoryTargetNote] = useState<NoteRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportFile = async (file: File) => {
    const result = await parseNotesExcelFile(file);
    if (result.count === 0) {
      return { success: false, message: 'الملف لا يحتوي على ملاحظات صالحة.' };
    }

    const map = new Map<string, NoteRecord>();
    notes.forEach((n) => map.set(n.id, n));
    result.notes.forEach((n) => map.set(n.id, n));
    const merged = Array.from(map.values());

    setNotes(merged);
    saveNotes(merged);

    logNoteAudit('استيراد', 'ملاحظة', 'BATCH', `تم استيراد ${result.count} ملاحظة من ملف Excel`);

    return {
      success: true,
      message: `تم استيراد ${result.count} ملاحظة بنجاح!`,
    };
  };

  // Selected folder or tag navigation context
  const [navFolderId, setNavFolderId] = useState<string | undefined>(undefined);
  const [navTag, setNavTag] = useState<string | undefined>(undefined);

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Sync to Storage
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveNoteFolders(folders);
  }, [folders]);

  useEffect(() => {
    saveNoteTags(tagsList);
  }, [tagsList]);

  useEffect(() => {
    saveNoteTemplates(templates);
  }, [templates]);

  // Handler: Save note (create or update)
  const handleSaveNote = (noteData: Partial<NoteRecord>, isNew: boolean) => {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });

    if (isNew) {
      const newId = `N-${Date.now().toString(36).toUpperCase()}`;
      const newNote: NoteRecord = {
        id: newId,
        title: noteData.title || 'ملاحظة بدون عنوان',
        content: noteData.content || '',
        summary: noteData.summary,
        type: noteData.type || 'عامة',
        category: noteData.category || 'العمل',
        subCategory: noteData.subCategory,
        priority: noteData.priority || 'متوسطة',
        status: noteData.status || 'نشطة',
        folderId: noteData.folderId || 'folder-work',
        folderName: folders.find((f) => f.id === (noteData.folderId || 'folder-work'))?.name,
        tags: noteData.tags || [],
        date: formattedDate,
        time: formattedTime,
        createdAt: now.toISOString(),
        updatedAt: formattedDate,
        isPinned: noteData.isPinned || false,
        isFavorite: noteData.isFavorite || false,
        isLocked: noteData.isLocked || false,
        pinCode: noteData.pinCode,
        isQuickNote: noteData.isQuickNote || false,
        color: noteData.color || 'emerald',
        source: noteData.source,
        linkedCustomerId: noteData.linkedCustomerId,
        linkedCustomerName: noteData.linkedCustomerName,
        linkedDoctorId: noteData.linkedDoctorId,
        linkedDoctorName: noteData.linkedDoctorName,
        linkedTaskId: noteData.linkedTaskId,
        linkedTaskTitle: noteData.linkedTaskTitle,
        linkedProject: noteData.linkedProject,
        nextReviewDate: noteData.nextReviewDate,
        reviewReminderEnabled: noteData.reviewReminderEnabled,
        tasks: noteData.tasks || [],
        attachments: noteData.attachments || [],
        reminders: noteData.reminders || [],
        versions: [
          {
            id: `v-1`,
            date: formattedDate,
            title: noteData.title || 'ملاحظة بدون عنوان',
            content: noteData.content || '',
            changeSummary: 'الإنشاء الأولي للملاحظة',
          },
        ],
      };

      setNotes([newNote, ...notes]);
      logNoteAudit('إضافة', 'ملاحظة', newNote.title, `تم إنشاء ملاحظة جديدة (${newNote.type})`);
    } else if (noteToEdit) {
      const updatedNotes = notes.map((n) => {
        if (n.id === noteToEdit.id) {
          const newVersion: NoteVersion = {
            id: `v-${(n.versions?.length || 0) + 1}`,
            date: formattedDate,
            title: n.title,
            content: n.content,
            changeSummary: 'تعديل المحتوى والخصائص',
          };

          return {
            ...n,
            ...noteData,
            folderName: folders.find((f) => f.id === (noteData.folderId || n.folderId))?.name,
            updatedAt: formattedDate,
            versions: [...(n.versions || []), newVersion],
          };
        }
        return n;
      });

      setNotes(updatedNotes);
      logNoteAudit('تعديل', 'ملاحظة', noteData.title || noteToEdit.title, `تم تحديث الملاحظة وتوليد نسخة تاريخية`);
    }
  };

  // Quick Capture submit (< 3 seconds workflow)
  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    setIsQuickSaving(true);
    const analysis = smartAnalyzeNoteText(quickText);

    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });

    const newId = `QN-${Date.now().toString(36).toUpperCase()}`;
    const newNote: NoteRecord = {
      id: newId,
      title: analysis.suggestedTitle || quickText.substring(0, 40) + '...',
      content: quickText.trim(),
      summary: analysis.suggestedSummary,
      type: analysis.suggestedType || 'عامة',
      category: analysis.suggestedCategory || 'العمل',
      priority: analysis.suggestedPriority || 'متوسطة',
      status: 'نشطة',
      folderId: 'folder-ideas',
      folderName: 'أفكار وخواطر',
      tags: analysis.suggestedTags.length > 0 ? analysis.suggestedTags : ['سريعة'],
      date: formattedDate,
      time: formattedTime,
      createdAt: now.toISOString(),
      updatedAt: formattedDate,
      isPinned: false,
      isFavorite: false,
      isLocked: false,
      isQuickNote: true,
      linkedCustomerName: analysis.detectedClient,
      linkedDoctorName: analysis.detectedDoctor,
      tasks: analysis.extractedTasks.map((t, idx) => ({
        id: `tsk-${Date.now()}-${idx}`,
        text: t.text,
        completed: false,
        dueDate: t.dueDate,
        priority: t.priority || 'متوسطة',
      })),
      versions: [
        {
          id: `v-1`,
          date: formattedDate,
          title: analysis.suggestedTitle || 'تدوين سريع',
          content: quickText.trim(),
          changeSummary: 'تدوين سريع فوري مع المعالجة الذكية',
        },
      ],
    };

    setNotes([newNote, ...notes]);
    setQuickText('');
    setIsQuickSaving(false);
    logNoteAudit('إضافة', 'ملاحظة', newNote.title, 'تم تدوين ملاحظة سريعة فورية');
  };

  // Delete Note (move to trash)
  const handleDeleteNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    const updated = notes.map((n) => (n.id === id ? { ...n, isDeleted: true } : n));
    setNotes(updated);
    if (target) {
      logNoteAudit('حذف', 'ملاحظة', target.title, 'تم نقل الملاحظة لسلة المحذوفات');
    }
  };

  // Permanent Delete
  const handlePermanentDelete = (id: string) => {
    const target = notes.find((n) => n.id === id);
    setNotes(notes.filter((n) => n.id !== id));
    if (target) {
      logNoteAudit('حذف', 'ملاحظة', target.title, 'تم الحذف النهائي للملاحظة');
    }
  };

  // Restore Note from Trash
  const handleRestoreNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    const updated = notes.map((n) => (n.id === id ? { ...n, isDeleted: false } : n));
    setNotes(updated);
    if (target) {
      logNoteAudit('استرجاع', 'ملاحظة', target.title, 'تم استعادة الملاحظة من سلة المحذوفات');
    }
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    setNotes(updated);
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote({ ...selectedNote, isPinned: !selectedNote.isPinned });
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, isFavorite: !n.isFavorite } : n));
    setNotes(updated);
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote({ ...selectedNote, isFavorite: !selectedNote.isFavorite });
    }
  };

  // Toggle Task inside Note
  const handleToggleTaskItem = (noteId: string, taskId: string) => {
    const updated = notes.map((n) => {
      if (n.id === noteId && n.tasks) {
        const updatedTasks = n.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        return { ...n, tasks: updatedTasks };
      }
      return n;
    });
    setNotes(updated);
    if (selectedNote && selectedNote.id === noteId && selectedNote.tasks) {
      const updatedTasks = selectedNote.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      setSelectedNote({ ...selectedNote, tasks: updatedTasks });
    }
  };

  // Restore Version
  const handleRestoreVersion = (noteId: string, version: NoteVersion) => {
    const updated = notes.map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          title: version.title,
          content: version.content,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return n;
    });
    setNotes(updated);
    logNoteAudit('استرجاع', 'نسخة', version.title, `تمت استعادة نسخة سابقة للملاحظة`);
  };

  // Schedule Next Review
  const handleScheduleReview = (noteId: string, nextDate: string) => {
    const updated = notes.map((n) =>
      n.id === noteId ? { ...n, nextReviewDate: nextDate, reviewReminderEnabled: true } : n
    );
    setNotes(updated);
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote({ ...selectedNote, nextReviewDate: nextDate });
    }
    logNoteAudit('تعديل', 'ملاحظة', noteId, `تم تحديث موعد المراجعة إلى ${nextDate}`);
  };

  // Use Template Handler
  const handleUseTemplate = (template: NoteTemplate) => {
    setNoteToEdit({
      id: '',
      title: template.title,
      content: template.contentTemplate || template.defaultContent || '',
      type: template.type,
      category: template.category,
      priority: 'متوسطة',
      status: 'نشطة',
      folderId: 'folder-work',
      tags: template.tags || template.defaultTags || [],
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
    setIsEditorOpen(true);
    // increment usage count
    setTemplates(
      templates.map((t) => (t.id === template.id ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t))
    );
  };

  // Open note detail
  const handleOpenDetail = (note: NoteRecord) => {
    setSelectedNote(note);
    setIsDetailOpen(true);
  };

  // Active notes for views
  const activeNotesList = notes.filter((n) => !n.isDeleted);
  const trashNotesList = notes.filter((n) => n.isDeleted);

  // Subtab filtered list
  const currentSubTabNotes = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    switch (activeSubTab) {
      case 'quick_notes':
        return activeNotesList.filter((n) => n.isQuickNote);
      case 'pinned':
        return activeNotesList.filter((n) => n.isPinned);
      case 'favorites':
        return activeNotesList.filter((n) => n.isFavorite);
      case 'needs_review':
        return activeNotesList.filter(
          (n) => n.nextReviewDate && n.nextReviewDate <= today && n.status !== 'مكتملة'
        );
      default:
        return activeNotesList;
    }
  }, [activeSubTab, activeNotesList]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                ادارة الملاحظات
              </h1>
              <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                قاعدة المعرفة
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              توثيق منظم، تدوين لحظي فوري، واستنتاج ذكي للمهام ومحاضر الاجتماعات
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Assistant */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>المساعد الذكي</span>
          </button>

          {/* Templates Library */}
          <button
            type="button"
            onClick={() => setIsTemplatesOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700"
          >
            <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>مكتبة القوالب</span>
          </button>

          {/* Excel Import/Export Modal Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-300 dark:border-slate-700 shadow-2xs"
            title="استيراد وتصدير الملاحظات Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>استيراد إكسل</span>
          </button>

          {/* New Note Button */}
          <button
            type="button"
            onClick={() => {
              setNoteToEdit(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ملاحظة جديدة</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700"
              title="تصدير البيانات"
            >
              <Download className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 z-30 text-xs space-y-1">
                <button
                  onClick={() => {
                    exportNotesToExcel(activeNotesList);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold"
                >
                  تصدير إلى Excel (XLSX)
                </button>
                <button
                  onClick={() => {
                    exportNotesToCSV(activeNotesList);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold"
                >
                  تصدير إلى CSV
                </button>
                <button
                  onClick={() => {
                    exportNotesToJSON(activeNotesList);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold"
                >
                  تصدير كـ JSON النسخ الاحتياطي
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Instant Quick Capture Bar */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleQuickCapture} className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder="تدوين فوري وسريع (أفكار، اتفاقات، تذكيرات، مهام)... سيتولى الذكاء الاصطناعي معالجتها وتصنيفها فوراً."
            className="flex-1 px-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium"
          />

          <button
            type="submit"
            disabled={isQuickSaving || !quickText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>حفظ فوري</span>
          </button>
        </form>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 dark:border-slate-800 pb-2 text-xs font-black no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'dashboard'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>لوحة التحكم والمؤشرات</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('all_notes');
            setNavFolderId(undefined);
            setNavTag(undefined);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'all_notes'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>جميع الملاحظات ({activeNotesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('quick_notes')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'quick_notes'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>الملاحظات السريعة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pinned')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'pinned'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Pin className="w-4 h-4 text-amber-400" />
          <span>المثبتة ({activeNotesList.filter((n) => n.isPinned).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('favorites')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'favorites'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-4 h-4 text-yellow-400" />
          <span>المفضلة ({activeNotesList.filter((n) => n.isFavorite).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('needs_review')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'needs_review'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-rose-400" />
          <span>تحتاج مراجعة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('trash')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'trash'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>سلة المحذوفات ({trashNotesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل التدقيق ({auditLogs.length})</span>
        </button>
      </div>

      {/* 4. Tab Content Rendering */}
      {activeSubTab === 'dashboard' && (
        <NotesDashboard
          notes={activeNotesList}
          folders={folders}
          tagsList={tagsList}
          onSelectNote={handleOpenDetail}
          onOpenNewNote={() => {
            setNoteToEdit(null);
            setIsEditorOpen(true);
          }}
          onSelectFolder={(folderId) => {
            setNavFolderId(folderId);
            setActiveSubTab('all_notes');
          }}
          onSelectTag={(tag) => {
            setNavTag(tag);
            setActiveSubTab('all_notes');
          }}
          onOpenOverdueReviews={() => setActiveSubTab('needs_review')}
        />
      )}

      {(activeSubTab === 'all_notes' ||
        activeSubTab === 'quick_notes' ||
        activeSubTab === 'pinned' ||
        activeSubTab === 'favorites' ||
        activeSubTab === 'needs_review') && (
        <NotesListView
          notes={currentSubTabNotes}
          folders={folders}
          tagsList={tagsList}
          selectedFolderId={navFolderId}
          selectedTag={navTag}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onSelectNote={handleOpenDetail}
          onEditNote={(note) => {
            setNoteToEdit(note);
            setIsEditorOpen(true);
          }}
          onDeleteNote={handleDeleteNote}
          onTogglePin={handleTogglePin}
          onToggleFavorite={handleToggleFavorite}
          onToggleTaskItem={handleToggleTaskItem}
          onOpenNewNote={() => {
            setNoteToEdit(null);
            setIsEditorOpen(true);
          }}
          onBulkDelete={(ids) => {
            const updated = notes.map((n) => (ids.includes(n.id) ? { ...n, isDeleted: true } : n));
            setNotes(updated);
            logNoteAudit('حذف', 'ملاحظة', 'مجموعة ملاحظات', `تم حذف ${ids.length} ملاحظة`);
          }}
        />
      )}

      {/* Trash Tab View */}
      {activeSubTab === 'trash' && (
        <div className="space-y-4 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                سلة المحذوفات ({trashNotesList.length} ملاحظة)
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                يمكنك استعادة الملاحظات المحذوفة أو حذفها نهائياً من قاعدة البيانات
              </p>
            </div>

            {trashNotesList.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('هل تريد بالتأكيد إفراغ سلة المحذوفات نهائياً؟')) {
                    setNotes(notes.filter((n) => !n.isDeleted));
                    logNoteAudit('حذف', 'نظام', 'سلة المحذوفات', 'تم إفراغ سلة المحذوفات نهائياً');
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-800"
              >
                إفراغ السلة نهائياً
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {trashNotesList.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                    {note.title}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-1">
                    {note.summary || note.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <button
                    onClick={() => handleRestoreNote(note.id)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة</span>
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(note.id)}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف نهائي</span>
                  </button>
                </div>
              </div>
            ))}

            {trashNotesList.length === 0 && (
              <p className="col-span-full text-center py-12 text-xs text-slate-400 dark:text-slate-500">
                سلة المحذوفات فارغة حالياً.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Tab View */}
      {activeSubTab === 'audit' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                سجل العمليات والتدقيق (Audit Logs)
              </h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">{auditLogs.length} عملية مسجلة</span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-xs ${
                      log.action === 'إضافة'
                        ? 'bg-emerald-100 text-emerald-700'
                        : log.action === 'تعديل'
                        ? 'bg-amber-100 text-amber-700'
                        : log.action === 'حذف'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {log.action}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {log.title}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{log.details}</span>
                  </div>
                </div>

                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Modals Management */}
      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
        onSave={handleSaveNote}
        folders={folders}
        tagsList={tagsList}
        customersList={customersList}
        doctorsList={doctorsList}
        tasksList={tasksList}
      />

      {/* Note Detail Modal */}
      <NoteDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedNote(null);
        }}
        note={selectedNote}
        onEdit={(note) => {
          setIsDetailOpen(false);
          setNoteToEdit(note);
          setIsEditorOpen(true);
        }}
        onDelete={handleDeleteNote}
        onTogglePin={handleTogglePin}
        onToggleFavorite={handleToggleFavorite}
        onToggleTaskItem={handleToggleTaskItem}
        onOpenVersionHistory={(note) => {
          setHistoryTargetNote(note);
          setIsHistoryModalOpen(true);
        }}
        onScheduleReview={handleScheduleReview}
      />

      {/* Templates Library Modal */}
      <TemplatesLibraryModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        templates={templates}
        onUseTemplate={handleUseTemplate}
        onAddTemplate={(newTpl) => setTemplates([...templates, newTpl])}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        notes={activeNotesList}
        onCreateNoteFromAi={(title, content, category) => {
          handleSaveNote(
            {
              title,
              content,
              category,
              type: 'عامة',
              folderId: 'folder-work',
            },
            true
          );
        }}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryTargetNote(null);
        }}
        note={historyTargetNote}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Universal Data Exchange Modal for Notes */}
      <UniversalDataExchangeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="الملاحظات وقاعدة المعرفة"
        itemTypeName="الملاحظات والمستندات والتدوينات"
        icon={BookOpen}
        themeColor="teal"
        supportedColumnsText="العنوان، المحتوى، التصنيف، النوع، الأولوية (عالية/متوسطة/منخفضة)، المجلد، الكلمات المفتاحية/الوسوم"
        onDownloadTemplate={downloadNotesExcelTemplate}
        onImportFile={handleImportFile}
        onExportExcel={() => exportNotesToExcel(activeNotesList)}
        excelSubtitle="ملف إكسل كامل ببيانات الملاحظات الفعالة"
        onExportJSON={() => exportNotesToJSON(activeNotesList)}
        jsonSubtitle="تصدير نسخة احتياطية JSON لكافة الملاحظات والمجلدات"
      />
    </div>
  );
};
