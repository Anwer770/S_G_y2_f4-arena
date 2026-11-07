export type TaskFlowStatus = 'todo' | 'in_progress' | 'completed';

export type TaskFlowPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskFlowRole = 'admin' | 'member';

export interface TaskFlowProject {
  id: string;
  name: string;
  description?: string;
  color: string; // Hex or tailwind color class
  isArchived?: boolean;
  createdAt: string;
}

export interface TaskFlowMember {
  id: string;
  name: string;
  email: string;
  role: TaskFlowRole;
  avatarColor: string;
  isActive: boolean;
  phone?: string;
  jobTitle?: string;
  createdAt: string;
}

export interface TaskFlowTask {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  status: TaskFlowStatus;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  priority?: TaskFlowPriority;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFlowActivity {
  id: string;
  timestamp: string;
  memberName: string;
  action: string;
  taskTitle?: string;
}

export interface TaskFlowFilterState {
  search: string;
  projectId: string; // 'all' or specific id
  assigneeId: string; // 'all' or specific id
  showCompleted: boolean;
  onlyOverdue: boolean;
  groupBy: 'none' | 'project' | 'assignee';
}
