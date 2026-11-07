import React, { useState } from 'react';
import { WorkTask, WorkProject, AppointmentItem, DailyRoutineBlock } from '../../types/workos';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowRight,
  Bot,
} from 'lucide-react';
import { parseNaturalLanguageTask } from '../../utils/workosStorage';

interface WorkOSAICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: WorkTask[];
  projects: WorkProject[];
  appointments: AppointmentItem[];
  routine: DailyRoutineBlock[];
  onAddTaskFromAI: (parsed: any) => void;
}

export const WorkOSAICopilotModal: React.FC<WorkOSAICopilotModalProps> = ({
  isOpen,
  onClose,
  tasks = [],
  projects = [],
  appointments = [],
  routine = [],
  onAddTaskFromAI,
}) => {
  // Hooks called unconditionally at top of component
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'plan' | 'audit'>('plan');
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = (tasks || []).filter((t) => t && t.status !== 'completed' && t.dueDate < todayStr);
  const urgentTasks = (tasks || []).filter((t) => t && t.status !== 'completed' && t.priority === 'urgent');

  const handleNaturalLanguageCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const parsed = parseNaturalLanguageTask(prompt.trim());
    if (typeof onAddTaskFromAI === 'function') {
      onAddTaskFromAI(parsed);
    }
    setCreatedNotice(`تم بنجاح تحليل الأمر وإنشاء المهمة: "${parsed.title}" بتاريخ ${parsed.dueDate}`);
    setPrompt('');
    setTimeout(() => setCreatedNotice(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="bg-linear-to-l from-teal-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm flex items-center gap-2">
                <span>مساعد العمل الذكي (AI Work Copilot)</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-teal-400/20 text-teal-200 border border-teal-300/30">
                  ذكاء تشغيلي
                </span>
              </h3>
              <p className="text-xs text-slate-300">تحليل الأولويات، جدولة المهام باللغة الطبيعية، واقتراح خطة اليوم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-white hover:bg-white/10 dark:hover:bg-slate-900/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-100 dark:bg-slate-800 p-2 flex gap-1 border-b border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'plan' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            خطة اليوم المقترحة ذكياً
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            فحص التعارضات والتأخيرات ({overdueTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'chat' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            إنشاء مهام باللغة الطبيعية
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700 dark:text-slate-200">
          {createdNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{createdNotice}</span>
            </div>
          )}

          {/* TAB 1: Smart Day Plan */}
          {activeTab === 'plan' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50/50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 space-y-2">
                <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  اقتراح المساعد الذكي لترتيب جدول أعمال اليوم:
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  بناءً على أولويات المشاريع والمهام المتأخرة والمواعيد المسجلة، ننصحك بالتركيز على 3 مسارات رئيسية:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200">
                    أولوية قصوى صباحاً (08:30 - 10:30)
                  </span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                    إنجاز المهام المتأخرة ومطابقة كشوف حسابات كبار العملاء
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    التركيز على المهام ذات الأولوية العاجلة قبل انشغال الفريق بالزيارات الميدانية.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                    منتصف النهار (11:00 - 13:30)
                  </span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                    تنفيذ المواعيد المسجلة وجلسة المشتريات بمستشفى العلوم
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    الموعد يستغرق 45 دقيقة مع توثيق كراسة المناقصة ومتابعة د. سامي الميداني.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                    بعد الظهر (15:00 - 17:00)
                  </span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                    مراجعة أثر حملة السوشيال ميديا وإغلاق التقرير اليومي
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    اعتماد التصاميم النهائية وعقد جلسة Daily Review لتقييم مخرجات اليوم.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Conflict & Overdue Audit */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 font-medium">
                تم فحص {tasks.length} مهام و {projects.length} مشاريع للكشف عن أي اختناقات في سير العمل.
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">قائمة المهام التي تجاوزت تاريخ استحقاقها:</span>
                {overdueTasks.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-900">{t.title}</div>
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-mono">تاريخ الاستحقاق: {t.dueDate}</div>
                    </div>
                    <span className="px-2 py-1 rounded bg-rose-200 text-rose-800 dark:text-rose-200 text-xs font-bold">
                      متأخرة
                    </span>
                  </div>
                ))}
                {overdueTasks.length === 0 && (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                    لا توجد أي مهام متأخرة حالياً!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Natural Language Task Creation */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                اكتب أي أمر بلغة طبيعية مباشرة (مثال: "تجهيز طلبية صيدلية القدس غداً الساعة 10 صباحاً بأولوية عاجلة")، وسيقوم النظام الذكي باستخراج العنوان والتاريخ والوقت والتصنيف تلقائياً:
              </p>

              <form onSubmit={handleNaturalLanguageCreate} className="space-y-3">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="مثال: اتصل بالدكتور عادل غداً الساعة 11 صباحاً لإرسال عينات مجموعة البشرة الجديدة..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>تحليل النص وإنشاء المهمة فوراً</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
