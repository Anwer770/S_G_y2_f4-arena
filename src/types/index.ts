// ============================================================================
// TYPES DEFINITION FOR MULTI-MODULE SUITE:
// 1. Stock & Inventory Ledger (دفتر صرف وتوريد الأصناف)
// 2. Daily Financial Ledger (دفتر السجل المالي اليومي)
// 3. Tasks, Commitments & Plans (دفتر المهام والأعمال والخطط والأهداف - دفتر المها v2.0)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. STOCK & INVENTORY TYPES
// ----------------------------------------------------------------------------
export type MovementType = 'توريد' | 'صرف';

export interface Product {
  id: string;
  name: string;
  openingStock: number;
  unit: string;
  isActive: boolean;
  description?: string;
  createdAt?: string;
}

export interface MovementRecord {
  id: string; // Unique internal ID, or matches subId
  mainId: string; // e.g. "Categ-1001"
  subId: string; // e.g. "IN-0001" or "OUT-0299" (Unique)
  date: string; // YYYY-MM-DD
  beneficiary: string; // Beneficiary / Supplier / Customer
  description: string; // Description
  movementType: MovementType; // "توريد" or "صرف"
  status: string; // تم التنفيذ, قيد التنفيذ, تم ترحيل, ملغي, etc.
  category: string; // مبيعات, مشتريات, عينات, دعم, هدية, توزيع, شخصي, تالف, شركة, مرتجع, عهده, معلقه, أخرى
  items: Record<string, number>; // { [productName]: quantity }
  note?: string; // Additional notes
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductStock {
  id: string;
  name: string;
  openingStock: number;
  totalIn: number;
  totalOut: number;
  currentStock: number;
  movementCount: number;
  isActive: boolean;
  unit: string;
}

export interface StockFilterState {
  search: string;
  movementType: string;
  status: string;
  category: string;
  product: string;
  beneficiary: string;
  startDate: string;
  endDate: string;
  withoutQuantitiesOnly: boolean;
}

// ----------------------------------------------------------------------------
// 2. DAILY FINANCIAL LEDGER TYPES (دفتر السجل المالي اليومي)
// ----------------------------------------------------------------------------
export interface FinancialTransaction {
  id: string; // معرف فريد بصيغة ACC-XXXX (مثال: ACC-1001)
  day: string; // يوم الأسبوع، يُحسب تلقائيًا من التاريخ (مثال: الثلاثاء)
  date: string; // تاريخ العملية YYYY-MM-DD
  importance: string; // درجة الأهمية (√, A, B, تم ترحيل, تم التنفيذ, قيد التنفيذ, معلق, اشكال)
  movement: string; // نوع الحركة (الصندوق, ايرادات, منصرف, حساب له, حساب عليه, سلفه, ملاحظة, حساب دائن (له), حساب مدين (ع))
  restriction: string; // نوع القيد / السند (فاتورة, امر صرف, سند, سند قبض, ...)
  movementType: string; // طريقة الدفع (اجل, نقدا, كريمي, جيب, صراف, حوالة, ...)
  categoryAccount: string; // فئة الحساب (أنور, أنور البيت, زها, تحصيل, مبيعات, ...)
  restrictionAccount: string; // حساب التقييد
  accountName: string; // اسم الحساب
  description?: string; // وصف تفصيلي للعملية (اختياري)
  number: string; // رقم السند أو المرجع (مثال: 851)
  amountYER: number; // المبلغ الرئيسي بالريال اليمني
  amountSAR: number; // المبلغ بالريال السعودي
  amountUSD: number; // المبلغ بالدولار الأمريكي
  isDraft?: boolean; // هل القيد مسودة
  attachmentUrl?: string; // مستند مرفق أو رقم المرجع
  createdAt?: string;
  updatedAt?: string;
}

export type FinancialPeriodFilter = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface FinancialFilterState {
  search: string;
  movement: string;
  importance: string;
  restriction: string;
  movementType: string;
  categoryAccount: string;
  restrictionAccount: string;
  accountName: string;
  startDate: string;
  endDate: string;
  currencyFilter: 'all' | 'YER' | 'SAR' | 'USD';
  periodFilter?: FinancialPeriodFilter;
  selectedPeriodDate?: string;
  isDraftOnly?: boolean;
}

export interface FinancialDropdownLists {
  movements: string[];
  restrictions: string[];
  movementTypes: string[];
  importanceList: string[];
  categoryAccounts: string[];
  restrictionAccounts: string[];
  accountNames: string[];
}

// ----------------------------------------------------------------------------
// 3. TASKS, COMMITMENTS, PLANS & GOALS TYPES (دفتر المها v2.0)
// ----------------------------------------------------------------------------
export type TaskPriority = 'A' | 'B' | 'C' | 'D'; // A: حرجة, B: عالية, C: متوسطة, D: منخفضة

export type TaskStatus =
  | 'مخطط'
  | 'الهدف'
  | 'قيد التنفيذ'
  | 'تم الانجاز'
  | 'تم ترحيل'
  | 'مؤجل'
  | 'ملغي'
  | 'متأخر';

export interface Task {
  id: string; // Unique T-XXXX (e.g. "T-0001")
  sub?: string; // المعرف الفرعي (مثال: عملاء-0012)
  start: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
  title: string; // عنوان المهمة
  desc?: string; // الوصف والتفاصيل
  cat: string; // الفئة من الـ 18 فئة
  op: string; // العملية من الـ 8 عمليات
  pri: TaskPriority; // الأولوية (A, B, C, D)
  status: TaskStatus; // الحالة
  resp: string; // المسؤول من الـ 12 مسؤول
  amount?: number; // المبلغ إن وجد
  createdAt?: string;
  updatedAt?: string;
}

export interface Commitment {
  id: string; // التزامات-XXX
  name: string; // اسم الالتزام / الجهة
  amount: number; // المبلغ
  pri: TaskPriority; // الأهمية
  due?: string; // تاريخ الاستحقاق YYYY-MM-DD
  status: 'قيد التنفيذ' | 'تم الانجاز' | 'مؤجل' | 'ملغي' | 'متأخر';
  desc?: string; // تفاصيل / ملاحظات
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskFilterState {
  search: string;
  cat: string;
  op: string;
  pri: string;
  status: string;
  resp: string;
  startDate: string;
  endDate: string;
  overdueOnly: boolean;
}

export type Item = Product;
export type Movement = MovementRecord;
export type MainAppModule = ActiveModuleTab;

export interface TaskAuditLog {
  id: string;
  time: string;
  action: 'إضافة' | 'تعديل' | 'حذف' | 'إنجاز' | 'استيراد' | 'تصدير' | 'تنظيف' | 'نظام';
  entity: 'مهمة' | 'التزام' | 'القوائم' | 'النظام' | 'مهام';
  title: string;
  details: string;
}

export type CalendarViewMode = 'daily' | 'weekly' | 'monthly';

// ----------------------------------------------------------------------------
// 4. CUSTOMERS & VISITS MANAGEMENT TYPES (دفتر إدارة العملاء والزيارات - القيصر الذهبي)
// ----------------------------------------------------------------------------
export type CustomerSource = 'القيصر الذهبي' | 'توب مكياجي' | 'عفيف' | 'الأطباء' | 'أخرى';
export type CustomerSignificance = 'A' | 'B' | 'C' | '√';
export type VisitStatus = 'مخطط' | 'قيد تنفيذ' | 'مكتمل' | 'ملغي' | 'مرحل' | 'متابعة' | 'مصفر';

export interface Customer {
  id: string; // المعرف الرئيسي (CUST-XXXX)
  subId: string; // المعرف الفرعي (ذهبي-001 / توب-001 / عفيف-001 / د-001)
  name: string; // اسم العميل / الصيدلية / المركز / الطبيب
  source: CustomerSource; // القيصر الذهبي | توب مكياجي | عفيف | الأطباء
  region: string; // المنطقة الجغرافية (صنعاء، الحديدة، عدن، إب، تعز / الحوبان، إلخ)
  route: string; // مسار الزيارة (السبت، الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس، الجمعة، شهري، بداية الشهر، نص الشهر، نهاية الشهر)
  significance: CustomerSignificance; // مستوى الأهمية (A, B, C, √)
  status: VisitStatus; // حالة الزيارة / الحساب (مخطط، قيد تنفيذ، مكتمل، ملغي، مرحل، متابعة، مصفر)
  responsible: string; // المندوب المسؤول (انور، صدام، عمار، عبدالرحمن، الاكحلي، الهاملي، جمال، محمد، علاء الاغبري، إلخ)
  taskDesc?: string; // وصف المهمة / الغرض من الزيارة
  dateBegin?: string; // تاريخ بدء المهمة YYYY-MM-DD
  dateEnd?: string; // تاريخ انتهاء المهمة YYYY-MM-DD
  balanceYER: number; // الرصيد بالريال اليمني
  balanceSAR: number; // الرصيد بالريال السعودي
  balanceUSD: number; // الرصيد بالدولار الأمريكي
  notes?: string; // ملاحظات وتفاصيل
  phone?: string; // رقم الهاتف / واتساب
  address?: string; // العنوان / الموقع / مقر العمل
  isInternalAccount?: boolean; // هل هو حساب داخلي (تاليا، برايمو، القيصر، بضاعة تالفة، عهدة)
  lastVisitDate?: string; // تاريخ آخر زيارة منفذة
  visitResult?: string; // نتيجة الزيارة الأخيرة
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerVisitRecord {
  id: string; // VST-XXXX
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  responsible: string;
  status: VisitStatus;
  notes: string;
  amountCollectedYER?: number;
  amountCollectedSAR?: number;
  amountCollectedUSD?: number;
  createdAt: string;
}

export interface CustomerAuditLog {
  id: string;
  time: string;
  action: 'إضافة' | 'تعديل' | 'حذف' | 'زيارة' | 'تحصيل' | 'استيراد' | 'تصدير' | 'تسوية';
  customerName: string;
  details: string;
}

export interface CustomerFilterState {
  search: string;
  source: string;
  region: string;
  route: string;
  significance: string;
  status: string;
  responsible: string;
  debtorsOnly: boolean;
  internalOnly: boolean;
  todayVisitsOnly: boolean;
  currencyFilter: 'all' | 'YER' | 'SAR' | 'USD';
}

// ----------------------------------------------------------------------------
// 5. DOCTOR & MEDICAL VISITS TYPES (دفتر إدارة زيارات الأطباء - PRD v1.0)
// ----------------------------------------------------------------------------
export type DoctorSignificance = 'A' | 'B' | 'C' | '√';
export type DoctorVisitStatus = 'مخطط' | 'قيد تنفيذ' | 'مكتمل' | 'ملغي' | 'مرحل' | 'متابعة';

export interface DoctorRecord {
  id: string; // DOC-1001
  name: string; // اسم الطبيب / المركز الطبي (إلزامي)
  source: string; // المصدر (إلزامي - افتراضي: "الأطباء")
  specialty?: string; // التخصص الطبي (باطنية، أطفال، عظام، جلدية، جراحة، نساء وتوليد، أسنان، عام، إلخ)
  clinicName?: string; // اسم العيادة / المركز / المستشفى / القسم
  region: string; // المنطقة (صنعاء، الحديدة، عدن، إب، تعز / الحوبان، ذمار، إلخ)
  route: string; // المسار (السبت، الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس، الجمعة، بداية الشهر، نص الشهر، نهاية الشهر، شهري)
  significance: DoctorSignificance; // الأهمية (A، B، C، √)
  responsible: string; // المندوب المسؤول (انور، صدام، عمار، عبدالرحمن، الاكحلي، الهاملي، جمال، محمد، علاء الاغبري، شركة)
  taskDesc?: string; // وصف المهمة / الغرض من الزيارة
  dateBegin?: string; // تاريخ بدء المهمة YYYY-MM-DD
  dateEnd?: string; // تاريخ انتهاء المهمة YYYY-MM-DD
  status: DoctorVisitStatus; // حالة الزيارة (مخطط، قيد تنفيذ، مكتمل، ملغي، مرحل، متابعة)
  notes?: string; // ملاحظات
  phone?: string; // رقم الهاتف / واتساب
  address?: string; // الموقع / العنوان / مكان العمل
  visitResult?: string; // نتيجة الزيارة وملاحظات التفاعل
  samplesGiven?: string; // العينات والمواد المقدمة
  lastVisitDate?: string; // تاريخ آخر زيارة منفذة
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorVisitLog {
  id: string; // DVL-XXXX
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  responsible: string;
  status: DoctorVisitStatus;
  notes: string;
  visitResult?: string;
  samplesGiven?: string;
  nextFollowUpDate?: string;
  createdAt: string;
}

export interface DoctorAuditLog {
  id: string;
  time: string;
  action: 'إضافة' | 'تعديل' | 'حذف' | 'زيارة' | 'استيراد' | 'تصدير' | 'تحديث حالة' | 'نظام';
  doctorName: string;
  details: string;
}

export interface DoctorFilterState {
  search: string;
  region: string;
  route: string;
  status: string;
  responsible: string;
  significance: string;
  specialty: string;
  todayVisitsOnly: boolean;
  activePeriodOnly: boolean;
}

// ----------------------------------------------------------------------------
// 6. DEBT & COMMITMENTS LEDGER TYPES (دفتر الدين والالتزامات - PRD v1.0)
// ----------------------------------------------------------------------------
export type DebtBookId = 'anwar' | 'previous' | 'zaha' | 'ali_qat';

export interface DebtRecord {
  id: string; // DEBT-XXXX
  book: DebtBookId; // anwar | previous | zaha | ali_qat
  date: string; // YYYY-MM-DD (or empty)
  icon: string; // ★ ⚐ ⚑ ✔ x O or empty
  name: string; // البيان / الاسم / الوصف
  currency: string; // YER | USD | SAR
  debit: number; // مدين (عليه)
  credit: number; // دائن (له)
  note: string; // ملاحظات
  isCompleted: boolean; // شطب وتظليل السجل المكتمل
  runningBalance?: number; // رصيد تراكمي (حساب علي القات)
  createdAt?: string;
  updatedAt?: string;
}

export interface DebtCommitmentPayment {
  pid: string;
  date: string;
  amount: number;
  note?: string;
}

export interface DebtCommitment {
  id: string; // التزامات-001
  name: string; // اسم الالتزام (إجباري)
  desc?: string; // وصف إضافي
  date: string; // تاريخ القيد YYYY-MM-DD
  endDate: string; // تاريخ الاستحقاق YYYY-MM-DD
  priority: 'A' | 'B' | 'C'; // عالية / متوسطة / منخفضة
  status: string; // وضع خاص | يحتاج تأكيد | مؤكد | منجز | لم يظهر | استراحة | جارية | قادمة | متأخرة
  icon: string; // ★ ⚐ ⚑ ✔ ✖ ⏸
  owner: string; // المسؤول
  category: string; // الفئة (افتراضي: أعمال الالتزامات)
  amount: number; // المبلغ
  currency: string; // YER / USD / SAR
  dir: 'debit' | 'credit'; // عليه / له
  note?: string; // ملاحظات
  payments: DebtCommitmentPayment[]; // سجل الدفعات الجزئية
  createdAt?: string;
  updatedAt?: string;
}

export interface DebtAuditLog {
  id: string;
  time: string;
  action: 'إضافة' | 'تعديل' | 'حذف' | 'سداد' | 'إكمال' | 'استيراد' | 'استعادة' | 'إعدادات' | 'نظام';
  entity: 'سجل دين' | 'التزام' | 'دفعة' | 'دفتر' | 'نظام' | 'قيد دين' | 'دفعة سداد';
  title: string;
  details: string;
}

export interface DebtFilterState {
  search: string;
  book: string; // all | anwar | previous | zaha | ali_qat
  currency: string; // all | YER | SAR | USD
  status: string;
  priority: string;
  icon: string;
  owner: string;
  category: string;
  dir: string; // all | debit | credit
  dateFrom: string;
  dateTo: string;
  showCompleted: boolean;
  overdueOnly: boolean;
  dueSoonOnly: boolean;
}

// ----------------------------------------------------------------------------
// 7. NOTES & KNOWLEDGE MANAGEMENT TYPES (إدارة الملاحظات والمعرفة - NKM v1.0)
// ----------------------------------------------------------------------------
export type NoteType =
  | 'عامة'
  | 'فكرة'
  | 'خطة'
  | 'مشروع'
  | 'اجتماع'
  | 'اتصال'
  | 'زيارة'
  | 'قرار'
  | 'بحث'
  | 'مشكلة'
  | 'تذكير'
  | 'سجل'
  | 'مالية'
  | 'قانونية'
  | 'مهمة'
  | 'أخرى';

export type NotePriority = 'عالية' | 'متوسطة' | 'منخفضة';

export type NoteStatus =
  | 'مسودة'
  | 'جديدة'
  | 'قيد المراجعة'
  | 'نشطة'
  | 'مكتملة'
  | 'مؤرشفة';

export interface NoteFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  parentId?: string | null;
  isSystem?: boolean;
}

export interface NoteTagItem {
  id: string;
  name: string;
  color: string;
}

export interface NoteAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  uploadedAt: string;
}

export interface NoteVersion {
  id?: string;
  versionId?: string;
  savedAt?: string;
  date?: string;
  title: string;
  content: string;
  summary?: string;
  author?: string;
  changeSummary?: string;
}

export interface NoteTaskItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority?: NotePriority;
}

export interface NoteLinkItem {
  id: string;
  targetType: 'customer' | 'doctor' | 'task' | 'debt' | 'project' | 'note' | 'external';
  targetId: string;
  targetTitle: string;
  url?: string;
}

export interface NoteReminderItem {
  id: string;
  date: string;
  time?: string;
  repeat?: 'once' | 'daily' | 'weekly' | 'monthly';
  active: boolean;
  noteText?: string;
}

export interface NoteRecord {
  id: string; // e.g. NOTE-1001
  title: string;
  content: string; // Rich Text / HTML / Markdown
  summary?: string;
  type: NoteType;
  category: string;
  subCategory?: string;
  priority: NotePriority;
  status: NoteStatus;
  tags: string[];
  folderId: string;
  folderName?: string;
  date?: string;
  time?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isLocked: boolean;
  pinCode?: string;
  isQuickNote: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  color?: string; // card accent color
  source?: string; // رابط / كتاب / شخص / اجتماع
  linkedCustomerId?: string;
  linkedCustomerName?: string;
  linkedDoctorId?: string;
  linkedDoctorName?: string;
  linkedTaskId?: string;
  linkedTaskTitle?: string;
  linkedProject?: string;
  nextReviewDate?: string; // YYYY-MM-DD
  reviewReminderEnabled?: boolean;
  attachments?: NoteAttachment[];
  tasks?: NoteTaskItem[];
  reminders?: NoteReminderItem[];
  links?: NoteLinkItem[];
  versions?: NoteVersion[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // Soft delete / Trash bin
}

export interface NoteTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: NoteType;
  category: string;
  tags?: string[];
  defaultTags?: string[];
  contentTemplate?: string;
  defaultContent?: string;
  isCustom?: boolean;
  usageCount?: number;
}

export interface NoteFilterState {
  search?: string;
  query?: string;
  folderId?: string;
  type?: string | NoteType;
  category?: string;
  priority?: string | NotePriority;
  status?: string | NoteStatus;
  tag?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  hasTasks?: boolean;
  hasAttachments?: boolean;
  isFavorite?: boolean;
  isPinned?: boolean;
  needsReview?: boolean;
  needsReviewOnly?: boolean;
  isTrashOnly?: boolean;
  linkedEntityType?: string;
  sortBy?: 'date' | 'updatedAt' | 'title' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface NoteAuditLog {
  id: string;
  time: string;
  action: 'إضافة' | 'تعديل' | 'حذف' | 'استعادة' | 'استرجاع' | 'أرشفة' | 'قفل' | 'تحويل' | 'استيراد' | 'تصدير' | 'نظام';
  entity: 'ملاحظة' | 'ملاحظة سريعة' | 'مجلد' | 'وسم' | 'قالب' | 'نسخة' | 'نظام';
  title: string;
  details: string;
}

// ----------------------------------------------------------------------------
// 8. UNIFIED NAVIGATION & SYSTEM TYPES
// ----------------------------------------------------------------------------
export type ActiveModuleTab =
  | 'dashboard'
  | 'workos'
  | 'taskflow'
  | 'links'
  | 'custody'
  | 'financial'
  | 'debts'
  | 'knowledge'
  | 'routines'
  | 'stock'
  | 'tasks'
  | 'customers'
  | 'doctors'
  | 'settings';

// ----------------------------------------------------------------------------
// 9. UNIFIED SETTINGS, AUDIT & BACKUP TYPES
// ----------------------------------------------------------------------------
export interface AppSettings {
  defaultYear: number;
  skipCancelled: boolean;
  defaultCurrency: string;
  enableNotifications: boolean;
  debtAlertDaysWindow?: number;
  confirmDelete?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  module: 'مخزون' | 'مالي' | 'عهدة' | 'مهام' | 'عملاء' | 'أطباء' | 'ديون' | 'معرفة' | 'روتين' | 'روابط' | 'نظام';
  action: string;
  recordId?: string;
  details: string;
}

export * from './routines';
export * from './custodyIssues';
export * from './linksLibrary';
export * from './taskflow';
export * from './workos';

export interface UnifiedBackupState {
  app: string;
  version: string;
  exportedAt: string;
  checksum: string;
  modules: {
    stock: {
      products: Product[];
      records: MovementRecord[];
      categories: string[];
      statuses: string[];
      seq: { IN: number; OUT: number };
    };
    custody?: {
      records: any[];
      categories: string[];
      responsibles: string[];
      statuses: string[];
      priorities: string[];
    };
    financial: {
      transactions: FinancialTransaction[];
      movements: string[];
      restrictions: string[];
      movementTypes: string[];
      importanceList: string[];
      categoryAccounts: string[];
      restrictionAccounts: string[];
      accountNames: string[];
    };
    tasks: {
      tasks: Task[];
      commitments: Commitment[];
      categories: string[];
      operations: string[];
      priorities: string[];
      statuses: string[];
      assignees: string[];
      auditLogs: TaskAuditLog[];
    };
    customers: {
      customers: Customer[];
      visits: CustomerVisitRecord[];
      sources: string[];
      regions: string[];
      routes: string[];
      responsibles: string[];
      auditLogs: CustomerAuditLog[];
    };
    doctors: {
      doctors: DoctorRecord[];
      visits: DoctorVisitLog[];
      regions: string[];
      routes: string[];
      responsibles: string[];
      specialties: string[];
      auditLogs: DoctorAuditLog[];
    };
    debts?: {
      records: DebtRecord[];
      commitments: DebtCommitment[];
      categories: string[];
      owners: string[];
      auditLogs: DebtAuditLog[];
    };
    knowledge?: {
      notes: NoteRecord[];
      folders: NoteFolder[];
      tags: NoteTagItem[];
      templates: NoteTemplate[];
      auditLogs: NoteAuditLog[];
    };
    routines?: {
      routines: any[];
      occurrences: any[];
      executions: any[];
      categories: any[];
      tags: any[];
      templates: any[];
      exceptions: any[];
      auditLogs: any[];
      settings: any;
    };
    links?: {
      records: any[];
      classifications?: string[];
      categories?: string[];
      types?: string[];
      importances?: string[];
    };
    workos?: any;
    settings: AppSettings;
    systemLogs: AuditLog[];
  };
}

export * from './linksLibrary';


