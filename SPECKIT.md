# حزمة المواصفات الهندسية الشاملة لتنفيذ المنظومة (Project SpecKit)
## المنظومة الإدارية والمحاسبية وإدارة العملاء والأطباء والديون والمعرفة والروابط المتكاملة
**الإصدار:** 2.7.0 | **المعيار الهندسي:** AI-Model Ready Implementation Specification (SpecKit) | **تاريخ التحديث:** 2026-09-01

---

## 0. دليل توجيه نماذج الذكاء الاصطناعي (AI Agent Execution Directive)

> **إلى نموذج الذكاء الاصطناعي المنفذ (AI Coding Agent):**
> أنت مكلف ببناء أو إعادة تنفيذ هذا النظام بالكامل. هذه الوثيقة (SpecKit) تمثل **المصدر الحصري للحقيقة الهندسية (Single Source of Truth)**.
> - يجب الالتزام الصارم بأسماء الحقول (Field Names)، أنواع البيانات (TypeScript / Kotlin Data Types)، قواعد الأعمال الرياضية، والهيكلية المعتمدة دون أي اجتهاد أو حذف.
> - الواجهة بالكامل باللغة العربية مع دعم الاتجاه الكامل من اليمين إلى اليسار (`dir="rtl"`).
> - الخط المعتمد هو **Cairo** بجميع أوزانه.
> - القائمة الجانبية (Sidebar) تكون مثبتة على **الجانب الأيمن** دائماً.

---

## 1. ملخص المشروع ونطاق العمل (Project Overview & Scope)

### 1.1 الهدف الأساسي
منظومة رقمية شاملة فائقة السرعة تعمل بنمط **Zero-Latency Offline-First**، تدمج 11 دفتراً تخصصياً مستقلاً ولكنها مترابطة حسابياً وتنظيمياً، مع نظام نسخ احتياطي موحد بملف واحد مشفر بـ Checksum.

### 1.2 الدفاتر الـ 11 المشمولة في النطاق:
1. **اللوحة العامة الموحدة (Unified Dashboard)**
2. **مكتبة الروابط والأدوات الذكية (Smart Links Library)**
3. **دفتر العهد والإشكاليات المعلقة (Custody & Pending Issues)**
4. **إدارة الروتين والعادات اليومية (Routines & Habits Tracker)**
5. **دفتر السجل المالي واليومية العامة (Daily Financial Register)**
6. **دفتر الدين والالتزامات والجدولة (Debts & Commitments Ledger)**
7. **إدارة الملاحظات وقاعدة المعرفة (Notes & Knowledge Base)**
8. **دفتر صرف وتوريد الأصناف والمخزون (Stock & Inventory Movements)**
9. **دفتر المهام والأعمال ومصفوفة الأولويات (Tasks & Eisenhower Matrix)**
10. **دفتر إدارة العملاء ومسارات الزيارات (CRM & Customer Visits)**
11. **دفتر زيارات الأطباء والدعاية الطبية (Medical Rep & Doctor Tracker)**
12. **مركز التوثيق الشامل (PRD Hub) والإعدادات وسجل التدقيق (Audit Trail)**

---

## 2. الهيكلية المعمارية والتصميم الفني (Architecture Specification)

### 2.1 المبادئ المعمارية (Core Tenets)
1. **Zero-Latency Reactive Storage**: قراءة وكتابة وتعديل فوري في التخزين المحلي بدون حظر خيط التنفيذ الرئيسي (Non-blocking).
2. **Deterministic Mathematical Engines**: الحسابات المالية وأرصدة المخزون لا تُخزن كقيم ثابتة قابلة للتلف، بل تُحسب ديناميكياً من واقع سجلات الحركات (Ledger-derived balances).
3. **Audit Trail Logging**: كل عملية (إضافة، تعديل، حذف، استيراد، تصدير) تُسجل تلقائياً مع توثيق زمني ومعرف العملية.
4. **Unified Backup Integrity**: استيراد وتصدير كافة بيانات النظام بملف JSON واحد مع التحقق من سلامة البنية ومطابقة الـ Checksum.

---

## 3. نماذج وهياكل البيانات الصارمة (Data Schemas & Type Contracts)

