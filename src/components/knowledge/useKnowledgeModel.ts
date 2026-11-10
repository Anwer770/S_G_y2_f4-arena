/**
 * نموذج وحدة المعرفة (R30) — الحالة والمحسوبات والمعالِجات، مستخرجة حرفياً
 * من `KnowledgeModule.tsx` (نفس الترتيب ونفس الاعتماديات).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Pin } from 'lucide-react';
import { parseNotesExcelFile } from '../../utils/universalImporters';
import {
  loadNoteAuditLogs,
  loadNoteFolders,
  loadNoteTags,
  loadNoteTemplates,
  loadNotes,
  logNoteAudit,
  saveNoteFolders,
  saveNoteTags,
  saveNoteTemplates,
  saveNotes,
} from '../../utils/storage';
import { getLocalNoteDateString, smartAnalyzeNoteText } from '../../utils/notes';
import { NoteViewMode } from './NotesListView';
import type { NoteAuditLog, NoteFolder, NoteRecord, NoteTagItem, NoteTemplate, NoteVersion } from '../../types';
import type { KnowledgeModuleProps, KnowledgeSubTab } from './knowledgeTypes';

export function useKnowledgeModel(props: KnowledgeModuleProps) {
  const { customersList = [], doctorsList = [], tasksList = [] } = props;

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
    const formattedDate = getLocalNoteDateString(now);
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
    const formattedDate = getLocalNoteDateString(now);
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
      const updatedTasks = selectedNote.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
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
          updatedAt: getLocalNoteDateString(),
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
      date: getLocalNoteDateString(),
      createdAt: new Date().toISOString(),
    });
    setIsEditorOpen(true);
    // increment usage count
    setTemplates(templates.map((t) => (t.id === template.id ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t)));
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
    const today = getLocalNoteDateString();
    switch (activeSubTab) {
      case 'quick_notes':
        return activeNotesList.filter((n) => n.isQuickNote);
      case 'pinned':
        return activeNotesList.filter((n) => n.isPinned);
      case 'favorites':
        return activeNotesList.filter((n) => n.isFavorite);
      case 'needs_review':
        return activeNotesList.filter((n) => n.nextReviewDate && n.nextReviewDate <= today && n.status !== 'مكتملة');
      default:
        return activeNotesList;
    }
  }, [activeSubTab, activeNotesList]);

  return {
    activeNotesList,
    activeSubTab,
    auditLogs,
    currentSubTabNotes,
    folders,
    handleDeleteNote,
    handleImportFile,
    handleOpenDetail,
    handlePermanentDelete,
    handleQuickCapture,
    handleRestoreNote,
    handleRestoreVersion,
    handleSaveNote,
    handleScheduleReview,
    handleToggleFavorite,
    handleTogglePin,
    handleToggleTaskItem,
    handleUseTemplate,
    historyTargetNote,
    isAiModalOpen,
    isDetailOpen,
    isEditorOpen,
    isHistoryModalOpen,
    isImportModalOpen,
    isQuickSaving,
    isTemplatesOpen,
    navFolderId,
    navTag,
    noteToEdit,
    notes,
    quickText,
    selectedNote,
    setActiveSubTab,
    setHistoryTargetNote,
    setIsAiModalOpen,
    setIsDetailOpen,
    setIsEditorOpen,
    setIsHistoryModalOpen,
    setIsImportModalOpen,
    setIsTemplatesOpen,
    setNavFolderId,
    setNavTag,
    setNoteToEdit,
    setNotes,
    setQuickText,
    setSelectedNote,
    setShowExportMenu,
    setTemplates,
    setViewMode,
    showExportMenu,
    tagsList,
    templates,
    trashNotesList,
    viewMode,
    customersList,
    doctorsList,
    tasksList,
  };
}

export type KnowledgeModel = ReturnType<typeof useKnowledgeModel>;
