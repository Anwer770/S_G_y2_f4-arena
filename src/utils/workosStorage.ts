import {
  Workspace,
  WorkProject,
  WorkTask,
  InboxItem,
  DailyRoutineBlock,
  DailyReviewRecord,
  HabitItem,
  GoalItem,
  AppointmentItem,
  WorkCommitment,
  WorkMeeting,
  WorkNote,
  TeamMember,
  AutomationRule,
  WorkActivityLog,
  WorkOSData,
} from '../types/workos';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import { dbStorage } from '../database/dbStorage';

// Storage keys
const STORAGE_PREFIX = 'workos_v1_';
const KEYS = {
  WORKSPACES: `${STORAGE_PREFIX}workspaces`,
  CURRENT_WORKSPACE: `${STORAGE_PREFIX}current_workspace`,
  PROJECTS: `${STORAGE_PREFIX}projects`,
  TASKS: `${STORAGE_PREFIX}tasks`,
  INBOX: `${STORAGE_PREFIX}inbox`,
  ROUTINES: `${STORAGE_PREFIX}routines`,
  REVIEWS: `${STORAGE_PREFIX}reviews`,
  HABITS: `${STORAGE_PREFIX}habits`,
  GOALS: `${STORAGE_PREFIX}goals`,
  APPOINTMENTS: `${STORAGE_PREFIX}appointments`,
  COMMITMENTS: `${STORAGE_PREFIX}commitments`,
  MEETINGS: `${STORAGE_PREFIX}meetings`,
  NOTES: `${STORAGE_PREFIX}notes`,
  TEAM: `${STORAGE_PREFIX}team`,
  AUTOMATIONS: `${STORAGE_PREFIX}automations`,
  ACTIVITY: `${STORAGE_PREFIX}activity`,
  ACTIVE_TIMER: `${STORAGE_PREFIX}active_timer`,
};

// Seed Workspaces
const SEED_WORKSPACES: Workspace[] = [
  {
    id: 'ws_main',
    name: 'مجموعة برايمو كوزمتكس',
    type: 'work',
    color: 'teal',
    icon: 'Briefcase',
    isDefault: true,
  },
  {
    id: 'ws_personal',
    name: 'مساحة العمل الشخصية والتطوير',
    type: 'personal',
    color: 'purple',
    icon: 'User',
  },
  {
    id: 'ws_expansion',
    name: 'مشروع التوسع والفروع الإقليمية',
    type: 'client',
    color: 'amber',
    icon: 'Building',
  },
];

// Seed Team Members
const SEED_TEAM: TeamMember[] = [
  {
    id: 'mem_1',
    name: 'م. يحيى الشامي',
    role: 'المدير التنفيذي ومدير العمليات',
    department: 'الإدارة العليا',
    email: 'ceo@primocosmetics.ye',
    phone: '777123456',
    avatarColor: 'bg-teal-600',
    capacityHoursPerWeek: 45,
    activeTasksCount: 4,
  },
  {
    id: 'mem_2',
    name: 'أحمد نبيل المحاسبي',
    role: 'المحاسب العام ورئيس قسم الحسابات',
    department: 'المالية والحسابات',
    email: 'finance@primocosmetics.ye',
    phone: '771234567',
    avatarColor: 'bg-emerald-600',
    capacityHoursPerWeek: 40,
    activeTasksCount: 5,
  },
  {
    id: 'mem_3',
    name: 'د. سامي الميداني',
    role: 'مشرف الدعاية والمشرف العلمي الطبي',
    department: 'التسويق والمبيعات الطبية',
    email: 'med.rep@primocosmetics.ye',
    phone: '773456789',
    avatarColor: 'bg-blue-600',
    capacityHoursPerWeek: 40,
    activeTasksCount: 3,
  },
  {
    id: 'mem_4',
    name: 'خالد أمين المخزن',
    role: 'أمين المستودع الرئيسي وحركات الصرف',
    department: 'المستودعات واللوجستيات',
    email: 'stock@primocosmetics.ye',
    phone: '775678901',
    avatarColor: 'bg-amber-600',
    capacityHoursPerWeek: 42,
    activeTasksCount: 2,
  },
  {
    id: 'mem_5',
    name: 'رنا التسويقية',
    role: 'مسؤولة الحملات الرقمية والعلاقات العامة',
    department: 'التسويق والإعلام',
    email: 'marketing@primocosmetics.ye',
    phone: '779012345',
    avatarColor: 'bg-rose-600',
    capacityHoursPerWeek: 38,
    activeTasksCount: 3,
  },
];

// Seed Projects
const SEED_PROJECTS: WorkProject[] = [
  {
    id: 'prj_1',
    code: 'PRJ-EXP-01',
    name: 'إطلاق خط مستحضرات العناية الطبيعية Q3',
    description: 'خطة التسويق، الاستيراد، اعتمادات العينات المجانية وجلسات العرض للأطباء والصيدليات الكبرى',
    manager: 'م. يحيى الشامي',
    members: ['mem_1', 'mem_3', 'mem_5'],
    startDate: '2026-09-01',
    dueDate: '2026-10-15',
    status: 'active',
    priority: 'high',
    progress: 68,
    budget: 8500000,
    category: 'إطلاق وتوسيع',
    tags: ['تسويق', 'استيراد', 'منتج جديد'],
    workspaceId: 'ws_main',
    notesCount: 4,
    filesCount: 6,
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'prj_2',
    code: 'PRJ-FIN-02',
    name: 'إغلاق الربع الثالث والمطابقة البنكية الشاملة',
    description: 'تسوية حسابات كبار العملاء، متابعة ديون كاك بنك والعميد، وأرشفة السجلات الضريبية',
    manager: 'أحمد نبيل المحاسبي',
    members: ['mem_1', 'mem_2'],
    startDate: '2026-09-10',
    dueDate: '2026-09-30',
    status: 'active',
    priority: 'urgent',
    progress: 45,
    budget: 450000,
    category: 'مالية وحسابات',
    tags: ['مطابقة', 'سندات', 'إغلاق مالي'],
    workspaceId: 'ws_main',
    notesCount: 8,
    filesCount: 12,
    createdAt: '2026-09-10T09:30:00Z',
  },
  {
    id: 'prj_3',
    code: 'PRJ-LOG-03',
    name: 'تحديث نظام الباركود والجرد الدوري للمخزن',
    description: 'حصر الأصناف، مطابقة رصيد المستودع الفعلي مع دفتر صرف وتوريد، وضبط حدود الأمان',
    manager: 'خالد أمين المخزن',
    members: ['mem_2', 'mem_4'],
    startDate: '2026-09-05',
    dueDate: '2026-09-25',
    status: 'active',
    priority: 'medium',
    progress: 80,
    budget: 320000,
    category: 'لوجستيات ومخزون',
    tags: ['جرد', 'مخزن', 'باركود'],
    workspaceId: 'ws_main',
    notesCount: 3,
    filesCount: 4,
    createdAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'prj_4',
    code: 'PRJ-DEV-04',
    name: 'تطوير الموقع التعريفي والبوابة الإلكترونية B2B',
    description: 'تمكين المراكز الطبية والصيدليات من طلب وتتبع الكميات وتأكيد الحوالات مباشرة',
    manager: 'رنا التسويقية',
    members: ['mem_1', 'mem_5'],
    startDate: '2026-08-15',
    dueDate: '2026-11-01',
    status: 'planned',
    priority: 'medium',
    progress: 25,
    budget: 1800000,
    category: 'تطوير تقني',
    tags: ['منصة إلكترونية', 'B2B', 'أتمتة'],
    workspaceId: 'ws_main',
    notesCount: 5,
    filesCount: 2,
    createdAt: '2026-08-15T11:00:00Z',
  },
];

