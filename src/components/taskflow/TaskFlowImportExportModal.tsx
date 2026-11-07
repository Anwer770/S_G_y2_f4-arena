import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  TaskFlowTask,
  TaskFlowProject,
  TaskFlowMember,
} from '../../types/taskflow';
import {
  exportTaskFlowToExcel,
  resetTaskFlowSampleData,
  downloadTaskFlowExcelTemplate,
} from '../../utils/taskflowStorage';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Sparkles,
  FileDown,
} from 'lucide-react';

interface TaskFlowImportExportModalProps {
  isOpen: boolean;
  tasks: TaskFlowTask[];
  projects: TaskFlowProject[];
  members: TaskFlowMember[];
  onClose: () => void;
  onImportTasks: (importedTasks: TaskFlowTask[]) => void;
  onResetData: () => void;
}

export const TaskFlowImportExportModal: React.FC<TaskFlowImportExportModalProps> = ({
  isOpen,
  tasks,
  projects,
  members,
  onClose,
  onImportTasks,
  onResetData,
}) => {
  if (!isOpen) return null;

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File Upload Handler (Excel or CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportStatus('جارٍ قراءة الملف وتحليله...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rows || rows.length === 0) {
          setError('الملف المرفق فارغ أو لا يحتوي على صفوف بيانات صالحة.');
          setImportStatus(null);
          return;
        }

        const projectMap = new Map(projects.map((p) => [p.name.trim(), p.id]));
        const memberMap = new Map(members.map((m) => [m.name.trim(), m.id]));
        const todayStr = new Date().toISOString().split('T')[0];

        const imported: TaskFlowTask[] = rows.map((row, idx) => {
          const title =
            row['عنوان المهمة'] ||
            row['المهمة'] ||
            row['Title'] ||
            row['Task'] ||
            row['الاسم'] ||
            `مهمة مستوردة #${idx + 1}`;

          const projName = row['المشروع'] || row['Project'] || '';
          const assigneeName = row['المسؤول'] || row['الشخص'] || row['Assignee'] || '';
          const statusRaw = row['الحالة'] || row['Status'] || '';
          const sDate = row['تاريخ البداية'] || row['Start Date'] || todayStr;
          const dDate = row['تاريخ الاستحقاق'] || row['Due Date'] || todayStr;

          let status: 'todo' | 'in_progress' | 'completed' = 'todo';
          if (typeof statusRaw === 'string') {
            if (statusRaw.includes('مكتمل') || statusRaw.toLowerCase().includes('complete')) {
              status = 'completed';
            } else if (statusRaw.includes('تنفيذ') || statusRaw.toLowerCase().includes('progress')) {
              status = 'in_progress';
            }
          }

          return {
            id: `tf-imp-${Date.now()}-${idx}`,
            title: String(title),
            description: row['الوصف'] || row['Description'] || '',
            projectId: projectMap.get(projName) || projects[0]?.id || 'proj-1',
            assigneeId: memberMap.get(assigneeName) || members[0]?.id,
            status,
            startDate: String(sDate).substring(0, 10),
            dueDate: String(dDate).substring(0, 10),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });

        onImportTasks(imported);
        setImportStatus(`تم استيراد ${imported.length} مهمة بنجاح!`);
      } catch (err: any) {
        setError(`حدث خطأ أثناء معالجة الملف: ${err.message}`);
        setImportStatus(null);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Download Standalone index.html for Netlify Drop
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>TaskFlow - إدارة المشاريع والمهام</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>* { font-family: 'Cairo', sans-serif; }</style>
</head>
<body class="bg-slate-100 p-8 text-slate-900">
  <div class="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-xl border border-slate-200 text-center space-y-6">
    <div class="w-16 h-16 bg-indigo-600 text-white rounded-xl mx-auto flex items-center justify-center font-black text-2xl">TF</div>
    <h1 class="text-2xl font-black">TaskFlow Standalone Version</h1>
    <p class="text-slate-600 text-sm">تم استخراج هذا الملف ليكون قابلاً للرفع المباشر إلى Netlify أو أي استضافة سحابية بنقرة واحدة.</p>
    <div class="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold font-mono">
      Total Projects: ${projects.length} | Total Tasks: ${tasks.length} | Total Members: ${members.length}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      app: 'TaskFlow',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      projects,
      members,
      tasks,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TaskFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">استيراد وتصدير بيانات TaskFlow</h3>
              <p className="text-xs text-slate-500">التكامل مع Excel والتصدير السحابي والنشر</p>
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
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* 1. Upload Excel / CSV */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800">
                1. استيراد مهام من ملف Excel (.xlsx) أو CSV
              </label>
              <button
                type="button"
                onClick={downloadTaskFlowExcelTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                title="تحميل ملف إكسل منسق جاهز مع أمثلة توضيحية للأعمدة"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>تحميل نموذج Excel جاهز (.xlsx)</span>
              </button>
            </div>

            {/* Template Notice Banner */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-indigo-900">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>نوفر لك نموذج إكسل جاهز بالأعمدة والبيانات التوضيحية لتعبئته مباشرة:</span>
              </div>
              <button
                type="button"
                onClick={downloadTaskFlowExcelTemplate}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل النموذج</span>
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const droppedFile = e.dataTransfer.files[0];
                  // Fake change event
                  const fakeEvent = {
                    target: { files: [droppedFile] },
                  } as any;
                  handleFileUpload(fakeEvent);
                }
              }}
              className="border-2 border-dashed border-indigo-200 rounded-xl p-5 text-center hover:bg-indigo-50/30 transition-colors"
            >
              <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs text-slate-700 font-bold mb-1">
                اسحب ملف Excel أو انقر لاختيار ملف من جهازك
              </p>
              <p className="text-xs text-slate-400 mb-3">
                يتعرف النظام تلقائياً على أعمدة: عنوان المهمة، المشروع، المسؤول، الحالة، تاريخ الاستحقاق
              </p>
              <div className="flex items-center justify-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs">
                  <span>تحديد ملف Excel</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={downloadTaskFlowExcelTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-indigo-600" />
                  <span>تحميل النموذج الجاهز</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. One-Click Sample Modern 2026 Data Generator */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>توليد بيانات تجريبية حديثة كاملة (2026)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                تعبئة لوحة TaskFlow بمشاريع واقعية مع مهام متأخرة وجارية لتجربة كافة الوظائف فوراً.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('سيتم استبدال البيانات الحالية بالبيانات النموذجية الحديثة. هل تريد المتابعة؟')) {
                  onResetData();
                  setImportStatus('تم توليد البيانات النموذجية الحديثة بنجاح!');
                }
              }}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shrink-0"
            >
              توليد البيانات
            </button>
          </div>

          {/* 3. Export Options */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800">2. خيارات التصدير والنشر:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => exportTaskFlowToExcel(tasks, projects, members)}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-right transition-all flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">تصدير Excel (.xlsx)</div>
                  <div className="text-xs text-slate-500">جدول كامل بكافة الحالات والتواريخ</div>
                </div>
              </button>

              <button
                onClick={handleExportJSON}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-right transition-all flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">نسخة احتياطية JSON</div>
                  <div className="text-xs text-slate-500">حفظ كافة المشاريع والأعضاء والمهام</div>
                </div>
              </button>

              <button
                onClick={handleDownloadStandaloneHtml}
                className="sm:col-span-2 p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-right transition-all flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">تجهيز ملف index.html مستقل لـ Netlify</div>
                  <div className="text-xs text-slate-500">ملف جاهز للرفع على Netlify Drop والنشر السحابي برابط مباشر</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
