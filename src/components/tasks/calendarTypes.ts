/**
 * أنواع عرض التقويم (R30) — مفصولة عن المكوّن ليشاركها الخطاف.
 */
import type { CalendarViewMode, Commitment, Task } from '../../types';

export interface CalendarViewProps {
  tasks: Task[];
  commitments?: Commitment[];
  onToggleComplete?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onToggleCompleteCommitment?: (commitment: Commitment) => void;
  onEditCommitment?: (commitment: Commitment) => void;
  onAddTaskForDate?: (dateStr: string) => void;
  onAddCommitmentForDate?: (dateStr: string) => void;
}

/** أيام الأسبوع بالعربية (بداية السبت) — تُستخدم في الترتيب والعناوين. */
export const ARABIC_WEEKDAYS = [
  { name: 'السبت', short: 'سبت', index: 6 },
  { name: 'الأحد', short: 'أحد', index: 0 },
  { name: 'الإثنين', short: 'إثنين', index: 1 },
  { name: 'الثلاثاء', short: 'ثلاثاء', index: 2 },
  { name: 'الأربعاء', short: 'أربعاء', index: 3 },
  { name: 'الخميس', short: 'خميس', index: 4 },
  { name: 'الجمعة', short: 'جمعة', index: 5 },
];