// Seed Tasks
const SEED_TASKS: WorkTask[] = [
  {
    id: 'tsk_101',
    taskNumber: 'TSK-101',
    title: 'مراجعة ومطابقة كشف حساب صيدلية النور والرواد لشهر سبتمبر',
    description: 'التواصل مع المدير المالي لصيدلية النور، تدقيق مبالغ التحصيلات المسلمة للمندوب وتأكيد استلام السندات الأصلية.',
    status: 'in_progress',
    priority: 'urgent',
    projectId: 'prj_2',
    category: 'مالية',
    tags: ['تحصيل', 'مطابقة', 'صيدليات'],
    assigneeId: 'mem_2',
    participants: ['mem_1'],
    creator: 'م. يحيى الشامي',
    startDate: '2026-09-14',
    dueDate: '2026-09-16',
    startTime: '09:00',
    dueTime: '13:00',
    estimatedHours: 4,
    actualHours: 2.5,
    progress: 60,
    dependencies: [],
    subtasks: [
      { id: 'sub_1', title: 'سحب كشف الحساب من المنظومة المحاسبية', completed: true, dueDate: '2026-09-14' },
      { id: 'sub_2', title: 'التواصل مع صيدلية النور لمطابقة الرصيد YER', completed: true, dueDate: '2026-09-15' },
      { id: 'sub_3', title: 'إرسال سند القبض المعتمد للمدير المالي', completed: false, dueDate: '2026-09-16' },
    ],
    checklist: [
      { id: 'chk_1', text: 'التأكد من توقيع المحاسب الميداني', completed: true },
      { id: 'chk_2', text: 'إرفاق إشعار تحويل الكريمي أو كاك بنك', completed: false },
      { id: 'chk_3', text: 'تحديث الرصيد في دليل العملاء', completed: false },
    ],
    comments: [
      {
        id: 'com_1',
        author: 'أحمد نبيل المحاسبي',
        text: 'تم الاتصال بالمحاسب وأكد إرسال الإشعار بعد الظهر.',
        createdAt: '2026-09-15T10:15:00Z',
      },
    ],
    timeEntries: [
      {
        id: 'te_1',
        startedAt: '2026-09-15T09:00:00Z',
        endedAt: '2026-09-15T11:30:00Z',
        durationMinutes: 150,
        note: 'تدقيق القيود المسجلة ومطابقة الفواتير السابقة',
      },
    ],
    customerRef: 'صيدلية النور النموذجية',
    workspaceId: 'ws_main',
    createdAt: '2026-09-14T08:00:00Z',
    updatedAt: '2026-09-15T10:15:00Z',
  },
  {
    id: 'tsk_102',
    taskNumber: 'TSK-102',
    title: 'توزيع دفعة العينات المجانية الجديدة لأطباء الجلدية والتجميل',
    description: 'تسليم البوكس التعريفي لـ 15 عيادة جلدية في خط سير حدة والزبيري مع توثيق ملاحظات الأطباء الأولية.',
    status: 'ready',
    priority: 'high',
    projectId: 'prj_1',
    category: 'دعاية طبية',
    tags: ['أطباء', 'عينات', 'زيارات ميدانية'],
    assigneeId: 'mem_3',
    participants: ['mem_1'],
    creator: 'م. يحيى الشامي',
    startDate: '2026-09-16',
    dueDate: '2026-09-18',
    startTime: '10:00',
    dueTime: '15:00',
    estimatedHours: 8,
    actualHours: 0,
    progress: 20,
    dependencies: [],
    subtasks: [
      { id: 'sub_4', title: 'استلام 45 باكج عينات من أمين المخزن بسند صرف رسمي', completed: true },
      { id: 'sub_5', title: 'زيارة عيادات د. أمل ود. شريف ود. ماجد', completed: false },
      { id: 'sub_6', title: 'توثيق تقرير الزيارة في دليل الأطباء', completed: false },
    ],
    checklist: [
      { id: 'chk_4', text: 'كتالوج المنتجات وبروشور التركيب العلمي', completed: true },
      { id: 'chk_5', text: 'سند استلام عينات موقع من الطبيب', completed: false },
    ],
    comments: [],
    timeEntries: [],
    customerRef: 'عيادة د. أمل التخصصية',
    workspaceId: 'ws_main',
    createdAt: '2026-09-15T09:00:00Z',
    updatedAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'tsk_103',
    taskNumber: 'TSK-103',
    title: 'جرد أصناف السيروم وكريمات الحماية وتحديد نواقص التوريد',
    description: 'فحص الكميات الفيزيائية في المستودع المركزي ومقارنتها مع الدفتر الإلكتروني لاكتشاف أي فوارق.',
    status: 'in_progress',
    priority: 'medium',
    projectId: 'prj_3',
    category: 'مخزون',
    tags: ['جرد', 'مستودع'],
    assigneeId: 'mem_4',
    participants: ['mem_2'],
    creator: 'خالد أمين المخزن',
    startDate: '2026-09-15',
    dueDate: '2026-09-17',
    startTime: '08:30',
    dueTime: '14:00',
    estimatedHours: 6,
    actualHours: 3,
    progress: 50,
    dependencies: [],
    subtasks: [
      { id: 'sub_7', title: 'حصر رفوف السيرومات ومطابقة الباركود', completed: true },
      { id: 'sub_8', title: 'إعداد قائمة الأصناف التي قاربت على النفاد', completed: false },
    ],
    checklist: [
      { id: 'chk_6', text: 'فحص تواريخ الصلاحية وتجنب التلف', completed: true },
      { id: 'chk_7', text: 'رفع طلب توريد جديد للمشتريات', completed: false },
    ],
    comments: [],
    timeEntries: [],
    workspaceId: 'ws_main',
    createdAt: '2026-09-14T11:00:00Z',
    updatedAt: '2026-09-15T11:00:00Z',
  },
  {
    id: 'tsk_104',
    taskNumber: 'TSK-104',
    title: 'إعداد تصاميم ومحتوى إعلانات السوشيال ميديا للموسم الخريفي',
    description: 'تجهيز 8 تصاميم احترافية وفيديوهات ريلز لشرح مزايا مجموعة تفتيح البشرة وفيتامين سي.',
    status: 'review',
    priority: 'medium',
    projectId: 'prj_1',
    category: 'تسويق',
    tags: ['سوشيال ميديا', 'تصميم', 'حملة'],
    assigneeId: 'mem_5',
    participants: ['mem_1'],
    creator: 'رنا التسويقية',
    startDate: '2026-09-12',
    dueDate: '2026-09-16',
    startTime: '11:00',
    dueTime: '16:00',
    estimatedHours: 10,
    actualHours: 9,
    progress: 90,
    dependencies: [],
    subtasks: [
      { id: 'sub_9', title: 'صياغة النصوص الإعلانية (Copywriting)', completed: true },
      { id: 'sub_10', title: 'مراجعة الأسعار والعروض الترويجية مع الإدارة', completed: true },
      { id: 'sub_11', title: 'جدولة المنشورات على فيسبوك وإنستغرام', completed: false },
    ],
    checklist: [
      { id: 'chk_8', text: 'التأكد من دقة أرقام الواتساب وروابط الطلب', completed: true },
      { id: 'chk_9', text: 'مراجعة الهوية البصرية وشعار برايمو', completed: true },
    ],
    comments: [],
    timeEntries: [],
    workspaceId: 'ws_main',
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-15T12:00:00Z',
  },
  {
    id: 'tsk_105',
    taskNumber: 'TSK-105',
    title: 'تجهيز عقد اتفاقية التوزيع الحصري لمحافظة تعز وإب',
    description: 'مراجعة الشروط الجزائية، خطة السداد ربع السنوية، والحد الأدنى للطلبيات مع الشريك المعتمد.',
    status: 'completed',
    priority: 'high',
    projectId: 'prj_1',
    category: 'عقود وقانونية',
    tags: ['عقود', 'توزيع'],
    assigneeId: 'mem_1',
    participants: ['mem_2'],
    creator: 'م. يحيى الشامي',
    startDate: '2026-09-08',
    dueDate: '2026-09-13',
    startTime: '10:00',
    dueTime: '14:00',
    estimatedHours: 5,
    actualHours: 4.5,
    progress: 100,
    dependencies: [],
    subtasks: [
      { id: 'sub_12', title: 'صياغة مسودة العقد التجارية', completed: true },
      { id: 'sub_13', title: 'اعتماد الضمانات المالية والشيكات', completed: true },
      { id: 'sub_14', title: 'التوقيع والختم الرسمي وتبادل النسخ', completed: true },
    ],
    checklist: [],
    comments: [],
    timeEntries: [],
    workspaceId: 'ws_main',
    createdAt: '2026-09-08T08:00:00Z',
    updatedAt: '2026-09-13T16:00:00Z',
    completedAt: '2026-09-13T16:00:00Z',
  },
];

