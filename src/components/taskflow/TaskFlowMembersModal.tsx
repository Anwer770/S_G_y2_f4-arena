import React, { useState } from 'react';
import { TaskFlowMember, TaskFlowRole } from '../../types/taskflow';
import {
  X,
  Plus,
  Users,
  Shield,
  User,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Briefcase,
  UserCheck,
  UserX,
} from 'lucide-react';

interface TaskFlowMembersModalProps {
  isOpen: boolean;
  members: TaskFlowMember[];
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onSaveMember: (member: TaskFlowMember) => void;
  onDeleteMember?: (memberId: string) => void;
  onToggleActive: (memberId: string) => void;
}

const AVATAR_COLORS = [
  '#4f46e5', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#64748b', // Slate
];

export const TaskFlowMembersModal: React.FC<TaskFlowMembersModalProps> = ({
  isOpen,
  members,
  currentUserId,
  isAdmin,
  onClose,
  onSaveMember,
  onDeleteMember,
  onToggleActive,
}) => {
  if (!isOpen) return null;

  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<TaskFlowMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<TaskFlowRole>('member');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState('');

  const resetForm = () => {
    setIsAdding(false);
    setEditingMember(null);
    setName('');
    setEmail('');
    setJobTitle('');
    setRole('member');
    setError('');
  };

  const startEdit = (m: TaskFlowMember) => {
    setEditingMember(m);
    setIsAdding(false);
    setName(m.name);
    setEmail(m.email);
    setJobTitle(m.jobTitle || '');
    setRole(m.role);
    setAvatarColor(m.avatarColor || AVATAR_COLORS[0]);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم العضو');
      return;
    }

    if (editingMember) {
      const updated: TaskFlowMember = {
        ...editingMember,
        name: name.trim(),
        email: email.trim(),
        jobTitle: jobTitle.trim(),
        role,
        avatarColor,
      };
      onSaveMember(updated);
    } else {
      const newMember: TaskFlowMember = {
        id: `mem-${Date.now()}`,
        name: name.trim(),
        email: email.trim() || `${Date.now()}@team.local`,
        jobTitle: jobTitle.trim(),
        role,
        avatarColor,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onSaveMember(newMember);
    }

    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">إدارة فريق العمل (Team Members)</h3>
              <p className="text-xs text-slate-500">
                إضافة وتعيين المسؤولين وتحديد الأدوار بدون تعقيد كلمات المرور
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Form when Adding or Editing Member */}
          {(isAdding || editingMember) && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>{editingMember ? 'تعديل بيانات العضو' : 'إضافة عضو جديد للفريق'}</span>
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  إلغاء
                </button>
              </div>

              {error && <div className="text-xs font-bold text-rose-600">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: د. ماجد السقاف"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي / الاختصاص</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثال: مسؤول دعاية طبية / مشرف مبيعات"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد أو الهاتف (اختياري)</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com أو رقم الهاتف"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الدور والصلاحية</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as TaskFlowRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="member">عضو فريق (Staff / Member) - إدارة المهام والمتابعة</option>
                    <option value="admin">مدير (Admin) - إدارة المشاريع والأعضاء</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">لون الأفاتار المميز</label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        avatarColor === c ? 'scale-125 ring-2 ring-indigo-600 ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-xs hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingMember ? 'حفظ التعديلات' : 'إضافة العضو'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">أعضاء الفريق الحاليين ({members.length})</span>
              {!isAdding && !editingMember && (
                <button
                  onClick={() => {
                    setIsAdding(true);
                    setEditingMember(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>عضو جديد</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">{m.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            m.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.role === 'admin' ? '👑 مدير (Admin)' : '👤 عضو (Member)'}
                        </span>
                        {!m.isActive && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-700">
                            معطل
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        {m.jobTitle && <span className="font-medium text-slate-700">{m.jobTitle}</span>}
                        {m.jobTitle && m.email && <span>•</span>}
                        {m.email && <span className="font-mono text-slate-400">{m.email}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle Role */}
                    <button
                      onClick={() => {
                        const newRole: TaskFlowRole = m.role === 'admin' ? 'member' : 'admin';
                        onSaveMember({ ...m, role: newRole });
                      }}
                      title="تبديل الصلاحية بين مدير وعضو"
                      className="px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold border border-slate-200 transition-colors"
                    >
                      {m.role === 'admin' ? 'تحويل لعضو' : 'ترقية لمدير'}
                    </button>

                    {/* Edit Member */}
                    <button
                      onClick={() => startEdit(m)}
                      title="تعديل بيانات العضو"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Toggle Active */}
                    <button
                      onClick={() => onToggleActive(m.id)}
                      title={m.isActive ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        m.isActive
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      {m.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    </button>

                    {/* Delete Member */}
                    {onDeleteMember && members.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف العضو (${m.name})؟`)) {
                            onDeleteMember(m.id);
                          }
                        }}
                        title="حذف العضو"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
