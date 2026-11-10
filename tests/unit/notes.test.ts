// @vitest-environment jsdom
/** منطق دفتر الملاحظات: الإحصاء، البحث، التحليل والتصدير (R54). */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const xlsx = vi.hoisted(() => ({
  jsonToSheet: vi.fn(() => ({})),
  bookNew: vi.fn(() => ({})),
  bookAppendSheet: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: xlsx.jsonToSheet,
    book_new: xlsx.bookNew,
    book_append_sheet: xlsx.bookAppendSheet,
  },
  writeFile: xlsx.writeFile,
}));

import {
  calculateNoteStats,
  exportNoteToMarkdown,
  exportNoteToText,
  exportNotesToCSV,
  exportNotesToExcel,
  exportNotesToJSON,
  filterNotes,
  generateNoteId,
  smartAnalyzeNoteText,
} from '../../src/utils/notes';
import type { NoteRecord } from '../../src/types';

const note = (over: Partial<NoteRecord> = {}): NoteRecord => ({
  id: 'NOTE-1001',
  title: 'عنوان افتراضي',
  content: 'محتوى افتراضي',
  type: 'عامة',
  category: 'العمل',
  priority: 'متوسطة',
  status: 'نشطة',
  tags: [],
  folderId: 'work',
  isPinned: false,
  isFavorite: false,
  isLocked: false,
  isQuickNote: false,
  createdAt: '2026-11-01T09:00:00.000Z',
  updatedAt: '2026-11-01T09:00:00.000Z',
  ...over,
});

const clickedDownloads: HTMLAnchorElement[] = [];
let originalCreateObjectURL: typeof URL.createObjectURL;
let originalRevokeObjectURL: typeof URL.revokeObjectURL;
let originalClick: typeof HTMLAnchorElement.prototype.click;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
  xlsx.jsonToSheet.mockClear();
  xlsx.bookNew.mockClear();
  xlsx.bookAppendSheet.mockClear();
  xlsx.writeFile.mockClear();
  clickedDownloads.length = 0;
  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  originalClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = vi.fn(() => 'blob:notes-test');
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = function click() {
    clickedDownloads.push(this);
  };
});

afterEach(() => {
  vi.useRealTimers();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  HTMLAnchorElement.prototype.click = originalClick;
  vi.unstubAllGlobals();
});

