import * as XLSX from 'xlsx';
import { dbStorage } from '../database/dbStorage';
import {
  TaskFlowProject,
  TaskFlowMember,
  TaskFlowTask,
  TaskFlowActivity,
  TaskFlowStatus,
} from '../types/taskflow';

const STORAGE_KEYS = {
  PROJECTS: 'AL_MANZUMA_TF_PROJECTS',
  MEMBERS: 'AL_MANZUMA_TF_MEMBERS',
  TASKS: 'AL_MANZUMA_TF_TASKS',
  CURRENT_USER: 'AL_MANZUMA_TF_CURRENT_USER',
  ACTIVITIES: 'AL_MANZUMA_TF_ACTIVITIES',
};

// ==========================================
// BroadcastChannel for Instant Real-Time Multi-Tab Sync
// ==========================================
export const taskflowChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('TASKFLOW_LIVE_SYNC_CHANNEL')
    : null;

export const broadcastTaskFlowUpdate = (type: string, payload?: any) => {
  if (taskflowChannel) {
    try {
      taskflowChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }
};

// ==========================================
// Initial Sample Data (Modern 2026 Dates)
// ==========================================
export const INITIAL_PROJECTS: TaskFlowProject[] = [
  {
    id: 'proj-1',
    name: 'إطلاق خط منتجات العناية الطبيعية 2026',
    description: 'تطوير وتسجيل وتعبئة 5 أصناف جديدة للبشرة والشعر وتدشينها بالأسواق',
    color: '#8b5cf6', // Indigo / Purple
    isArchived: false,
    createdAt: '2026-08-01',
  },
  {
    id: 'proj-2',
    name: 'حملة التسويق الرقمي والدعاية الطبية',
    description: 'خطة الزيارات للمراكز الطبية الكبرى والإعلانات الممولة ومتابعة العينات',
    color: '#0ea5e9', // Sky Blue
    isArchived: false,
    createdAt: '2026-08-05',
  },
  {
    id: 'proj-3',
    name: 'توسعة أسطول التوزيع وسلاسل الإمداد',
    description: 'تجهيز مسارات المناديب وإدارة نقاط البيع والمستودعات في المحافظات',
    color: '#10b981', // Emerald Green
    isArchived: false,
    createdAt: '2026-08-10',
  },
  {
    id: 'proj-4',
    name: 'أتمتة الجرد والمطابقة المالية الربعية',
    description: 'حصر الفروقات المحاسبية ومطابقة العهد وجدولة ديون كبار العملاء',
    color: '#f59e0b', // Amber / Orange
    isArchived: false,
    createdAt: '2026-08-15',
  },
];

export const INITIAL_MEMBERS: TaskFlowMember[] = [
  {
    id: 'mem-1',
    name: 'د. طارق المنصوري',
    email: 'admin@taskflow.local',
    role: 'admin',
    avatarColor: '#4f46e5',
    isActive: true,
    jobTitle: 'مدير المنظومة والعمليات',
    createdAt: '2026-08-01',
  },
  {
    id: 'mem-2',
    name: 'م. سارة المهدي',
    email: 'sara@taskflow.local',
    role: 'member',
    avatarColor: '#ec4899',
    isActive: true,
    jobTitle: 'أخصائية تصميم وتسويق رقمي',
    createdAt: '2026-08-02',
  },
  {
    id: 'mem-3',
    name: 'أ. خالد الحميري',
    email: 'khaled@taskflow.local',
    role: 'member',
    avatarColor: '#10b981',
    isActive: true,
    jobTitle: 'مشرف المستودعات وسلاسل الإمداد',
    createdAt: '2026-08-03',
  },
  {
    id: 'mem-4',
    name: 'د. ريم اليافعي',
    email: 'reem@taskflow.local',
    role: 'member',
    avatarColor: '#f59e0b',
    isActive: true,
    jobTitle: 'مسؤولة الدعاية والعلاقات الطبية',
    createdAt: '2026-08-04',
  },
];

export const INITIAL_TASKS: TaskFlowTask[] = [
  {
    id: 'tf-101',
    title: 'اعتماد التصاميم النهائية لعبوات سيروم فيتامين سي',
    description: 'مراجعة خامات الطباعة المقاومة للماء ومطابقة معايير الباركود الدولي مع المورد',
    projectId: 'proj-1',
    assigneeId: 'mem-2',
    status: 'in_progress',
    startDate: '2026-08-25',
    dueDate: '2026-09-08',
    priority: 'high',
    createdAt: '2026-08-25T09:00:00.000Z',
    updatedAt: '2026-09-01T14:30:00.000Z',
  },
  {
    id: 'tf-102',
    title: 'توزيع العينات الترويجية لـ 20 طبيب جلدية رئيسي',
    description: 'توزيع الدفعة الأولى من عينات الغسول وواقي الشمس وتسجيل تقييمات الأطباء',
    projectId: 'proj-2',
    assigneeId: 'mem-4',
    status: 'in_progress',
    startDate: '2026-08-28',
    dueDate: '2026-09-05',
    priority: 'urgent',
    createdAt: '2026-08-28T10:15:00.000Z',
    updatedAt: '2026-09-02T08:00:00.000Z',
  },
  {
    id: 'tf-103',
    title: 'مطابقة جرد مستودع التوزيع الرئيسي لشهر أغسطس',
    description: 'فحص حركة الوارد والمنصرف ومطابقة العجز الفعلي قبل إغلاق كشف الحساب',
    projectId: 'proj-4',
    assigneeId: 'mem-3',
    status: 'todo',
    startDate: '2026-08-20',
    dueDate: '2026-08-30', // Overdue! (Due in August, today is Sept 2026)
    priority: 'urgent',
    createdAt: '2026-08-20T11:00:00.000Z',
    updatedAt: '2026-08-31T09:00:00.000Z',
  },
  {
    id: 'tf-104',
    title: 'تسعير باقات الجملة لمراكز التجميل والصيدليات',
    description: 'تحديد هوامش الربح وخصومات الكميات النقدية والآجلة',
    projectId: 'proj-1',
    assigneeId: 'mem-1',
    status: 'completed',
    startDate: '2026-08-15',
    dueDate: '2026-08-27',
    priority: 'medium',
    createdAt: '2026-08-15T08:30:00.000Z',
    updatedAt: '2026-08-27T17:00:00.000Z',
  },
  {
    id: 'tf-105',
    title: 'إطلاق مسار المبيعات الجديد (منطقة إب والعدين)',
    description: 'جدولة خط سير المندوب وتعيين أول 15 عميلاً معتمداً وتسليم العينات',
    projectId: 'proj-3',
    assigneeId: 'mem-3',
    status: 'todo',
    startDate: '2026-09-01',
    dueDate: '2026-09-12',
    priority: 'medium',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'tf-106',
    title: 'تصوير فيديو تعريفي احترافي للمنتجات',
    description: 'جلسة تصوير للمنتجات مع تفاصيل المكونات الطبيعية واستخداماتها للإنستغرام',
    projectId: 'proj-2',
    assigneeId: 'mem-2',
    status: 'todo',
    startDate: '2026-09-03',
    dueDate: '2026-09-15',
    priority: 'low',
    createdAt: '2026-09-02T07:30:00.000Z',
    updatedAt: '2026-09-02T07:30:00.000Z',
  },
  {
    id: 'tf-107',
    title: 'سداد دفعة المورد الصيني لمواد التغليف',
    description: 'تحويل الدفعة الثانية عبر الاعتماد المستندي واستلام بوليصة الشحن',
    projectId: 'proj-4',
    assigneeId: 'mem-1',
    status: 'completed',
    startDate: '2026-08-10',
    dueDate: '2026-08-20',
    priority: 'high',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-20T12:00:00.000Z',
  },
];

// ==========================================
// Storage Helpers
// ==========================================
export const loadTaskFlowProjects = (): TaskFlowProject[] => {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      saveTaskFlowProjects(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_PROJECTS;
  }
};

export const saveTaskFlowProjects = (projects: TaskFlowProject[]) => {
  try {
    dbStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    broadcastTaskFlowUpdate('PROJECTS_UPDATED', projects);
  } catch (e) {
    console.error('Failed to save projects:', e);
  }
};

export const loadTaskFlowMembers = (): TaskFlowMember[] => {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      saveTaskFlowMembers(INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MEMBERS;
  }
};

export const saveTaskFlowMembers = (members: TaskFlowMember[]) => {
  try {
    dbStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    broadcastTaskFlowUpdate('MEMBERS_UPDATED', members);
  } catch (e) {
    console.error('Failed to save members:', e);
  }
};

export const loadTaskFlowTasks = (): TaskFlowTask[] => {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      saveTaskFlowTasks(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_TASKS;
  }
};

export const saveTaskFlowTasks = (tasks: TaskFlowTask[]) => {
  try {
    dbStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    broadcastTaskFlowUpdate('TASKS_UPDATED', tasks);
  } catch (e) {
    console.error('Failed to save tasks:', e);
  }
};

export const loadTaskFlowCurrentUser = (): TaskFlowMember => {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
    const members = loadTaskFlowMembers();
    return members[0] || INITIAL_MEMBERS[0];
  } catch (e) {
    return INITIAL_MEMBERS[0];
  }
};

