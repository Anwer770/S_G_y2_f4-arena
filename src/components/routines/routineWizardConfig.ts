/**
 * ثوابت وأنواع معالج الروتين (R30) — مستخرجة من RoutineWizardModal.tsx.
 */
import type { RoutineRecord, RoutineCategoryItem, RoutineTagItem, RoutineStep } from '../../types/routines';

export interface RoutineWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: RoutineRecord | null;
  categories: RoutineCategoryItem[];
  tags: RoutineTagItem[];
  onSave: (routine: RoutineRecord) => void;
}

export const COLOR_OPTIONS = [
  { id: 'emerald', bg: 'bg-emerald-500', name: 'زمردي' },
  { id: 'blue', bg: 'bg-blue-500', name: 'أزرق' },
  { id: 'amber', bg: 'bg-amber-500', name: 'كهرماني' },
  { id: 'purple', bg: 'bg-purple-500', name: 'أرجواني' },
  { id: 'rose', bg: 'bg-rose-500', name: 'وردي' },
  { id: 'teal', bg: 'bg-teal-500', name: 'تيل' },
  { id: 'indigo', bg: 'bg-indigo-500', name: 'نيلي' },
];

export const ICON_OPTIONS = ['🌅', '💼', '🤝', '💰', '🩺', '📊', '🌿', '⚡', '🌙', '🎯', '📚', '🏃‍♂️', '🔥', '🛡️', '📦'];

export const DAYS_OF_WEEK = [
  { day: 6, label: 'السبت' },
  { day: 0, label: 'الأحد' },
  { day: 1, label: 'الاثنين' },
  { day: 2, label: 'الثلاثاء' },
  { day: 3, label: 'الأربعاء' },
  { day: 4, label: 'الخميس' },
  { day: 5, label: 'الجمعة' },
];
