/**
 * تصدير/استيراد «إدارة العمل» (JSON · CSV · Excel · قوالب) — مستخرجة من workosStorage.ts (R30).
 */
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { WorkOSData, WorkTask, WorkOrder, WorkProject, WorkCommitment, TaskStatus } from '../../types/workos';
import { assertFileSize, readFirstSheetSafe } from '../xlsxSafe';
import { loadWorkOSData, saveWorkOSData } from './workosLoaders';
import { createTripleLinkOrder } from './workosAutomation';

// Celebration Confetti
export function triggerConfetti(): void {
  try {
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#10b981'],
    });
  } catch (err) {
    console.warn('Confetti trigger failed:', err);
  }
}

// Data Export Utilities
export function exportWorkOSToJSON(data?: WorkOSData): void {
  const payload = data || loadWorkOSData();
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `workos-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportWorkOSToCSV(data?: WorkOSData): void {
  const payload = data || loadWorkOSData();
  const tasks = payload.tasks || [];
  const headers = ['رقم المهمة', 'العنوان', 'الحالة', 'الأولوية', 'المشروع', 'المسؤول', 'تاريخ الاستحقاق', 'التقدم %'];

  const rows = tasks.map((t) => [
    `"${t.taskNumber || ''}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${t.status || ''}"`,
    `"${t.priority || ''}"`,
    `"${(payload.projects.find((p) => p.id === t.projectId)?.name || '').replace(/"/g, '""')}"`,
    `"${(payload.team.find((m) => m.id === t.assigneeId)?.name || '').replace(/"/g, '""')}"`,
    `"${t.dueDate || ''}"`,
    `"${t.progress || 0}%"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `workos-tasks-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportWorkOSToExcel(data?: WorkOSData): void {
  const payload = data || loadWorkOSData();
  const tasks = payload.tasks || [];
  const projects = payload.projects || [];
  const team = payload.team || [];

  const taskRows = tasks.map((t) => {
    const proj = projects.find((p) => p.id === t.projectId);
    const member = team.find((m) => m.id === t.assigneeId);
    return {
      'رقم المهمة': t.taskNumber || '',
      'عنوان المهمة': t.title || '',
      الوصف: t.description || '',
      الحالة: t.status || '',
      الأولوية: t.priority || '',
      المشروع: proj ? proj.name : '',
      المسؤول: member ? member.name : '',
      'تاريخ الاستحقاق': t.dueDate || '',
      'نسبة الإنجاز %': t.progress || 0,
      'الساعات التقديرية': t.estimatedHours || 0,
      'الساعات الفعلية': t.actualHours || 0,
      الوسوم: (t.tags || []).join(', '),
    };
  });

  const projectRows = projects.map((p) => ({
    'كود المشروع': p.code || '',
    'اسم المشروع': p.name || '',
    الوصف: p.description || '',
    الحالة: p.status || '',
    الفئة: p.category || '',
    'تاريخ البدء': p.startDate || '',
    'تاريخ الاستحقاق': p.dueDate || '',
    'نسبة الإنجاز %': p.progress || 0,
  }));

  const wb = XLSX.utils.book_new();
  const wsTasks = XLSX.utils.json_to_sheet(taskRows);
  const wsProjects = XLSX.utils.json_to_sheet(projectRows);

  XLSX.utils.book_append_sheet(wb, wsTasks, 'المهام التنفيذية');
  XLSX.utils.book_append_sheet(wb, wsProjects, 'المشاريع');

  XLSX.writeFile(wb, `workos-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadWorkOSTasksTemplate(): void {
  const sampleRows = [
    {
      'عنوان المهمة': 'إعداد التقرير المالي للربع الأول',
      الوصف: 'مراجعة قيود الصرف والقبض وإصدار الميزان',
      الحالة: 'in_progress',
      الأولوية: 'high',
      'اسم المشروع': 'تطوير المنظومة',
      'اسم المسؤول': 'أحمد السعيد',
      'تاريخ الاستحقاق': new Date().toISOString().slice(0, 10),
      'نسبة الإنجاز %': 50,
      'الساعات التقديرية': 8,
      الوسوم: 'مالية, تقارير',
    },
    {
      'عنوان المهمة': 'متابعة استلام شحنة مستودع صنعاء',
      الوصف: 'مطابقة أذونات الاستلام مع بوليصة الشحن',
      الحالة: 'planned',
      الأولوية: 'urgent',
      'اسم المشروع': 'سلسلة التوريد',
      'اسم المسؤول': 'خالد محمد',
      'تاريخ الاستحقاق': new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      'نسبة الإنجاز %': 10,
      'الساعات التقديرية': 4,
      الوسوم: 'مستودع, شحنات',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(wb, ws, 'نموذج المهام');
  XLSX.writeFile(wb, `workos-tasks-template.xlsx`);
}

export function importWorkOSTasksFromExcel(file: File): Promise<{ success: boolean; message: string; count?: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        assertFileSize(file);
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const safeSheet = readFirstSheetSafe<Record<string, unknown>>(data, 'array');
        const rawJson: Record<string, unknown>[] = safeSheet.rows;

        if (!rawJson || rawJson.length === 0) {
          resolve({ success: false, message: 'الملف فارغ أو لا يحتوي على أسطر صالحة.' });
          return;
        }

        const currentData = loadWorkOSData();
        const existingTasks = currentData.tasks || [];
        const projects = currentData.projects || [];
        const team = currentData.team || [];

        let importedCount = 0;
        const newTasks: WorkTask[] = [];

        rawJson.forEach((row, idx) => {
          const title = String(row['عنوان المهمة'] || row['العنوان'] || row['Title'] || '').trim();
          if (!title) return;

          const desc = String(row['الوصف'] || row['Description'] || '').trim();
          const rawStatus = String(row['الحالة'] || row['Status'] || '').trim();
          const rawPri = String(row['الأولوية'] || row['Priority'] || '').trim();
          const projectName = String(row['المشروع'] || row['اسم المشروع'] || row['Project'] || '').trim();
          const memberName = String(row['المسؤول'] || row['اسم المسؤول'] || row['Assignee'] || '').trim();
          const dueDate =
            String(row['تاريخ الاستحقاق'] || row['DueDate'] || '').trim() || new Date().toISOString().slice(0, 10);
          const progress = Number(row['نسبة الإنجاز %'] || row['Progress'] || 0) || 0;
          const estimatedHours = Number(row['الساعات التقديرية'] || row['EstimatedHours'] || 0) || 0;
          const rawTags = String(row['الوسوم'] || row['Tags'] || '').trim();

          // Match project
          const matchedProj = projects.find((p) => p.name.includes(projectName) || projectName.includes(p.name));
          // Match assignee
          const matchedMember = team.find((m) => m.name.includes(memberName) || memberName.includes(m.name));

          let status: TaskStatus = 'planned';
          if (['completed', 'مكتملة', 'تم', 'منجز'].includes(rawStatus.toLowerCase())) status = 'completed';
          else if (['in_progress', 'قيد التنفيذ', 'جاري'].includes(rawStatus.toLowerCase())) status = 'in_progress';
          else if (['in_review', 'مراجعة'].includes(rawStatus.toLowerCase())) status = 'review';
          else if (['blocked', 'معلقة', 'متوقفة'].includes(rawStatus.toLowerCase())) status = 'blocked';

          let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium';
          if (['urgent', 'طارئ', 'عاجل'].includes(rawPri.toLowerCase())) priority = 'urgent';
          else if (['high', 'مرتفع', 'مهم'].includes(rawPri.toLowerCase())) priority = 'high';
          else if (['low', 'منخفض', 'عادي'].includes(rawPri.toLowerCase())) priority = 'low';

          const newTask: WorkTask = {
            id: `task_${Date.now()}_${idx}`,
            taskNumber: `TSK-${1000 + existingTasks.length + importedCount + 1}`,
            title,
            description: desc,
            status,
            priority,
            category: 'عام',
            projectId: matchedProj ? matchedProj.id : projects[0]?.id || 'p_core',
            assigneeId: matchedMember ? matchedMember.id : 'm1',
            dueDate,
            progress: Math.min(100, Math.max(0, progress)),
            estimatedHours,
            actualHours: 0,
            tags: rawTags
              ? rawTags
                  .split(/[,،]/)
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [],
            subtasks: [],
            checklist: [],
            timeEntries: [],
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          newTasks.push(newTask);
          importedCount++;
        });

        if (importedCount === 0) {
          resolve({ success: false, message: 'لم يتم العثور على أسطر تحتوي على (عنوان المهمة).' });
          return;
        }

        currentData.tasks = [...newTasks, ...existingTasks];
        saveWorkOSData(currentData);
        resolve({ success: true, message: `تم استيراد ${importedCount} مهمة جديدة بنجاح!`, count: importedCount });
      } catch (err: unknown) {
        console.error('WorkOS Excel Import Error:', err);
        resolve({
          success: false,
          message: `فشل قراءة الملف: ${(err instanceof Error ? err.message : String(err)) || 'تنسيق غير صالح'}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: 'تعذر قراءة ملف الإكسل.' });
    };

    reader.readAsArrayBuffer(file);
  });
}