export const saveTaskFlowCurrentUser = (user: TaskFlowMember) => {
  try {
    dbStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save current user:', e);
  }
};

export const loadTaskFlowActivities = (): TaskFlowActivity[] => {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addTaskFlowActivity = (
  memberName: string,
  action: string,
  taskTitle?: string
) => {
  try {
    const activities = loadTaskFlowActivities();
    const newAct: TaskFlowActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      memberName,
      action,
      taskTitle,
    };
    const updated = [newAct, ...activities].slice(0, 50); // keep last 50
    dbStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
    broadcastTaskFlowUpdate('ACTIVITY_ADDED', newAct);
  } catch (e) {}
};

// ==========================================
// Task Logic: Overdue Calculation Rule
// ==========================================
export const isTaskOverdue = (task: TaskFlowTask, referenceDate = new Date()): boolean => {
  // If completed, it is NEVER overdue
  if (task.status === 'completed') return false;
  if (!task.dueDate) return false;

  const todayStr = referenceDate.toISOString().split('T')[0];
  return task.dueDate < todayStr;
};

export const getEffectiveStatus = (
  task: TaskFlowTask,
  referenceDate = new Date()
): TaskFlowStatus | 'overdue' => {
  if (isTaskOverdue(task, referenceDate)) {
    return 'overdue';
  }
  return task.status;
};

