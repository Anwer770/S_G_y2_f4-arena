import * as XLSX from 'xlsx';
import {
  DoctorFilterState,
  DoctorRecord,
  DoctorSignificance,
  DoctorVisitLog,
  DoctorVisitStatus,
} from '../types';

export function getTodayArabicDay(): string {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayIndex = new Date().getDay();
  return days[dayIndex];
}

export function isDoctorVisitDueToday(route: string): boolean {
  const today = getTodayArabicDay();
  if (route === today) return true;

  const dayOfMonth = new Date().getDate();
  if (route === 'بداية الشهر' && dayOfMonth <= 10) return true;
  if (route === 'نص الشهر' && dayOfMonth > 10 && dayOfMonth <= 20) return true;
  if (route === 'نهاية الشهر' && dayOfMonth > 20) return true;
  if (route === 'شهري') return true;

  return false;
}

export function isDoctorTaskActiveInRange(dateBegin?: string, dateEnd?: string): boolean {
  if (!dateBegin && !dateEnd) return true;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (dateBegin && dateEnd) {
    return todayStr >= dateBegin && todayStr <= dateEnd;
  }
  if (dateBegin) return todayStr >= dateBegin;
  if (dateEnd) return todayStr <= dateEnd;
  return true;
}

export interface DoctorDashboardStats {
  totalDoctors: number;
  completedCount: number;
  inProgressCount: number;
  plannedCount: number;
  followUpCount: number;
  postponedCount: number;
  cancelledCount: number;
  completionRate: number; // نسب الإنجاز المستهدفة ≥ 80%
  todayVisitsTotal: number;
  todayVisitsCompleted: number;
  activePeriodTasksCount: number;
  regionBreakdown: { region: string; count: number; percentage: number }[];
  routeBreakdown: { route: string; count: number }[];
  significanceBreakdown: { key: DoctorSignificance; count: number }[];
  statusBreakdown: { key: DoctorVisitStatus; count: number; percentage: number }[];
  specialtyBreakdown: { specialty: string; count: number }[];
  responsibleStats: {
    name: string;
    total: number;
    completed: number;
    inProgress: number;
    planned: number;
    completionRate: number;
  }[];
}

