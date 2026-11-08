/**
 * تصنيفات الديون وفهارس الدفاتر — مستخرجة من utils/debts.ts (R30).
 */
import { DebtBookId } from '../../types';

export const DEBT_CATEGORIES = [
  'أعمال الالتزامات',
  'ديون شخصية',
  'إيجار ومصاريف سكن',
  'فواتير وخدمات',
  'مشتريات وبضائع',
  'عهدة وتحصيل',
  'أقساط ومستحقات',
  'حسابات تجارية',
  'أخرى',
];

export const DEBT_OWNERS = [
  'أنور',
  'زها',
  'علي القات',
  'أحمد',
  'صدام',
  'عمار',
  'عبدالرحمن',
  'الأكحلي',
  'جمال',
  'محمد',
  'المؤسسة',
];

export const DEBT_ICONS = [
  { symbol: '★', name: 'وضع خاص (Special Condition)', color: 'text-amber-500 bg-amber-50' },
  { symbol: '⚐', name: 'يحتاج تأكيد (Need to Confirm)', color: 'text-blue-500 bg-blue-50' },
  { symbol: '⚑', name: 'مؤكد (Confirmed)', color: 'text-emerald-500 bg-emerald-50' },
  { symbol: '✔', name: 'مكتمل / منجز (Completed)', color: 'text-slate-500 bg-slate-100' },
  { symbol: '✖', name: 'لم يظهر (No Show)', color: 'text-rose-500 bg-rose-50' },
  { symbol: '⏸', name: 'استراحة / خارج المكتب (Break)', color: 'text-purple-500 bg-purple-50' },
];

export const DEBT_BOOKS_META: Record<
  DebtBookId,
  { title: string; subtitle: string; description: string; badge: string; color: string }
> = {
  anwar: {
    title: 'دفتر دين أنور',
    subtitle: 'سجل المديونيات والمسحوبات الخاصة',
    description: 'توثيق مسحوبات ومديونيات أنور والالتزامات المترتبة',
    badge: 'دين أنور',
    color: 'amber',
  },
  previous: {
    title: 'حساب دين سابق',
    subtitle: 'الديون والمستحقات السابقة ومتعددة العملات',
    description: 'تسوية القيود والديون السابقة بالريال اليمني والسعودي',
    badge: 'دين سابق',
    color: 'indigo',
  },
  zaha: {
    title: 'دين أنور – زها',
    subtitle: 'الحسابات المشتركة والالتزامات المتبادلة',
    description: 'توثيق المديونيات المشتركة بالريال اليمني والدولار الأمريكي',
    badge: 'أنور-زها',
    color: 'purple',
  },
  ali_qat: {
    title: 'حساب علي القات',
    subtitle: 'الدفتر اليومي والرصيد التراكمي (له / عليه)',
    description: 'تسجيل الحركات اليومية مع الرصيد التراكمي المستمر',
    badge: 'علي القات',
    color: 'emerald',
  },
};

// ============================================================================
// INITIAL SEED DATA (EXCEL JARD APPENDIX)
// ============================================================================

// 1. دين أنور (26 records)