describe('معرّف الملاحظة وإحصاءاتها', () => {
  it('يبدأ التسلسل من 1001 ويتجاوز أعلى معرّف صالح فقط', () => {
    expect(generateNoteId([])).toBe('NOTE-1001');
    expect(generateNoteId([note({ id: 'NOTE-1001' }), note({ id: 'NOTE-1040' }), note({ id: 'ABC-999' })])).toBe(
      'NOTE-1041'
    );
  });

  it('لا يعدّ القمامة مرتين عندما تمرر أيضاً ضمن الملاحظات', () => {
    /* العيب: شاشة المعرفة تمرر قائمة موحّدة في مسارات الاستعادة؛ الجمع القديم كان يجعل
       NOTE-1002 المحذوف يظهر مرتين في «الكل» و«سلة المحذوفات». */
    const deleted = note({ id: 'NOTE-1002', deletedAt: '2026-11-06T10:00:00.000Z', isDeleted: true });
    const result = calculateNoteStats([note(), deleted], [deleted]);

    expect(result.total).toBe(1);
    expect(result.totalNotes).toBe(2);
    expect(result.trashCount).toBe(1);
  });

  it('يحسب السمات والمهام والتوزيعات ويستبعد المحذوف', () => {
    const result = calculateNoteStats([
      note({
        id: 'NOTE-1001',
        createdAt: '2026-11-07T08:00:00.000Z',
        updatedAt: '2026-11-07T09:00:00.000Z',
        category: 'المالية',
        type: 'مالية',
        priority: 'عالية',
        tags: ['عاجل', 'مال', 'مال'],
        isPinned: true,
        isFavorite: true,
        isLocked: true,
        isQuickNote: true,
        tasks: [
          { id: 'T1', text: 'منجز', completed: true },
          { id: 'T2', text: 'معلّق', completed: false },
        ],
      }),
      note({
        id: 'NOTE-1002',
        category: 'غير معروفة',
        type: 'فكرة',
        priority: 'منخفضة',
        status: 'مؤرشفة',
        isArchived: true,
        tags: ['متابعة'],
        updatedAt: '2026-11-06T09:00:00.000Z',
      }),
      note({ id: 'NOTE-1003', deletedAt: '2026-11-06T10:00:00.000Z', isDeleted: true }),
    ]);

    expect(result).toMatchObject({
      total: 2,
      totalActive: 2,
      totalNotes: 3,
      newToday: 1,
      favorites: 1,
      pinned: 1,
      locked: 1,
      archived: 1,
      quickNotes: 1,
      totalTasks: 2,
      completedTasks: 1,
      taskCompletionRate: 50,
    });
    expect(result.categoryDistribution).toEqual([
      { name: 'المالية', count: 1, color: '#10b981' },
      { name: 'غير معروفة', count: 1, color: '#6b7280' },
    ]);
    expect(result.byType).toEqual({ مالية: 1, فكرة: 1 });
    expect(result.priorityDistribution).toEqual([
      { priority: 'عالية', count: 1 },
      { priority: 'متوسطة', count: 0 },
      { priority: 'منخفضة', count: 1 },
    ]);
    expect(result.tagsCloud).toContainEqual({ name: 'مال', count: 2, color: 'emerald' });
    expect(result.tagsCloud).toContainEqual({ name: 'عاجل', count: 1, color: 'rose' });
    expect(result.recentNotes.map((n) => n.id)).toEqual(['NOTE-1001', 'NOTE-1002']);
  });

  it('يعرض مراجعات الأسبوع والمتأخر منها فقط، مرتبة بالأقدم', () => {
    const result = calculateNoteStats([
      note({ id: 'A', nextReviewDate: '2026-11-06' }),
      note({ id: 'B', nextReviewDate: '2026-11-14' }),
      note({ id: 'C', nextReviewDate: '2026-11-15' }),
      note({ id: 'D', nextReviewDate: '2026-11-01', status: 'مكتملة' }),
      note({ id: 'E', nextReviewDate: '2026-11-01', status: 'مؤرشفة' }),
    ]);

    expect(result.needsReview).toBe(2);
    expect(result.overdueReviews).toBe(1);
    expect(result.reviewDueNotes.map((n) => [n.id, n.daysRemaining, n.isOverdue])).toEqual([
      ['A', -1, true],
      ['B', 7, false],
    ]);
  });

  it('القائمة الفارغة تعيد صفراً ولا تخلق NaN', () => {
    const result = calculateNoteStats([]);
    expect(result.total).toBe(0);
    expect(result.taskCompletionRate).toBe(0);
    expect(result.categoryDistribution).toEqual([]);
    expect(result.recentNotes).toEqual([]);
  });
});

