/**
 * نموذج محرّر الملاحظات (R30) — الحالة والمحسوبات والمعالِجات، مستخرجة حرفياً
 * من `NoteEditorModal.tsx` (نفس الترتيب ونفس الاعتماديات).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  NoteAttachment,
  NotePriority,
  NoteRecord,
  NoteReminderItem,
  NoteStatus,
  NoteTaskItem,
  NoteType,
} from '../../types';
import { smartAnalyzeNoteText } from '../../utils/notes';
import { Tag } from 'lucide-react';
import type { NoteEditorModalProps } from './noteEditorTypes';

interface SpeechAlternativeLike {
  transcript: string;
}
interface SpeechResultLike {
  [index: number]: SpeechAlternativeLike;
}
interface SpeechResultListLike {
  length: number;
  [index: number]: SpeechResultLike;
}
interface SpeechResultEventLike {
  resultIndex: number;
  results: SpeechResultListLike;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function useNoteEditorModel(props: NoteEditorModalProps) {
  const {
    isOpen,
    onClose,
    noteToEdit,
    onSave,
    folders,
    tagsList,
    customersList = [],
    doctorsList = [],
    tasksList = [],
  } = props;

  const isNew = !noteToEdit;

  // Form States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [type, setType] = useState<NoteType>('عامة');
  const [category, setCategory] = useState('العمل');
  const [subCategory, setSubCategory] = useState('');
  const [priority, setPriority] = useState<NotePriority>('متوسطة');
  const [status, setStatus] = useState<NoteStatus>('نشطة');
  const [folderId, setFolderId] = useState('folder-work');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [source, setSource] = useState('');
  const [color, setColor] = useState('emerald');

  // Cross-entity links
  const [linkedCustomerId, setLinkedCustomerId] = useState('');
  const [linkedCustomerName, setLinkedCustomerName] = useState('');
  const [linkedDoctorId, setLinkedDoctorId] = useState('');
  const [linkedDoctorName, setLinkedDoctorName] = useState('');
  const [linkedTaskId, setLinkedTaskId] = useState('');
  const [linkedTaskTitle, setLinkedTaskTitle] = useState('');
  const [linkedProject, setLinkedProject] = useState('');

  // Next Review Date
  const [nextReviewDate, setNextReviewDate] = useState('');
  const [reviewReminderEnabled, setReviewReminderEnabled] = useState(false);

  // Embedded Tasks
  const [tasks, setTasks] = useState<NoteTaskItem[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<NotePriority>('متوسطة');

  // Attachments
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);

  // Reminders
  const [reminders, setReminders] = useState<NoteReminderItem[]>([]);

  // Editor mode: edit or markdown preview
  const [previewMode, setPreviewMode] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Voice recording simulation / Speech to text
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // AI Assistant drawer/state
  const [showAiToolkit, setShowAiToolkit] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<ReturnType<typeof smartAnalyzeNoteText> | null>(null);

  // Initialize form
  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
      setSummary(noteToEdit.summary || '');
      setType(noteToEdit.type || 'عامة');
      setCategory(noteToEdit.category || 'العمل');
      setSubCategory(noteToEdit.subCategory || '');
      setPriority(noteToEdit.priority || 'متوسطة');
      setStatus(noteToEdit.status || 'نشطة');
      setFolderId(noteToEdit.folderId || 'folder-work');
      setSelectedTags(noteToEdit.tags || []);
      setIsPinned(noteToEdit.isPinned || false);
      setIsFavorite(noteToEdit.isFavorite || false);
      setIsLocked(noteToEdit.isLocked || false);
      setPinCode(noteToEdit.pinCode || '');
      setSource(noteToEdit.source || '');
      setColor(noteToEdit.color || 'emerald');

      setLinkedCustomerId(noteToEdit.linkedCustomerId || '');
      setLinkedCustomerName(noteToEdit.linkedCustomerName || '');
      setLinkedDoctorId(noteToEdit.linkedDoctorId || '');
      setLinkedDoctorName(noteToEdit.linkedDoctorName || '');
      setLinkedTaskId(noteToEdit.linkedTaskId || '');
      setLinkedTaskTitle(noteToEdit.linkedTaskTitle || '');
      setLinkedProject(noteToEdit.linkedProject || '');

      setNextReviewDate(noteToEdit.nextReviewDate || '');
      setReviewReminderEnabled(noteToEdit.reviewReminderEnabled || false);
      setTasks(noteToEdit.tasks || []);
      setAttachments(noteToEdit.attachments || []);
      setReminders(noteToEdit.reminders || []);
    } else {
      // Reset form
      setTitle('');
      setContent('');
      setSummary('');
      setType('عامة');
      setCategory('العمل');
      setSubCategory('');
      setPriority('متوسطة');
      setStatus('نشطة');
      setFolderId('folder-work');
      setSelectedTags([]);
      setIsPinned(false);
      setIsFavorite(false);
      setIsLocked(false);
      setPinCode('');
      setSource('');
      setColor('emerald');

      setLinkedCustomerId('');
      setLinkedCustomerName('');
      setLinkedDoctorId('');
      setLinkedDoctorName('');
      setLinkedTaskId('');
      setLinkedTaskTitle('');
      setLinkedProject('');

      setNextReviewDate('');
      setReviewReminderEnabled(false);
      setTasks([]);
      setAttachments([]);
      setReminders([]);
    }
  }, [noteToEdit, isOpen]);

  // Voice recording integration (Web Speech API)
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const speechWindow = window as unknown as {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      };
      const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert('ميزة التعرف على الصوت غير مدعومة في هذا المتصفح. يمكنك الكتابة مباشرة.');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: SpeechResultEventLike) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setContent((prev) => prev + (prev.length > 0 && !prev.endsWith('\n') ? ' ' : '') + transcript);
          }
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      }
    }
  };

  // Quick formatting insert
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('note-content-area') as HTMLTextAreaElement;
    if (!textarea) {
      setContent((prev) => prev + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = prefix + (selectedText || '') + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 50);
  };

  // AI Toolkit Trigger
  const handleRunAiAnalysis = () => {
    if (!content.trim() && !title.trim()) {
      alert('الرجاء كتابة نص الملاحظة أولاً لتحليلها بالذكاء الاصطناعي.');
      return;
    }
    setIsAiProcessing(true);
    setTimeout(() => {
      const fullText = (title ? title + '\n' : '') + content;
      const res = smartAnalyzeNoteText(fullText);
      setAiAnalysisResult(res);
      setIsAiProcessing(false);
      setShowAiToolkit(true);
    }, 300);
  };

  const applyAiSummary = () => {
    if (aiAnalysisResult?.suggestedSummary) {
      setSummary(aiAnalysisResult.suggestedSummary);
    }
  };

  const applyAiTasks = () => {
    if (aiAnalysisResult?.extractedTasks && aiAnalysisResult.extractedTasks.length > 0) {
      const newItems: NoteTaskItem[] = aiAnalysisResult.extractedTasks.map((t, idx) => ({
        id: `nt-${Date.now()}-${idx}`,
        text: t.text,
        completed: false,
        dueDate: t.dueDate,
        priority: t.priority || 'متوسطة',
      }));
      setTasks((prev) => [...prev, ...newItems]);
    }
  };

  const applyAiTagsAndCategory = () => {
    if (aiAnalysisResult) {
      if (aiAnalysisResult.suggestedCategory) setCategory(aiAnalysisResult.suggestedCategory);
      if (aiAnalysisResult.suggestedType) setType(aiAnalysisResult.suggestedType);
      if (aiAnalysisResult.suggestedPriority) setPriority(aiAnalysisResult.suggestedPriority);
      if (aiAnalysisResult.suggestedTags.length > 0) {
        setSelectedTags((prev) => Array.from(new Set([...prev, ...aiAnalysisResult.suggestedTags])));
      }
      if (aiAnalysisResult.detectedClient) {
        setLinkedCustomerName(aiAnalysisResult.detectedClient);
      }
      if (aiAnalysisResult.detectedDoctor) {
        setLinkedDoctorName(aiAnalysisResult.detectedDoctor);
      }
    }
  };

  // Add Task
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: NoteTaskItem = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      dueDate: newTaskDueDate || undefined,
      priority: newTaskPriority,
    };
    setTasks([...tasks, newTask]);
    setNewTaskText('');
    setNewTaskDueDate('');
  };

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Add Tag
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const val = newTagInput.trim();
    if (!selectedTags.includes(val)) {
      setSelectedTags([...selectedTags, val]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: event.target?.result as string,
          uploadedAt: new Date().toLocaleString('ar-YE'),
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('الرجاء إدخال عنوان الملاحظة.');
      return;
    }

    const payload: Partial<NoteRecord> = {
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim() || undefined,
      type,
      category,
      subCategory: subCategory.trim() || undefined,
      priority,
      status,
      folderId,
      tags: selectedTags,
      isPinned,
      isFavorite,
      isLocked,
      pinCode: isLocked ? pinCode : undefined,
      isQuickNote: false,
      color,
      source: source.trim() || undefined,
      linkedCustomerId: linkedCustomerId || undefined,
      linkedCustomerName: linkedCustomerName || undefined,
      linkedDoctorId: linkedDoctorId || undefined,
      linkedDoctorName: linkedDoctorName || undefined,
      linkedTaskId: linkedTaskId || undefined,
      linkedTaskTitle: linkedTaskTitle || undefined,
      linkedProject: linkedProject.trim() || undefined,
      nextReviewDate: nextReviewDate || undefined,
      reviewReminderEnabled,
      tasks,
      attachments,
      reminders,
    };

    onSave(payload, isNew);
    onClose();
  };

  const noteTypes: { id: NoteType; label: string; icon: string }[] = [
    { id: 'عامة', label: 'ملاحظة عامة', icon: '📝' },
    { id: 'فكرة', label: 'فكرة وابتكار', icon: '💡' },
    { id: 'اجتماع', label: 'محضر اجتماع', icon: '🤝' },
    { id: 'اتصال', label: 'اتصال ومتابعة', icon: '📞' },
    { id: 'زيارة', label: 'زيارة ميدانية', icon: '🏃' },
    { id: 'قرار', label: 'قرار إداري', icon: '✅' },
    { id: 'بحث', label: 'بحث ودراسة', icon: '📊' },
    { id: 'مشكلة', label: 'مشكلة وحل', icon: '⚠️' },
    { id: 'تذكير', label: 'تذكير وموعد', icon: '🔔' },
    { id: 'سجل', label: 'سجل يومي', icon: '📜' },
    { id: 'مالية', label: 'ملاحظة مالية', icon: '💰' },
    { id: 'قانونية', label: 'ملاحظة قانونية', icon: '⚖️' },
  ];

  const colorOptions = [
    { id: 'emerald', bg: 'bg-emerald-500', name: 'زمردي' },
    { id: 'blue', bg: 'bg-blue-500', name: 'أزرق' },
    { id: 'indigo', bg: 'bg-indigo-500', name: 'نيلي' },
    { id: 'purple', bg: 'bg-purple-500', name: 'بنفسجي' },
    { id: 'amber', bg: 'bg-amber-500', name: 'كهرماني' },
    { id: 'rose', bg: 'bg-rose-500', name: 'وردي' },
    { id: 'teal', bg: 'bg-teal-500', name: 'فيروزي' },
    { id: 'slate', bg: 'bg-slate-500', name: 'رمادي' },
  ];

  return {
    isOpen,
    onClose,
    noteToEdit,
    folders,
    customersList,
    doctorsList,
    onSave,
    aiAnalysisResult,
    applyAiSummary,
    applyAiTagsAndCategory,
    applyAiTasks,
    attachments,
    category,
    content,
    folderId,
    handleAddTag,
    handleAddTask,
    handleDeleteTask,
    handleFileUpload,
    handleRemoveAttachment,
    handleRemoveTag,
    handleRunAiAnalysis,
    handleSubmit,
    handleToggleTask,
    insertFormatting,
    isAiProcessing,
    isFavorite,
    isLocked,
    isNew,
    isPinned,
    isRecording,
    linkedCustomerName,
    linkedDoctorName,
    linkedProject,
    newTagInput,
    newTaskDueDate,
    newTaskText,
    nextReviewDate,
    noteTypes,
    pinCode,
    previewMode,
    priority,
    selectedTags,
    setCategory,
    setContent,
    setFolderId,
    setIsFavorite,
    setIsLocked,
    setIsPinned,
    setLinkedCustomerName,
    setLinkedDoctorName,
    setLinkedProject,
    setNewTagInput,
    setNewTaskDueDate,
    setNewTaskText,
    setNextReviewDate,
    setPinCode,
    setPreviewMode,
    setPriority,
    setShowAiToolkit,
    setSource,
    setStatus,
    setSummary,
    setTitle,
    setType,
    showAiToolkit,
    source,
    status,
    summary,
    tasks,
    title,
    toggleVoiceRecording,
    type,
  };
}

export type NoteEditorModel = ReturnType<typeof useNoteEditorModel>;