export function calculateDoctorStats(
  doctors: DoctorRecord[],
  visits: DoctorVisitLog[] = []
): DoctorDashboardStats {
  let completedCount = 0;
  let inProgressCount = 0;
  let plannedCount = 0;
  let followUpCount = 0;
  let postponedCount = 0;
  let cancelledCount = 0;
  let todayVisitsTotal = 0;
  let todayVisitsCompleted = 0;
  let activePeriodTasksCount = 0;

  const regionMap: Record<string, number> = {};
  const routeMap: Record<string, number> = {};
  const sigMap: Record<DoctorSignificance, number> = { A: 0, B: 0, C: 0, '√': 0 };
  const specialtyMap: Record<string, number> = {};
  const statusMap: Record<DoctorVisitStatus, number> = {
    مخطط: 0,
    'قيد تنفيذ': 0,
    مكتمل: 0,
    ملغي: 0,
    مرحل: 0,
    متابعة: 0,
  };
  const respMap: Record<
    string,
    { total: number; completed: number; inProgress: number; planned: number }
  > = {};

  doctors.forEach((d) => {
    // Status counts
    if (d.status === 'مكتمل') completedCount++;
    else if (d.status === 'قيد تنفيذ') inProgressCount++;
    else if (d.status === 'مخطط') plannedCount++;
    else if (d.status === 'متابعة') followUpCount++;
    else if (d.status === 'مرحل') postponedCount++;
    else if (d.status === 'ملغي') cancelledCount++;

    if (d.status && statusMap[d.status] !== undefined) {
      statusMap[d.status]++;
    }

    // Regions
    const reg = d.region || 'غير محدد';
    regionMap[reg] = (regionMap[reg] || 0) + 1;

    // Routes
    const rt = d.route || 'غير محدد';
    routeMap[rt] = (routeMap[rt] || 0) + 1;

    // Significance
    if (d.significance && sigMap[d.significance] !== undefined) {
      sigMap[d.significance]++;
    }

    // Specialties
    const spec = d.specialty || 'عام / غير مصنف';
    specialtyMap[spec] = (specialtyMap[spec] || 0) + 1;

    // Today's visits
    if (isDoctorVisitDueToday(d.route)) {
      todayVisitsTotal++;
      if (d.status === 'مكتمل') {
        todayVisitsCompleted++;
      }
    }

    // Active in period
    if (isDoctorTaskActiveInRange(d.dateBegin, d.dateEnd)) {
      activePeriodTasksCount++;
    }

    // Responsible stats
    const resp = d.responsible || 'غير معين';
    if (!respMap[resp]) {
      respMap[resp] = { total: 0, completed: 0, inProgress: 0, planned: 0 };
    }
    respMap[resp].total++;
    if (d.status === 'مكتمل') respMap[resp].completed++;
    else if (d.status === 'قيد تنفيذ') respMap[resp].inProgress++;
    else if (d.status === 'مخطط') respMap[resp].planned++;
  });

  const total = doctors.length;
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const regionBreakdown = Object.entries(regionMap)
    .map(([region, count]) => ({
      region,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const routeBreakdown = Object.entries(routeMap)
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count);

  const specialtyBreakdown = Object.entries(specialtyMap)
    .map(([specialty, count]) => ({ specialty, count }))
    .sort((a, b) => b.count - a.count);

  const significanceBreakdown: { key: DoctorSignificance; count: number }[] = [
    { key: 'A', count: sigMap['A'] },
    { key: 'B', count: sigMap['B'] },
    { key: 'C', count: sigMap['C'] },
    { key: '√', count: sigMap['√'] },
  ];

  const statusBreakdown: { key: DoctorVisitStatus; count: number; percentage: number }[] = (
    Object.keys(statusMap) as DoctorVisitStatus[]
  ).map((key) => ({
    key,
    count: statusMap[key],
    percentage: total > 0 ? Math.round((statusMap[key] / total) * 100) : 0,
  }));

  const responsibleStats = Object.entries(respMap)
    .map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.completed,
      inProgress: data.inProgress,
      planned: data.planned,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalDoctors: total,
    completedCount,
    inProgressCount,
    plannedCount,
    followUpCount,
    postponedCount,
    cancelledCount,
    completionRate,
    todayVisitsTotal,
    todayVisitsCompleted,
    activePeriodTasksCount,
    regionBreakdown,
    routeBreakdown,
    significanceBreakdown,
    statusBreakdown,
    specialtyBreakdown,
    responsibleStats,
  };
}

export function filterDoctors(doctors: DoctorRecord[], filter: DoctorFilterState): DoctorRecord[] {
  return doctors.filter((d) => {
    // Search
    if (filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      const match =
        d.name.toLowerCase().includes(q) ||
        (d.clinicName && d.clinicName.toLowerCase().includes(q)) ||
        (d.specialty && d.specialty.toLowerCase().includes(q)) ||
        (d.phone && d.phone.includes(q)) ||
        (d.id && d.id.toLowerCase().includes(q)) ||
        (d.address && d.address.toLowerCase().includes(q)) ||
        (d.responsible && d.responsible.toLowerCase().includes(q)) ||
        (d.taskDesc && d.taskDesc.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Region
    if (filter.region && d.region !== filter.region) return false;

    // Route
    if (filter.route && d.route !== filter.route) return false;

    // Status
    if (filter.status && d.status !== filter.status) return false;

    // Responsible
    if (filter.responsible && d.responsible !== filter.responsible) return false;

    // Significance
    if (filter.significance && d.significance !== filter.significance) return false;

    // Specialty
    if (filter.specialty && d.specialty !== filter.specialty) return false;

    // Today's visits only
    if (filter.todayVisitsOnly && !isDoctorVisitDueToday(d.route)) return false;

    // Active period only
    if (filter.activePeriodOnly && !isDoctorTaskActiveInRange(d.dateBegin, d.dateEnd)) return false;

    return true;
  });
}

export function generateNextDoctorId(doctors: DoctorRecord[]): string {
  let maxNum = 1000;
  doctors.forEach((d) => {
    const match = d.id.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `DOC-${maxNum + 1}`;
}

export function findDoctorDuplicates(
  newDoc: Partial<DoctorRecord>,
  existing: DoctorRecord[],
  excludeId?: string
): DoctorRecord[] {
  if (!newDoc.name) return [];
  const cleanName = newDoc.name.trim().toLowerCase();
  const cleanPhone = newDoc.phone ? newDoc.phone.replace(/[\s\-\+]/g, '') : '';

  return existing.filter((doc) => {
    if (excludeId && doc.id === excludeId) return false;

    // Exact or close name match
    const existingName = doc.name.trim().toLowerCase();
    if (existingName === cleanName) return true;

    // Phone match
    if (cleanPhone && doc.phone) {
      const existingPhone = doc.phone.replace(/[\s\-\+]/g, '');
      if (existingPhone && existingPhone === cleanPhone) return true;
    }

    return false;
  });
}

// ============================================================================
// EXCEL & CSV EXPORT (UTF-8 BOM WITH ARABIC COMPATIBILITY)
// ============================================================================
export function exportDoctorsToExcel(doctors: DoctorRecord[], fileName?: string): void {
  const exportData = doctors.map((d, index) => ({
    'م': index + 1,
    'المعرف': d.id,
    'اسم الطبيب / المركز': d.name,
    'المصدر': d.source || 'الأطباء',
    'التخصص': d.specialty || '',
    'العيادة / المستشفى': d.clinicName || '',
    'المنطقة': d.region,
    'المسار': d.route,
    'الأهمية': d.significance,
    'المسؤول': d.responsible,
    'وصف المهمة': d.taskDesc || '',
    'تاريخ بدء المهمة': d.dateBegin || '',
    'تاريخ انتهاء المهمة': d.dateEnd || '',
    'حالة الزيارة': d.status,
    'رقم الهاتف': d.phone || '',
    'العنوان والموقع': d.address || '',
    'العينات المسلمة': d.samplesGiven || '',
    'نتيجة الزيارة': d.visitResult || '',
    'ملاحظات': d.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'دفتر زيارات الأطباء');

  // Set RTL direction on the worksheet
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  const fName = fileName || `دفتر_إدارة_زيارات_الأطباء_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fName);
}

export function exportDoctorsToCSV(doctors: DoctorRecord[], fileName?: string): void {
  const headers = [
    'م',
    'المعرف',
    'اسم الطبيب / المركز',
    'المصدر',
    'التخصص',
    'العيادة / المستشفى',
    'المنطقة',
    'المسار',
    'الأهمية',
    'المسؤول',
    'وصف المهمة',
    'تاريخ بدء المهمة',
    'تاريخ انتهاء المهمة',
    'حالة الزيارة',
    'رقم الهاتف',
    'العنوان والموقع',
    'العينات المسلمة',
    'نتيجة الزيارة',
    'ملاحظات',
  ];

  const rows = doctors.map((d, index) => [
    index + 1,
    `"${d.id}"`,
    `"${(d.name || '').replace(/"/g, '""')}"`,
    `"${(d.source || 'الأطباء').replace(/"/g, '""')}"`,
    `"${(d.specialty || '').replace(/"/g, '""')}"`,
    `"${(d.clinicName || '').replace(/"/g, '""')}"`,
    `"${(d.region || '').replace(/"/g, '""')}"`,
    `"${(d.route || '').replace(/"/g, '""')}"`,
    `"${d.significance}"`,
    `"${(d.responsible || '').replace(/"/g, '""')}"`,
    `"${(d.taskDesc || '').replace(/"/g, '""')}"`,
    `"${d.dateBegin || ''}"`,
    `"${d.dateEnd || ''}"`,
    `"${d.status}"`,
    `"${d.phone || ''}"`,
    `"${(d.address || '').replace(/"/g, '""')}"`,
    `"${(d.samplesGiven || '').replace(/"/g, '""')}"`,
    `"${(d.visitResult || '').replace(/"/g, '""')}"`,
    `"${(d.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName || `دفتر_الأطباء_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDoctorVisitsToExcel(visits: DoctorVisitLog[], fileName?: string): void {
  const exportData = visits.map((v, index) => ({
    'م': index + 1,
    'معرف الزيارة': v.id,
    'اسم الطبيب': v.doctorName,
    'التاريخ': v.date,
    'اليوم': v.dayOfWeek,
    'المندوب المنفذ': v.responsible,
    'حالة الزيارة': v.status,
    'العينات المقدمة': v.samplesGiven || '',
    'نتيجة الزيارة وتفاعل الطبيب': v.visitResult || '',
    'الملاحظات': v.notes || '',
    'موعد المتابعة القادمة': v.nextFollowUpDate || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل الزيارات الميدانية للأطباء');

  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  const fName = fileName || `سجل_زيارات_الأطباء_الميدانية_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fName);
}

// ============================================================================
// EXCEL & CSV IMPORT PARSER WITH SMART COLUMN MATCHING
// ============================================================================
export async function parseDoctorsExcelOrCSV(
  file: File,
  existingDoctors: DoctorRecord[]
): Promise<{
  success: boolean;
  doctors: DoctorRecord[];
  errors: string[];
  duplicateCount: number;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            doctors: [],
            errors: ['الملف فارغ أو لا يحتوي على صفوف بيانات صالحة'],
            duplicateCount: 0,
          });
          return;
        }

        const parsedDoctors: DoctorRecord[] = [];
        const errors: string[] = [];
        let duplicateCount = 0;
        let runningId = 1000 + existingDoctors.length;

        rawJson.forEach((row, index) => {
          const rowNum = index + 2;

          // Helper to find value across multiple possible column aliases
          const findVal = (...aliases: string[]): string => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase();
              for (const alias of aliases) {
                if (
                  cleanKey === alias.toLowerCase() ||
                  cleanKey.includes(alias.toLowerCase())
                ) {
                  const val = row[key];
                  return val !== undefined && val !== null ? String(val).trim() : '';
                }
              }
            }
            return '';
          };

          const name = findVal('اسم الطبيب', 'اسم العميل', 'name', 'الطبيب', 'الاسم', 'المركز');
          if (!name) {
            // Skip empty row or log notice
            return;
          }

          const source = findVal('المصدر', 'source') || 'الأطباء';
          const specialty = findVal('التخصص', 'specialty', 'القسم') || 'عام';
          const clinicName = findVal('العيادة', 'المستشفى', 'clinic', 'اسم العيادة', 'المركز الطبي') || '';
          const region = findVal('المنطقة', 'region', 'المحافظة', 'الموقع') || 'صنعاء';
          const route = findVal('المسار', 'route', 'اليوم', 'مسار الزيارة') || 'السبت';
          const significanceRaw = findVal('الأهمية', 'significance', 'الدرجة') || 'B';
          const responsible = findVal('المسؤول', 'responsible', 'المندوب', 'المشرف') || 'انور';
          const taskDesc = findVal('وصف المهمة', 'task description', 'الغرض', 'المهمة', 'task') || '';
          const dateBegin = findVal('تاريخ بدء المهمة', 'date tasks began', 'start date', 'البدء', 'من تاريخ') || '2026-08-01';
          const dateEnd = findVal('تاريخ انتهاء المهمة', 'date tasks end', 'end date', 'الانتهاء', 'إلى تاريخ') || '2026-08-07';
          const statusRaw = findVal('حالة الزيارة', 'الحالة', 'status') || 'مخطط';
          const phone = findVal('رقم الهاتف', 'الهاتف', 'phone', 'تلفون', 'واتساب', 'موبايل') || '';
          const address = findVal('العنوان', 'الموقع', 'address', 'location', 'مكان العمل') || '';
          const notes = findVal('ملاحظات', 'notes', 'ملاحظة', 'التفاصيل') || '';
          const visitResult = findVal('نتيجة الزيارة', 'النتيجة', 'visit result') || '';
          const samplesGiven = findVal('العينات المسلمة', 'العينات', 'samples') || '';

          // Normalize significance
          let significance: DoctorSignificance = 'B';
          if (significanceRaw.includes('A') || significanceRaw === 'أ') significance = 'A';
          else if (significanceRaw.includes('C') || significanceRaw === 'ج') significance = 'C';
          else if (significanceRaw.includes('√') || significanceRaw.includes('v') || significanceRaw.includes('صح')) significance = '√';

          // Normalize status
          let status: DoctorVisitStatus = 'مخطط';
          if (statusRaw.includes('مكتمل') || statusRaw.includes('منجز') || statusRaw.includes('completed')) status = 'مكتمل';
          else if (statusRaw.includes('تنفيذ') || statusRaw.includes('progress')) status = 'قيد تنفيذ';
          else if (statusRaw.includes('متابعة') || statusRaw.includes('follow')) status = 'متابعة';
          else if (statusRaw.includes('مرحل') || statusRaw.includes('مؤجل') || statusRaw.includes('postponed')) status = 'مرحل';
          else if (statusRaw.includes('ملغي') || statusRaw.includes('cancel')) status = 'ملغي';

          // Duplicate check
          const isDup = existingDoctors.some(
            (e) => e.name.trim().toLowerCase() === name.trim().toLowerCase()
          );
          if (isDup) {
            duplicateCount++;
          }

          runningId++;
          const id = findVal('المعرف', 'id', 'الكود') || `DOC-${runningId}`;

          parsedDoctors.push({
            id,
            name,
            source,
            specialty,
            clinicName,
            region,
            route,
            significance,
            responsible,
            taskDesc,
            dateBegin,
            dateEnd,
            status,
            phone,
            address,
            notes,
            visitResult,
            samplesGiven,
            createdAt: new Date().toISOString().split('T')[0],
          });
        });

        resolve({
          success: parsedDoctors.length > 0,
          doctors: parsedDoctors,
          errors,
          duplicateCount,
        });
      } catch (err: any) {
        resolve({
          success: false,
          doctors: [],
          errors: [`فشل تحليل ملف Excel/CSV: ${err.message || err}`],
          duplicateCount: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        doctors: [],
        errors: ['تعذر قراءة الملف من الجهاز'],
        duplicateCount: 0,
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
