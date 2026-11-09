/**
 * ثوابت ونمط الإدخال السريع في «إدارة العمل» (R30) — مستخرجة من WorkOSQuickAddModal.tsx.
 */
import { CheckSquare, FolderKanban, ShoppingCart, Coins, Calendar, BookOpen, Target, Flame } from 'lucide-react';
import type {
  WorkProject,
  TeamMember,
  TaskPriority,
  WorkOrder,
  NewTaskDraft,
  NewProjectDraft,
  NewNoteDraft,
  NewAppointmentDraft,
  NewCommitmentDraft,
  NewHabitDraft,
  NewGoalDraft,
} from '../../types/workos';

export interface WorkOSQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string;
  initialProjectId?: string;
  initialPriority?: TaskPriority;
  projects: WorkProject[];
  team: TeamMember[];
  onAddTask: (task: NewTaskDraft) => void;
  onAddOrder?: (order: WorkOrder) => void;
  onAddProject: (project: NewProjectDraft) => void;
  onAddNote: (note: NewNoteDraft) => void;
  onAddAppointment: (appointment: NewAppointmentDraft) => void;
  onAddCommitment: (commitment: NewCommitmentDraft) => void;
  onAddHabit: (habit: NewHabitDraft) => void;
  onAddGoal: (goal: NewGoalDraft) => void;
}

/** تبويبات أنواع الإدخال المتاحة في الشاشة الموحدة. */
export const INPUT_TABS = [
  { id: 'task', label: 'مهمة', icon: CheckSquare, badge: 'تنفيذي' },
  { id: 'project', label: 'مشروع', icon: FolderKanban, badge: 'إداري' },
  { id: 'order', label: 'طلبية / طلب', icon: ShoppingCart, badge: 'مبيعات وتوريد' },
  { id: 'commitment', label: 'التزام مالي', icon: Coins, badge: 'مالي وذمم' },
  { id: 'appointment', label: 'موعد', icon: Calendar, badge: 'ميداني' },
  { id: 'note', label: 'ملاحظة', icon: BookOpen, badge: 'معرفة' },
  { id: 'goal', label: 'هدف', icon: Target, badge: 'استراتيجي' },
  { id: 'habit', label: 'عادة', icon: Flame, badge: 'انضباط' },
];
