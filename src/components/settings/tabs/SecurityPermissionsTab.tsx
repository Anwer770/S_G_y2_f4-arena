import React, { useState } from 'react';
import { UserRole } from '../../../types/settings';
import { ALL_PERMISSIONS_LIST } from '../../../utils/settingsStorage';
import { ShieldCheck, Shield, Check, Lock, CheckSquare, Square, Info } from 'lucide-react';

interface Props {
  rolePermissions: Record<UserRole, string[]>;
  onChange: (updated: Record<UserRole, string[]>) => void;
}

const ROLES: Array<{
  id: UserRole;
  title: string;
  description: string;
  badgeBg: string;
  badgeColor: string;
}> = [
  {
    id: 'admin',
    title: 'مدير النظام (Admin)',
    description: 'صلاحيات كاملة وغير مقيدة على جميع وحدات النظام والتقارير والنسخ الاحتياطي',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeColor: 'text-purple-700 dark:text-purple-300',
  },
  {
    id: 'accountant',
    title: 'محاسب (Accountant)',
    description: 'تسجيل وتعديل القيود اليومية، سندات القبض والصرف، ومتابعة القوائم والميزانية',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    badgeColor: 'text-teal-700 dark:text-teal-300',
  },
  {
    id: 'sales',
    title: 'موظف مبيعات (Sales)',
    description: 'إصدار الفواتير النقدية والآجلة، عروض الأسعار، واستعراض بيانات العملاء والمخزون',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    id: 'viewer',
    title: 'مشاهد (Viewer)',
    description: 'استعراض وقراءة السجلات والتقارير المالية دون إمكانية الإضافة أو التعديل أو الحذف',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeColor: 'text-slate-700 dark:text-slate-300',
  },
];

export const SecurityPermissionsTab: React.FC<Props> = ({ rolePermissions, onChange }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('accountant');

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

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map((r) => {
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
                صلاحيات دور: {ROLES.find((r) => r.id === activeRole)?.title}
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
