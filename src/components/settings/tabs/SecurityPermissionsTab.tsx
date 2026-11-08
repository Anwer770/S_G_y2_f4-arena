import React, { useState } from 'react';
import { CustomRole, SystemUser } from '../../../types/settings';
import { ALL_PERMISSIONS_LIST } from '../../../utils/settingsStorage';
import { BUILTIN_ROLES, canDeleteCustomRole, makeRoleId, roleCoverage, validateCustomRole } from '../../../utils/roles';
import { ShieldCheck, Shield, Check, Lock, CheckSquare, Square, Info, Plus, Trash2, Users } from 'lucide-react';

interface Props {
  rolePermissions: Record<string, string[]>;
  onChange: (updated: Record<string, string[]>) => void;
  customRoles: CustomRole[];
  onCustomRolesChange: (roles: CustomRole[]) => void;
  users: SystemUser[];
}


export const SecurityPermissionsTab: React.FC<Props> = ({ rolePermissions, onChange, customRoles, onCustomRolesChange, users }) => {
  const [activeRole, setActiveRole] = useState<string>('accountant');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [copyFrom, setCopyFrom] = useState<string>('viewer');
  const [roleError, setRoleError] = useState('');

  const allRoles = [
    ...BUILTIN_ROLES,
    ...customRoles.map((r) => ({
      id: r.id,
      title: r.label,
      description: r.description || `دور مخصّص · ${r.permissions.length} صلاحية`,
      badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
      badgeColor: 'text-indigo-700 dark:text-indigo-300',
      custom: true,
    })),
  ];

  const addRole = () => {
    const perms = Array.from(new Set([...((rolePermissions[copyFrom] || []).slice(0, 6))]));
    const err = validateCustomRole(newRoleLabel, perms, customRoles);
    if (err) { setRoleError(err); return; }
    const role: CustomRole = {
      id: makeRoleId(newRoleLabel),
      label: newRoleLabel.trim(),
      permissions: perms,
      createdAt: new Date().toISOString(),
    };
    onCustomRolesChange([...customRoles, role]);
    onChange({ ...rolePermissions, [role.id]: perms });
    setActiveRole(role.id);
    setNewRoleLabel('');
    setRoleError('');
  };

  const deleteRole = (roleId: string) => {
    const err = canDeleteCustomRole(roleId, users);
    if (err) { setRoleError(err); return; }
    if (!window.confirm('حذف هذا الدور نهائياً؟')) return;
    onCustomRolesChange(customRoles.filter((r) => r.id !== roleId));
    const next = { ...rolePermissions };
    delete next[roleId];
    onChange(next);
    setActiveRole('accountant');
    setRoleError('');
  };

  const currentRolePerms = rolePermissions[activeRole] || [];

  const handleTogglePermission = (permId: string) => {
    if (activeRole === 'admin') {
      alert('لا يمكن تقييد صلاحيات مدير النظام لضمان عدم قفل الحساب عن الإدارة');
      return;
    }

    const hasPerm = currentRolePerms.includes(permId);
    const updatedPerms = hasPerm
      ? currentRolePerms.filter((p) => p !== permId)
      : [...currentRolePerms, permId];

    onChange({
      ...rolePermissions,
      [activeRole]: updatedPerms,
    });
  };

  const handleSelectAll = (category: string) => {
    if (activeRole === 'admin') return;
    const catPerms = ALL_PERMISSIONS_LIST.filter((p) => p.category === category).map((p) => p.id);
    const allSelected = catPerms.every((p) => currentRolePerms.includes(p));

    let nextPerms: string[];
    if (allSelected) {
      nextPerms = currentRolePerms.filter((p) => !catPerms.includes(p));
    } else {
      nextPerms = Array.from(new Set([...currentRolePerms, ...catPerms]));
    }

    onChange({
      ...rolePermissions,
      [activeRole]: nextPerms,
    });
  };

  const categories = ['الحسابات والمالية', 'المخزون والمستودعات', 'الفواتير والمبيعات', 'الإعدادات والنظام'] as const;
  const activeIsCustom = customRoles.some((r) => r.id === activeRole);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">الأمان وإدارة صلاحيات الأدوار</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تخصيص الصلاحيات الدقيقة لكل دور وظيفي وتحديد العمليات المسموح بها في المنظومة
          </p>
        </div>
      </div>

      {/* إدارة الأدوار المخصّصة */}
      <div className="surface-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> أدوار مخصّصة
          <span className="version-chip rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 text-xs font-bold">
            {customRoles.length}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          أنشئ دوراً جديداً (مثل «مراقب مخزون») بنسخ صلاحيات دور قائم ثم عدّلها. وحدات الشاشات تُشتق آلياً من الصلاحيات الممنوحة.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newRoleLabel}
            onChange={(e) => setNewRoleLabel(e.target.value)}
            placeholder="اسم الدور الجديد"
            className="w-48 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          />
          <select
            value={copyFrom}
            onChange={(e) => setCopyFrom(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            title="نسخ الصلاحيات من"
          >
            {allRoles.map((r) => (<option key={r.id} value={r.id}>نسخ من: {r.title}</option>))}
          </select>
          <button type="button" onClick={addRole}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> إنشاء دور
          </button>
          {activeIsCustom && (
            <button type="button" onClick={() => deleteRole(activeRole)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> حذف الدور الحالي
            </button>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500">تغطية الدور الحالي: {roleCoverage(currentRolePerms, ALL_PERMISSIONS_LIST.length)}%</span>
        </div>
        {roleError && <div className="text-xs font-bold text-rose-600 dark:text-rose-300">{roleError}</div>}
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {allRoles.map((r) => {
          const isSelected = activeRole === r.id;
          const count = rolePermissions[r.id]?.length || 0;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRole(r.id)}
              className={`p-4 rounded-xl border text-right transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-blue-500 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${r.badgeBg} ${r.badgeColor}`}>
                    {r.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    {count} صلاحية
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {r.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                <span className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                  {isSelected ? 'الدور المحدد حالياً' : 'انقر لتخصيص الصلاحيات'}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Role Permissions Editor */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                صلاحيات دور: {allRoles.find((r) => r.id === activeRole)?.title}
              </span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              مجموع الصلاحيات الممنوحة: {currentRolePerms.length} من أصل {ALL_PERMISSIONS_LIST.length} صلاحية
            </p>
          </div>

          {activeRole === 'admin' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Lock className="w-3.5 h-3.5" />
              مدير النظام يمتلك كافة الصلاحيات حكماً
            </span>
          )}
        </div>

        {/* Categories of Permissions */}
        <div className="space-y-6">
          {categories.map((cat) => {
            const catPerms = ALL_PERMISSIONS_LIST.filter((p) => p.category === cat);
            const allSelected = catPerms.every((p) => currentRolePerms.includes(p.id));

            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">{cat}</h4>
                  {activeRole !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleSelectAll(cat)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      {allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل في هذا القسم'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {catPerms.map((perm) => {
                    const isChecked = activeRole === 'admin' || currentRolePerms.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                          isChecked
                            ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 hover:border-slate-300'
                        } ${activeRole === 'admin' ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className={`text-xs font-bold ${isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {perm.name}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">{perm.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