describe('التحليل النصي المساعد', () => {
  it('يستخرج مهمة عاجلة وموعدها وكياناتها من نص مالي', () => {
    const result = smartAnalyzeNoteText('سداد فاتورة صيدلية الشفاء غداً بشكل عاجل. المبلغ 12,500 ريال في 2026-11-08.');

    expect(result.suggestedTitle).toMatch(/^سداد فاتورة صيدلية الشفاء/);
    expect(result.suggestedCategory).toBe('العملاء');
    expect(result.suggestedType).toBe('زيارة');
    expect(result.suggestedPriority).toBe('عالية');
    expect(result.extractedTasks).toEqual([
      expect.objectContaining({
        text: 'سداد فاتورة صيدلية الشفاء غداً بشكل عاجل',
        dueDate: '2026-11-08',
        priority: 'عالية',
      }),
    ]);
    expect(result.extractedEntities.dates).toContain('2026-11-08');
    expect(result.extractedEntities.amounts).toEqual(['12,500 ريال']);
    expect(result.detectedClient).toContain('صيدلية الشفاء');
    expect(result.detectedReminder).toEqual({
      date: '2026-11-08',
      time: '09:00',
      text: result.suggestedTitle,
    });
  });

  it('يفضّل الاجتماع على الكلمات الأخرى ويستخرج الطبيب', () => {
    const result = smartAnalyzeNoteText('محضر اجتماع مع د. أحمد لمناقشة الخطة.');

    expect(result.suggestedCategory).toBe('الاجتماعات');
    expect(result.suggestedType).toBe('اجتماع');
    expect(result.suggestedTags).toEqual(['اجتماع']);
    expect(result.detectedDoctor).toContain('د. أحمد');
  });

  it('الكلمة اليومية في الأحد تعني اليوم إذا كان اليوم أحداً، لا الأحد بعد أسبوع', () => {
    vi.setSystemTime(new Date('2026-11-08T12:00:00.000Z')); // Sunday
    const result = smartAnalyzeNoteText('اتصل بالعميل يوم الأحد.');

    expect(result.extractedTasks[0]).toMatchObject({ dueDate: '2026-11-08' });
  });

  it('لا يعتبر الاسم «متابعة» فعلاً مكلفاً ما لم يكن كلمة فعل مستقلة', () => {
    const result = smartAnalyzeNoteText('تقرير المتابعة الشهري للمبيعات جاهز.');
    expect(result.extractedTasks).toEqual([]);
  });

  it('النص الفارغ يحصل على عنوان افتراضي بلا مهمة أو تذكير', () => {
    const result = smartAnalyzeNoteText('   \n  ');
    expect(result.suggestedTitle).toContain('ملاحظة');
    expect(result.suggestedSummary).toBe('');
    expect(result.extractedTasks).toEqual([]);
    expect(result.detectedReminder).toBeUndefined();
  });

  it('يصنّف بقية المجالات والأولوية المنخفضة', () => {
    expect(smartAnalyzeNoteText('فكرة تطوير ابتكار لاحقا').suggestedType).toBe('فكرة');
    expect(smartAnalyzeNoteText('هناك مشكلة عطل في النظام').suggestedType).toBe('مشكلة');
    expect(smartAnalyzeNoteText('تم اعتماد قرار إداري').suggestedType).toBe('قرار');
    expect(smartAnalyzeNoteText('دراسة بحث مقارنة للبدائل').suggestedType).toBe('بحث');
    expect(smartAnalyzeNoteText('قراءة وقت الفراغ').suggestedPriority).toBe('منخفضة');
  });
});

describe('حواف الإحصاء والتحليل', () => {
  it('يتعامل مع الحقول الاختيارية والقيم المستوردة غير المكتملة بلا انهيار', () => {
    const imported = note({
      id: 'IMPORTED',
      category: '' as never,
      type: '' as never,
      priority: 'غير مصنفة' as never,
      tags: undefined as never,
      createdAt: '2026-11-07 08:00:00',
    });
    const result = calculateNoteStats([imported], [note({ id: 'TRASH-WITHOUT-FLAG' })]);

    expect(result.categoryDistribution).toEqual([{ name: 'عام', count: 1, color: '#6b7280' }]);
    expect(result.typeDistribution).toEqual([{ type: 'عامة', count: 1 }]);
    expect(result.totalNotes).toBe(2);
    expect(result.trashCount).toBe(1);
  });

  it('يلون وسوم المتابعة والقرار ويهمل الوسم الفارغ', () => {
    const result = calculateNoteStats([note({ tags: ['مبيعات', 'متابعة', 'قرار', '   '] })]);
    expect(result.tagsCloud).toEqual(
      expect.arrayContaining([
        { name: 'متابعة', count: 1, color: 'amber' },
        { name: 'قرار', count: 1, color: 'purple' },
      ])
    );
  });

  it.each([
    ['اليوم', '2026-11-07'],
    ['الاثنين', '2026-11-09'],
    ['الثلاثاء', '2026-11-10'],
    ['الأربعاء', '2026-11-11'],
    ['الخميس', '2026-11-12'],
    ['السبت', '2026-11-07'],
  ])('يعين تاريخ المهمة عند ذكر %s', (phrase, dueDate) => {
    const result = smartAnalyzeNoteText(`اتصل بالعميل ${phrase}`);
    expect(result.extractedTasks[0]).toMatchObject({ dueDate, priority: phrase === 'اليوم' ? 'عالية' : 'متوسطة' });
  });

  it('يغطي تحليل الكيانات والفئات المالية والاتصال والتذكير دون مهمة', () => {
    const financial = smartAnalyzeNoteText('فاتورة حساب بقيمة 50 دولار نهاية الشهر والأحد القادم');
    expect(financial.suggestedType).toBe('مالية');
    expect(financial.suggestedTags).toEqual(['مالية', 'متابعة']);
    expect(financial.extractedEntities.dates).toEqual(expect.arrayContaining(['الأحد القادم', 'نهاية الشهر']));
    expect(financial.extractedEntities.amounts).toEqual(['50 دولار']);
    expect(financial.detectedReminder).toEqual({
      date: '2026-11-07',
      time: '09:00',
      text: financial.suggestedTitle,
    });

    const call = smartAnalyzeNoteText('اتصال هاتفي مع عميل جديد');
    expect(call.suggestedType).toBe('اتصال');
  });

  it('لا يكرر مهمة النص نفسه ولا يقبل فعلاً أقصر من وصف مهمة', () => {
    expect(smartAnalyzeNoteText('اتصل بالعميل. اتصل بالعميل.').extractedTasks).toHaveLength(1);
    expect(smartAnalyzeNoteText('سداد').extractedTasks).toEqual([]);
  });

  it('لا يكرر الشخص عند تداخل كلمات التعرف ويعالج الفرع الثاني من أولوية عاجل', () => {
    const result = smartAnalyzeNoteText('دكتورة وجدان عاجل مهم');
    expect(result.extractedEntities.persons.length).toBeGreaterThan(0);
    expect(result.suggestedPriority).toBe('عالية');
  });
});

