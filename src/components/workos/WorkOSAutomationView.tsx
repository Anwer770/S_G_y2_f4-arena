import React, { useState } from 'react';
import { AutomationRule } from '../../types/workos';
import {
  Cpu,
  Zap,
  CheckCircle2,
  Play,
  ToggleLeft,
  ToggleRight,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bell,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';

interface WorkOSAutomationViewProps {
  automations: AutomationRule[];
  onToggleAutomation: (id: string) => void;
  onExecuteAutomationManually: (rule: AutomationRule) => void;
  onAddAutomation?: (rule: AutomationRule) => void;
  onDeleteAutomation?: (id: string) => void;
}

export const WorkOSAutomationView: React.FC<WorkOSAutomationViewProps> = ({
  automations,
  onToggleAutomation,
  onExecuteAutomationManually,
  onAddAutomation,
  onDeleteAutomation,
}) => {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [executionNotification, setExecutionNotification] = useState<string | null>(null);

  // New Rule form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState<AutomationRule['triggerEvent']>('task_overdue');
  const [actionType, setActionType] = useState<AutomationRule['actionType']>('notify_team');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newRule: AutomationRule = {
      id: `aut_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'قاعدة سير عمل مخصصة مؤتمتة في نظام Work OS',
      triggerEvent,
      actionType,
      isActive: true,
      executionsCount: 0,
      lastExecutedAt: new Date().toISOString(),
    };

    if (onAddAutomation) {
      onAddAutomation(newRule);
    }
    setName('');
    setDescription('');
    setIsNewModalOpen(false);
    showNotice(`تمت إضافة قاعدة الأتمتة الجديدة: "${newRule.name}" بنجاح.`);
  };

  const showNotice = (msg: string) => {
    setExecutionNotification(msg);
    setTimeout(() => {
      setExecutionNotification(null);
    }, 4000);
  };

  const handleRun = (rule: AutomationRule) => {
    onExecuteAutomationManually(rule);
    showNotice(`تم تشغيل قاعدة سير العمل: "${rule.name}" وتحديث سجلات التنفيذ.`);
  };

  const getTriggerLabel = (trig: AutomationRule['triggerEvent']) => {
    switch (trig) {
      case 'task_overdue':
        return 'عند تأخر موعد تسليم المهمة';
      case 'task_completed':
        return 'عند اكتمال المهمة بنجاح';
      case 'all_subtasks_completed':
        return 'عند إنجاز كافة المهام الفرعية 100%';
      case 'project_100_percent':
        return 'عند وصول إنجاز المشروع إلى 100%';
      case 'new_customer_task':
        return 'عند إنشاء مهمة مرتبطة بعميل';
      case 'daily_plan_start':
        return 'عند بدء جلسة التخطيط الصباحية';
      default:
        return trig;
    }
  };

  const getActionLabel = (act: AutomationRule['actionType']) => {
    switch (act) {
      case 'notify_team':
        return 'إرسال تنبيه فوري للمسؤول والفريق';
      case 'create_followup_task':
        return 'توليد مهمة متابعة تلقائية';
      case 'mark_project_completed':
        return 'تحديث حالة المشروع إلى مكتمل ومؤرشف';
      case 'archive_item':
        return 'نقل العنصر إلى الأرشيف النهائي';
      case 'tag_priority_urgent':
        return 'رفع أولوية المهمة تلقائياً إلى عاجلة';
      default:
        return act;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">محرك الأتمتة وقواعد سير العمل (Automation Engine)</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {automations.filter((a) => a.isActive).length} نشطة
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تنفيذ الإجراءات التلقائية المجدولة عند تغير حالات المهام والمشاريع والمواعيد بدون تدخل يدوي
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء قاعدة أتمتة جديدة</span>
        </button>
      </div>

      {/* Live execution toast notice */}
      {executionNotification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{executionNotification}</span>
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-3.5">
        {automations.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-2xs transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                rule.isActive
                  ? 'border-slate-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700/60'
                  : 'border-slate-100 dark:border-slate-800/60 opacity-60 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 shrink-0">
                    <Zap className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{rule.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      rule.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {rule.isActive ? 'مفعّلة' : 'معطّلة مؤقتاً'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">{rule.description}</p>

                {/* Flow Pills (When -> Then) */}
                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200/60 dark:border-slate-700">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>الشرط: <strong>{getTriggerLabel(rule.triggerEvent)}</strong></span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-400 rotate-180 hidden sm:block" />
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 rounded-lg font-medium border border-teal-200/60 dark:border-teal-800">
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    <span>الإجراء: <strong>{getActionLabel(rule.actionType)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 pt-1">
                  <span>
                    مرات التنفيذ الناجحة: <strong className="font-mono text-slate-700 dark:text-slate-200">{rule.executionsCount} مرة</strong>
                  </span>
                  {rule.lastExecutedAt && (
                    <>
                      <span>•</span>
                      <span>
                        آخر تشغيل: <strong className="font-mono">{rule.lastExecutedAt.split('T')[0]}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                <button
                  onClick={() => handleRun(rule)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="تشغيل القاعدة فوراً لاختبار التأثير وسير العمل"
                >
                  <Play className="w-3.5 h-3.5 text-teal-700 dark:text-teal-300" />
                  <span>تشغيل تجريبي</span>
                </button>

                {onDeleteAutomation && (
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف قاعدة الأتمتة: "${rule.name}"؟`)) {
                        onDeleteAutomation(rule.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    title="حذف القاعدة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onToggleAutomation(rule.id)}
                  className="cursor-pointer transition hover:opacity-90"
                  title={rule.isActive ? 'تعطيل القاعدة' : 'تفعيل القاعدة'}
                >
                  {rule.isActive ? (
                    <ToggleRight className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Rule Modal */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          dir="rtl"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNewModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-lg space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">إنشاء قاعدة سير عمل وأتمتة جديدة</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم القاعدة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إشعار فوري عند اكتمال مهام التوريد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">وصف الإجراء والسلوك:</label>
                <textarea
                  rows={2}
                  placeholder="شرح مختصر لسبب تطبيق هذه القاعدة والنتيجة المتوقعة..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-hidden text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عند وقوع الحدث (Trigger):</label>
                  <select
                    value={triggerEvent}
                    onChange={(e) => setTriggerEvent(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-hidden text-xs"
                  >
                    <option value="task_overdue">تأخر موعد تسليم المهمة</option>
                    <option value="task_completed">اكتمال المهمة بنجاح</option>
                    <option value="all_subtasks_completed">إنجاز كافة المهام الفرعية</option>
                    <option value="project_100_percent">بلوغ المشروع 100% إنجاز</option>
                    <option value="new_customer_task">إنشاء مهمة خاصة بعميل</option>
                    <option value="daily_plan_start">بدء جلسة التخطيط الصباحية</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نفذ الإجراء تلقائياً (Action):</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-hidden text-xs"
                  >
                    <option value="notify_team">إرسال تنبيه فوري للمسؤول والفريق</option>
                    <option value="create_followup_task">توليد مهمة متابعة تلقائية</option>
                    <option value="mark_project_completed">تحديث حالة المشروع إلى مكتمل</option>
                    <option value="archive_item">أرشفة العنصر نهائياً</option>
                    <option value="tag_priority_urgent">رفع الأولوية إلى عاجلة</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  حفظ وتفعيل القاعدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
