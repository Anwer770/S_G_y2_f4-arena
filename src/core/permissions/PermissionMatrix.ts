import { UserRole } from '../../types/settings';
import { ActiveModuleTab } from '../../types';

export interface RolePermissions {
  role: UserRole;
  roleNameAr: string;
  allowedModules: ActiveModuleTab[];
  canModifyFinance: boolean;
  canModifyInventory: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canAccessSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    role: 'admin',
    roleNameAr: 'مدير النظام (تحكم كامل)',
    allowedModules: [
      'dashboard',
      'customers',
      'financial',
      'stock',
      'debts',
      'custody',
      'workos',
      'routines',
      'knowledge',
      'doctors',
      'links',
      'settings',
    ],
    canModifyFinance: true,
    canModifyInventory: true,
    canManageUsers: true,
    canExportData: true,
    canAccessSettings: true,
  },
  accountant: {
    role: 'accountant',
    roleNameAr: 'محاسب مالي معتمد',
    allowedModules: [
      'dashboard',
      'financial',
      'customers',
      'debts',
      'custody',
      'stock',
      'links',
      'knowledge',
      'settings',
    ],
    canModifyFinance: true,
    canModifyInventory: false,
    canManageUsers: false,
    canExportData: true,
    canAccessSettings: false,
  },
  sales: {
    role: 'sales',
    roleNameAr: 'مندوب تسويق ومبيعات ميداني',
    allowedModules: [
      'dashboard',
      'customers',
      'doctors',
      'stock',
      'workos',
      'routines',
      'knowledge',
      'links',
    ],
    canModifyFinance: false,
    canModifyInventory: false,
    canManageUsers: false,
    canExportData: false,
    canAccessSettings: false,
  },
  viewer: {
    role: 'viewer',
    roleNameAr: 'مستعرض / مراقب (قراءة فقط)',
    allowedModules: ['dashboard', 'knowledge', 'links'],
    canModifyFinance: false,
    canModifyInventory: false,
    canManageUsers: false,
    canExportData: true,
    canAccessSettings: false,
  },
};

export function isModuleAllowedForRole(role: UserRole, tab: ActiveModuleTab): boolean {
  const perm = ROLE_PERMISSIONS[role];
  if (!perm) return false;
  return perm.allowedModules.includes(tab);
}