describe('الترشيح والبحث', () => {
  const notes = [
    note({
      id: 'A',
      title: 'فاتورة يناير',
      content: 'رصيد مستحق',
      category: 'المالية',
      type: 'مالية',
      priority: 'عالية',
      status: 'نشطة',
      folderId: 'finance',
      tags: ['دفع', 'عاجل'],
      isPinned: true,
      isFavorite: true,
      tasks: [{ id: 'T', text: 'سداد', completed: false }],
      attachments: [{ id: 'F', name: 'f.pdf', type: 'pdf', size: 10, uploadedAt: '2026-11-01' }],
      nextReviewDate: '2026-11-10',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
    }),
    note({
      id: 'B',
      title: 'محضر جلسة المبيعات',
      content: 'قرارات حضور',
      category: 'العمل',
      type: 'اجتماع',
      priority: 'منخفضة',
      status: 'مؤرشفة',
      folderId: 'work',
      tags: ['محضر'],
      createdAt: '2026-11-05T10:00:00.000Z',
      updatedAt: '2026-11-07T10:00:00.000Z',
    }),
    note({
      id: 'C',
      title: 'مذكرة محذوفة',
      deletedAt: '2026-11-06T10:00:00.000Z',
      isDeleted: true,
      createdAt: '2026-11-06T10:00:00.000Z',
    }),
  ];

  it('يخفي المحذوف افتراضياً ويعيده في سلة المحذوفات فقط', () => {
    expect(filterNotes(notes, {}).map((n) => n.id)).toEqual(['A', 'B']);
    expect(filterNotes(notes, { isTrashOnly: true }).map((n) => n.id)).toEqual(['C']);
  });

  it('ينفذ السمات والحقول والتواريخ معاً', () => {
    const result = filterNotes(notes, {
      isPinned: true,
      isFavorite: true,
      needsReview: true,
      hasTasks: true,
      hasAttachments: true,
      folderId: 'finance',
      type: 'مالية',
      category: 'المالية',
      priority: 'عالية',
      status: 'نشطة',
      tag: 'دفع',
      tags: ['لا يوجد', 'عاجل'],
      startDate: '2026-11-01',
      endDate: '2026-11-02',
    });
    expect(result.map((n) => n.id)).toEqual(['A']);
  });

  it('يوسع البحث الدلالي للديون والاجتماعات والعملاء والأطباء', () => {
    expect(filterNotes(notes, { search: 'دين' }).map((n) => n.id)).toEqual(['A']);
    expect(filterNotes(notes, { query: 'اجتماع' }).map((n) => n.id)).toEqual(['B']);

    const client = note({ id: 'D', title: 'متابعة صيدلية المركز', linkedDoctorName: 'د. خالد' });
    expect(filterNotes([client], { search: 'عميل' }).map((n) => n.id)).toEqual(['D']);
    expect(filterNotes([client], { search: 'طبيب' }).map((n) => n.id)).toEqual(['D']);
  });

  it('يرتب بالعناوين والتاريخ والتحديث والأولوية في الاتجاهين', () => {
    expect(filterNotes(notes, { sortBy: 'date', sortOrder: 'desc' }).map((n) => n.id)).toEqual(['B', 'A']);
    expect(filterNotes(notes, { sortBy: 'updatedAt', sortOrder: 'asc' }).map((n) => n.id)).toEqual(['A', 'B']);
    expect(filterNotes(notes, { sortBy: 'priority', sortOrder: 'desc' }).map((n) => n.id)).toEqual(['A', 'B']);
    expect(filterNotes(notes, { sortBy: 'title', sortOrder: 'asc' })).toHaveLength(2);
    expect(filterNotes(notes, { sortBy: 'unknown' as never })).toHaveLength(2);
  });

  it('يرفض كل مرشح لا يطابقه ويقبل حد التاريخ المطابق لوقت ISO', () => {
    const plain = note({
      folderId: 'one',
      type: 'عامة',
      category: 'العمل',
      priority: 'متوسطة',
      status: 'نشطة',
      tags: [],
      createdAt: '2026-11-01T23:59:59.000Z',
    });

    expect(filterNotes([plain], { isPinned: true })).toEqual([]);
    expect(filterNotes([note({ ...plain, isPinned: true })], { isPinned: true, isFavorite: true })).toEqual([]);
    expect(filterNotes([plain], { needsReviewOnly: true })).toEqual([]);
    expect(filterNotes([note({ ...plain, nextReviewDate: '2026-11-20' })], { needsReview: true })).toEqual([]);
    expect(filterNotes([plain], { hasTasks: true })).toEqual([]);
    expect(filterNotes([plain], { hasAttachments: true })).toEqual([]);
    expect(filterNotes([plain], { folderId: 'two' })).toEqual([]);
    expect(filterNotes([plain], { type: 'فكرة' })).toEqual([]);
    expect(filterNotes([plain], { category: 'المالية' })).toEqual([]);
    expect(filterNotes([plain], { priority: 'عالية' })).toEqual([]);
    expect(filterNotes([plain], { status: 'مؤرشفة' })).toEqual([]);
    expect(filterNotes([plain], { tag: 'مهم' })).toEqual([]);
    expect(filterNotes([plain], { tags: ['مهم'] })).toEqual([]);
    expect(filterNotes([plain], { startDate: '2026-11-02' })).toEqual([]);
    expect(filterNotes([plain], { endDate: '2026-10-31' })).toEqual([]);
    expect(filterNotes([plain], { endDate: '2026-11-01' }).map((n) => n.id)).toEqual(['NOTE-1001']);
    expect(
      filterNotes([note({ ...plain, tags: undefined as never, tasks: undefined })], { search: 'لا يوجد' })
    ).toEqual([]);

    const legacy = note({
      id: 'LEGACY',
      createdAt: undefined as never,
      updatedAt: undefined as never,
      priority: 'غريبة' as never,
    });
    expect(filterNotes([legacy, plain], { sortBy: 'updatedAt', sortOrder: 'asc' })).toHaveLength(2);
    expect(filterNotes([legacy, plain], { sortBy: 'date', sortOrder: 'asc' })).toHaveLength(2);
    expect(filterNotes([legacy, plain], { sortBy: 'priority', sortOrder: 'asc' })).toHaveLength(2);
    expect(filterNotes([legacy], { startDate: '2026-11-01' })).toEqual([]);
  });
});

