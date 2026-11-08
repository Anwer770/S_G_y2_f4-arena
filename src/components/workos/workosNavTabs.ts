import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ShoppingCart,
  Kanban,
  Clock,
  Flame,
  Users,
  Sun,
  Target,
  Coffee,
  Eye,
} from 'lucide-react';
import { WorkOSData } from '../../types/workos';
import type { WorkOSNavTab } from './WorkOSViewNav';

/**
 * تعريف تبويبات «إدارة العمل» (R29) — مُستخرج من WorkOSModule.tsx.
 * نفس المعرّفات والترتيب والمجموعات؛ العدّادات تُقرأ من البيانات الحيّة.
 */
export const buildWorkOSNavTabs = (data: WorkOSData): WorkOSNavTab[] => {
  return [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard, group: 'work' },
    { id: 'projects', label: 'المشاريع', icon: FolderKanban, count: data.projects.length, group: 'work' },
    { id: 'tasks', label: 'المهام', icon: CheckSquare, count: data.tasks.length, group: 'work' },
    { id: 'orders', label: 'الدفتر المركزي والطلبيات', icon: ShoppingCart, count: data.orders?.length || 0, group: 'work' },
    { id: 'kanban', label: 'كانبان', icon: Kanban, group: 'views' },
    { id: 'timeline', label: 'الجدول الزمني', icon: Clock, group: 'views' },
    { id: 'priorities', label: 'الأولويات', icon: Flame, group: 'insights' },
    { id: 'workload', label: 'عبء الفريق', icon: Users, group: 'insights' },
    // مجموعة «التخطيط والمتابعة» (§6 · §25) — مداخل إلى الواجهات القائمة نفسها (لا واجهات جديدة)
    { id: 'planner', label: 'التخطيط اليومي', icon: Sun, group: 'planning', secondary: 'planner' as const },
    { id: 'goals', label: 'الأهداف', icon: Target, group: 'planning', secondary: 'goals' as const, count: data.goals.length },
    { id: 'routine', label: 'الروتين', icon: Coffee, group: 'planning', secondary: 'routine' as const },
    { id: 'visits', label: 'الزيارات', icon: Eye, group: 'planning', secondary: 'visits' as const },
  ];
};