// ==========================================
// Excel & Export Helpers
// ==========================================
export const downloadTaskFlowExcelTemplate = () => {
  const templateRows = [
    {
      'عنوان المهمة': 'إطلاق حملة الترويج للبشرة والجمال 2026',
      'المشروع': 'إطلاق خط منتجات العناية الطبيعية 2026',
      'المسؤول': 'د. سارة المنصوري',
      'الحالة': 'قيد التنفيذ',
      'الأولوية': 'عالية',
      'تاريخ البداية': '2026-09-01',
      'تاريخ الاستحقاق': '2026-09-25',
      'الوصف': 'تجهيز المنشورات ومتابعة عينات الأطباء والصيدليات المستهدفة',
    },
    {
      'عنوان المهمة': 'جرد مستودع التوزيع ومطابقة الكميات',
      'المشروع': 'توسعة أسطول التوزيع وسلاسل الإمداد',
      'المسؤول': 'أحمد العولقي',
      'الحالة': 'قيد الانتظار',
      'الأولوية': 'متوسطة',
      'تاريخ البداية': '2026-09-10',
      'تاريخ الاستحقاق': '2026-09-30',
      'الوصف': 'فحص تواريخ الصلاحية وحصر الكميات المحجوزة',
    },
    {
      'عنوان المهمة': 'تجديد ترخيص التسجيل والرقابة الدوائية',
      'المشروع': 'إطلاق خط منتجات العناية الطبيعية 2026',
      'المسؤول': 'م. فهد السقاف',
      'الحالة': 'مكتملة',
      'الأولوية': 'عالية',
      'تاريخ البداية': '2026-08-15',
      'تاريخ الاستحقاق': '2026-09-05',
      'الوصف': 'تم استلام الشهادة واعتماد الفحص المخبري بنجاح',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'نموذج_مهام_TaskFlow');
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });
  XLSX.writeFile(wb, 'نموذج_استيراد_مهام_TaskFlow.xlsx');
};

export const exportTaskFlowToExcel = (
  tasks: TaskFlowTask[],
  projects: TaskFlowProject[],
  members: TaskFlowMember[]
) => {
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  const data = tasks.map((t) => {
    const overdue = isTaskOverdue(t);
    let statusLabel = 'قيد الانتظار (To Do)';
    if (t.status === 'in_progress') statusLabel = 'قيد التنفيذ (In Progress)';
    if (t.status === 'completed') statusLabel = 'مكتملة (Completed)';

    return {
      'رقم المهمة': t.id,
      'عنوان المهمة': t.title,
      'المشروع': projectMap.get(t.projectId) || 'غير محدد',
      'المسؤول': memberMap.get(t.assigneeId || '') || 'غير مسند',
      'الحالة': statusLabel,
      'هل متأخرة؟': overdue ? 'نعم (متأخرة)' : 'لا',
      'تاريخ البداية': t.startDate || '-',
      'تاريخ الاستحقاق': t.dueDate || '-',
      'الأولوية': t.priority || 'medium',
      'الوصف': t.description || '',
      'تاريخ الإنشاء': t.createdAt ? t.createdAt.split('T')[0] : '-',
      'آخر تحديث': t.updatedAt ? t.updatedAt.split('T')[0] : '-',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'مهام_TaskFlow');
  XLSX.writeFile(wb, `TaskFlow_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const resetTaskFlowSampleData = () => {
  saveTaskFlowProjects(INITIAL_PROJECTS);
  saveTaskFlowMembers(INITIAL_MEMBERS);
  saveTaskFlowTasks(INITIAL_TASKS);
  saveTaskFlowCurrentUser(INITIAL_MEMBERS[0]);
  dbStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
};
