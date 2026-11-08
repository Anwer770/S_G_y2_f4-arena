/**
 * نظام الأدوار والصلاحيات (RBAC) — منطق نقي يستهلكه AuthContext والواجهات.
 *
 * الأدوار المدمجة أربعة (`admin/accountant/sales/viewer`) ويمكن إضافة أدوار
 * مخصّصة من تبويب «الأمان والصلاحيات» بصلاحيات حرّة؛ وحدات الشاشات تُشتق للأدوار
 * المخصّصة آلياً من الصلاحيات الممنوحة (لا جدول موازٍ يُنسى تحديثه).
 */
import type { ActiveModuleTab } from '../types';
import type { CustomRole, UserRole } from '../types/settings';

export interface RoleMeta {
  id: UserRole;
  title: string;
  description: string;
  badgeBg: string;
  badgeColor: string;
}

export const BUILTIN_ROLES: RoleMeta[] = [
  {
    id: 'admin',
    title: 'مدير النظام (Admin)',
    description: 'صلاحيات كاملة وغير مقيدة على جميع وحدات النظام والتقارير والنسخ الاحتياطي',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeColor: 'text-purple-700 dark:text-purple-300',
  },
  {
    id: 'accountant',
    title: 'أمين المخزن والمحاسب (Accountant)',
    description: 'تسجيل وتعديل القيود اليومية، سندات القبض والصرف، متابعة المخزون والقوائم المالية',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    badgeColor: 'text-teal-700 dark:text-teal-300',
  },
  {
    id: 'sales',
    title: 'مندوب مبيعات (Sales)',
    description: 'إصدار الفواتير، متابعة العملاء والأطباء والزيارات — بلا وصول للسجلات المالية الحسّاسة',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    id: 'viewer',
    title: 'مستعرض (Viewer)',
    description: 'اطلاع فقط على المخزون والعملاء والأطباء بلا أي تعديل',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeColor: 'text-slate-700 dark:text-slate-300',
  },
];

export const BUILTIN_ROLE_IDS: UserRole[] = ['admin', 'accountant', 'sales', 'viewer'];

export const ROLE_MODULE_ACCESS: Record<UserRole, ActiveModuleTab[]> = {
  admin: [
    'dashboard', 'financial', 'stock', 'tasks', 'customers', 'doctors', 'debts',
    'custody', 'knowledge', 'routines', 'links', 'taskflow', 'workos', 'settings',
  ],
  accountant: ['dashboard', 'financial', 'debts', 'custody', 'customers', 'stock', 'tasks', 'links', 'knowledge'],
  sales: ['dashboard', 'customers', 'doctors', 'tasks', 'stock', 'custody', 'links', 'knowledge'],
  viewer: ['dashboard', 'stock', 'customers', 'doctors', 'links', 'knowledge'],
};

/** الصلاحية التي تفتح كل وحدة — تُستخدم للأدوار المخصّصة فقط. */
export const PERMISSION_TO_MODULES: Record<string, ActiveModuleTab[]> = {
  fin_view: ['financial', 'debts'],
  fin_reports: ['financial'],
  inv_view: ['stock'],
  sales_view: ['customers', 'doctors'],
  sys_settings: ['settings'],
  sys_audit: ['settings'],
};

/** يشتقّ وحدات الشاشات من الصلاحيات (للأدوار المخصّصة). */
export function deriveModulesFromPermissions(permissions: string[]): ActiveModuleTab[] {
  const tabs = new Set<ActiveModuleTab>(['dashboard']);
  for (const p of permissions) (PERMISSION_TO_MODULES[p] || []).forEach((t) => tabs.add(t));
  return Array.from(tabs);
}

export const isBuiltinRole = (roleId: string): roleId is UserRole => (BUILTIN_ROLE_IDS as string[]).includes(roleId);

/** الوحدات المسموحة لدور ما: المدمج من الجدول، والمخصّص من صلاحياته. */
export function modulesForRole(
  roleId: string,
  rolePermissions: Record<string, string[]> = {},
  customRoles: CustomRole[] = []
): ActiveModuleTab[] {
  if (isBuiltinRole(roleId)) return ROLE_MODULE_ACCESS[roleId];
  const custom = customRoles.find((r) => r.id === roleId);
  const perms = custom?.permissions ?? rolePermissions[roleId] ?? [];
  return deriveModulesFromPermissions(perms);
}

/** صلاحيات دور ما مع معالجة الأدوار المحذوفة. */
export function permissionsForRole(
  roleId: string,
  rolePermissions: Record<string, string[]> = {},
  customRoles: CustomRole[] = []
): string[] {
  if (roleId === 'admin') return ['*'];
  const custom = customRoles.find((r) => r.id === roleId);
  return custom?.permissions ?? rolePermissions[roleId] ?? [];
}

export function roleLabel(roleId: string, customRoles: CustomRole[] = []): string {
  const builtin = BUILTIN_ROLES.find((r) => r.id === roleId);
  if (builtin) return builtin.title;
  return customRoles.find((r) => r.id === roleId)?.label ?? 'دور محذوف';
}

export const makeRoleId = (label: string): string =>
  `role_${String(label)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .slice(0, 24)}_${Date.now().toString(36).slice(-4)}`;

/** تحقّق من صلاحية إنشاء دور مخصّص. */
export function validateCustomRole(
  label: string,
  permissions: string[],
  existing: CustomRole[]
): string | null {
  const clean = String(label || '').trim();
  if (clean.length < 2) return 'اسم الدور مطلوب (حرفان على الأقل)';
  if (existing.some((r) => r.label.trim().toLowerCase() === clean.toLowerCase())) return `الدور «${clean}» موجود بالفعل`;
  if (!permissions.length) return 'اختر صلاحية واحدة على الأقل للدور الجديد';
  return null;
}

/** هل يمكن حذف الدور؟ (لا يُحذف دور مدمج ولا دور مستخدم به مستخدمون) */
export function canDeleteCustomRole(roleId: string, users: Array<{ role: string }>): string | null {
  if (isBuiltinRole(roleId)) return 'لا يمكن حذف الأدوار المدمجة';
  if (users.some((u) => u.role === roleId)) return 'لا يمكن حذف دور مرتبط بمستخدمين — انقلهم إلى دور آخر أولاً';
  return null;
}

/** إحصاء سريع لعرضه في الواجهة. */
export function roleCoverage(permissions: string[], total: number): number {
  if (!permissions.length) return 0;
  return Math.round((permissions.length / Math.max(total, 1)) * 100);
}
