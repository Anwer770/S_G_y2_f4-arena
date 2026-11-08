/**
 * القوائم والثوابت المركزية (Master Lookups) — مصدر واحد موثوق للبيانات.
 *
 * كل قائمة منسدلة في النظام (فئات المخزون · المسؤولون · المستفيدون · درجات الأهمية ·
 * حالات الحركات) تُقرأ من هنا عبر `useLookups()` بدل تكرارها نصياً في كل شاشة.
 *
 * التخزين: `suite_lookups_v1` في طبقة `dbStorage`، ويُدرَج تلقائياً في النسخة
 * الاحتياطية الموحدة (`createUnifiedBackup`) ويُستعاد معها.
 */

export type LookupKind = 'categories' | 'owners' | 'beneficiaries' | 'statuses' | 'grades';

export type GradeTone = 'rose' | 'amber' | 'emerald' | 'sky' | 'slate';

export interface LookupItem {
  id: string;
  label: string;
  order: number;
  active: boolean;
}

export interface GradeItem extends LookupItem {
  tone: GradeTone;
  /** وصف مختصر يظهر في تلميح العنصر */
  hint?: string;
}

export interface LookupsState {
  version: 1;
  updatedAt: string;
  categories: LookupItem[];
  owners: LookupItem[];
  beneficiaries: LookupItem[];
  statuses: LookupItem[];
  grades: GradeItem[];
}

export const LOOKUPS_STORAGE_KEY = 'suite_lookups_v1';

const item = (id: string, label: string, order: number): LookupItem => ({ id, label, order, active: true });

export const DEFAULT_LOOKUPS: LookupsState = {
  version: 1,
  updatedAt: '2026-11-08T00:00:00.000Z',
  categories: [
    item('cat-care', 'عناية وتجميل', 1),
    item('cat-devices', 'أجهزة ومعدات', 2),
    item('cat-services', 'خدمات', 3),
    item('cat-samples', 'عينات مجانية', 4),
    item('cat-supplies', 'مستلزمات', 5),
    item('cat-other', 'أخرى', 6),
  ],
  owners: [
    item('own-anwar', 'أنور', 1),
    item('own-saddam', 'صدام', 2),
    item('own-akhlaki', 'الأكحلي', 3),
    item('own-hamli', 'الهاملي', 4),
    item('own-abdulrahman', 'عبد الرحمن', 5),
    item('own-jamal', 'جمال', 6),
    item('own-mohammed', 'محمد', 7),
  ],
  beneficiaries: [
    item('ben-customers', 'العملاء', 1),
    item('ben-doctors', 'الأطباء', 2),
    item('ben-suppliers', 'الموردون', 3),
    item('ben-internal', 'حسابات داخلية', 4),
  ],
  statuses: [
    item('st-planned', 'مخطط', 1),
    item('st-progress', 'قيد التنفيذ', 2),
    item('st-done', 'مكتمل', 3),
    item('st-cancelled', 'منصرِف', 4),
    item('st-late', 'متأخر', 5),
    item('st-hold', 'معلّق', 6),
  ],
  grades: [
    { id: 'gr-a', label: 'A', hint: 'عالي الأهمية', tone: 'rose', order: 1, active: true },
    { id: 'gr-b', label: 'B', hint: 'متوسط الأهمية', tone: 'amber', order: 2, active: true },
    { id: 'gr-c', label: 'C', hint: 'منخفض الأهمية', tone: 'emerald', order: 3, active: true },
    { id: 'gr-root', label: '√', hint: 'مستهدف', tone: 'sky', order: 4, active: true },
  ],
};

export const LOOKUP_META: Record<
  LookupKind,
  { title: string; description: string; addPlaceholder: string; usedBy: string }
> = {
  categories: {
    title: 'فئات التصنيف',
    description: 'فئات الأصناف والحركات الموحدة',
    addPlaceholder: 'مثال: عناية وتجميل',
    usedBy: 'المخزون · الديون · المهام',
  },
  owners: {
    title: 'المسؤولون',
    description: 'الأسماء الثابتة للمسؤولين عن الحسابات والمهام',
    addPlaceholder: 'مثال: أنور',
    usedBy: 'الديون · الزيارات · المهام',
  },
  beneficiaries: {
    title: 'المستفيدون',
    description: 'جهات الاستفادة المعتمدة في الحركات',
    addPlaceholder: 'مثال: العملاء',
    usedBy: 'المخزون · السجل اليومي',
  },
  statuses: {
    title: 'حالات الحركات والطلبات',
    description: 'حالات موحّدة بين الزيارات والمخزون والمهام',
    addPlaceholder: 'مثال: معلّق',
    usedBy: 'الزيارات · المخزون · المهام',
  },
  grades: {
    title: 'مستويات الأهمية',
    description: 'درجات الأهمية مع لون ومؤشر بصري واضح',
    addPlaceholder: 'مثال: D',
    usedBy: 'العملاء · الأطباء · السجل المالي',
  },
};

export const GRADE_TONE_CLASSES: Record<GradeTone, { chip: string; dot: string; label: string }> = {
  rose: {
    chip: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
    label: 'أحمر — عالي',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
    label: 'ذهبي — متوسط',
  },
  emerald: {
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    label: 'أخضر — منخفض',
  },
  sky: {
    chip: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    dot: 'bg-sky-500',
    label: 'أزرق — مستهدف',
  },
  slate: {
    chip: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
    label: 'رمادي — محايد',
  },
};

/** يعيد التسميات النشطة مرتّبة — هذه هي التي تُغذّي القوائم المنسدلة. */
export function activeLabels(state: LookupsState, kind: LookupKind): string[] {
  const list = kind === 'grades' ? state.grades : state[kind];
  return [...list]
    .filter((i) => i.active)
    .sort((a, b) => a.order - b.order)
    .map((i) => i.label);
}

export function findGrade(state: LookupsState, label: string): GradeItem | undefined {
  return state.grades.find((g) => g.label === label);
}
