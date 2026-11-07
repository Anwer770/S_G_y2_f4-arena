import * as XLSX from 'xlsx';
import {
  DebtRecord,
  DebtCommitment,
  MovementRecord,
  Task,
  Customer,
  DoctorRecord,
  NoteRecord,
  TaskPriority,
  TaskStatus,
  CustomerSource,
  CustomerSignificance,
  VisitStatus,
} from '../types';
import { RoutineRecord } from '../types/routines';
import { CustodyIssueRecord, CustodySection } from '../types/custodyIssues';
import { LinkRecord } from '../types/linksLibrary';

// Helper to read file to JSON rows
export const readFileToRows = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json(worksheet);
        resolve(rows || []);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('فشلت قراءة الملف'));
    reader.readAsBinaryString(file);
  });
};

// =========================================================================
// 2. Debts & Commitments Importer
// =========================================================================
export const parseDebtsExcelFile = async (
  file: File
): Promise<{ debts: DebtRecord[]; commitments: DebtCommitment[]; count: number }> => {
  const rows = await readFileToRows(file);
  const debts: DebtRecord[] = [];
  const commitments: DebtCommitment[] = [];
  const nowStr = new Date().toISOString();
  const todayStr = nowStr.split('T')[0];

  rows.forEach((row, idx) => {
    const bookRaw = String(row['دفتر الحساب'] || row['الدفتر'] || row['Book'] || '').trim();
    const name = String(row['الاسم / الجهة'] || row['الاسم'] || row['الجهة'] || row['Name'] || `حساب مستورد ${idx + 1}`).trim();
    const amount = parseFloat(row['المبلغ'] || row['Amount'] || 0) || 0;
    const currency = String(row['العملة'] || row['Currency'] || 'ريال يمني').trim();
    const transType = String(row['نوع المعاملة'] || row['النوع'] || 'لنا').trim();
    const category = String(row['التصنيف'] || row['Category'] || 'عام').trim();
    const date = String(row['التاريخ'] || row['Date'] || todayStr).substring(0, 10);
    const dueDate = String(row['تاريخ الاستحقاق'] || row['Due Date'] || date).substring(0, 10);
    const owner = String(row['الشخص المسؤول'] || row['المسؤول'] || 'أنور').trim();
    const notes = String(row['ملاحظات'] || row['Notes'] || '').trim();

    const isCommitment = bookRaw.includes('التزام') || bookRaw.includes('أقساط') || transType.includes('علينا');

    if (isCommitment) {
      commitments.push({
        id: `التزامات-imp-${Date.now().toString().slice(-4)}-${idx + 1}`,
        name,
        desc: notes,
        date,
        endDate: dueDate,
        priority: 'A',
        status: 'قيد التنفيذ',
        icon: '★',
        owner,
        category,
        amount,
        currency,
        dir: 'debit',
        note: notes,
        payments: [],
        createdAt: nowStr,
        updatedAt: nowStr,
      });
    } else {
      let book: 'anwar' | 'previous' | 'zaha' | 'ali_qat' = 'anwar';
      if (bookRaw.includes('سابق') || bookRaw.includes('قديم')) book = 'previous';
      else if (bookRaw.includes('زها')) book = 'zaha';
      else if (bookRaw.includes('علي') || bookRaw.includes('قات')) book = 'ali_qat';

      const isDebit = transType.includes('عليه') || transType.includes('طلب') || transType.includes('لنا');

      debts.push({
        id: `DEBT-imp-${Date.now().toString().slice(-4)}-${idx + 1}`,
        book,
        date,
        icon: '★',
        name,
        currency,
        debit: isDebit ? amount : 0,
        credit: !isDebit ? amount : 0,
        note: notes,
        isCompleted: false,
        createdAt: nowStr,
        updatedAt: nowStr,
      });
    }
  });

  return { debts, commitments, count: debts.length + commitments.length };
};

