/**
 * قراءة/كتابة بيانات «إدارة العمل» — مستخرجة من workosStorage.ts (R30).
 * كل الدوال هنا تبقى بنفس الأسماء والسلوك حرفياً؛ الأم يعيد تصديرها.
 */
import {
  Workspace,
  WorkProject,
  WorkTask,
  WorkOrder,
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
} from '../../types/workos';
import { dbStorage } from '../../database/dbStorage';
import { publishDomainEvent, withAutomationOrigin } from '../automation/automationEvents';
import {
  deriveTaskEvents,
  deriveProjectEvents,
  deriveOrderEvents,
  deriveCommitmentEvents,
} from '../automation/automationDerive';
import { KEYS } from './workosKeys';
import {
  SEED_WORKSPACES,
  SEED_PROJECTS,
  SEED_TASKS,
  SEED_ORDERS,
  SEED_INBOX,
  SEED_ROUTINE,
  SEED_HABITS,
  SEED_GOALS,
  SEED_APPOINTMENTS,
  SEED_COMMITMENTS,
  SEED_MEETINGS,
  SEED_NOTES,
  SEED_TEAM,
  SEED_AUTOMATIONS,
  SEED_ACTIVITY,
} from './workosSeeds';

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
  const previous = loadProjects();
  saveSafe(KEYS.PROJECTS, data);
  for (const event of deriveProjectEvents(previous, data)) publishDomainEvent(event);
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
  const previous = loadTasks();
  saveSafe(KEYS.TASKS, data);
  // R31: كل كتابة مهام تُنشر أحداثها المشتقة (إنجاز · اكتمال مهام فرعية · إنشاء · تعديل)
  for (const event of deriveTaskEvents(previous, data)) publishDomainEvent(event);
}

/**
 * كتابة مهام بلا نشر أحداث (R40).
 * تُستخدم فقط في المسارات التي كانت تكتب المفتاح مباشرةً من مكوّن، والحفاظ على
 * «لا تغيير سلوك» يمنع إدخال أحداث أتمتة لم تكن تُنشر سابقاً.
 * أي مسار جديد يريد إطلاق الأتمتة يستخدم `saveTasks` لا هذه.
 */
export function saveTasksWithoutEvents(data: WorkTask[]): void {
  saveSafe(KEYS.TASKS, data);
}

// Orders (الطلبيات)
export function loadOrders(): WorkOrder[] {
  const loaded = loadSafe<WorkOrder[]>(KEYS.ORDERS, SEED_ORDERS);
  return Array.isArray(loaded) ? loaded : SEED_ORDERS;
}
export function saveOrders(data: WorkOrder[]): void {
  const previous = loadOrders();
  saveSafe(KEYS.ORDERS, data);
  for (const event of deriveOrderEvents(previous, data)) publishDomainEvent(event);
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
  const previous = loadCommitments();
  saveSafe(KEYS.COMMITMENTS, data);
  for (const event of deriveCommitmentEvents(previous, data)) publishDomainEvent(event);
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
  const targetDate = new Date(today);
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
  // إعادة التهيئة عملية جملية: لا تُطلق أتمتة على مئات السجلات البذرية
  return withAutomationOrigin(() => {
    resetWorkOSDefaultsInternal();
  });
}

function resetWorkOSDefaultsInternal(): void {
  saveWorkspaces(SEED_WORKSPACES);
  saveCurrentWorkspaceId('ws_main');
  saveProjects(SEED_PROJECTS);
  saveTasks(SEED_TASKS);
  saveOrders(SEED_ORDERS);
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
  const ord = loadOrders();
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
    orders: Array.isArray(ord) ? ord : SEED_ORDERS,
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
  if (data.orders) saveOrders(data.orders);
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