// Seed Inbox
const SEED_INBOX: InboxItem[] = [
  {
    id: 'inb_1',
    rawText: 'تجديد تصريح وزارة الصحة للشحنة القادمة من ميناء الحديدة قبل نهاية الشهر',
    extractedTitle: 'تجديد تصريح وزارة الصحة للشحنة القادمة',
    category: 'إجراءات قانونية',
    suggestedAction: 'task',
    createdAt: '2026-09-15T09:30:00Z',
    isProcessed: false,
  },
  {
    id: 'inb_2',
    rawText: 'فكرة: تخصيص كود خصم 10% لكل صيدلية تطلب كميات فوق 500 ألف ريال نقداً',
    extractedTitle: 'خصم نقدي 10% للطلبيات الكبيرة',
    category: 'مبيعات وتسويق',
    suggestedAction: 'note',
    createdAt: '2026-09-15T11:45:00Z',
    isProcessed: false,
  },
  {
    id: 'inb_3',
    rawText: 'الاتصال بالدكتور هشام استشاري الجلدية بمركز الأمل لترتيب محاضرة تعريفية الخميس القادم',
    extractedTitle: 'ترتيب محاضرة علمية مع د. هشام',
    category: 'علاقات طبية',
    suggestedAction: 'appointment',
    createdAt: '2026-09-15T14:10:00Z',
    isProcessed: false,
  },
];

// Seed Daily Routine
const SEED_ROUTINE: DailyRoutineBlock[] = [
  {
    id: 'rt_1',
    timeSlot: '07:30 - 08:30',
    title: 'تخطيط اليوم ومراجعة مؤشرات الأداء',
    plannedActivity: 'فتح لوحة التحكم، فحص الإشعارات، تحديد 3 مهام أساسية ذات أولوية عليا وجدولة المواعيد',
    category: 'planning',
    status: 'completed',
    notes: 'تم تحديد مهام المطابقة ومتابعة صيدلية النور',
  },
  {
    id: 'rt_2',
    timeSlot: '08:30 - 10:30',
    title: 'العمل العميق: مراجعة المالية والتحصيلات',
    plannedActivity: 'مطابقة قيود السجل المالي، مراجعة سندات الصرف، ومتابعة جدول الأقساط المستحقة',
    category: 'work',
    status: 'completed',
  },
  {
    id: 'rt_3',
    timeSlot: '10:30 - 12:30',
    title: 'متابعة المبيعات الميدانية والمخزن',
    plannedActivity: 'مراجعة أمين المخزن، التحقق من فواتير التوريد، ومتابعة تقارير زيارات المندوبين',
    category: 'work',
    status: 'completed',
  },
  {
    id: 'rt_4',
    timeSlot: '13:00 - 14:00',
    title: 'اجتماع التنسيق والمراجعة الدورية',
    plannedActivity: 'لقاء سريع مع الفريق لتفكيك أي عقبات ومزامنة أولويات اليوم',
    category: 'work',
    status: 'planned',
  },
  {
    id: 'rt_5',
    timeSlot: '16:00 - 17:00',
    title: 'مراجعة نهاية اليوم (Daily Review)',
    plannedActivity: 'حصر المنجز، ترحيل المؤجل للغد، وتدوين ملاحظات التعلم والتحسين',
    category: 'review',
    status: 'planned',
  },
];

// Seed Habits
const SEED_HABITS: HabitItem[] = [
  {
    id: 'hbt_1',
    name: 'المطابقة والتدقيق المالي اليومي',
    category: 'انضباط مهني',
    frequency: 'weekdays',
    targetDaysPerWeek: 5,
    streak: 14,
    bestStreak: 28,
    completedDates: ['2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15'],
    reminderTime: '08:30',
    notes: 'يضمن صفر أخطاء أو معلقات محاسبية بنهاية كل يوم',
  },
  {
    id: 'hbt_2',
    name: 'توثيق زيارات العملاء والأطباء فور إتمامها',
    category: 'علاقات وعمليات',
    frequency: 'weekdays',
    targetDaysPerWeek: 5,
    streak: 9,
    bestStreak: 18,
    completedDates: ['2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15'],
    reminderTime: '14:00',
    notes: 'تسجيل الملاحظات وسندات الاستلام فور مغادرة العيادة أو الصيدلية',
  },
  {
    id: 'hbt_3',
    name: 'قراءة نصف ساعة في إدارة الأعمال والتسويق',
    category: 'تطوير ذاتي',
    frequency: 'daily',
    targetDaysPerWeek: 7,
    streak: 21,
    bestStreak: 35,
    completedDates: ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15'],
    reminderTime: '20:30',
  },
];