// ============================================================================
// TRIPLE INTEGRATION ENGINE (الربط الثلاثي الآلي: مهمة + طلبية + التزام مالي)
// ============================================================================

export function exportUnifiedWorkOSToExcel(
  tasks: WorkTask[],
  orders: WorkOrder[],
  commitments: WorkCommitment[],
  projects: WorkProject[] = []
): void {
  const wb = XLSX.utils.book_new();

  // 1. Orders Sheet
  const orderRows = orders.map((o) => ({
    'رقم الطلبية': o.orderNumber,
    'عنوان الطلبية': o.title,
    'اسم العميل / الصيدلية': o.customerName,
    'نوع الطلبية': o.orderType,
    'المنطقة / الفرع': o.regionBranch,
    'المبلغ الإجمالي (ريال)': o.totalAmount,
    العملة: o.currency,
    الحالة: o.status,
    الأولوية: o.priority,
    'تاريخ البدء': o.startDate,
    'تاريخ التسليم': o.deliveryDate,
    'المندوب / المسؤول': o.assignedRep,
    'نسبة إنجاز مهمة التسليم %': o.linkedTaskProgress || 0,
    الملاحظات: o.notes || '',
  }));
  const wsOrders = XLSX.utils.json_to_sheet(orderRows);
  XLSX.utils.book_append_sheet(wb, wsOrders, 'الطلبيات وعقود التوريد');

  // 2. Tasks Sheet
  const taskRows = tasks.map((t) => ({
    'رقم المهمة': t.taskNumber,
    'عنوان المهمة': t.title,
    الوصف: t.description,
    الحالة: t.status,
    الأولوية: t.priority,
    الفئة: t.category,
    'تاريخ الاستحقاق': t.dueDate,
    'نسبة الإنجاز %': t.progress,
    المسؤول: t.assigneeId,
    'معرف الطلبية المرتبطة': t.linkedOrderId || '',
  }));
  const wsTasks = XLSX.utils.json_to_sheet(taskRows);
  XLSX.utils.book_append_sheet(wb, wsTasks, 'المهام التنفيذية');

  // 3. Commitments Sheet
  const cmtRows = commitments.map((c) => ({
    'معرف الالتزام': c.id,
    'عنوان الالتزام': c.title,
    'الجهة / العميل': c.entity,
    المسؤول: c.person,
    المبلغ: c.amount || 0,
    العملة: c.currency || 'YER',
    الحالة: c.status,
    'طريقة السداد': c.paymentMethod || 'نقداً',
    'أرقام الفواتير': c.invoiceNumbers || '',
    'تاريخ الاستحقاق': c.dueDate,
    'معرف الطلبية المرتبطة': c.linkedOrderId || '',
  }));
  const wsCmts = XLSX.utils.json_to_sheet(cmtRows);
  XLSX.utils.book_append_sheet(wb, wsCmts, 'الالتزامات المالية والتحصيل');

  XLSX.writeFile(wb, `workos-unified-triple-data-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadUnifiedWorkOSTemplate(): void {
  const sampleOrders = [
    {
      'عنوان الطلبية': 'توريد دفعة سيرومات ومستحضرات طبية',
      'اسم العميل / الصيدلية': 'صيدلية النور - الحصبة',
      'نوع الطلبية': 'طلبيات صيدليات',
      'المنطقة / الفرع': 'منطقة الحصبة',
      'المبلغ الإجمالي (ريال)': 450000,
      العملة: 'YER',
      الأولوية: 'urgent',
      'تاريخ البدء': new Date().toISOString().slice(0, 10),
      'تاريخ التسليم': new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      'المندوب / المسؤول': 'د. سامي الميداني',
      'طريقة السداد': 'نقداً عند التسليم',
      'رقم الفاتورة': 'INV-8891',
      الملاحظات: 'تسليم الأصناف مع عينات مجانية',
    },
    {
      'عنوان الطلبية': 'طلبية عينات ترويجية للمركز الاستشاري',
      'اسم العميل / الصيدلية': 'مستشفى الأمل التخصصي',
      'نوع الطلبية': 'عينات',
      'المنطقة / الفرع': 'شارع تعز',
      'المبلغ الإجمالي (ريال)': 180000,
      العملة: 'YER',
      الأولوية: 'high',
      'تاريخ البدء': new Date().toISOString().slice(0, 10),
      'تاريخ التسليم': new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      'المندوب / المسؤول': 'خالد أمين المخزن',
      'طريقة السداد': 'آجل 30 يوم',
      'رقم الفاتورة': 'INV-8892',
      الملاحظات: 'عقد توريد دوري',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleOrders);
  XLSX.utils.book_append_sheet(wb, ws, 'قالب الطلبيات الموحد');
  XLSX.writeFile(wb, `workos-unified-template.xlsx`);
}

export function importUnifiedWorkOSFromExcel(
  file: File
): Promise<{ success: boolean; message: string; count?: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        assertFileSize(file);
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const safeSheet = readFirstSheetSafe<Record<string, unknown>>(data, 'array');
        const rawJson: Record<string, unknown>[] = safeSheet.rows;

        if (!rawJson || rawJson.length === 0) {
          resolve({ success: false, message: 'الملف فارغ أو لا يحتوي على أسطر صالحة.' });
          return;
        }

        let importedCount = 0;
        rawJson.forEach((row) => {
          const title = String(row['عنوان الطلبية'] || row['العنوان'] || row['Title'] || '').trim();
          const customerName = String(
            row['اسم العميل / الصيدلية'] || row['العميل'] || row['Customer'] || 'عميل نقدي'
          ).trim();
          if (!title) return;

          const totalAmount = Number(row['المبلغ الإجمالي (ريال)'] || row['المبلغ'] || row['Amount'] || 0);
          const orderType = String(row['نوع الطلبية'] || 'طلبيات صيدليات').trim();
          const regionBranch = String(row['المنطقة / الفرع'] || 'عام').trim();
          const deliveryDate = String(
            row['تاريخ التسليم'] || row['DueDate'] || new Date().toISOString().slice(0, 10)
          ).trim();
          const assignedRep = String(row['المندوب / المسؤول'] || row['المسؤول'] || 'مندوب التوزيع').trim();
          const notes = String(row['الملاحظات'] || '').trim();
          const paymentMethod = String(row['طريقة السداد'] || 'نقداً عند التسليم').trim();
          const invoiceNumber = String(row['رقم الفاتورة'] || '').trim();

          createTripleLinkOrder({
            title,
            customerName,
            orderType,
            regionBranch,
            totalAmount,
            priority: 'high',
            startDate: new Date().toISOString().slice(0, 10),
            deliveryDate,
            assignedRep,
            notes,
            generateTask: true,
            generateCommitment: true,
            paymentMethod,
            invoiceNumber,
          });

          importedCount++;
        });

        if (importedCount === 0) {
          resolve({ success: false, message: 'لم يتم العثور على أسطر صالحة في القالب.' });
          return;
        }

        resolve({
          success: true,
          message: `تم استيراد ${importedCount} طلبية مع إنشاء مهامها والتزاماتها المالية المرتبطة آلياً!`,
          count: importedCount,
        });
      } catch (err: unknown) {
        console.error('Unified Import Error:', err);
        resolve({
          success: false,
          message: `فشل قراءة الملف: ${(err instanceof Error ? err.message : String(err)) || 'تنسيق غير صالح'}`,
        });
      }
    };
    reader.onerror = () => resolve({ success: false, message: 'تعذر قراءة ملف الإكسل.' });
    reader.readAsArrayBuffer(file);
  });
}