```typescript
// ==========================================
// 1. STOCK & INVENTORY MODULE SCHEMAS
// ==========================================

export type MovementType = 'وارد' | 'منصرف';

export interface MovementItem {
  itemId: string;        // UUID of the Product
  itemName: string;      // Cached product name
  subId: string;         // Sequential item-specific movement ID
  quantity: number;      // Must be > 0
  price?: number;        // Unit price (optional)
  notes?: string;
}

export interface MovementRecord {
  id: string;            // Movement voucher ID (e.g. IN-0001, OUT-0001)
  date: string;          // ISO Date string (YYYY-MM-DD)
  day: string;           // Arabic day of the week (e.g. الأحد)
  type: MovementType;    // 'وارد' | 'منصرف'
  items: MovementItem[]; // Multiple items per voucher
  recipient: string;     // Supplier or recipient party
  notes?: string;
  createdAt: number;     // Timestamp
}

export interface Item {
  id: string;            // UUID
  name: string;          // Product name
  unit: string;          // e.g. حبة, كرتون, علبة, باكت
  openingBalance: number;// Opening balance >= 0
  category?: string;     // Classification category
  minLimit?: number;     // Low stock reorder threshold
  notes?: string;
}

// ==========================================
// 2. FINANCIAL LEDGER SCHEMAS
// ==========================================

export type FinancialType = 'إيراد' | 'مصروف' | 'سند قبض' | 'سند صرف' | 'تحويل داخلي';

export interface FinancialTransaction {
  id: string;            // Unique transaction code (e.g. ACC-0001)
  date: string;          // YYYY-MM-DD
  day: string;           // Derived Arabic day name
  amount: number;        // Monetary value > 0
  type: FinancialType;
  account: string;       // e.g. الصندوق الرئيسي, البنك, محفظة إلكترونية, عهدة
  movement: string;      // Movement description / subcategory
  restriction: string;   // Documentation status: '√' | 'A' | 'B' | 'تم الترحيل' | 'قيد التنفيذ' | 'معلق' | 'إشكال'
  party?: string;        // Associated entity / customer / vendor
  notes?: string;
  createdAt: number;
}

// ==========================================
// 3. DEBTS & COMMITMENTS SCHEMAS
// ==========================================

export type DebtType = 'لنا' | 'علينا'; // Receivables vs Payables
export type DebtStatus = 'معلق' | 'مسدد جزئياً' | 'مسدد بالكامل' | 'متعثر';

export interface DebtRepayment {
  id: string;
  date: string;
  amount: number;
  financialRefId?: string; // Linked ACC-XXXX transaction
  notes?: string;
}

export interface DebtRecord {
  id: string;
  partyName: string;     // Person or company name
  phone?: string;
  type: DebtType;        // 'لنا' (Receivable) | 'علينا' (Payable)
  totalAmount: number;   // Original debt amount
  paidAmount: number;    // Cumulative repayments
  remainingAmount: number;// totalAmount - paidAmount
  dueDate?: string;      // Scheduled settlement date
  status: DebtStatus;
  category?: string;     // e.g. تجاري, شخصي, موردين
  repayments: DebtRepayment[];
  notes?: string;
  createdAt: number;
}

// ==========================================
// 4. CRM & CUSTOMER VISITS SCHEMAS
// ==========================================

export interface CustomerRecord {
  id: string;
  name: string;
  tradeName?: string;    // Business / Pharmacy / Store name
  phone: string;
  address: string;
  region: string;        // Geographic district / route
  category: string;      // e.g. VIP, Class A, Class B, Class C
  creditLimit?: number;
  currentBalance: number;
  assignedRoute?: string;// e.g. مسار السبت, خط صنعاء-التحرير
  notes?: string;
}

export interface CustomerVisitRecord {
  id: string;
  customerId: string;
  customerName: string;
  visitDate: string;
  purpose: 'تحصيل' | 'طلب بضاعة' | 'عرض منتجات' | 'متابعة دورية' | 'حل إشكال';
  outcome: string;
  collectedAmount?: number;
  orderSummary?: string;
  nextFollowUpDate?: string;
  notes?: string;
}

// ==========================================
// 5. MEDICAL REP & DOCTORS SCHEMAS
// ==========================================

export interface DoctorRecord {
  id: string;
  name: string;
  specialty: string;     // e.g. باطنية, جلدية, أطفال, جراحة
  clinicName: string;
  address: string;
  classCategory: 'Class A+' | 'Class A' | 'Class B' | 'Class C';
  visitSchedule: string; // e.g. السبت والأربعاء - مساءً
  phone?: string;
  notes?: string;
}

export interface DoctorVisitRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  visitDate: string;
  promotedProducts: string[]; // List of presented drugs / products
  samplesGiven: { productName: string; quantity: number }[];
  doctorFeedback: 'إيجابي جداً' | 'مهتم' | 'محايد' | 'متحفظ' | 'طلب عينات إضافية';
  nextVisitDate?: string;
  notes?: string;
}

// ==========================================
// 6. TASKS & EISENHOWER MATRIX SCHEMAS
// ==========================================

export type EisenhowerQuadrant = 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'neither';
export type PriorityLevel = 'A' | 'B' | 'C' | 'D'; // ABCD Method

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  quadrant: EisenhowerQuadrant;
  priority: PriorityLevel;
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: number;
  planId?: string;       // Linked master plan / milestone
  category?: string;
}

// ==========================================
// 7. KNOWLEDGE BASE & NOTES SCHEMAS
// ==========================================

export interface NoteCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface NoteRecord {
  id: string;
  title: string;
  content: string;       // Markdown formatted content
  categoryId: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isTrashed: boolean;
  updatedAt: number;
}

export interface QuickNoteRecord {
  id: string;
  text: string;
  createdAt: number;
}

// ==========================================
// 8. ROUTINES & HABITS SCHEMAS
// ==========================================

export interface RoutineItem {
  id: string;
  title: string;
  frequency: 'يومي' | 'أسبوعي' | 'شهري' | 'صباحي' | 'مسائي';
  targetMinutes?: number;
  importance: 'عالي' | 'متوسط' | 'عادي';
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate?: string;
  history: Record<string, boolean>; // 'YYYY-MM-DD': true
}

// ==========================================
// 9. CUSTODY & PENDING ISSUES SCHEMAS
// ==========================================

export type CustodyStatus = 'معلق' | 'قيد المتابعة' | 'تم التسوية جزئياً' | 'مغلق' | 'إشكال محاسبي';

export interface CustodyIssueRecord {
  id: string;
  title: string;
  responsiblePerson: string;
  custodyType: 'نقدية' | 'عينية' | 'أجهزة ومعدات' | 'فارق محاسبي';
  amount?: number;
  issueDate: string;
  settlementDate?: string;
  status: CustodyStatus;
  actionsTaken: { date: string; action: string; user?: string }[];
  notes?: string;
}

// ==========================================
// 10. SMART LINKS LIBRARY SCHEMAS
// ==========================================

export interface LinkRecord {
  id: string;
  title: string;
  url: string;
  category: string;
  classification: string;
  importance: 'A' | 'B' | 'C' | 'D' | 'مفيد' | 'ملغي' | 'غير نشط';
  type: 'رسمي' | 'مجاني' | 'مدفوع' | 'مهكر' | 'تحميل' | 'فيسبوك' | 'انستجرام' | 'تلجرام';
  isAi: boolean;
  isFavorite: boolean;
  visitCount: number;
  notes?: string;
}

// ==========================================
// 11. UNIFIED BACKUP & AUDIT TRAIL SCHEMAS
// ==========================================

export interface AuditLog {
  id: string;
  timestamp: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'IMPORT' | 'EXPORT' | 'RESET';
  module: string;
  entityId: string;
  details: string;
}

export interface UnifiedBackupState {
  app: "المنظومة الإدارية والمحاسبية وإدارة العملاء والأطباء والديون والمعرفة المتكاملة";
  version: "2.7.0";
  exportedAt: string; // ISO String
  checksum: string;   // Deterministic SHA-256 or CRC32 hash of payload
  modules: {
    stock: { products: Item[]; records: MovementRecord[]; categories: string[]; };
    financial: { transactions: FinancialTransaction[]; accounts: string[]; };
    debts: { records: DebtRecord[]; };
    customers: { customers: CustomerRecord[]; visits: CustomerVisitRecord[]; };
    doctors: { doctors: DoctorRecord[]; visits: DoctorVisitRecord[]; };
    tasks: { tasks: TaskItem[]; };
    knowledge: { notes: NoteRecord[]; categories: NoteCategory[]; quickNotes: QuickNoteRecord[]; };
    routines: { records: RoutineItem[]; };
    custody: { records: CustodyIssueRecord[]; };
    linksLibrary: { records: LinkRecord[]; };
  };
  auditTrail: AuditLog[];
}
```