describe('تصدير الملاحظات', () => {
  const fullNote = note({
    id: 'NOTE-2001',
    title: 'عنوان، فيه فاصلة "واقتباس"',
    content: 'المحتوى',
    summary: 'ملخص',
    subCategory: 'فرعي',
    linkedCustomerName: 'عميل',
    linkedDoctorName: 'د. طبيب',
    linkedProject: 'مشروع',
    linkedTaskTitle: 'مهمة',
    nextReviewDate: '2026-12-01',
    tags: ['أول', 'ثان'],
    isPinned: true,
    isFavorite: true,
    isQuickNote: true,
    tasks: [{ id: 'T', text: 'مهمة', completed: true }],
    attachments: [{ id: 'A', name: 'a', type: 'txt', size: 1, uploadedAt: '2026-01-01' }],
  });

  it('تصدير Excel يحفظ كل الحقول في 25 عموداً', () => {
    exportNotesToExcel([fullNote], 'x.xlsx');

    expect(xlsx.jsonToSheet).toHaveBeenCalledTimes(1);
    const rows = (xlsx.jsonToSheet.mock.calls as unknown as Array<[Record<string, unknown>[]]>)[0]![0];
    expect(rows[0]).toMatchObject({
      'كود الملاحظة': 'NOTE-2001',
      'العميل المرتبط': 'عميل',
      'عدد المرفقات': 1,
      مثبتة: 'نعم',
    });
    expect(Object.keys(rows[0])).toHaveLength(25);
    expect(xlsx.bookAppendSheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'الملاحظات');
    expect(xlsx.writeFile).toHaveBeenCalledWith(expect.anything(), 'x.xlsx');
  });

  it('تصدير CSV يستخدم مخطط Excel نفسه كي لا يفقد حقول النسخة الاحتياطية', async () => {
    /* العيب: CSV كان يصدّر 9 أعمدة فقط مقابل 25 في Excel، فيفقد الربط والمراجعة
       والمهام والمرفقات عند اختيار المستخدم «CSV». */
    let csv = '';
    vi.stubGlobal(
      'Blob',
      class FakeBlob {
        constructor(parts: string[]) {
          csv = parts.join('');
        }
      }
    );

    exportNotesToCSV([fullNote], 'x.csv');

    const [headers, row] = csv.replace(/^\uFEFF/, '').split('\n');
    expect(headers.split(',')).toHaveLength(25);
    expect(headers).toContain('العميل المرتبط');
    expect(headers).toContain('تاريخ المراجعة القادمة');
    expect(row).toContain('عميل');
    expect(clickedDownloads[0].getAttribute('download')).toBe('x.csv');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:notes-test');
  });

  it('يصدر JSON وMarkdown وText باسم تنزيل آمن ومحتوى الملاحظة', async () => {
    exportNotesToJSON([fullNote], 'backup.json');
    expect(clickedDownloads[0].getAttribute('download')).toBe('backup.json');
    expect(clickedDownloads[0].getAttribute('href')).toContain(encodeURIComponent('NOTE-2001'));

    exportNoteToMarkdown(fullNote);
    exportNoteToText(fullNote);
    expect(clickedDownloads.map((a) => a.getAttribute('download'))).toEqual([
      'backup.json',
      'NOTE-2001_عنوان، فيه فاصلة "واقتباس.md',
      'NOTE-2001_عنوان، فيه فاصلة "وا.txt',
    ]);
  });

  it('التصدير النصي يعمل أيضاً للملاحظة الخفيفة بلا حقول اختيارية', () => {
    const sparse = note({
      tags: undefined as never,
      summary: undefined,
      subCategory: undefined,
      linkedCustomerName: undefined,
      linkedDoctorName: undefined,
      linkedProject: undefined,
      linkedTaskTitle: undefined,
      nextReviewDate: undefined,
      tasks: undefined,
      attachments: undefined,
    });
    exportNotesToExcel([sparse], 'sparse.xlsx');
    exportNotesToCSV([sparse], 'sparse.csv');
    exportNoteToMarkdown(sparse);
    exportNoteToMarkdown(note({ tasks: [{ id: 'with-date', text: 'مهمة', completed: false, dueDate: '2026-12-01' }] }));
    exportNoteToText(sparse);
    exportNoteToText(note({ tasks: [{ id: 'not-done', text: 'مهمة معلقة', completed: false }] }));
    expect(clickedDownloads).toHaveLength(5);
  });
});
