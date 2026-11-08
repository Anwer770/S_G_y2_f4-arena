import type { ActiveModuleTab } from '../types';

export interface SubMenuItem {
  id: string;
  label: string;
  hint?: string;
}

export interface SubMenuDefinition {
  title: string;
  items: SubMenuItem[];
}

/**
 * القوائم الفرعية الرأسية — تُعرَض في درج جانبي ملاصق للقائمة الرئيسية
 * وتتحكّم في التبويب الداخلي للشاشة عبر قناة `suite:subtab`.
 * المعرّفات يجب أن تطابق حالة التبويب الداخلية في كل وحدة.
 */
export const SUB_MENUS: Partial<Record<ActiveModuleTab, SubMenuDefinition>> = {
  dashboard: {
    title: 'لوحة التحكم',
    items: [
      { id: 'today', label: 'مهام اليوم' },
      { id: 'overdue', label: 'المتأخرة' },
      { id: 'visits', label: 'الزيارات' },
      { id: 'commitments', label: 'الالتزامات' },
      { id: 'orders_ledger', label: 'دفتر الطلبات' },
    ],
  },
  debts: {
    title: 'الديون والالتزامات',
    items: [
      { id: 'ledgers', label: 'دفاتر الديون' },
      { id: 'commitments', label: 'الالتزامات' },
      { id: 'alerts', label: 'التنبيهات' },
      { id: 'audit', label: 'سجل التعديلات' },
    ],
  },
  settings: {
    title: 'الإعدادات المركزية',
    items: [
      { id: 'lookups', label: 'القوائم والثوابت' },
      { id: 'company', label: 'بيانات الشركة' },
      { id: 'general', label: 'إعدادات عامة' },
      { id: 'inventory', label: 'المخزون' },
      { id: 'fiscalYear', label: 'السنة المالية' },
      { id: 'notifications', label: 'الإشعارات' },
      { id: 'printer', label: 'إعدادات الطابعة' },
      { id: 'users', label: 'المستخدمون' },
      { id: 'security', label: 'الأمان والصلاحيات' },
      { id: 'audit', label: 'سجل التدقيق' },
      { id: 'databases', label: 'قواعد البيانات' },
      { id: 'about', label: 'عن التطبيق' },
    ],
  },
};

export const hasSubMenu = (tab: ActiveModuleTab): boolean => Boolean(SUB_MENUS[tab]?.items.length);