// Seed Goals
const SEED_GOALS: GoalItem[] = [
  {
    id: 'gol_1',
    title: 'رفع إجمالي المبيعات والتحصيلات الربعية بنسبة 35%',
    category: 'نمو مالي',
    targetDate: '2026-12-31',
    progress: 72,
    status: 'on_track',
    visionDescription: 'الوصول إلى تغطية شاملة لـ 120 نقطة بيع صيدلانية ومراكز تجميل في صنعاء والمحافظات المجاورة.',
    objectives: [
      { id: 'obj_1', title: 'إضافة 25 صيدلية كبرى جديدة لقائمة العملاء النشطين', progress: 80, linkedProjectId: 'prj_1' },
      { id: 'obj_2', title: 'تخفيض الديون المتأخرة فوق 60 يوماً بنسبة 50%', progress: 65, linkedProjectId: 'prj_2' },
      { id: 'obj_3', title: 'تفعيل نظام الحوافز والعمولات للمندوبين الميدانيين', progress: 70 },
    ],
  },
  {
    id: 'gol_2',
    title: 'أتمتة العمليات اللوجستية والمخزنية بنسبة 100%',
    category: 'كفاءة تشغيلية',
    targetDate: '2026-11-30',
    progress: 58,
    status: 'on_track',
    visionDescription: 'الاستغناء الكامل عن الأوراق، وربط حركات الصرف والتوريد مباشرة بالسجل المحاسبي.',
    objectives: [
      { id: 'obj_4', title: 'تطبيق الباركود على كافة العبوات والكراتين', progress: 85, linkedProjectId: 'prj_3' },
      { id: 'obj_5', title: 'تدريب أمناء المخازن على التطبيق السحابي', progress: 50 },
    ],
  },
];

// Seed Appointments
const SEED_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'apt_1',
    title: 'اجتماع مع مدير المشتريات بمستشفى جامعة العلوم',
    person: 'أ. عبد الرحمن الهاملي',
    location: 'مكتب الإدارة العامة - مبنى المستشفى',
    date: '2026-09-16',
    time: '11:00',
    durationMinutes: 45,
    attendees: ['م. يحيى الشامي', 'د. سامي الميداني'],
    notes: 'عرض كراسة المواصفات الخاصة بمطهرات ومستحضرات العناية التخصصية وتقديم أسعار المناقصة.',
    status: 'scheduled',
    linkedTaskId: 'tsk_102',
  },
  {
    id: 'apt_2',
    title: 'جلسة عمل مع مدقق الحسابات الخارجي',
    person: 'أ. طه الصلوي - مكتب المحاسبين المتحدون',
    location: 'مقر شركة برايمو - قاعة الاجتماعات',
    date: '2026-09-17',
    time: '10:00',
    durationMinutes: 90,
    attendees: ['م. يحيى الشامي', 'أحمد نبيل المحاسبي'],
    notes: 'مراجعة الميزانية النصف سنوية والتحقق من التسويات الضريبية وحسابات البنوك.',
    status: 'scheduled',
  },
];

// Seed Commitments
const SEED_COMMITMENTS: WorkCommitment[] = [
  {
    id: 'cmt_1',
    title: 'تسليم طلبيات صيدليات تهامة الخاصة بعروض العيد',
    entity: 'مجموعة صيدليات تهامة المركزية',
    person: 'د. وليد القدسي',
    description: 'تجهيز 80 كرتون سيروم وكريم ترطيب وشحنها عبر نقليات المزن مع الفواتير الضريبية المعمدة.',
    commitmentDate: '2026-09-10',
    dueDate: '2026-09-18',
    status: 'in_progress',
    importance: 'A',
    notes: 'تم استلام دفعة 50% نقداً والمتبقي عند وصول البضاعة.',
    amount: 1450000,
    currency: 'YER',
  },
  {
    id: 'cmt_2',
    title: 'سداد قسط الحاوية المبردة المستوردة لصالح شركة الشحن',
    entity: 'شركة الشرق الأوسط للملاحة والتخليص',
    person: 'الكابتن رياض العزي',
    description: 'سداد القسط الثاني مقابل بوليصة الشحن البحري عبر حوالة مصرفية من كاك بنك.',
    commitmentDate: '2026-09-01',
    dueDate: '2026-09-20',
    status: 'pending',
    importance: 'A',
    notes: 'معمد من المدير التنفيذي ومدرج ضمن التدفقات النقدية للأسبوع الجاري.',
    amount: 3200,
    currency: 'USD',
  },
];

// Seed Meetings
const SEED_MEETINGS: WorkMeeting[] = [
  {
    id: 'mtg_1',
    title: 'الاجتماع الدوري لإدارة المبيعات والتسويق',
    date: '2026-09-14',
    time: '14:00',
    attendees: ['م. يحيى الشامي', 'أحمد نبيل المحاسبي', 'د. سامي الميداني', 'رنا التسويقية'],
    agenda: [
      'مراجعة نتائج الحملة الترويجية لمنتجات الصيف',
      'مناقشة تقارير تغطية الأطباء ونسبة العينات المسلمة',
      'تحديد الأسعار التنافسية للأصناف الجديدة القادمة',
    ],
    decisions: [
      'اعتماد ميزانية 300,000 ريال للحملة الرقمية الجديدة',
      'إلزام المندوبين بتسليم تقرير الزيارات يومياً قبل الساعة 5 مساءً',
      'منح صيدليات الجملة خصم 5% إضافي عند السداد الفوري',
    ],
    actionItems: [
      {
        id: 'act_1',
        title: 'صياغة العروض وإرسالها لصيدليات الجملة',
        assignee: 'رنا التسويقية',
        dueDate: '2026-09-16',
        completed: true,
      },
      {
        id: 'act_2',
        title: 'تحديث سجلات العينات في المخزن',
        assignee: 'خالد أمين المخزن',
        dueDate: '2026-09-17',
        completed: false,
      },
    ],
    notes: 'الاجتماع كان إيجابياً ومثمر وتم الاتفاق على رفع وتيرة الزيارات الميدانية.',
    projectId: 'prj_1',
  },
];

