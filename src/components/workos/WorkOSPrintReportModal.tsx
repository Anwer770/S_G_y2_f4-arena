import React, { useRef } from 'react';
import { WorkTask, WorkProject, TeamMember } from '../../types/workos';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Target,
  BarChart3,
  Layers,
} from 'lucide-react';

interface WorkOSPrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: WorkTask[];
  projects: WorkProject[];
  team: TeamMember[];
  onExportExcel?: () => void;
}

export const WorkOSPrintReportModal: React.FC<WorkOSPrintReportModalProps> = ({
  isOpen,
  onClose,
  tasks = [],
  projects = [],
  team = [],
  onExportExcel,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr
  );
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed');

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const printDate = new Date().toLocaleDateString('ar-YE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const printTime = new Date().toLocaleTimeString('ar-YE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white dark:print:bg-slate-900"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #fff !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-container {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] print:max-h-none print:h-auto print-container my-auto">
        {/* Modal Toolbar (Hidden during print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 print-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">تقرير إنجاز منظومة العمل والمشاريع Work OS</h2>
              <p className="text-xs text-slate-400">معاينة التقرير الرسمي الشامل وجاهز للطباعة والتصدير</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div ref={printRef} className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 print:p-0 print:overflow-visible">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    Q
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      مجموعة القيصر للحلول والمشاريع المتكاملة
                    </h1>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      تقرير أداء المشاريع والمهام التنفيذية • Work OS Engine
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-left text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  <span className="text-slate-500 ml-1">تاريخ الإصدار:</span>
                  <span>{printDate}</span>
                </div>
                <div className="font-mono text-slate-500">
                  <span className="ml-1">وقت الطباعة:</span>
                  <span>{printTime}</span>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-900 border border-teal-300">
                  تقرير رسمي معتمد
                </div>
              </div>
            </div>
          </div>

          {/* Key Executive KPI Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي المهام التشغيلية:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{tasks.length}</span>
                <span className="text-xs text-slate-500">مهمة</span>
              </div>
              <span className="text-xs text-emerald-700 font-bold mt-1 block">
                مكتمل: {completedTasks.length} ({completionRate}%)
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-500 block mb-1">المشاريع النشطة:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-indigo-700 dark:text-indigo-400">
                  {projects.filter((p) => p.status === 'active').length}
                </span>
                <span className="text-xs text-slate-500">من أصل {projects.length}</span>
              </div>
              <span className="text-xs text-slate-500 font-bold mt-1 block">مشاريع قيد الإنجاز</span>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
              <span className="text-xs font-bold text-rose-700 block mb-1">المهام المتأخرة والحرجة:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-rose-700">{overdueTasks.length}</span>
                <span className="text-xs text-rose-600">متأخرة</span>
              </div>
              <span className="text-xs text-amber-700 font-bold mt-1 block">
                عاجلة جداً: {urgentTasks.length}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-500 block mb-1">ساعات العمل الفعلية / المقدرة:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-teal-700 dark:text-teal-400">{totalActualHours}</span>
                <span className="text-xs text-slate-500">ساعة</span>
              </div>
              <span className="text-xs text-slate-500 font-bold mt-1 block">
                المقدر: {totalEstimatedHours} س
              </span>
            </div>
          </div>

          {/* Projects Breakdown */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                ملخص إنجاز المشاريع الكبرى ({projects.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300">
                      <th className="py-2 px-3">كود المشروع</th>
                      <th className="py-2 px-3">اسم المشروع</th>
                      <th className="py-2 px-3">الفئة / القسم</th>
                      <th className="py-2 px-3 text-center">المهام الكلية</th>
                      <th className="py-2 px-3 text-center">المنجزة</th>
                      <th className="py-2 px-3 text-center">نسبة الإنجاز</th>
                      <th className="py-2 px-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {projects.map((proj) => {
                      const pTasks = tasks.filter((t) => t.projectId === proj.id);
                      const pDone = pTasks.filter((t) => t.status === 'completed');
                      const rate = pTasks.length > 0 ? Math.round((pDone.length / pTasks.length) * 100) : proj.progress || 0;
                      return (
                        <tr key={proj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{proj.code || proj.id}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{proj.name}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{proj.category || 'عام'}</td>
                          <td className="py-2 px-3 text-center font-mono">{pTasks.length}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">{pDone.length}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              {rate}%
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                              proj.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : proj.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {proj.status === 'active' ? 'نشط' : proj.status === 'completed' ? 'مكتمل' : 'مخطط'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active & High Priority Tasks Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              كشف المهام التشغيلية التفصيلي ({tasks.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300">
                    <th className="py-2 px-3">رقم المهمة</th>
                    <th className="py-2 px-3">عنوان المهمة</th>
                    <th className="py-2 px-3">المسؤول</th>
                    <th className="py-2 px-3">تاريخ الاستحقاق</th>
                    <th className="py-2 px-3 text-center">الأولوية</th>
                    <th className="py-2 px-3 text-center">الإنجاز</th>
                    <th className="py-2 px-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {tasks.slice(0, 50).map((t) => {
                    const assignee = team.find((m) => m.id === t.assigneeId);
                    const isOverdue = t.status !== 'completed' && t.dueDate && t.dueDate < todayStr;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{t.taskNumber || t.id}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          <div>{t.title}</div>
                          {t.description && (
                            <div className="text-2xs text-slate-500 font-normal truncate max-w-xs">{t.description}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{assignee?.name || 'غير محدد'}</td>
                        <td className={`py-2 px-3 font-mono ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {t.dueDate || '—'}
                          {isOverdue && <span className="mr-1 text-2xs">(متأخرة)</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                            t.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : t.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.priority === 'urgent' ? 'حرجة' : t.priority === 'high' ? 'عالية' : 'متوسطة'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-teal-800">{t.progress || 0}%</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                            t.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.status === 'completed' ? 'منجزة' : t.status === 'in_progress' ? 'جارية' : 'مخططة'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {tasks.length > 50 && (
              <p className="text-2xs text-slate-500 text-center pt-1">
                * تم عرض أول 50 مهمة في هذه المعاينة الورقية. للتفاصيل الكاملة، استخدم زر تصدير Excel.
              </p>
            )}
          </div>

          {/* Official Sign-off and Footer */}
          <div className="pt-8 mt-6 border-t-2 border-slate-300 dark:border-slate-700 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <span className="block text-slate-500 font-bold mb-8">إعداد ومتابعة العمليات:</span>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
            </div>
            <div>
              <span className="block text-slate-500 font-bold mb-8">مدير المشاريع والمراجعة:</span>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
            </div>
            <div>
              <span className="block text-slate-500 font-bold mb-8">اعتماد الإدارة العامة:</span>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
