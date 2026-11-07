import React, { useState } from 'react';
import { SystemUser, UserRole } from '../../../types/settings';
import { Users, Plus, Edit2, Trash2, Shield, CheckCircle2, XCircle, Mail, Phone, Lock, X } from 'lucide-react';

interface Props {
  users: SystemUser[];
  onChange: (updated: SystemUser[]) => void;
}

const ROLE_LABELS: Record<UserRole, { title: string; color: string; bg: string }> = {
  admin: { title: 'مدير النظام', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-950/70' },
  accountant: { title: 'محاسب', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-100 dark:bg-teal-950/70' },
  sales: { title: 'موظف مبيعات', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-950/70' },
  viewer: { title: 'مشاهد فقط', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
};

export const UsersTab: React.FC<Props> = ({ users, onChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('accountant');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const openAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('accountant');
    setFormStatus('active');
    setModalOpen(true);
  };

  const openEditModal = (user: SystemUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormStatus(user.status);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('يرجى كتابة الاسم والبريد الإلكتروني');
      return;
    }

    if (editingUser) {
      onChange(
        users.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formName.trim(),
                email: formEmail.trim(),
                phone: formPhone.trim(),
                role: formRole,
                status: formStatus,
              }
            : u
        )
      );
    } else {
      const newUser: SystemUser = {
        id: `usr-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole,
        status: formStatus,
        avatarInitial: formName.trim().charAt(0),
        lastLogin: 'لم يسجل دخول بعد',
        createdAt: new Date().toISOString().split('T')[0],
      };
      onChange([...users, newUser]);
    }

    setModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) {
      alert('لا يمكن حذف المستخدم الأخير في النظام');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      onChange(users.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">إدارة المستخدمين وحسابات الدخول</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              إضافة وتعيين أدوار الموظفين، المحاسبين، ومندوبي المبيعات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Users Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
          <table className="w-full text-right border-collapse text-xs min-w-[820px] print:min-w-0">
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 shadow-2xs select-none">
              <tr>
                <th className="py-2.5 px-3 sticky right-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">المستخدم</th>
                <th className="py-2.5 px-3">البريد الإلكتروني</th>
                <th className="py-2.5 px-3">الهاتف</th>
                <th className="py-2.5 px-3">الدور الوظيفي</th>
                <th className="py-2.5 px-3">الحالة</th>
                <th className="py-2.5 px-3">آخر تسجيل دخول</th>
                <th className="py-2.5 px-3 text-center sticky left-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] w-24">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {users.map((user) => {
                const roleMeta = ROLE_LABELS[user.role] || ROLE_LABELS.viewer;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="py-2 px-3 sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50/90 dark:group-hover:bg-slate-800/80 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {user.avatarInitial || user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">انضم: {user.createdAt}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{user.email}</td>

                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{user.phone || '—'}</td>

                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border border-current/20 ${roleMeta.bg} ${roleMeta.color}`}
                      >
                        <Shield className="w-3 h-3" />
                        {roleMeta.title}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                          <XCircle className="w-2.5 h-2.5" />
                          معطل
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-xs">{user.lastLogin || 'اليوم'}</td>

                    <td className="py-2 px-3 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50/90 dark:group-hover:bg-slate-800/80 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="تعديل المستخدم"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد للنظام'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الاسم الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  البريد الإلكتروني (لتسجيل الدخول) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="user@qeema.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500 text-left"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+967 77..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500 text-left"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الدور الوظيفي والصلاحيات
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-hidden cursor-pointer"
                >
                  <option value="admin">مدير النظام (كامل الصلاحيات)</option>
                  <option value="accountant">محاسب (الحسابات، السندات، القيود)</option>
                  <option value="sales">موظف مبيعات (فواتير، عملاء، مخزون)</option>
                  <option value="viewer">مشاهد فقط (اطلاع واستعراض فقط)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  حالة الحساب
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('active')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      formStatus === 'active'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    نشط (Active)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('inactive')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      formStatus === 'inactive'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    معطل (Inactive)
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
