import React from 'react';
import { TaskFlowMember } from '../../types/taskflow';
import {
  X,
  UserCheck,
  Shield,
  ArrowRightLeft,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';

interface TaskFlowUserSwitchModalProps {
  isOpen: boolean;
  currentUser: TaskFlowMember;
  members: TaskFlowMember[];
  onClose: () => void;
  onSwitchUser: (member: TaskFlowMember) => void;
}

export const TaskFlowUserSwitchModal: React.FC<TaskFlowUserSwitchModalProps> = ({
  isOpen,
  currentUser,
  members,
  onClose,
  onSwitchUser,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">تبديل المستخدم النشط</h3>
              <p className="text-xs text-slate-500">
                اختيار صفة المنفذ للعمليات دون الحاجة لتسجيل دخول أو كلمات مرور
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
        <div className="p-6 space-y-5">
          {/* Active User Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-bold">المستخدم النشط حالياً:</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                  currentUser.role === 'admin'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {currentUser.role === 'admin' ? '👑 مدير النظام (Admin)' : '👤 عضو فريق (Member)'}
              </span>
            </div>
            <div className="text-sm font-black text-slate-900">{currentUser.name}</div>
            {currentUser.jobTitle && (
              <div className="text-xs text-slate-500 font-medium">{currentUser.jobTitle}</div>
            )}
            <p className="text-xs text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
              {currentUser.role === 'admin'
                ? 'صلاحيات المدير: إضافة المشاريع، إدارة الأعضاء، ضبط التوزيع، وتعديل كافة المهام.'
                : 'صلاحيات العضو: إنشاء المهام الجديدة، تحديث الحالات، وتعديل التواريخ والملاحظات.'}
            </p>
          </div>

          {/* Quick Member Selection List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span>اختر عضواً للعمل بصفته فوراً:</span>
            </span>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
              {members.map((m) => {
                const isSelected = m.id === currentUser.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSwitchUser(m);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-right transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-2 border-indigo-500 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="text-xs font-black text-slate-900 truncate">{m.name}</div>
                        <div className="text-xs text-slate-500 font-medium truncate">
                          {m.jobTitle || m.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 mr-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                          m.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 font-bold" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              تم استبعاد شاشات تسجيل الدخول وكلمات المرور لتسهيل التجربة والتعاون المباشر بنقرة واحدة.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