// =========================================================================
// 3. Stock Movements Importer
// =========================================================================
export const parseStockExcelFile = async (
  file: File
): Promise<{ movements: MovementRecord[]; count: number }> => {
  const rows = await readFileToRows(file);
  const movements: MovementRecord[] = [];
  const nowStr = new Date().toISOString();
  const todayStr = nowStr.split('T')[0];

  rows.forEach((row, idx) => {
    const typeRaw = String(row['نوع الحركة'] || row['النوع'] || row['Type'] || 'IN').toUpperCase();
    const isOut = typeRaw.includes('صرف') || typeRaw.includes('OUT');
    const movementType = isOut ? 'صرف' : 'توريد';
    const subPrefix = isOut ? 'OUT' : 'IN';
    const date = String(row['التاريخ'] || row['Date'] || todayStr).substring(0, 10);
    const itemName = String(row['اسم الصنف'] || row['الصنف'] || row['Item'] || 'صنف غير محدد').trim();
    const quantity = Math.abs(parseFloat(row['الكمية'] || row['Quantity'] || 1) || 1);
    const beneficiary = String(row['الجهة / المورد'] || row['الجهة'] || row['العميل'] || 'طرف عام').trim();
    const notes = String(row['ملاحظات'] || row['Notes'] || '').trim();
    const category = String(row['التصنيف'] || 'مبيعات').trim();

    movements.push({
      id: `mov-imp-${Date.now()}-${idx}`,
      mainId: `Categ-100${(idx % 5) + 1}`,
      subId: `${subPrefix}-${Date.now().toString().slice(-4)}-${idx + 1}`,
      date,
      beneficiary,
      description: notes || `حركة ${movementType} لصنف ${itemName}`,
      movementType,
      status: 'تم التنفيذ',
      category,
      items: { [itemName]: quantity },
      note: notes,
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  });

  return { movements, count: movements.length };
};

// =========================================================================
// 4. Daily Tasks Importer
// =========================================================================
export const parseDailyTasksExcelFile = async (
  file: File
): Promise<{ tasks: Task[]; count: number }> => {
  const rows = await readFileToRows(file);
  const tasks: Task[] = [];
  const nowStr = new Date().toISOString();
  const todayStr = nowStr.split('T')[0];

  rows.forEach((row, idx) => {
    const title = String(row['عنوان المهمة'] || row['المهمة'] || row['Title'] || `مهمة مستوردة ${idx + 1}`).trim();
    const cat = String(row['التصنيف'] || row['Category'] || 'أعمال عامة').trim();
    const op = String(row['العملية'] || row['Operation'] || 'إجراء دوري').trim();
    const priorityRaw = String(row['الأولوية'] || row['Priority'] || 'C').toUpperCase();
    const pri: TaskPriority = ['A', 'B', 'C', 'D'].includes(priorityRaw) ? (priorityRaw as TaskPriority) : 'B';
    const resp = String(row['المسؤول'] || row['Assignee'] || 'أنور').trim();
    const dueDate = String(row['تاريخ الاستحقاق'] || row['Due Date'] || todayStr).substring(0, 10);
    const desc = String(row['ملاحظات'] || row['الوصف'] || row['Notes'] || '').trim();
    const statusRaw = String(row['الحالة'] || row['Status'] || 'مخطط').trim();

    let status: TaskStatus = 'قيد التنفيذ';
    if (statusRaw.includes('مكتمل') || statusRaw.includes('تم الانجاز')) status = 'تم الانجاز';
    else if (statusRaw.includes('مخطط')) status = 'مخطط';

    tasks.push({
      id: `T-imp-${Date.now().toString().slice(-4)}-${idx + 1}`,
      sub: `مهمة-${idx + 1}`,
      start: todayStr,
      end: dueDate,
      title,
      desc,
      cat,
      op,
      pri,
      status,
      resp,
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  });

  return { tasks, count: tasks.length };
};

// =========================================================================
// 5. Customers Importer
// =========================================================================
export const parseCustomersExcelFile = async (
  file: File
): Promise<{ customers: Customer[]; count: number }> => {
  const rows = await readFileToRows(file);
  const customers: Customer[] = [];
  const nowStr = new Date().toISOString();

  rows.forEach((row, idx) => {
    const code = String(row['كود العميل'] || row['الكود'] || `ذهبي-${Date.now().toString().slice(-4)}-${idx + 1}`).trim();
    const name = String(row['اسم العميل / الصيدلية'] || row['اسم العميل'] || row['الاسم'] || row['Name'] || `عميل مستورد ${idx + 1}`).trim();
    const region = String(row['المحافظة'] || row['المنطقة'] || 'صنعاء').trim();
    const route = String(row['المسار / اليوم'] || row['المسار'] || 'السبت').trim();
    const phone = String(row['رقم الهاتف'] || row['الهاتف'] || '').trim();
    const responsible = String(row['الشخص المسؤول'] || row['المسؤول'] || 'انور').trim();
    const initialDebt = parseFloat(row['مديونية سابقة'] || row['المديونية'] || 0) || 0;
    const notes = String(row['ملاحظات'] || '').trim();

    customers.push({
      id: `CUST-imp-${Date.now()}-${idx}`,
      subId: code,
      name,
      source: 'القيصر الذهبي' as CustomerSource,
      region,
      route,
      significance: 'B' as CustomerSignificance,
      status: 'مخطط' as VisitStatus,
      responsible,
      balanceYER: initialDebt,
      balanceSAR: 0,
      balanceUSD: 0,
      notes,
      phone,
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  });

  return { customers, count: customers.length };
};

// =========================================================================
// 7. Routines Importer
// =========================================================================
export const parseRoutinesExcelFile = async (
  file: File
): Promise<{ routines: RoutineRecord[]; count: number }> => {
  const rows = await readFileToRows(file);
  const routines: RoutineRecord[] = [];
  const nowStr = new Date().toISOString();
  const todayStr = nowStr.split('T')[0];

  rows.forEach((row, idx) => {
    const name = String(row['اسم الروتين'] || row['الروتين'] || row['Title'] || `روتين مستورد ${idx + 1}`).trim();
    const categoryName = String(row['التصنيف'] || 'عام').trim();
    const startTime = String(row['الوقت'] || '08:00').trim();
    const duration = parseInt(String(row['المدة (دقائق)'] || row['المدة'] || 30), 10) || 30;
    const description = String(row['الهدف'] || row['الوصف'] || row['ملاحظات'] || '').trim();

    routines.push({
      id: `rt-imp-${Date.now()}-${idx}`,
      code: `RTN-${(idx + 1).toString().padStart(3, '0')}`,
      name,
      description,
      categoryId: 'cat-general',
      categoryName,
      type: 'DAILY',
      frequency: 'يومي',
      startDate: todayStr,
      startTime,
      endTime: '09:00',
      duration,
      priority: 3,
      importance: 3,
      status: 'ACTIVE',
      isActive: true,
      color: 'teal',
      icon: 'Flame',
      reminderSettings: {
        enabled: false,
        offsetsMinutes: [10],
        notifyOnLate: false,
      },
      steps: [],
      completionRule: 'REQUIRED_ONLY',
      tags: [],
      currentStreak: 1,
      longestStreak: 1,
      totalExecutions: 0,
      completedExecutions: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  });

  return { routines, count: routines.length };
};

// =========================================================================
// 8. Notes / Knowledge Importer
// =========================================================================
export const parseNotesExcelFile = async (
  file: File
): Promise<{ notes: NoteRecord[]; count: number }> => {
  const rows = await readFileToRows(file);
  const notes: NoteRecord[] = [];
  const nowStr = new Date().toISOString();
  const todayStr = nowStr.split('T')[0];

  rows.forEach((row, idx) => {
    const title = String(row['عنوان الملاحظة'] || row['العنوان'] || row['Title'] || `ملاحظة مستوردة ${idx + 1}`).trim();
    const content = String(row['المحتوى'] || row['النص'] || row['Content'] || '').trim();
    const type = String(row['النوع'] || 'خطة عمل').trim();
    const category = String(row['التصنيف'] || 'عام').trim();
    const priority = 'متوسطة';
    const status = 'نشطة';
    const folderId = 'folder-work';
    const tagsRaw = String(row['الوسوم'] || row['Tags'] || '');
    const tags = tagsRaw.split(/[,،]/).map((t) => t.trim()).filter(Boolean);
    const date = String(row['التاريخ'] || todayStr).substring(0, 10);

    notes.push({
      id: `note-imp-${Date.now()}-${idx}`,
      title,
      content,
      type: type as any,
      category,
      priority,
      status,
      folderId,
      tags,
      date,
      isPinned: false,
      isFavorite: false,
      isLocked: false,
      isQuickNote: false,
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  });

  return { notes, count: notes.length };
};

// =========================================================================
// 9. Custody & Issues Importer
// =========================================================================
export const parseCustodyExcelFile = async (
  file: File
): Promise<{ records: CustodyIssueRecord[]; count: number }> => {
  const rows = await readFileToRows(file);
  const records: CustodyIssueRecord[] = [];
  const nowStr = new Date().toISOString();
  const todayStr = nowStr.split('T')[0];

  rows.forEach((row, idx) => {
    const secRaw = String(row['القسم'] || row['Section'] || 'custody').trim();
    const section: CustodySection = secRaw.includes('إشكال') || secRaw.includes('issue') ? 'issues' : 'custody';
    const name = String(row['العنوان / البيان'] || row['الاسم'] || row['العنوان'] || `سجل مستورد ${idx + 1}`).trim();
    const desc = String(row['الوصف'] || row['الملاحظات'] || name).trim();
    const responsible = String(row['الشخص المسؤول'] || row['المسؤول'] || 'أنور').trim();
    const category = String(row['التصنيف'] || 'عام').trim();
    const amount = parseFloat(row['المبلغ'] || 0) || 0;
    const currency = String(row['العملة'] || 'ريال يمني').trim();
    const date = String(row['التاريخ'] || todayStr).substring(0, 10);
    const notes = String(row['الملاحظات'] || '').trim();

    records.push({
      id: `custody-imp-${Date.now()}-${idx}`,
      section,
      name,
      desc,
      cat: category,
      pri: 'B',
      status: 'مخطط',
      resp: responsible,
      amount,
      currency,
      date,
      notes,
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  });

  return { records, count: records.length };
};

// =========================================================================
// 10. Links Library Importer
// =========================================================================
export const parseLinksExcelFile = async (
  file: File
): Promise<{ links: LinkRecord[]; count: number }> => {
  const rows = await readFileToRows(file);
  const links: LinkRecord[] = [];
  const nowStr = new Date().toISOString();

  rows.forEach((row, idx) => {
    const siteName = String(row['عنوان الرابط'] || row['اسم الموقع'] || row['العنوان'] || `رابط مستورد ${idx + 1}`).trim();
    const url = String(row['الرابط (URL)'] || row['الرابط'] || row['URL'] || 'https://google.com').trim();
    const classification = String(row['التصنيف الأساسي'] || 'أدوات عامة').trim();
    const category = String(row['الفئة'] || 'أخرى').trim();
    const type = String(row['النوع'] || 'موقع رسمي').trim();
    const importance = String(row['الأهمية'] || 'B').trim();
    const desc = String(row['الوصف'] || siteName).trim();
    const isFavorite = String(row['مميز بنجمة'] || '').includes('نعم');

    links.push({
      id: `link-imp-${Date.now()}-${idx}`,
      siteName,
      desc,
      url,
      classification,
      category,
      type,
      importance,
      isFavorite,
      visitCount: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  });

  return { links, count: links.length };
};