// Seed Notes
const SEED_NOTES: WorkNote[] = [
  {
    id: 'not_1',
    title: 'سياسة التحصيل ومنح الآجل لعملاء الصيدليات 2026',
    content: `المعايير المعتمدة للبيع الآجل:
1. الحد الائتماني الأقصى للعميل العادي: 500,000 ريال يمني.
2. سقف فترة السداد: 30 يوماً من تاريخ الفاتورة.
3. يمنع صرف طلبيات جديدة لأي عميل لديه فاتورة متأخرة تجاوزت 45 يوماً دون موافقة خطية من المدير التنفيذي.
4. يمنح خصم تعجيل دفع 3% عند السداد خلال 7 أيام من التوريد.`,
    type: 'instruction',
    tags: ['سياسات', 'تحصيل', 'ائتمان'],
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z',
    isPinned: true,
  },
  {
    id: 'not_2',
    title: 'قائمة بأهم الملاحظات الواردة من أطباء التجميل على تركيبة السيروم',
    content: `أبرز تعليقات الأطباء (د. سامي، د. أمل، د. رياض):
- قوام السيروم ممتاز وسريع الامتصاص على البشرة.
- يفضل توفير عبوة اقتصادية 50 مل للعيادات لاستخدامها في جلسات الديرما بن.
- التغليف الخارجي أنيق ويلقى قبولاً ممتازاً مقارنة بالمنتجات المستوردة باهظة الثمن.`,
    type: 'project',
    tags: ['ملاحظات طبية', 'منتج', 'تطوير'],
    linkedProjectId: 'prj_1',
    createdAt: '2026-09-12T11:20:00Z',
    updatedAt: '2026-09-14T15:00:00Z',
    isPinned: false,
  },
];

// Seed Automations
const SEED_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'aut_1',
    name: 'تنبيه فوري عند تأخر موعد تسليم المهمة',
    description: 'عند تجاوز تاريخ استحقاق المهمة وهي غير مكتملة، يتم إرسال إشعار للمسؤول ومدير المشروع وتلوينها بالأحمر.',
    triggerEvent: 'task_overdue',
    actionType: 'notify_team',
    isActive: true,
    executionsCount: 12,
    lastExecutedAt: '2026-09-15T08:00:00Z',
  },
  {
    id: 'aut_2',
    name: 'إكمال المهمة التلقائي عند إنجاز 100% من المهام الفرعية',
    description: 'عند وضع علامة صح على جميع Subtasks وChecklist، يتم اقتراح وضع المهمة كـ "جاهزة للمراجعة" أو "مكتملة".',
    triggerEvent: 'all_subtasks_completed',
    actionType: 'create_followup_task',
    isActive: true,
    executionsCount: 29,
    lastExecutedAt: '2026-09-14T16:30:00Z',
  },
  {
    id: 'aut_3',
    name: 'أرشفة المشاريع وإغلاقها عند وصول الإنجاز إلى 100%',
    description: 'عند اكتمال كافة مهام المشروع وبلوغ نسبة 100% يتم إشعار الإدارة لاقتراح الإغلاق والأرشفة وحفظ التقارير.',
    triggerEvent: 'project_100_percent',
    actionType: 'mark_project_completed',
    isActive: true,
    executionsCount: 4,
    lastExecutedAt: '2026-09-10T12:00:00Z',
  },
];

// Seed Activity
const SEED_ACTIVITY: WorkActivityLog[] = [
  {
    id: 'act_log_1',
    timestamp: '2026-09-15T12:15:00Z',
    user: 'م. يحيى الشامي',
    action: 'تحديث حالة',
    entity: 'مهمة',
    entityTitle: 'إعداد تصاميم ومحتوى إعلانات السوشيال ميديا',
    oldValue: 'قيد التنفيذ',
    newValue: 'تحتاج مراجعة',
  },
  {
    id: 'act_log_2',
    timestamp: '2026-09-15T10:00:00Z',
    user: 'أحمد نبيل المحاسبي',
    action: 'تسجيل وقت عمل',
    entity: 'مهمة',
    entityTitle: 'مراجعة ومطابقة كشف حساب صيدلية النور',
    oldValue: '0 ساعة',
    newValue: '2.5 ساعة عمل',
  },
  {
    id: 'act_log_3',
    timestamp: '2026-09-14T17:30:00Z',
    user: 'م. يحيى الشامي',
    action: 'إنجاز مهمة',
    entity: 'مهمة',
    entityTitle: 'تجهيز عقد اتفاقية التوزيع الحصري لمحافظة تعز',
    oldValue: 'قيد التنفيذ',
    newValue: 'مكتملة بنجاح',
  },
];

// ----------------------------------------------------------------------------
// SAFE LOCAL STORAGE LOADERS & SAVERS
// ----------------------------------------------------------------------------
function loadSafe<T>(key: string, fallback: T): T {
  try {
    const raw = dbStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') return fallback;
    try {
      const parsed = JSON.parse(raw);
      if (parsed === null || parsed === undefined) return fallback;
      return parsed;
    } catch {
      // If parsing fails (e.g. key was stored as an unquoted string like 'ws_main')
      if (typeof fallback === 'string') {
        // Normalize in storage for clean future reads
        try {
          dbStorage.setItem(key, JSON.stringify(raw));
        } catch {}
        return raw as unknown as T;
      }
      return fallback;
    }
  } catch {
    return fallback;
  }
}

