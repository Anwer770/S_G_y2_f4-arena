// ============================================================================
// WORK OPERATING SYSTEM (WORK OS) - COMPLETE TYPES & MODELS
// Professional Task, Project, Routine, Habit, Meeting, & Team System
// ============================================================================

export type WorkOSView =
  | 'dashboard'
  | 'inbox'
  | 'my_tasks'
  | 'all_tasks'
  | 'projects'
  | 'calendar'
  | 'kanban'
  | 'gantt'
  | 'routine'
  | 'habits'
  | 'goals'
  | 'appointments'
  | 'commitments'
  | 'notes'
  | 'meetings'
  | 'team'
  | 'reports'
  | 'automations'
  | 'time_tracking'
  | 'archive'
  | 'activity'
  | 'settings';

export type WorkOSViewMode =
  | 'dashboard'
  | 'inbox'
  | 'tasks'
  | 'projects'
  | 'taskflow'
  | 'classic_tasks'
  | 'routine'
  | 'habits'
  | 'goals'
  | 'appointments'
  | 'notes'
  | 'team'
  | 'automation'
  | 'reports';

export type TaskStatus =
  | 'new'
  | 'planned'
  | 'ready'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'completed'
  | 'cancelled'
  | 'archived'
  | 'delayed';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export type ProjectStatus =
  | 'planned'
  | 'active'
  | 'paused'
  | 'delayed'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type DependencyType =
  | 'finish_to_start'
  | 'start_to_start'
  | 'finish_to_finish'
  | 'start_to_finish';

export interface TaskDependency {
  taskId: string;
  type: DependencyType;
}

export interface WorkSubtask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  note?: string;
}

export interface WorkTask {
  id: string;
  taskNumber: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  areaId?: string;
  category: string;
  tags: string[];
  assigneeId: string;
  participants?: string[];
  creator?: string;
  startDate?: string;
  dueDate: string;
  startTime?: string;
  dueTime?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  parentTaskId?: string;
  dependencies?: TaskDependency[];
  subtasks: WorkSubtask[];
  checklist: ChecklistItem[];
  comments: TaskComment[];
  timeEntries?: TimeEntry[];
  customerRef?: string;
  invoiceRef?: string;
  workspaceId?: string;
  activityLog?: any[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
}

export interface WorkProject {
  id: string;
  code: string;
  name: string;
  description: string;
  manager: string;
  members?: string[];
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
  priority: TaskPriority;
  progress: number;
  budget?: number;
  category: string;
  tags?: string[];
  workspaceId?: string;
  areaId?: string;
  notesCount?: number;
  filesCount?: number;
  createdAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  type: 'work' | 'personal' | 'client' | 'custom';
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface Area {
  id: string;
  name: string;
  workspaceId: string;
  color: string;
}

export interface InboxItem {
  id: string;
  rawText?: string;
  extractedTitle?: string;
  category?: string;
  suggestedAction?: 'task' | 'note' | 'appointment' | 'project' | 'reminder';
  createdAt: string;
  isProcessed?: boolean;
  content?: string;
  type?: 'note' | 'task' | 'idea' | 'link' | 'reminder' | string;
  status?: 'unprocessed' | 'processed' | 'archived' | string;
}

export interface WorkOSData {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  projects: WorkProject[];
  tasks: WorkTask[];
  inbox: InboxItem[];
  dailyRoutine: DailyRoutineBlock[];
  dailyReviews: DailyReviewRecord[];
  habits: HabitItem[];
  goals: GoalItem[];
  appointments: AppointmentItem[];
  commitments: WorkCommitment[];
  meetings: WorkMeeting[];
  notes: WorkNote[];
  team: TeamMember[];
  automations: AutomationRule[];
  activities: WorkActivityLog[];
}

export interface DailyRoutineBlock {
  id: string;
  timeSlot: string; // e.g. "07:00" or "07:00 - 08:30"
  title: string;
  plannedActivity: string;
  category: 'work' | 'planning' | 'health' | 'learning' | 'review' | 'personal';
  status: 'planned' | 'completed' | 'postponed' | 'delayed' | 'cancelled';
  notes?: string;
}

export interface DailyReviewRecord {
  id: string;
  date: string;
  plannedSummary: string;
  achievedSummary: string;
  blockersReason: string;
  carryOverTomorrow: string;
  satisfactionRating: number; // 1 - 5
  reviewNotes: string;
}

export interface HabitItem {
  id: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekdays' | 'custom';
  targetDaysPerWeek: number;
  streak: number;
  bestStreak: number;
  completedDates: string[]; // YYYY-MM-DD
  reminderTime?: string;
  notes?: string;
}

export interface GoalObjective {
  id: string;
  title: string;
  progress: number;
  linkedProjectId?: string;
}

export interface GoalItem {
  id: string;
  title: string;
  category: string;
  targetDate: string;
  progress: number;
  objectives: GoalObjective[];
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  visionDescription: string;
}

export interface AppointmentItem {
  id: string;
  title: string;
  person: string;
  location: string;
  date: string;
  time: string;
  durationMinutes: number;
  attendees: string[];
  notes: string;
  linkedTaskId?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface WorkCommitment {
  id: string;
  title: string;
  entity: string;
  person: string;
  description: string;
  commitmentDate: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'fulfilled' | 'breached';
  importance: 'A' | 'B' | 'C';
  notes: string;
  amount?: number;
  currency?: string;
}

export interface MeetingActionItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
  convertedTaskId?: string;
}

export interface WorkMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: string[];
  agenda: string[];
  decisions: string[];
  actionItems: MeetingActionItem[];
  notes: string;
  projectId?: string;
}

export interface WorkNote {
  id: string;
  title: string;
  content: string;
  type: 'daily' | 'meeting' | 'idea' | 'customer' | 'project' | 'instruction' | 'decision' | 'personal';
  tags: string[];
  linkedProjectId?: string;
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone?: string;
  avatarColor: string;
  capacityHoursPerWeek: number;
  activeTasksCount: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerEvent:
    | 'task_overdue'
    | 'task_completed'
    | 'all_subtasks_completed'
    | 'project_100_percent'
    | 'new_customer_task'
    | 'daily_plan_start';
  actionType:
    | 'notify_team'
    | 'create_followup_task'
    | 'mark_project_completed'
    | 'archive_item'
    | 'tag_priority_urgent';
  isActive: boolean;
  executionsCount: number;
  lastExecutedAt?: string;
}

export interface WorkActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityTitle: string;
  oldValue?: string;
  newValue?: string;
}

export interface WorkOSFilterState {
  search: string;
  status: string;
  priority: string;
  projectId: string;
  assigneeId: string;
  workspaceId: string;
  tag: string;
  dueDateRange: 'all' | 'today' | 'this_week' | 'overdue' | 'upcoming';
}

export interface ActiveTimerState {
  taskId: string;
  taskTitle: string;
  startedAt: string;
  elapsedSeconds: number;
  isRunning: boolean;
}

