/**
 * R59 — عقد بيانات اليوم الأول.
 *
 * `src/data` جداول بذور لا منطق قابل لقياس coverage؛ لذلك تحميها اختبارات شكل
 * وعلاقات، لا تُدخل 5,242 سطراً من البيانات في مقام H16. أي توسعة مقصودة للبذور
 * تعدّل العدد المعلن هنا ووثيقة R59 معاً، أما سقوط سجل/مرجع فيفشل فوراً.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_COMMITMENTS } from '../../src/data/defaultCommitments';
import {
  DEFAULT_CUSTODY_CATEGORIES,
  DEFAULT_CUSTODY_ISSUES_RECORDS,
  DEFAULT_CUSTODY_PRIORITIES,
  DEFAULT_CUSTODY_RESPONSIBLES,
  DEFAULT_CUSTODY_STATUSES,
} from '../../src/data/defaultCustodyIssues';
import {
  CUSTOMER_REGIONS,
  CUSTOMER_RESPONSIBLES,
  CUSTOMER_ROUTES,
  CUSTOMER_SOURCES,
  CUSTOMER_STATUSES,
  DEFAULT_CUSTOMERS,
  DEFAULT_CUSTOMER_VISITS,
} from '../../src/data/defaultCustomers';
import {
  DEFAULT_DOCTORS,
  DEFAULT_DOCTOR_VISITS,
  DOCTOR_REGIONS,
  DOCTOR_RESPONSIBLES,
  DOCTOR_ROUTES,
  DOCTOR_SPECIALTIES,
  DOCTOR_STATUSES,
} from '../../src/data/defaultDoctors';
import {
  DEFAULT_ACCOUNT_NAMES,
  DEFAULT_CATEGORY_ACCOUNTS,
  DEFAULT_FINANCIAL_TRANSACTIONS,
  DEFAULT_IMPORTANCE_LIST,
  DEFAULT_MOVEMENTS,
  DEFAULT_MOVEMENT_TYPES,
  DEFAULT_RESTRICTION_ACCOUNTS,
  DEFAULT_RESTRICTIONS,
} from '../../src/data/defaultFinancial';
import {
  DEFAULT_LINKS_RECORDS,
  DEFAULT_LINK_CATEGORIES,
  DEFAULT_LINK_CLASSIFICATIONS,
  DEFAULT_LINK_IMPORTANCES,
  DEFAULT_LINK_TYPES,
} from '../../src/data/defaultLinks';
import {
  DEFAULT_NOTES,
  DEFAULT_NOTE_FOLDERS,
  DEFAULT_NOTE_TAGS,
  DEFAULT_NOTE_TEMPLATES,
} from '../../src/data/defaultNotes';
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_STATUSES } from '../../src/data/defaultProducts';
import { INITIAL_RECORDS } from '../../src/data/defaultRecords';
import {
  DEFAULT_ROUTINES,
  DEFAULT_ROUTINE_CATEGORIES,
  DEFAULT_ROUTINE_EXECUTIONS,
  DEFAULT_ROUTINE_OCCURRENCES,
  DEFAULT_ROUTINE_SETTINGS,
  DEFAULT_ROUTINE_TAGS,
  DEFAULT_ROUTINE_TEMPLATES,
} from '../../src/data/defaultRoutines';
import {
  DEFAULT_TASKS,
  TASK_ASSIGNEES,
  TASK_CATEGORIES,
  TASK_OPERATIONS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../../src/data/defaultTasks';

const expectUnique = (label: string, values: readonly string[]) => {
  expect(new Set(values).size, `${label}: معرّف/قيمة مكررة`).toBe(values.length);
};

const expectReferences = (label: string, values: readonly string[], allowed: readonly string[]) => {
  const invalid = [...new Set(values.filter((value) => !allowed.includes(value)))];
  expect(invalid, `${label}: مراجع معلقة`).toEqual([]);
};

const isCalendarDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    parsed.getUTCFullYear() === Number(year) &&
    parsed.getUTCMonth() === Number(month) - 1 &&
    parsed.getUTCDate() === Number(day)
  );
};

const expectDates = (label: string, values: Array<string | undefined>) => {
  const invalid = values.filter((value): value is string => !!value && !isCalendarDate(value));
  expect(invalid, `${label}: تاريخ غير تقويمي`).toEqual([]);
};

const DATE_KEYS = new Set([
  'date',
  'due',
  'start',
  'end',
  'dateBegin',
  'dateEnd',
  'lastVisitDate',
  'nextFollowUpDate',
  'nextReviewDate',
  'dueDate',
  'startDate',
  'lastExecutedDate',
  'createdAt',
  'updatedAt',
  'actualStart',
  'actualEnd',
  'startedAt',
  'endedAt',
  'savedAt',
]);

const collectDateFields = (value: unknown, fields: Array<{ path: string; value: string }>, path = ''): void => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDateFields(item, fields, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (DATE_KEYS.has(key) && typeof child === 'string' && child) fields.push({ path: childPath, value: child });
    collectDateFields(child, fields, childPath);
  }
};

const expectReasonableIsoDates = (label: string, seeds: unknown[]) => {
  const fields: Array<{ path: string; value: string }> = [];
  collectDateFields(seeds, fields, label);
  const maximumYear = new Date().getUTCFullYear() + 10;
  const invalid = fields.filter(({ value }) => {
    const calendar = value.slice(0, 10);
    if (!isCalendarDate(calendar)) return true;
    const year = Number(calendar.slice(0, 4));
    if (year < 2020 || year > maximumYear) return true;
    return value.length > 10 && (Number.isNaN(Date.parse(value)) || !/^\d{4}-\d{2}-\d{2}T/.test(value));
  });
  expect(invalid, `${label}: حقل زمني غير ISO أو خارج المدى المعقول`).toEqual([]);
};

const expectNonNegative = (label: string, values: readonly number[]) => {
  expect(
    values.every((value) => Number.isFinite(value) && value >= 0),
    `${label}: مبلغ/كمية سالبة أو غير رقمية`
  ).toBe(true);
};

describe('R59 — الحصر والهوية', () => {
  it('يثبّت حجم البيانات التي تصل إلى التخزين عند أول تشغيل (643 سجلاً عبر 11 كتابة أساسية)', () => {
    // هذه هي مجموعات BaseRepository التي يقرأها MainApp؛ القراءة الأولى تكتبها.
    // الزيارات والقوائم المساندة تعود fallback من CollectionRepository بلا كتابة.
    const firstBootRecords = [
      ['الأصناف', DEFAULT_PRODUCTS, 62],
      ['حركات المخزون', INITIAL_RECORDS, 301],
      ['القيود المالية', DEFAULT_FINANCIAL_TRANSACTIONS, 5],
      ['المهام', DEFAULT_TASKS, 103],
      ['الالتزامات', DEFAULT_COMMITMENTS, 32],
      ['العملاء', DEFAULT_CUSTOMERS, 26],
      ['الأطباء', DEFAULT_DOCTORS, 10],
      ['العهد', DEFAULT_CUSTODY_ISSUES_RECORDS, 40],
      ['الملاحظات', DEFAULT_NOTES, 6],
      ['الروتينات', DEFAULT_ROUTINES, 6],
      ['الروابط', DEFAULT_LINKS_RECORDS, 52],
    ] as const;

    expect(firstBootRecords).toHaveLength(11);
    for (const [label, records, expectedCount] of firstBootRecords) {
      expect(records, `${label}: عدد سجلات اليوم الأول`).toHaveLength(expectedCount);
    }
    expect(firstBootRecords.reduce((count, [, records]) => count + records.length, 0)).toBe(643);
  });

  it('لا يكرّر أي معرّف بين سجلات كل بذرة أو قوائمها الكائنية', () => {
    const collections = [
      ['الالتزامات', DEFAULT_COMMITMENTS],
      ['العهد', DEFAULT_CUSTODY_ISSUES_RECORDS],
      ['العملاء', DEFAULT_CUSTOMERS],
      ['زيارات العملاء', DEFAULT_CUSTOMER_VISITS],
      ['الأطباء', DEFAULT_DOCTORS],
      ['زيارات الأطباء', DEFAULT_DOCTOR_VISITS],
      ['القيود المالية', DEFAULT_FINANCIAL_TRANSACTIONS],
      ['الروابط', DEFAULT_LINKS_RECORDS],
      ['مجلدات المعرفة', DEFAULT_NOTE_FOLDERS],
      ['وسوم المعرفة', DEFAULT_NOTE_TAGS],
      ['قوالب المعرفة', DEFAULT_NOTE_TEMPLATES],
      ['الملاحظات', DEFAULT_NOTES],
      ['الأصناف', DEFAULT_PRODUCTS],
      ['حركات المخزون', INITIAL_RECORDS],
      ['فئات الروتين', DEFAULT_ROUTINE_CATEGORIES],
      ['وسوم الروتين', DEFAULT_ROUTINE_TAGS],
      ['قوالب الروتين', DEFAULT_ROUTINE_TEMPLATES],
      ['الروتينات', DEFAULT_ROUTINES],
      ['تكرارات الروتين', DEFAULT_ROUTINE_OCCURRENCES],
      ['تنفيذات الروتين', DEFAULT_ROUTINE_EXECUTIONS],
      ['المهام', DEFAULT_TASKS],
    ] as const;

    for (const [label, records] of collections) {
      expect(records.length, `${label}: البذرة لا تكون فارغة`).toBeGreaterThan(0);
      expectUnique(
        label,
        records.map((record) => record.id)
      );
    }

    const recordIds = [
      DEFAULT_COMMITMENTS,
      DEFAULT_CUSTODY_ISSUES_RECORDS,
      DEFAULT_CUSTOMERS,
      DEFAULT_CUSTOMER_VISITS,
      DEFAULT_DOCTORS,
      DEFAULT_DOCTOR_VISITS,
      DEFAULT_FINANCIAL_TRANSACTIONS,
      DEFAULT_LINKS_RECORDS,
      DEFAULT_NOTES,
      DEFAULT_PRODUCTS,
      INITIAL_RECORDS,
      DEFAULT_ROUTINES,
      DEFAULT_ROUTINE_OCCURRENCES,
      DEFAULT_ROUTINE_EXECUTIONS,
      DEFAULT_TASKS,
    ].flatMap((records) => records.map((record) => record.id));
    expectUnique('كل السجلات البذرية', recordIds);
    expect(DEFAULT_CUSTOMER_VISITS.every((visit) => visit.id.startsWith('VST-'))).toBe(true);
    expect(DEFAULT_DOCTOR_VISITS.every((visit) => visit.id.startsWith('DVL-'))).toBe(true);

    for (const [label, list] of [
      ['تصنيفات المخزون', DEFAULT_CATEGORIES],
      ['حالات المخزون', DEFAULT_STATUSES],
      ['تصنيفات العهد', DEFAULT_CUSTODY_CATEGORIES],
      ['مسؤولو العهد', DEFAULT_CUSTODY_RESPONSIBLES],
      ['حالات العهد', DEFAULT_CUSTODY_STATUSES],
      ['أولويات العهد', DEFAULT_CUSTODY_PRIORITIES],
      ['مصادر العملاء', CUSTOMER_SOURCES],
      ['مناطق العملاء', CUSTOMER_REGIONS],
      ['مسارات العملاء', CUSTOMER_ROUTES],
      ['مسؤولو العملاء', CUSTOMER_RESPONSIBLES],
      ['حالات العملاء', CUSTOMER_STATUSES],
      ['مناطق الأطباء', DOCTOR_REGIONS],
      ['مسارات الأطباء', DOCTOR_ROUTES],
      ['مسؤولو الأطباء', DOCTOR_RESPONSIBLES],
      ['تخصصات الأطباء', DOCTOR_SPECIALTIES],
      ['حركات المالية', DEFAULT_MOVEMENTS],
      ['قيود المالية', DEFAULT_RESTRICTIONS],
      ['طرق المالية', DEFAULT_MOVEMENT_TYPES],
      ['أهمية المالية', DEFAULT_IMPORTANCE_LIST],
      ['فئات المالية', DEFAULT_CATEGORY_ACCOUNTS],
      ['حسابات تقييد المالية', DEFAULT_RESTRICTION_ACCOUNTS],
      ['أسماء حسابات المالية', DEFAULT_ACCOUNT_NAMES],
      ['تصنيفات الروابط', DEFAULT_LINK_CLASSIFICATIONS],
      ['فئات الروابط', DEFAULT_LINK_CATEGORIES],
      ['أنواع الروابط', DEFAULT_LINK_TYPES],
      ['أهمية الروابط', DEFAULT_LINK_IMPORTANCES],
      ['فئات المهام', TASK_CATEGORIES],
      ['عمليات المهام', TASK_OPERATIONS],
      ['مسؤولو المهام', TASK_ASSIGNEES],
    ] as const) {
      expectUnique(label, list);
    }
  });
});

describe('R59 — المراجع الداخلية وقوائم الاختيار', () => {
  it('يربط العملاء/الأطباء وزياراتهم بالقوائم والكيان الصحيح', () => {
    expectReferences(
      'العملاء: المصدر',
      DEFAULT_CUSTOMERS.map((record) => record.source),
      CUSTOMER_SOURCES
    );
    expectReferences(
      'العملاء: المنطقة',
      DEFAULT_CUSTOMERS.map((record) => record.region),
      CUSTOMER_REGIONS
    );
    expectReferences(
      'العملاء: المسار',
      DEFAULT_CUSTOMERS.map((record) => record.route),
      CUSTOMER_ROUTES
    );
    expectReferences(
      'العملاء: المسؤول',
      DEFAULT_CUSTOMERS.map((record) => record.responsible),
      CUSTOMER_RESPONSIBLES
    );
    expectReferences(
      'العملاء: الحالة',
      DEFAULT_CUSTOMERS.map((record) => record.status),
      CUSTOMER_STATUSES
    );
    expectReferences(
      'زيارات العملاء: المسؤول',
      DEFAULT_CUSTOMER_VISITS.map((record) => record.responsible),
      CUSTOMER_RESPONSIBLES
    );
    expectReferences(
      'زيارات العملاء: الحالة',
      DEFAULT_CUSTOMER_VISITS.map((record) => record.status),
      CUSTOMER_STATUSES
    );

    const customersById = new Map(DEFAULT_CUSTOMERS.map((customer) => [customer.id, customer]));
    for (const visit of DEFAULT_CUSTOMER_VISITS) {
      expect(customersById.get(visit.customerId)?.name, `زيارة ${visit.id}: العميل`).toBe(visit.customerName);
    }

    expectReferences(
      'الأطباء: المنطقة',
      DEFAULT_DOCTORS.map((record) => record.region),
      DOCTOR_REGIONS
    );
    expectReferences(
      'الأطباء: المسار',
      DEFAULT_DOCTORS.map((record) => record.route),
      DOCTOR_ROUTES
    );
    expectReferences(
      'الأطباء: المسؤول',
      DEFAULT_DOCTORS.map((record) => record.responsible),
      DOCTOR_RESPONSIBLES
    );
    expectReferences(
      'الأطباء: التخصص',
      DEFAULT_DOCTORS.map((record) => record.specialty ?? ''),
      [...DOCTOR_SPECIALTIES, '']
    );
    expectReferences(
      'الأطباء: الحالة',
      DEFAULT_DOCTORS.map((record) => record.status),
      DOCTOR_STATUSES.map((status) => status.key)
    );
    expectReferences(
      'زيارات الأطباء: المسؤول',
      DEFAULT_DOCTOR_VISITS.map((record) => record.responsible),
      DOCTOR_RESPONSIBLES
    );
    expectReferences(
      'زيارات الأطباء: الحالة',
      DEFAULT_DOCTOR_VISITS.map((record) => record.status),
      DOCTOR_STATUSES.map((status) => status.key)
    );

    const doctorsById = new Map(DEFAULT_DOCTORS.map((doctor) => [doctor.id, doctor]));
    for (const visit of DEFAULT_DOCTOR_VISITS) {
      expect(doctorsById.get(visit.doctorId)?.name, `زيارة ${visit.id}: الطبيب`).toBe(visit.doctorName);
    }
  });

  it('يربط القوائم المالية والمهام والعهد والروابط بقيمها المتاحة في أول تشغيل', () => {
    expectReferences(
      'المهام: الفئة',
      DEFAULT_TASKS.map((record) => record.cat),
      TASK_CATEGORIES
    );
    expectReferences(
      'المهام: العملية',
      DEFAULT_TASKS.map((record) => record.op),
      TASK_OPERATIONS
    );
    expectReferences(
      'المهام: المسؤول',
      DEFAULT_TASKS.map((record) => record.resp),
      TASK_ASSIGNEES
    );
    expectReferences(
      'المهام: الحالة',
      DEFAULT_TASKS.map((record) => record.status),
      TASK_STATUSES
    );
    expectReferences(
      'الالتزامات: الأولوية',
      DEFAULT_COMMITMENTS.map((record) => record.pri),
      TASK_PRIORITIES.map((priority) => priority.key)
    );

    expectReferences(
      'العهد: الفئة',
      DEFAULT_CUSTODY_ISSUES_RECORDS.map((record) => record.cat),
      DEFAULT_CUSTODY_CATEGORIES
    );
    expectReferences(
      'العهد: المسؤول',
      DEFAULT_CUSTODY_ISSUES_RECORDS.map((record) => record.resp),
      DEFAULT_CUSTODY_RESPONSIBLES
    );
    expectReferences(
      'العهد: الحالة',
      DEFAULT_CUSTODY_ISSUES_RECORDS.map((record) => record.status),
      DEFAULT_CUSTODY_STATUSES
    );
    expectReferences(
      'العهد: الأولوية',
      DEFAULT_CUSTODY_ISSUES_RECORDS.map((record) => record.pri),
      DEFAULT_CUSTODY_PRIORITIES
    );

    expectReferences(
      'المالية: الأهمية',
      DEFAULT_FINANCIAL_TRANSACTIONS.map((record) => record.importance),
      DEFAULT_IMPORTANCE_LIST
    );
    expectReferences(
      'المالية: الحركة',
      DEFAULT_FINANCIAL_TRANSACTIONS.map((record) => record.movement),
      DEFAULT_MOVEMENTS
    );
    expectReferences(
      'المالية: القيد',
      DEFAULT_FINANCIAL_TRANSACTIONS.map((record) => record.restriction),
      DEFAULT_RESTRICTIONS
    );
    expectReferences(
      'المالية: الطريقة',
      DEFAULT_FINANCIAL_TRANSACTIONS.map((record) => record.movementType),
      DEFAULT_MOVEMENT_TYPES
    );
    expectReferences(
      'المالية: الفئة',
      DEFAULT_FINANCIAL_TRANSACTIONS.map((record) => record.categoryAccount),
      DEFAULT_CATEGORY_ACCOUNTS
    );
    expectReferences(
      'المالية: حساب التقييد',
      DEFAULT_FINANCIAL_TRANSACTIONS.map((record) => record.restrictionAccount),
      DEFAULT_RESTRICTION_ACCOUNTS
    );
    expectReferences(
      'المالية: الحساب',
      DEFAULT_FINANCIAL_TRANSACTIONS.map((record) => record.accountName),
      DEFAULT_ACCOUNT_NAMES
    );

    expectReferences(
      'الروابط: التصنيف',
      DEFAULT_LINKS_RECORDS.map((record) => record.classification),
      DEFAULT_LINK_CLASSIFICATIONS
    );
    expectReferences(
      'الروابط: الفئة',
      DEFAULT_LINKS_RECORDS.map((record) => record.category),
      DEFAULT_LINK_CATEGORIES
    );
    expectReferences(
      'الروابط: النوع',
      DEFAULT_LINKS_RECORDS.map((record) => record.type),
      DEFAULT_LINK_TYPES
    );
    expectReferences(
      'الروابط: الأهمية',
      DEFAULT_LINKS_RECORDS.map((record) => record.importance),
      DEFAULT_LINK_IMPORTANCES
    );
  });

  it('يحافظ على رسم المعرفة والروتين والمخزون بلا مراجع معلقة', () => {
    const folderIds = DEFAULT_NOTE_FOLDERS.map((folder) => folder.id);
    expectReferences(
      'الملاحظات: المجلد',
      DEFAULT_NOTES.map((note) => note.folderId),
      folderIds
    );

    const categoryIds = DEFAULT_ROUTINE_CATEGORIES.map((category) => category.id);
    const categoryNames = DEFAULT_ROUTINE_CATEGORIES.map((category) => category.name);
    const tagNames = DEFAULT_ROUTINE_TAGS.map((tag) => tag.name);
    const routinesById = new Map(DEFAULT_ROUTINES.map((routine) => [routine.id, routine]));
    const occurrencesById = new Map(DEFAULT_ROUTINE_OCCURRENCES.map((occurrence) => [occurrence.id, occurrence]));

    expectReferences(
      'الروتين: الفئة',
      DEFAULT_ROUTINES.map((routine) => routine.categoryId),
      categoryIds
    );
    expectReferences(
      'الروتين: اسم الفئة',
      DEFAULT_ROUTINES.map((routine) => routine.categoryName),
      categoryNames
    );
    expectReferences(
      'الروتين: الوسوم',
      DEFAULT_ROUTINES.flatMap((routine) => routine.tags),
      tagNames
    );
    expectReferences(
      'قوالب الروتين: الفئة',
      DEFAULT_ROUTINE_TEMPLATES.map((template) => template.category),
      categoryNames
    );
    expectReferences(
      'قوالب الروتين: الوسوم',
      DEFAULT_ROUTINE_TEMPLATES.flatMap((template) => template.tags),
      tagNames
    );

    for (const occurrence of DEFAULT_ROUTINE_OCCURRENCES) {
      const routine = routinesById.get(occurrence.routineId);
      expect(routine, `تكرار ${occurrence.id}: الروتين`).toBeDefined();
      expectReferences(
        `تكرار ${occurrence.id}: الخطوات`,
        occurrence.stepProgress?.map((progress) => progress.stepId) ?? [],
        routine?.steps.map((step) => step.id) ?? []
      );
    }

    for (const execution of DEFAULT_ROUTINE_EXECUTIONS) {
      expect(routinesById.get(execution.routineId)?.name, `تنفيذ ${execution.id}: اسم الروتين`).toBe(
        execution.routineName
      );
      expect(occurrencesById.get(execution.occurrenceId ?? '')?.routineId, `تنفيذ ${execution.id}: التكرار`).toBe(
        execution.routineId
      );
    }

    const productNames = DEFAULT_PRODUCTS.map((product) => product.name);
    expectReferences(
      'حركات المخزون: الأصناف',
      INITIAL_RECORDS.flatMap((record) => Object.keys(record.items ?? {})),
      productNames
    );
  });
});

describe('R59 — الأرقام والتواريخ', () => {
  it('يبقي كل المبالغ والكميات البذرية غير سالبة، ويعلن رصيد العميل الدائن الاستثنائي', () => {
    expectNonNegative(
      'الالتزامات',
      DEFAULT_COMMITMENTS.map((record) => record.amount)
    );
    expectNonNegative(
      'العهد',
      DEFAULT_CUSTODY_ISSUES_RECORDS.flatMap((record) => (record.amount === undefined ? [] : [record.amount]))
    );
    expectNonNegative(
      'القيود المالية',
      DEFAULT_FINANCIAL_TRANSACTIONS.flatMap((record) => [record.amountYER, record.amountSAR, record.amountUSD])
    );
    expectNonNegative(
      'المهام',
      DEFAULT_TASKS.flatMap((record) => (record.amount === undefined ? [] : [record.amount]))
    );
    expectNonNegative(
      'الأصناف',
      DEFAULT_PRODUCTS.map((record) => record.openingStock)
    );
    expectNonNegative(
      'حركات المخزون',
      INITIAL_RECORDS.flatMap((record) => Object.values(record.items ?? {}))
    );
    expectNonNegative(
      'تحصيلات الزيارات',
      DEFAULT_CUSTOMER_VISITS.flatMap((record) =>
        [record.amountCollectedYER, record.amountCollectedSAR, record.amountCollectedUSD].filter(
          (amount): amount is number => amount !== undefined
        )
      )
    );

    const creditedBalances = DEFAULT_CUSTOMERS.filter(
      (customer) => customer.balanceYER < 0 || customer.balanceSAR < 0 || customer.balanceUSD < 0
    );
    expect(creditedBalances).toHaveLength(1);
    expect(creditedBalances[0]).toMatchObject({ id: 'CUST-1003', balanceYER: -63_020 });
    expect(creditedBalances[0].notes).toContain('رصيد دائن');
  });

  it('لا يسمح بتاريخ شكلي أو يوم تقويمي مستحيل، ويحفظ مدى كل مهمة/زيارة', () => {
    expectReasonableIsoDates('كل حقول التاريخ البذرية', [
      DEFAULT_COMMITMENTS,
      DEFAULT_CUSTODY_ISSUES_RECORDS,
      DEFAULT_CUSTOMERS,
      DEFAULT_CUSTOMER_VISITS,
      DEFAULT_DOCTORS,
      DEFAULT_DOCTOR_VISITS,
      DEFAULT_FINANCIAL_TRANSACTIONS,
      DEFAULT_LINKS_RECORDS,
      DEFAULT_NOTES,
      DEFAULT_PRODUCTS,
      INITIAL_RECORDS,
      DEFAULT_ROUTINES,
      DEFAULT_ROUTINE_OCCURRENCES,
      DEFAULT_ROUTINE_EXECUTIONS,
      DEFAULT_TASKS,
    ]);

    expectDates(
      'الالتزامات',
      DEFAULT_COMMITMENTS.map((record) => record.due)
    );
    expectDates(
      'العهد',
      DEFAULT_CUSTODY_ISSUES_RECORDS.map((record) => record.date)
    );
    expectDates(
      'العملاء',
      DEFAULT_CUSTOMERS.flatMap((record) => [record.dateBegin, record.dateEnd, record.lastVisitDate])
    );
    expectDates(
      'زيارات العملاء',
      DEFAULT_CUSTOMER_VISITS.map((record) => record.date)
    );
    expectDates(
      'الأطباء',
      DEFAULT_DOCTORS.flatMap((record) => [record.dateBegin, record.dateEnd, record.lastVisitDate])
    );
    expectDates(
      'زيارات الأطباء',
      DEFAULT_DOCTOR_VISITS.flatMap((record) => [record.date, record.nextFollowUpDate])
    );
    expectDates(
      'المالية',
      DEFAULT_FINANCIAL_TRANSACTIONS.map((record) => record.date)
    );
    expectDates(
      'حركات المخزون',
      INITIAL_RECORDS.map((record) => record.date)
    );
    expectDates(
      'الروتين',
      DEFAULT_ROUTINES.flatMap((record) => [record.startDate, record.lastExecutedDate])
    );
    expectDates(
      'تكرارات الروتين',
      DEFAULT_ROUTINE_OCCURRENCES.map((record) => record.date)
    );
    expectDates(
      'تنفيذات الروتين',
      DEFAULT_ROUTINE_EXECUTIONS.map((record) => record.date)
    );

    expect(
      DEFAULT_COMMITMENTS.every(
        (record) => !record.due || !record.createdAt || record.createdAt.slice(0, 10) <= record.due
      )
    ).toBe(true);
    expect(
      DEFAULT_CUSTOMERS.every((record) => !record.dateBegin || !record.dateEnd || record.dateBegin <= record.dateEnd)
    ).toBe(true);
    expect(
      DEFAULT_DOCTORS.every((record) => !record.dateBegin || !record.dateEnd || record.dateBegin <= record.dateEnd)
    ).toBe(true);
    expect(DEFAULT_ROUTINES.every((record) => record.startTime < record.endTime)).toBe(true);
    expectUnique('أيام عمل الروتين', DEFAULT_ROUTINE_SETTINGS.workingDays.map(String));
    expect(DEFAULT_ROUTINE_SETTINGS.workingDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)).toBe(
      true
    );
  });
});