---

## 4. القواعد الخوارزمية والحسابية الصارمة (Mathematical Rules)

### 4.1 معادلات الصندوق والمالية
1. **المقبوضات الإجمالية ($\text{Total Inflow}$):**
   $$\text{Inflow} = \sum_{\text{type} \in \{\text{'إيراد'}, \text{'سند قبض'}\}} \text{amount}$$
2. **المدفوعات الإجمالية ($\text{Total Outflow}$):**
   $$\text{Outflow} = \sum_{\text{type} \in \{\text{'مصروف'}, \text{'سند صرف'}\}} \text{amount}$$
3. **رصيد الصندوق اللحظي ($\text{Net Balance}$):**
   $$\text{Balance} = \text{Inflow} - \text{Outflow}$$

### 4.2 معادلات إدارة المخزون اللحظي
لكل صنف $i$ ذو معرف `itemId`:
$$\text{Current Stock}_i = \text{openingBalance}_i + \sum_{\text{record} \in \text{IN}} \text{qty}_{i} - \sum_{\text{record} \in \text{OUT}} \text{qty}_{i}$$

### 4.3 توازن الديون والسداد
لكل سجل دين $D$:
$$\text{remainingAmount}_D = \text{totalAmount}_D - \sum_{r \in \text{repayments}} \text{amount}_r$$
- إذا كان $\text{remainingAmount} = 0 \implies \text{status} = \text{'مسدد بالكامل'}$.
- إذا كان $0 < \text{remainingAmount} < \text{totalAmount} \implies \text{status} = \text{'مسدد جزئياً'}$.