function saveSafe<T>(key: string, data: T): void {
  try {
    dbStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

// Workspaces
export function loadWorkspaces(): Workspace[] {
  const loaded = loadSafe<Workspace[]>(KEYS.WORKSPACES, SEED_WORKSPACES);
  return Array.isArray(loaded) ? loaded : SEED_WORKSPACES;
}
export function saveWorkspaces(data: Workspace[]): void {
  saveSafe(KEYS.WORKSPACES, data);
}

export function loadCurrentWorkspaceId(): string {
  return loadSafe<string>(KEYS.CURRENT_WORKSPACE, 'ws_main') || 'ws_main';
}
export function saveCurrentWorkspaceId(id: string): void {
  saveSafe(KEYS.CURRENT_WORKSPACE, id);
}

// Projects
export function loadProjects(): WorkProject[] {
  const loaded = loadSafe<WorkProject[]>(KEYS.PROJECTS, SEED_PROJECTS);
  return Array.isArray(loaded) ? loaded : SEED_PROJECTS;
}
export function saveProjects(data: WorkProject[]): void {
  saveSafe(KEYS.PROJECTS, data);
}

// Tasks
export function loadTasks(): WorkTask[] {
  const loaded = loadSafe<WorkTask[]>(KEYS.TASKS, SEED_TASKS);
  const list = Array.isArray(loaded) ? loaded : SEED_TASKS;
  return list.map((t) => ({
    ...t,
    subtasks: Array.isArray(t?.subtasks) ? t.subtasks : [],
    checklist: Array.isArray(t?.checklist) ? t.checklist : [],
    comments: Array.isArray(t?.comments) ? t.comments : [],
    tags: Array.isArray(t?.tags) ? t.tags : [],
    dependencies: Array.isArray(t?.dependencies) ? t.dependencies : [],
  }));
}
export function saveTasks(data: WorkTask[]): void {
  saveSafe(KEYS.TASKS, data);
}

// Inbox
export function loadInbox(): InboxItem[] {
  const loaded = loadSafe<InboxItem[]>(KEYS.INBOX, SEED_INBOX);
  return Array.isArray(loaded) ? loaded : SEED_INBOX;
}
export function saveInbox(data: InboxItem[]): void {
  saveSafe(KEYS.INBOX, data);
}

// Routines
export function loadRoutine(): DailyRoutineBlock[] {
  return loadSafe<DailyRoutineBlock[]>(KEYS.ROUTINES, SEED_ROUTINE);
}
export function saveRoutine(data: DailyRoutineBlock[]): void {
  saveSafe(KEYS.ROUTINES, data);
}

// Daily Reviews
export function loadDailyReviews(): DailyReviewRecord[] {
  return loadSafe<DailyReviewRecord[]>(KEYS.REVIEWS, []);
}
export function saveDailyReviews(data: DailyReviewRecord[]): void {
  saveSafe(KEYS.REVIEWS, data);
}

// Habits
export function loadHabits(): HabitItem[] {
  return loadSafe<HabitItem[]>(KEYS.HABITS, SEED_HABITS);
}
export function saveHabits(data: HabitItem[]): void {
  saveSafe(KEYS.HABITS, data);
}

// Goals
export function loadGoals(): GoalItem[] {
  return loadSafe<GoalItem[]>(KEYS.GOALS, SEED_GOALS);
}
export function saveGoals(data: GoalItem[]): void {
  saveSafe(KEYS.GOALS, data);
}

// Appointments
export function loadAppointments(): AppointmentItem[] {
  return loadSafe<AppointmentItem[]>(KEYS.APPOINTMENTS, SEED_APPOINTMENTS);
}
export function saveAppointments(data: AppointmentItem[]): void {
  saveSafe(KEYS.APPOINTMENTS, data);
}

// Commitments
export function loadCommitments(): WorkCommitment[] {
  return loadSafe<WorkCommitment[]>(KEYS.COMMITMENTS, SEED_COMMITMENTS);
}
export function saveCommitments(data: WorkCommitment[]): void {
  saveSafe(KEYS.COMMITMENTS, data);
}

// Meetings
export function loadMeetings(): WorkMeeting[] {
  return loadSafe<WorkMeeting[]>(KEYS.MEETINGS, SEED_MEETINGS);
}
export function saveMeetings(data: WorkMeeting[]): void {
  saveSafe(KEYS.MEETINGS, data);
}

// Notes
export function loadNotes(): WorkNote[] {
  return loadSafe<WorkNote[]>(KEYS.NOTES, SEED_NOTES);
}
export function saveNotes(data: WorkNote[]): void {
  saveSafe(KEYS.NOTES, data);
}

// Team
export function loadTeam(): TeamMember[] {
  return loadSafe<TeamMember[]>(KEYS.TEAM, SEED_TEAM);
}
export function saveTeam(data: TeamMember[]): void {
  saveSafe(KEYS.TEAM, data);
}

// Automations
export function loadAutomations(): AutomationRule[] {
  return loadSafe<AutomationRule[]>(KEYS.AUTOMATIONS, SEED_AUTOMATIONS);
}
export function saveAutomations(data: AutomationRule[]): void {
  saveSafe(KEYS.AUTOMATIONS, data);
}

// Activity Log
export function loadActivity(): WorkActivityLog[] {
  return loadSafe<WorkActivityLog[]>(KEYS.ACTIVITY, SEED_ACTIVITY);
}
export function saveActivity(data: WorkActivityLog[]): void {
  saveSafe(KEYS.ACTIVITY, data);
}
export function logWorkActivity(
  user: string,
  action: string,
  entity: string,
  entityTitle: string,
  oldValue?: string,
  newValue?: string
): void {
  const current = loadActivity();
  const newEntry: WorkActivityLog = {
    id: `act_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user,
    action,
    entity,
    entityTitle,
    oldValue,
    newValue,
  };
  saveActivity([newEntry, ...current.slice(0, 199)]);
}

// Active Timer
export interface ActiveTimerState {
  taskId: string;
  taskTitle: string;
  startedAt: string; // ISO string
  elapsedSeconds: number;
  isRunning: boolean;
}

export function loadActiveTimer(): ActiveTimerState | null {
  return loadSafe<ActiveTimerState | null>(KEYS.ACTIVE_TIMER, null);
}
export function saveActiveTimer(timer: ActiveTimerState | null): void {
  saveSafe(KEYS.ACTIVE_TIMER, timer);
}

// ----------------------------------------------------------------------------
// NATURAL LANGUAGE TASK PARSER (عربي ذكي)
// Parses phrases like "اتصل بأحمد غداً الساعة 10 صباحاً لإرسال عرض السعر"
// ----------------------------------------------------------------------------
export interface ParsedTaskResult {
  title: string;
  dueDate: string;
  dueTime: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  relatedAction: string;
}

export function parseNaturalLanguageTask(text: string): ParsedTaskResult {
  const clean = text.trim();
  const today = new Date();
  let targetDate = new Date(today);
  let dueTime = '10:00';
  let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium';
  let category = 'أعمال عامة';

  // Date parsing
  if (clean.includes('غدا') || clean.includes('غداً') || clean.includes('بكرة')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (clean.includes('بعد غد') || clean.includes('بعد غداً')) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (clean.includes('اليوم')) {
    // keep today
  } else if (clean.includes('السبت')) {
    targetDate.setDate(targetDate.getDate() + ((6 - targetDate.getDay() + 7) % 7 || 7));
  } else if (clean.includes('الأحد')) {
    targetDate.setDate(targetDate.getDate() + ((0 - targetDate.getDay() + 7) % 7 || 7));
  } else if (clean.includes('الإثنين') || clean.includes('الاثنين')) {
    targetDate.setDate(targetDate.getDate() + ((1 - targetDate.getDay() + 7) % 7 || 7));
  } else if (clean.includes('الثلاثاء')) {
    targetDate.setDate(targetDate.getDate() + ((2 - targetDate.getDay() + 7) % 7 || 7));
  } else if (clean.includes('الأربعاء')) {
    targetDate.setDate(targetDate.getDate() + ((3 - targetDate.getDay() + 7) % 7 || 7));
  } else if (clean.includes('الخميس')) {
    targetDate.setDate(targetDate.getDate() + ((4 - targetDate.getDay() + 7) % 7 || 7));
  }

  // Time parsing
  if (clean.includes('الساعة 8') || clean.includes('الساعة 08')) dueTime = '08:00';
  else if (clean.includes('الساعة 9') || clean.includes('الساعة 09')) dueTime = '09:00';
  else if (clean.includes('الساعة 10')) dueTime = '10:00';
  else if (clean.includes('الساعة 11')) dueTime = '11:00';
  else if (clean.includes('الساعة 12')) dueTime = '12:00';
  else if (clean.includes('الساعة 1') || clean.includes('الواحدة')) dueTime = '13:00';
  else if (clean.includes('الساعة 2') || clean.includes('الثانية')) dueTime = '14:00';
  else if (clean.includes('الساعة 3') || clean.includes('الثالثة')) dueTime = '15:00';
  else if (clean.includes('الساعة 4') || clean.includes('الرابعة')) dueTime = '16:00';
  else if (clean.includes('الساعة 5') || clean.includes('الخامسة')) dueTime = '17:00';

  if (clean.includes('مساء') && parseInt(dueTime.split(':')[0]) < 12) {
    dueTime = `${parseInt(dueTime.split(':')[0]) + 12}:00`;
  }

  // Priority parsing
  if (clean.includes('عاجل') || clean.includes('ضروري') || clean.includes('طارئ')) {
    priority = 'urgent';
  } else if (clean.includes('مهم') || clean.includes('أولوية عالية')) {
    priority = 'high';
  }

  // Category parsing
  if (clean.includes('عميل') || clean.includes('صيدلية') || clean.includes('بيع') || clean.includes('عرض')) {
    category = 'مبيعات وعملاء';
  } else if (clean.includes('حساب') || clean.includes('سند') || clean.includes('تحصيل') || clean.includes('مبلغ')) {
    category = 'مالية وحسابات';
  } else if (clean.includes('طبيب') || clean.includes('عيادة') || clean.includes('دكتور')) {
    category = 'دعاية طبية';
  } else if (clean.includes('مخزن') || clean.includes('بضاعة') || clean.includes('صرف') || clean.includes('توريد')) {
    category = 'مستودع ولوجستيات';
  }

  // Clean title
  let extractedTitle = clean
    .replace(/(غدا|غداً|بكرة|اليوم|بعد غد|بعد غداً)/g, '')
    .replace(/الساعة\s+\d+(\s+(صباحاً|مساءً))?/g, '')
    .replace(/(عاجل|ضروري|طارئ|مهم)/g, '')
    .trim();

  if (!extractedTitle) extractedTitle = clean;

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');

  return {
    title: extractedTitle,
    dueDate: `${yyyy}-${mm}-${dd}`,
    dueTime,
    priority,
    category,
    relatedAction: clean.includes('إرسال') ? 'إرسال مستندات' : 'متابعة مباشرة',
  };
}

// Reset data to seed defaults
export function resetWorkOSToDefault(): void {
  saveWorkspaces(SEED_WORKSPACES);
  saveCurrentWorkspaceId('ws_main');
  saveProjects(SEED_PROJECTS);
  saveTasks(SEED_TASKS);
  saveInbox(SEED_INBOX);
  saveRoutine(SEED_ROUTINE);
  saveHabits(SEED_HABITS);
  saveGoals(SEED_GOALS);
  saveAppointments(SEED_APPOINTMENTS);
  saveCommitments(SEED_COMMITMENTS);
  saveMeetings(SEED_MEETINGS);
  saveNotes(SEED_NOTES);
  saveTeam(SEED_TEAM);
  saveAutomations(SEED_AUTOMATIONS);
  saveActivity(SEED_ACTIVITY);
  saveActiveTimer(null);
}

// Full State Loader & Saver
export function loadWorkOSData(): WorkOSData {
  const ws = loadWorkspaces();
  const prj = loadProjects();
  const tsk = loadTasks();
  const inb = loadInbox();
  const rtn = loadRoutine();
  const rev = loadDailyReviews();
  const hab = loadHabits();
  const gol = loadGoals();
  const apt = loadAppointments();
  const com = loadCommitments();
  const mtg = loadMeetings();
  const nts = loadNotes();
  const tem = loadTeam();
  const aut = loadAutomations();
  const act = loadActivity();

  return {
    workspaces: Array.isArray(ws) ? ws : SEED_WORKSPACES,
    currentWorkspaceId: loadCurrentWorkspaceId() || 'ws_main',
    projects: Array.isArray(prj) ? prj : SEED_PROJECTS,
    tasks: Array.isArray(tsk) ? tsk : SEED_TASKS,
    inbox: Array.isArray(inb) ? inb : SEED_INBOX,
    dailyRoutine: Array.isArray(rtn) ? rtn : SEED_ROUTINE,
    dailyReviews: Array.isArray(rev) ? rev : [],
    habits: Array.isArray(hab) ? hab : SEED_HABITS,
    goals: Array.isArray(gol) ? gol : SEED_GOALS,
    appointments: Array.isArray(apt) ? apt : SEED_APPOINTMENTS,
    commitments: Array.isArray(com) ? com : SEED_COMMITMENTS,
    meetings: Array.isArray(mtg) ? mtg : SEED_MEETINGS,
    notes: Array.isArray(nts) ? nts : SEED_NOTES,
    team: Array.isArray(tem) ? tem : SEED_TEAM,
    automations: Array.isArray(aut) ? aut : SEED_AUTOMATIONS,
    activities: Array.isArray(act) ? act : SEED_ACTIVITY,
  };
}

export function saveWorkOSData(data: WorkOSData): void {
  if (!data) return;
  if (data.workspaces) saveWorkspaces(data.workspaces);
  if (data.currentWorkspaceId) saveCurrentWorkspaceId(data.currentWorkspaceId);
  if (data.projects) saveProjects(data.projects);
  if (data.tasks) saveTasks(data.tasks);
  if (data.inbox) saveInbox(data.inbox);
  if (data.dailyRoutine) saveRoutine(data.dailyRoutine);
  if (data.dailyReviews) saveDailyReviews(data.dailyReviews);
  if (data.habits) saveHabits(data.habits);
  if (data.goals) saveGoals(data.goals);
  if (data.appointments) saveAppointments(data.appointments);
  if (data.commitments) saveCommitments(data.commitments);
  if (data.meetings) saveMeetings(data.meetings);
  if (data.notes) saveNotes(data.notes);
  if (data.team) saveTeam(data.team);
  if (data.automations) saveAutomations(data.automations);
  if (data.activities) saveActivity(data.activities);
}

// Celebration Confetti
export function triggerConfetti(): void {
  try {
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#10b981'],
    });
  } catch (err) {
    console.warn('Confetti trigger failed:', err);
  }
}

// Data Export Utilities
export function exportWorkOSToJSON(data?: WorkOSData): void {
  const payload = data || loadWorkOSData();
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `workos-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportWorkOSToCSV(data?: WorkOSData): void {
  const payload = data || loadWorkOSData();
  const tasks = payload.tasks || [];
  const headers = ['رقم المهمة', 'العنوان', 'الحالة', 'الأولوية', 'المشروع', 'المسؤول', 'تاريخ الاستحقاق', 'التقدم %'];
  
  const rows = tasks.map((t) => [
    `"${t.taskNumber || ''}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${t.status || ''}"`,
    `"${t.priority || ''}"`,
    `"${(payload.projects.find((p) => p.id === t.projectId)?.name || '').replace(/"/g, '""')}"`,
    `"${(payload.team.find((m) => m.id === t.assigneeId)?.name || '').replace(/"/g, '""')}"`,
    `"${t.dueDate || ''}"`,
    `"${t.progress || 0}%"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `workos-tasks-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportWorkOSToExcel(data?: WorkOSData): void {
  const payload = data || loadWorkOSData();
  const tasks = payload.tasks || [];
  const projects = payload.projects || [];
  const team = payload.team || [];

  const taskRows = tasks.map((t) => {
    const proj = projects.find((p) => p.id === t.projectId);
    const member = team.find((m) => m.id === t.assigneeId);
    return {
      'رقم المهمة': t.taskNumber || '',
      'عنوان المهمة': t.title || '',
      'الوصف': t.description || '',
      'الحالة': t.status || '',
      'الأولوية': t.priority || '',
      'المشروع': proj ? proj.name : '',
      'المسؤول': member ? member.name : '',
      'تاريخ الاستحقاق': t.dueDate || '',
      'نسبة الإنجاز %': t.progress || 0,
      'الساعات التقديرية': t.estimatedHours || 0,
      'الساعات الفعلية': t.actualHours || 0,
      'الوسوم': (t.tags || []).join(', '),
    };
  });

  const projectRows = projects.map((p) => ({
    'كود المشروع': p.code || '',
    'اسم المشروع': p.name || '',
    'الوصف': p.description || '',
    'الحالة': p.status || '',
    'الفئة': p.category || '',
    'تاريخ البدء': p.startDate || '',
    'تاريخ الاستحقاق': p.dueDate || '',
    'نسبة الإنجاز %': p.progress || 0,
  }));

  const wb = XLSX.utils.book_new();
  const wsTasks = XLSX.utils.json_to_sheet(taskRows);
  const wsProjects = XLSX.utils.json_to_sheet(projectRows);

  XLSX.utils.book_append_sheet(wb, wsTasks, 'المهام التنفيذية');
  XLSX.utils.book_append_sheet(wb, wsProjects, 'المشاريع');

  XLSX.writeFile(wb, `workos-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadWorkOSTasksTemplate(): void {
  const sampleRows = [
    {
      'عنوان المهمة': 'إعداد التقرير المالي للربع الأول',
      'الوصف': 'مراجعة قيود الصرف والقبض وإصدار الميزان',
      'الحالة': 'in_progress',
      'الأولوية': 'high',
      'اسم المشروع': 'تطوير المنظومة',
      'اسم المسؤول': 'أحمد السعيد',
      'تاريخ الاستحقاق': new Date().toISOString().slice(0, 10),
      'نسبة الإنجاز %': 50,
      'الساعات التقديرية': 8,
      'الوسوم': 'مالية, تقارير',
    },
    {
      'عنوان المهمة': 'متابعة استلام شحنة مستودع صنعاء',
      'الوصف': 'مطابقة أذونات الاستلام مع بوليصة الشحن',
      'الحالة': 'planned',
      'الأولوية': 'urgent',
      'اسم المشروع': 'سلسلة التوريد',
      'اسم المسؤول': 'خالد محمد',
      'تاريخ الاستحقاق': new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      'نسبة الإنجاز %': 10,
      'الساعات التقديرية': 4,
      'الوسوم': 'مستودع, شحنات',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(wb, ws, 'نموذج المهام');
  XLSX.writeFile(wb, `workos-tasks-template.xlsx`);
}

export function importWorkOSTasksFromExcel(file: File): Promise<{ success: boolean; message: string; count?: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({ success: false, message: 'الملف فارغ أو لا يحتوي على أسطر صالحة.' });
          return;
        }

        const currentData = loadWorkOSData();
        const existingTasks = currentData.tasks || [];
        const projects = currentData.projects || [];
        const team = currentData.team || [];

        let importedCount = 0;
        const newTasks: WorkTask[] = [];

        rawJson.forEach((row, idx) => {
          const title = String(row['عنوان المهمة'] || row['العنوان'] || row['Title'] || '').trim();
          if (!title) return;

          const desc = String(row['الوصف'] || row['Description'] || '').trim();
          const rawStatus = String(row['الحالة'] || row['Status'] || '').trim();
          const rawPri = String(row['الأولوية'] || row['Priority'] || '').trim();
          const projectName = String(row['المشروع'] || row['اسم المشروع'] || row['Project'] || '').trim();
          const memberName = String(row['المسؤول'] || row['اسم المسؤول'] || row['Assignee'] || '').trim();
          const dueDate = String(row['تاريخ الاستحقاق'] || row['DueDate'] || '').trim() || new Date().toISOString().slice(0, 10);
          const progress = Number(row['نسبة الإنجاز %'] || row['Progress'] || 0) || 0;
          const estimatedHours = Number(row['الساعات التقديرية'] || row['EstimatedHours'] || 0) || 0;
          const rawTags = String(row['الوسوم'] || row['Tags'] || '').trim();

          // Match project
          const matchedProj = projects.find((p) => p.name.includes(projectName) || projectName.includes(p.name));
          // Match assignee
          const matchedMember = team.find((m) => m.name.includes(memberName) || memberName.includes(m.name));

          let status: any = 'planned';
          if (['completed', 'مكتملة', 'تم', 'منجز'].includes(rawStatus.toLowerCase())) status = 'completed';
          else if (['in_progress', 'قيد التنفيذ', 'جاري'].includes(rawStatus.toLowerCase())) status = 'in_progress';
          else if (['in_review', 'مراجعة'].includes(rawStatus.toLowerCase())) status = 'in_review';
          else if (['blocked', 'معلقة', 'متوقفة'].includes(rawStatus.toLowerCase())) status = 'blocked';

          let priority: any = 'medium';
          if (['urgent', 'طارئ', 'عاجل'].includes(rawPri.toLowerCase())) priority = 'urgent';
          else if (['high', 'مرتفع', 'مهم'].includes(rawPri.toLowerCase())) priority = 'high';
          else if (['low', 'منخفض', 'عادي'].includes(rawPri.toLowerCase())) priority = 'low';

          const newTask: WorkTask = {
            id: `task_${Date.now()}_${idx}`,
            taskNumber: `TSK-${1000 + existingTasks.length + importedCount + 1}`,
            title,
            description: desc,
            status,
            priority,
            category: 'عام',
            projectId: matchedProj ? matchedProj.id : projects[0]?.id || 'p_core',
            assigneeId: matchedMember ? matchedMember.id : 'm1',
            dueDate,
            progress: Math.min(100, Math.max(0, progress)),
            estimatedHours,
            actualHours: 0,
            tags: rawTags ? rawTags.split(/[,،]/).map((t) => t.trim()).filter(Boolean) : [],
            subtasks: [],
            checklist: [],
            timeEntries: [],
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          newTasks.push(newTask);
          importedCount++;
        });

        if (importedCount === 0) {
          resolve({ success: false, message: 'لم يتم العثور على أسطر تحتوي على (عنوان المهمة).' });
          return;
        }

        currentData.tasks = [...newTasks, ...existingTasks];
        saveWorkOSData(currentData);
        resolve({ success: true, message: `تم استيراد ${importedCount} مهمة جديدة بنجاح!`, count: importedCount });
      } catch (err: any) {
        console.error('WorkOS Excel Import Error:', err);
        resolve({ success: false, message: `فشل قراءة الملف: ${err?.message || 'تنسيق غير صالح'}` });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: 'تعذر قراءة ملف الإكسل.' });
    };

    reader.readAsArrayBuffer(file);
  });
}
