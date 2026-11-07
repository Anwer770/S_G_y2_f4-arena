import {
  NoteFilterState,
  NoteFolder,
  NotePriority,
  NoteRecord,
  NoteStatus,
  NoteTagItem,
  NoteTemplate,
  NoteType,
} from '../types';
import * as XLSX from 'xlsx';

export interface NoteStatsResult {
  total: number;
  totalActive: number;
  totalNotes: number;
  newToday: number;
  favorites: number;
  needsReview: number;
  overdueReviews: number;
  pinned: number;
  archived: number;
  quickNotes: number;
  locked: number;
  trashCount: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  byType: Record<string, number>;
  categoryDistribution: { name: string; count: number; color: string }[];
  typeDistribution: { type: string; count: number }[];
  priorityDistribution: { priority: NotePriority; count: number }[];
  tagsCloud: { name: string; count: number; color: string }[];
  recentNotes: NoteRecord[];
  reviewDueNotes: (NoteRecord & { daysRemaining: number; isOverdue: boolean })[];
}

export function generateNoteId(existingNotes: NoteRecord[]): string {
  const existingNumbers = existingNotes
    .map((n) => {
      const match = n.id.match(/NOTE-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);

  const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 1000;
  return `NOTE-${maxNum + 1}`;
}

export function calculateNoteStats(
  notes: NoteRecord[],
  trashNotes: NoteRecord[] = []
): NoteStatsResult {
  const activeNotes = notes.filter((n) => !n.deletedAt && !n.isDeleted);
  const total = activeNotes.length;
  const totalActive = total;
  const totalNotes = notes.length + trashNotes.length;
  const trashCount = trashNotes.length + notes.filter((n) => !!n.deletedAt || !!n.isDeleted).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let newToday = 0;
  let favorites = 0;
  let pinned = 0;
  let archived = 0;
  let quickNotes = 0;
  let locked = 0;
  let totalTasks = 0;
  let completedTasks = 0;

  const categoryCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const priorityCounts: Record<NotePriority, number> = {
    عالية: 0,
    متوسطة: 0,
    منخفضة: 0,
  };
  const tagCounts: Record<string, number> = {};

  const reviewDueNotes: (NoteRecord & { daysRemaining: number; isOverdue: boolean })[] = [];

  activeNotes.forEach((n) => {
    if (n.createdAt && n.createdAt.startsWith(todayStr)) {
      newToday++;
    }
    if (n.isFavorite) favorites++;
    if (n.isPinned) pinned++;
    if (n.isLocked) locked++;
    if (n.status === 'مؤرشفة' || n.isArchived) archived++;
    if (n.isQuickNote) quickNotes++;

    // Tasks stats
    if (n.tasks && n.tasks.length > 0) {
      totalTasks += n.tasks.length;
      completedTasks += n.tasks.filter((t) => t.completed).length;
    }

    // Category
    const cat = n.category || 'عام';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Type
    const tp = n.type || 'عامة';
    typeCounts[tp] = (typeCounts[tp] || 0) + 1;

    // Priority
    if (n.priority && priorityCounts[n.priority] !== undefined) {
      priorityCounts[n.priority]++;
    }

    // Tags
    if (n.tags && Array.isArray(n.tags)) {
      n.tags.forEach((tg) => {
        if (tg && tg.trim()) {
          tagCounts[tg.trim()] = (tagCounts[tg.trim()] || 0) + 1;
        }
      });
    }

    // Review due check
    if (n.nextReviewDate && n.status !== 'مكتملة' && n.status !== 'مؤرشفة') {
      const reviewDate = new Date(n.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      const diffTime = reviewDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        reviewDueNotes.push({
          ...n,
          daysRemaining: diffDays,
          isOverdue: diffDays < 0,
        });
      }
    }
  });

  // Sort review due notes: overdue first, then nearest
  reviewDueNotes.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const needsReview = reviewDueNotes.length;
  const overdueReviews = reviewDueNotes.filter((r) => r.isOverdue).length;
  const taskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Category array with colors
  const colorMap: Record<string, string> = {
    المشاريع: '#6366f1',
    المالية: '#10b981',
    الأفكار: '#f59e0b',
    العملاء: '#3b82f6',
    العمل: '#14b8a6',
    'الدراسة والبحث': '#8b5cf6',
    الاجتماعات: '#ec4899',
    الشخصية: '#64748b',
  };

  const categoryDistribution = Object.entries(categoryCounts)
    .map(([name, count]) => ({
      name,
      count,
      color: colorMap[name] || '#6b7280',
    }))
    .sort((a, b) => b.count - a.count);

  const typeDistribution = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const priorityDistribution = Object.entries(priorityCounts).map(
    ([priority, count]) => ({
      priority: priority as NotePriority,
      count,
    })
  );

  const tagsCloud = Object.entries(tagCounts)
    .map(([name, count]) => {
      let color = 'indigo';
      if (name.includes('عاجل') || name.includes('مهم')) color = 'rose';
      else if (name.includes('مبيعات') || name.includes('مال')) color = 'emerald';
      else if (name.includes('متابعة')) color = 'amber';
      else if (name.includes('قرار')) color = 'purple';
      return { name, count, color };
    })
    .sort((a, b) => b.count - a.count);

  const recentNotes = [...activeNotes]
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
    .slice(0, 10);

  return {
    total,
    totalActive,
    totalNotes,
    newToday,
    favorites,
    needsReview,
    overdueReviews,
    pinned,
    archived,
    quickNotes,
    locked,
    trashCount,
    totalTasks,
    completedTasks,
    taskCompletionRate,
    byType: typeCounts,
    categoryDistribution,
    typeDistribution,
    priorityDistribution,
    tagsCloud,
    recentNotes,
    reviewDueNotes,
  };
}

// ----------------------------------------------------------------------------
// SMART NLP & AI ANALYZER
// ----------------------------------------------------------------------------
export interface AISuggestionResult {
  suggestedTitle: string;
  suggestedSummary: string;
  suggestedCategory: string;
  suggestedType: NoteType;
  suggestedPriority: NotePriority;
  suggestedTags: string[];
  extractedTasks: { text: string; dueDate?: string; priority?: NotePriority }[];
  extractedEntities: {
    dates: string[];
    persons: string[];
    amounts: string[];
    organizations: string[];
  };
  detectedReminder?: { date: string; time: string; text: string };
  detectedClient?: string;
  detectedDoctor?: string;
}

export function smartAnalyzeNoteText(text: string): AISuggestionResult {
  const clean = text.trim();
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Suggested title
  let suggestedTitle = '';
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^[#\-*\d.]+\s*/, '').trim();
    suggestedTitle = firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
  }
  if (!suggestedTitle) {
    suggestedTitle = `ملاحظة ${new Date().toLocaleDateString('ar-EG')}`;
  }

  // 2. Extract Tasks / Actions
  const actionKeywords = [
    'اتصل',
    'متابعة',
    'ارسال',
    'إرسال',
    'سداد',
    'تحصيل',
    'تجهيز',
    'تسليم',
    'حجز',
    'زيارة',
    'مراجعة',
    'تأكيد',
    'دفع',
    'شراء',
    'تنسيق',
    'إعداد',
    'اعداد',
    'تحديث',
    'فحص',
    'طباعة',
  ];

  const extractedTasks: { text: string; dueDate?: string; priority?: NotePriority }[] = [];
  const sentences = clean.split(/[.!?،؛\n]+/).map((s) => s.trim()).filter((s) => s.length > 3);

  sentences.forEach((sentence) => {
    const hasAction = actionKeywords.some((kw) => sentence.startsWith(kw) || sentence.includes(` ${kw} `) || sentence.startsWith(`- ${kw}`) || sentence.startsWith(`[ ] ${kw}`));
    if (hasAction) {
      let taskPriority: NotePriority = 'متوسطة';
      if (sentence.includes('عاجل') || sentence.includes('ضروري') || sentence.includes('فورا') || sentence.includes('اليوم') || sentence.includes('غدا')) {
        taskPriority = 'عالية';
      }

      // Check dates in task
      let dueDate: string | undefined = undefined;
      const today = new Date();
      if (sentence.includes('اليوم')) {
        dueDate = today.toISOString().split('T')[0];
      } else if (sentence.includes('غدا') || sentence.includes('غداً') || sentence.includes('بكرة')) {
        const tm = new Date();
        tm.setDate(tm.getDate() + 1);
        dueDate = tm.toISOString().split('T')[0];
      } else if (sentence.includes('الأحد')) {
        dueDate = getNextDayOfWeek(0);
      } else if (sentence.includes('الاثنين')) {
        dueDate = getNextDayOfWeek(1);
      } else if (sentence.includes('الثلاثاء')) {
        dueDate = getNextDayOfWeek(2);
      } else if (sentence.includes('الأربعاء')) {
        dueDate = getNextDayOfWeek(3);
      } else if (sentence.includes('الخميس')) {
        dueDate = getNextDayOfWeek(4);
      } else if (sentence.includes('السبت')) {
        dueDate = getNextDayOfWeek(6);
      }

      const taskClean = sentence.replace(/^[#\-*\d.\s\[\]]+/, '').trim();
      if (taskClean.length > 4 && !extractedTasks.some((t) => t.text === taskClean)) {
        extractedTasks.push({
          text: taskClean,
          dueDate,
          priority: taskPriority,
        });
      }
    }
  });

  // 3. Extract Entities: Dates, Persons, Amounts
  const dates: string[] = [];
  const persons: string[] = [];
  const amounts: string[] = [];
  const organizations: string[] = [];

  // Match dates
  const dateRegex = /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g;
  const matchedDates = clean.match(dateRegex);
  if (matchedDates) dates.push(...matchedDates);
  if (clean.includes('غداً') || clean.includes('غدا')) dates.push('غداً');
  if (clean.includes('الأحد القادم')) dates.push('الأحد القادم');
  if (clean.includes('نهاية الشهر')) dates.push('نهاية الشهر');

  // Match amounts
  const amountRegex = /(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?|\d+)\s*(?:ريال|دولار|سعودي|YER|USD|SAR|ألف|الف)/g;
  const matchedAmounts = clean.match(amountRegex);
  if (matchedAmounts) amounts.push(...matchedAmounts);

  // Match persons / doctors / clients
  const personKeywords = ['د.', 'دكتور', 'دكتورة', 'أ.', 'أحمد', 'وجدان', 'أنور', 'علي', 'محمد', 'عبدالله', 'المهندس', 'الأستاذ', 'صيدلية', 'مركز', 'مستشفى'];
  personKeywords.forEach((kw) => {
    const idx = clean.indexOf(kw);
    if (idx !== -1) {
      const chunk = clean.slice(idx, idx + 40).split(/[.,\n،؛]/)[0].trim();
      if (chunk && !persons.includes(chunk)) {
        persons.push(chunk);
      }
    }
  });

  // Detect Client / Doctor
  let detectedDoctor: string | undefined = undefined;
  let detectedClient: string | undefined = undefined;
  const docMatch = persons.find((p) => p.startsWith('د.') || p.startsWith('دكتور') || p.includes('صيدلية') || p.includes('مركز'));
  if (docMatch) {
    if (docMatch.includes('صيدلية') || docMatch.includes('مركز')) {
      detectedClient = docMatch;
    } else {
      detectedDoctor = docMatch;
    }
  }

  // 4. Suggested Category, Type & Tags
  let suggestedCategory = 'العمل';
  let suggestedType: NoteType = 'عامة';
  const suggestedTags: string[] = [];

  if (clean.includes('اجتماع') || clean.includes('محضر') || clean.includes('حضور')) {
    suggestedCategory = 'الاجتماعات';
    suggestedType = 'اجتماع';
    suggestedTags.push('اجتماع');
  } else if (clean.includes('عميل') || clean.includes('صيدلية') || clean.includes('مبيعات') || clean.includes('طلبية') || clean.includes('زبون')) {
    suggestedCategory = 'العملاء';
    suggestedType = clean.includes('اتصال') || clean.includes('هاتف') ? 'اتصال' : 'زيارة';
    suggestedTags.push('مبيعات', 'عملاء');
  } else if (clean.includes('فكرة') || clean.includes('مقترح') || clean.includes('تطوير') || clean.includes('ابتكار')) {
    suggestedCategory = 'الأفكار';
    suggestedType = 'فكرة';
    suggestedTags.push('فكرة', 'تطوير');
  } else if (clean.includes('ريال') || clean.includes('فاتورة') || clean.includes('سداد') || clean.includes('حساب') || clean.includes('سعر') || clean.includes('دين')) {
    suggestedCategory = 'المالية';
    suggestedType = 'مالية';
    suggestedTags.push('مالية', 'متابعة');
  } else if (clean.includes('مشكلة') || clean.includes('عطل') || clean.includes('خطأ') || clean.includes('خلل')) {
    suggestedCategory = 'العمل';
    suggestedType = 'مشكلة';
    suggestedTags.push('مشكلة', 'حلول');
  } else if (clean.includes('قرار') || clean.includes('اعتماد') || clean.includes('تعميم')) {
    suggestedCategory = 'العمل';
    suggestedType = 'قرار';
    suggestedTags.push('قرار إداري');
  } else if (clean.includes('دراسة') || clean.includes('بحث') || clean.includes('مقارنة')) {
    suggestedCategory = 'الدراسة والبحث';
    suggestedType = 'بحث';
    suggestedTags.push('بحث');
  }

  // Priority
  let suggestedPriority: NotePriority = 'متوسطة';
  if (clean.includes('عاجل') || clean.includes('مهم جدا') || clean.includes('فوري') || clean.includes('طارئ')) {
    suggestedPriority = 'عالية';
    if (!suggestedTags.includes('عاجل')) suggestedTags.push('عاجل');
  } else if (clean.includes('منخفض') || clean.includes('لاحقا') || clean.includes('وقت الفراغ')) {
    suggestedPriority = 'منخفضة';
  }

  // Summary
  const suggestedSummary = sentences.slice(0, 2).join(' — ');

  // Reminder
  let detectedReminder: { date: string; time: string; text: string } | undefined = undefined;
  if (dates.length > 0 || extractedTasks.some((t) => t.dueDate)) {
    const tmDate = extractedTasks.find((t) => t.dueDate)?.dueDate || new Date().toISOString().split('T')[0];
    detectedReminder = {
      date: tmDate,
      time: '09:00',
      text: suggestedTitle,
    };
  }

  return {
    suggestedTitle,
    suggestedSummary,
    suggestedCategory,
    suggestedType,
    suggestedPriority,
    suggestedTags: Array.from(new Set(suggestedTags)),
    extractedTasks,
    extractedEntities: {
      dates,
      persons,
      amounts,
      organizations,
    },
    detectedReminder,
    detectedClient,
    detectedDoctor,
  };
}

function getNextDayOfWeek(dayOfWeek: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (dayOfWeek + 7 - day) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

// ----------------------------------------------------------------------------
// FILTER & SEARCH LOGIC (Full-Text & Semantic)
// ----------------------------------------------------------------------------
export function filterNotes(
  notes: NoteRecord[],
  filter: NoteFilterState
): NoteRecord[] {
  const filtered = notes.filter((note) => {
    // Trash / Deleted filter
    if (filter.isTrashOnly) {
      if (!note.deletedAt && !note.isDeleted) return false;
    } else {
      if (note.deletedAt || note.isDeleted) return false;
    }

    // Pinned / Favorite / Needs Review
    if (filter.isPinned && !note.isPinned) return false;
    if (filter.isFavorite && !note.isFavorite) return false;

    if (filter.needsReview || filter.needsReviewOnly) {
      if (!note.nextReviewDate) return false;
      const rDate = new Date(note.nextReviewDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      rDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((rDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) return false;
    }

    if (filter.hasTasks && (!note.tasks || note.tasks.length === 0)) {
      return false;
    }

    if (filter.hasAttachments && (!note.attachments || note.attachments.length === 0)) {
      return false;
    }

    // Folder
    if (filter.folderId && filter.folderId !== 'all' && note.folderId !== filter.folderId) {
      return false;
    }

    // Type
    if (filter.type && filter.type !== 'all' && note.type !== filter.type) {
      return false;
    }

    // Category
    if (filter.category && filter.category !== 'all' && note.category !== filter.category) {
      return false;
    }

    // Priority
    if (filter.priority && filter.priority !== 'all' && note.priority !== filter.priority) {
      return false;
    }

    // Status
    if (filter.status && filter.status !== 'all' && note.status !== filter.status) {
      return false;
    }

    // Tag
    if (filter.tag && filter.tag !== 'all') {
      if (!note.tags || !note.tags.includes(filter.tag)) return false;
    }
    if (filter.tags && filter.tags.length > 0 && filter.tags[0] !== 'all') {
      const match = filter.tags.some((t) => note.tags && note.tags.includes(t));
      if (!match) return false;
    }

    // Date range
    if (filter.startDate) {
      const noteDate = (note.createdAt || '').split(' ')[0];
      if (noteDate < filter.startDate) return false;
    }
    if (filter.endDate) {
      const noteDate = (note.createdAt || '').split(' ')[0];
      if (noteDate > filter.endDate) return false;
    }

    // Search query with semantic expansion
    const rawSearch = filter.search || filter.query;
    if (rawSearch && rawSearch.trim()) {
      const q = rawSearch.trim().toLowerCase();

      // Semantic synonyms expansions for common Arabic business terms
      const searchTerms = [q];
      if (q.includes('دين') || q.includes('مديون')) {
        searchTerms.push('تحصيل', 'فاتورة', 'رصيد', 'سداد', 'مالية');
      }
      if (q.includes('اجتماع') || q.includes('محضر')) {
        searchTerms.push('جلسة', 'قرارات', 'نقاط', 'حضور');
      }
      if (q.includes('عميل') || q.includes('زبون')) {
        searchTerms.push('صيدلية', 'مركز', 'مشتريات', 'طلبية');
      }
      if (q.includes('طبيب') || q.includes('دكتور')) {
        searchTerms.push('عيادة', 'مستشفى', 'عينات', 'زيارة');
      }

      const noteText = [
        note.id,
        note.title,
        note.content,
        note.summary || '',
        note.category,
        note.subCategory || '',
        note.type,
        note.source || '',
        note.linkedCustomerName || '',
        note.linkedDoctorName || '',
        note.linkedProject || '',
        ...(note.tags || []),
        ...(note.tasks || []).map((t) => t.text),
      ]
        .join(' ')
        .toLowerCase();

      const matchesAny = searchTerms.some((term) => noteText.includes(term));
      if (!matchesAny) return false;
    }

    return true;
  });

  if (filter.sortBy) {
    filtered.sort((a, b) => {
      const order = filter.sortOrder === 'asc' ? 1 : -1;
      if (filter.sortBy === 'title') {
        return a.title.localeCompare(b.title) * order;
      }
      if (filter.sortBy === 'updatedAt') {
        return ((a.updatedAt || a.createdAt) > (b.updatedAt || b.createdAt) ? 1 : -1) * order;
      }
      if (filter.sortBy === 'date') {
        return ((a.createdAt || '') > (b.createdAt || '') ? 1 : -1) * order;
      }
      if (filter.sortBy === 'priority') {
        const pMap: Record<string, number> = { عالية: 3, متوسطة: 2, منخفضة: 1 };
        return ((pMap[a.priority] || 0) - (pMap[b.priority] || 0)) * order;
      }
      return 0;
    });
  }

  return filtered;
}

// ----------------------------------------------------------------------------
// EXPORT & DOWNLOAD UTILITIES
// ----------------------------------------------------------------------------
export function exportNotesToExcel(notes: NoteRecord[], filename = 'سجل_الملاحظات_والمعرفة.xlsx') {
  const rows = notes.map((n, idx) => ({
    'م': idx + 1,
    'كود الملاحظة': n.id,
    'العنوان': n.title,
    'النوع': n.type,
    'التصنيف': n.category,
    'التصنيف الفرعي': n.subCategory || '',
    'الأولوية': n.priority,
    'الحالة': n.status,
    'المجلد': n.folderId,
    'الوسوم': (n.tags || []).join(', '),
    'الملخص': n.summary || '',
    'المحتوى': n.content,
    'العميل المرتبط': n.linkedCustomerName || '',
    'الطبيب المرتبط': n.linkedDoctorName || '',
    'المشروع المرتبط': n.linkedProject || '',
    'المهمة المرتبطة': n.linkedTaskTitle || '',
    'تاريخ المراجعة القادمة': n.nextReviewDate || '',
    'عدد المهام': (n.tasks || []).length,
    'المهام المنجزة': (n.tasks || []).filter((t) => t.completed).length,
    'عدد المرفقات': (n.attachments || []).length,
    'ملاحظة سريعة': n.isQuickNote ? 'نعم' : 'لا',
    'مثبتة': n.isPinned ? 'نعم' : 'لا',
    'مفضلة': n.isFavorite ? 'نعم' : 'لا',
    'تاريخ الإنشاء': n.createdAt,
    'آخر تعديل': n.updatedAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الملاحظات');

  worksheet['!cols'] = [
    { wch: 4 }, // م
    { wch: 12 }, // كود
    { wch: 35 }, // عنوان
    { wch: 12 }, // نوع
    { wch: 15 }, // تصنيف
    { wch: 15 }, // فرعي
    { wch: 10 }, // أولوية
    { wch: 12 }, // حالة
    { wch: 14 }, // مجلد
    { wch: 20 }, // وسوم
    { wch: 40 }, // ملخص
    { wch: 60 }, // محتوى
    { wch: 20 }, // عميل
    { wch: 20 }, // طبيب
    { wch: 20 }, // مشروع
    { wch: 20 }, // مهمة
    { wch: 15 }, // مراجعة
    { wch: 10 }, // عدد مهام
    { wch: 10 }, // منجزة
    { wch: 10 }, // مرفقات
    { wch: 10 }, // سريعة
    { wch: 8 }, // مثبتة
    { wch: 8 }, // مفضلة
    { wch: 18 }, // إنشاء
    { wch: 18 }, // تعديل
  ];

  XLSX.writeFile(workbook, filename);
}

export function exportNotesToCSV(notes: NoteRecord[], filename = 'الملاحظات_والمعرفة.csv') {
  const headers = [
    'كود الملاحظة',
    'العنوان',
    'النوع',
    'التصنيف',
    'الأولوية',
    'الحالة',
    'الوسوم',
    'المحتوى',
    'تاريخ الإنشاء',
  ];

  const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

  const rows = notes.map((n) => [
    escapeCSV(n.id),
    escapeCSV(n.title),
    escapeCSV(n.type),
    escapeCSV(n.category),
    escapeCSV(n.priority),
    escapeCSV(n.status),
    escapeCSV((n.tags || []).join(';')),
    escapeCSV(n.content),
    escapeCSV(n.createdAt),
  ]);

  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportNotesToJSON(notes: NoteRecord[], filename = 'notes_backup.json') {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportNoteToMarkdown(note: NoteRecord) {
  const tagsStr = (note.tags || []).map((t) => `#${t}`).join(' ');
  const md = `# ${note.title}
**النوع:** ${note.type} | **التصنيف:** ${note.category} | **الأولوية:** ${note.priority} | **الحالة:** ${note.status}
**تاريخ الإنشاء:** ${note.createdAt} | **تاريخ التعديل:** ${note.updatedAt}
${tagsStr ? `**الوسوم:** ${tagsStr}\n` : ''}
${note.linkedCustomerName ? `**العميل المرتبط:** ${note.linkedCustomerName}\n` : ''}
${note.linkedDoctorName ? `**الطبيب المرتبط:** ${note.linkedDoctorName}\n` : ''}
${note.linkedProject ? `**المشروع:** ${note.linkedProject}\n` : ''}
${note.nextReviewDate ? `**تاريخ المراجعة القادمة:** ${note.nextReviewDate}\n` : ''}

---

${note.content}

${
  note.tasks && note.tasks.length > 0
    ? `\n### قائمة المهام والتكليفات:\n${note.tasks
        .map((t) => `- [${t.completed ? 'x' : ' '}] ${t.text}${t.dueDate ? ` (الموعد: ${t.dueDate})` : ''}`)
        .join('\n')}`
    : ''
}

---
*تم التصدير من نظام إدارة الملاحظات والمعرفة*
`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${note.id}_${note.title.slice(0, 25)}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportNoteToText(note: NoteRecord) {
  const txt = `عنوان الملاحظة: ${note.title}
الكود: ${note.id}
النوع: ${note.type} | التصنيف: ${note.category} | الأولوية: ${note.priority} | الحالة: ${note.status}
تاريخ الإنشاء: ${note.createdAt}

--------------------------------------------------
${note.content}
--------------------------------------------------

${
  note.tasks && note.tasks.length > 0
    ? `المهام المرتبطة:\n${note.tasks.map((t, idx) => `${idx + 1}. [${t.completed ? 'منجز' : 'قيد الانتظار'}] ${t.text}`).join('\n')}`
    : ''
}
`;

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${note.id}_${note.title.slice(0, 20)}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