---

## 5. مواصفات واجهة وتجربة المستخدم (UI/UX Specifications)

1. **الخط الطباعي (Typography):**
   - الخط الأساسي: **Cairo** من Google Fonts (400, 500, 600, 700, 800, 900).
   - لا يجوز استخدام خطوط بديلة مثل Arial أو Roboto للنصوص العربية.
2. **الاتجاه والترتيب (RTL Layout):**
   - السمة `dir="rtl"` مفعلة على جذر التطبيق (`<html>` و `<body>`).
   - جميع حقول الإدخال النصية تبدأ من اليمين (`text-align: right`).
   - الحقول الرقمية والأكواد (`code`, `numbers`, `dates`) تدعم محاذاة واضحة مع خطوط متناسقة `tnum`.
3. **الشريط الجانبي الأيمن (Right Sidebar):**
   - مثبت على الجانب الأيمن (`fixed top-0 right-0 h-screen`).
   - يدعم خاصيتي الفتح/الإغلاق للشاشات الصغيرة وتغيير الحجم (Collapse/Expand) للشاشات الكبيرة.
   - يتضمن شارات (Badges) بالأعداد الحية للسجلات في كل دفتر.
4. **تكامل التصدير والطباعة:**
   - تصدير كامل إلى JSON بضغطة زر.
   - استيراد مع فحص ومطابقة تلقائية ومراجعة سلامة البيانات قبل التخزين.
   - تصدير كشوفات CSV لجميع الدفاتر.
   - تجهيز صفحات الطباعة عبر CSS `@media print` المخصص لحجم A4 بدون ظهور أشرطة التمرير أو الأزرار.

---

## 6. خطة التنفيذ خطوة بخطوة للنماذج الذكية (Step-by-Step Implementation Roadmap)

عند قيام أي نموذج ذكاء اصطناعي (مثل Claude, GPT, Gemini, DeepSeek) ببرمجة النظام، يجب اتباع هذه المراحل بالترتيب:

### المرحلة 1: إعداد البيئة والنماذج الأساسية (Core & Schemas)
1. إنشاء ملف الأنواع الشامل `types.ts` أو Kotlin Models يحتوي كافة العقود المعرفة في القسم (3).
2. إعداد محرك التخزين والتحقق `storage.ts` أو Room Database مع قيم تجريبية افتراضية غنية (Seed Data).
3. إعداد نظام الـ `AuditLog` لحفظ التغييرات تلقائياً.

### المرحلة 2: هيكل التخطيط والخطوط (Layout & RTL Shell)
1. ضبط الخط **Cairo** والاتجاه `dir="rtl"`.
2. بناء مكون القائمة الجانبية اليمنى (`Sidebar.tsx`) والشريط العلوي (`Header.tsx`).
3. بناء نظام التوجيه والتبديل بين التبويبات الـ 11.

### المرحلة 3: بناء دفاتر العمليات والمحاسبة (Financial & Inventory)
1. برمجة دفتر السجل المالي `FinancialModule` مع حساب التدفقات الفورية.
2. برمجة دفتر المخزون `StockModule` مع الحساب التلقائي للأرصدة وسندات `IN/OUT`.
3. برمجة دفتر الديون والالتزامات `DebtsModule` مع سجل السدادات.

### المرحلة 4: بناء دفاتر العلاقات والزيارات (CRM & Medical Rep)
1. برمجة `CustomersModule` مع خطوط السير وتوثيق الزيارات.
2. برمجة `DoctorsModule` مع سجلات الأطباء والعينات الترويجية.

### المرحلة 5: بناء دفاتر التنظيم والمعرفة (Knowledge, Tasks & Routines)
1. برمجة `TasksModule` بمصفوفة آيزنهاور التفاعلية.
2. برمجة `KnowledgeModule` بالمجلدات ومسودة الأفكار.
3. برمجة `RoutinesModule` و `CustodyModule` و `LinksLibraryModule`.

### المرحلة 6: لوحة القيادة، وثيقة PRD، وأدوات النسخ الاحتياطي (Integration & Export)
1. تجميع المؤشرات في `UnifiedDashboard`.
2. دمج عارض وثيقة الـ PRD مع أزرار النسخ والتحميل المباشر.
3. تفعيل التصدير/الاستيراد الشامل مع فحص الـ Checksum في `UnifiedSettings`.

---
*تم إعداد هذه الوثيقة وفق أعلى المعايير الهندسية لضمان التنفيذ الدقيق والمتطابق عبر أي بيئة تطويرية أو نموذج ذكاء اصطناعي.*
