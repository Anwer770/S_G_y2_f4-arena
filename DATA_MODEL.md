# خريطة وهيكل البيانات (Data Model Map)
## توثيق الكيانات، الحقول، المفاتيح، والعلاقات الحالية في المنظومة

### 1. كيانات إدارة المخزون (Stock & Inventory)

#### أ. الصنف المخزني (`Product` / `Item`)
* **المعرف**: `id` (نص فريد، مثل `prod-001`)
* **الحقول**:
  * `name`: string (اسم الصنف، فريد)
  * `openingStock`: number (الرصيد الافتتاحي)
  * `unit`: string (الوحدة: كرتون، باكت، حبة، درزن، إلخ)
  * `isActive`: boolean (نشط / موقف)
  * `description`?: string (وصف الصنف)
* **المخزن**: مفتاح IndexedDB / LocalStorage: `suite_stock_products_v1`
* **الحقول المحسوبة (`ProductStock`)**:
  * `totalIn`: مجموع حركات التوريد
  * `totalOut`: مجموع حركات الصرف
  * `currentStock` = `openingStock` + `totalIn` - `totalOut`
  * `movementCount`: عدد أذونات الحركة للصنف

#### ب. إذن حركة المخزون (`MovementRecord`)
* **المعرف**: `id` و `subId` (مثل `IN-0012` أو `OUT-0150`)
* **الحقول**:
  * `mainId`: string (معرف التصنيف، مثل `Categ-1001`)
  * `date`: string (تاريخ الحركة YYYY-MM-DD)
  * `beneficiary`: string (المستفيد أو المورد)
  * `description`: string (البيان)
  * `movementType`: 'توريد' | 'صرف'
  * `status`: string (تم التنفيذ، قيد التنفيذ، تم ترحيل، ملغي)
  * `category`: string (مبيعات، مشتريات، عينات، دعم، هدية، توزيع، تالف، عهدة، إلخ)
  * `items`: `Record<string, number>` (قاموس: اسم الصنف -> الكمية)
  * `note`?: string
* **المخزن**: `suite_stock_records_v1`
* **العلاقة**: عند تفعيل الربط المحاسبي، تنشئ حركة المخزون قيداً مالياً في دفتر السجل اليومي.

---

### 2. كيانات السجل المالي والمحاسبي (Daily Financial Ledger)

#### القيد المالي / السند (`FinancialTransaction`)
* **المعرف**: `id` (مثل `ACC-1001` بالتسلسل الرقمي)
* **الحقول**:
  * `number`: string (رقم المرجع / رقم السند الدفتري)
  * `date`: string (تاريخ العملية YYYY-MM-DD)
  * `day`: string (يوم الأسبوع محسوب تلقائياً باللغة العربية)
  * `importance`: string (درجة الأهمية: √, A, B, تم ترحيل, تم التنفيذ, معلق, اشكال)
  * `movement`: string (نوع الحركة: الصندوق, ايرادات, منصرف, حساب له, حساب عليه, سلفه)
  * `restriction`: string (نوع القيد / السند: فاتورة, امر صرف, سند, سند قبض)
  * `movementType`: string (طريقة الدفع: نقدا, كريمي, جيب, صراف, حوالة, اجل)
  * `categoryAccount`: string (فئة الحساب: أنور, أنور البيت, زها, تحصيل, مبيعات)
  * `restrictionAccount`: string (حساب التقييد)
  * `accountName`: string (اسم الحساب المستفيد أو الدافع)
  * `amountYER`: number (المبلغ بالريال اليمني)
  * `amountSAR`: number (المبلغ بالريال السعودي)
  * `amountUSD`: number (المبلغ بالدولار الأمريكي)
  * `description`?: string (البيان والشرح)
  * `isDraft`?: boolean
* **المخزن**: `suite_fin_transactions_v2`
* **قواعد العمل**:
  * حساب إجمالي المقبوضات والمصروفات لكل عملة على حدة.
  * حساب صافي حركة الصندوق والسيولة النقدية المتوفرة.

---

### 3. كيانات العملاء والزيارات (Customers & Field Visits)

#### أ. العميل (`Customer`)
* **المعرف**: `id` (مثل `CUST-1001`) و `subId` (مثل `ذهبي-001`)
* **الحقول**:
  * `name`: string (اسم العميل / الصيدلية / المركز)
  * `source`: CustomerSource (القيصر الذهبي | توب مكياجي | عفيف | الأطباء | أخرى)
  * `region`: string (المنطقة الجغرافية)
  * `route`: string (مسار الزيارة: السبت، الأحد ... أو شهري)
  * `significance`: CustomerSignificance (A, B, C, √)
  * `status`: VisitStatus (مخطط، قيد تنفيذ، مكتمل، ملغي، مرحل، متابعة، مصفر)
  * `responsible`: string (المندوب المسؤول)
  * `taskDesc`?: string (الغرض من الزيارة)
  * `dateBegin`?, `dateEnd`?: string (فترة المهمة)
  * `balanceYER`, `balanceSAR`, `balanceUSD`: number (أرصدة المديونية)
  * `phone`?, `address`?, `notes`?: string
  * `isInternalAccount`?: boolean
  * `lastVisitDate`?, `visitResult`?: string
* **المخزن**: `suite_customers_v1`

#### ب. سجل الزيارة الميدانية للعميل (`CustomerVisitRecord`)
* **المعرف**: `id` (مثل `VISIT-XXXX`)
* **الحقول**:
  * `customerId`: string (معرف العميل المرتبط)
  * `customerName`: string
  * `date`: string و `dayOfWeek`: string
  * `responsible`: string
  * `status`: VisitStatus
  * `amountCollectedYER`, `amountCollectedSAR`, `amountCollectedUSD`: number (التحصيل المالي)
  * `notes`: string
* **المخزن**: `suite_customer_visits_v1`
* **العلاقة**: تحديث تلقائي لرصيد مديونية العميل وتاريخ آخر زيارة.

---

### 4. كيانات الأطباء والمراكز الطبية (Doctors & Medical Visits)

#### أ. سجل الطبيب (`DoctorRecord`)
* **المعرف**: `id` (مثل `DOC-1001`)
* **الحقول**:
  * `name`: string (اسم الطبيب)
  * `specialty`?: string (التخصص الطبي)
  * `clinicName`?: string (اسم العيادة أو المستشفى)
  * `source`: string
  * `region`: string، `route`: string، `responsible`: string
  * `significance`: DoctorSignificance (A, B, C, √)
  * `status`: DoctorVisitStatus
  * `taskDesc`?, `dateBegin`?, `dateEnd`?: string
  * `phone`?, `address`?, `notes`?: string
  * `samplesGiven`?, `visitResult`?, `lastVisitDate`?: string
* **المخزن**: `suite_doctors_v1`

#### ب. سجل زيارة الطبيب (`DoctorVisitLog`)
* **المعرف**: `id` (مثل `DVL-XXXX`)
* **الحقول**:
  * `doctorId`: string، `doctorName`: string
  * `date`: string، `dayOfWeek`: string، `responsible`: string
  * `status`: DoctorVisitStatus
  * `samplesGiven`: string (العينات المسلمة)
  * `visitResult`: string (نتيجة التفاعل)
  * `nextFollowUpDate`: string (موعد المتابعة)
* **المخزن**: `suite_doctor_visits_v1`

---

### 5. كيانات الديون والالتزامات (Debts & Commitments)

#### أ. قيد الدين الفردي (`DebtRecord`)
* **المعرف**: `id` (مثل `DEBT-XXXX`)
* **الدفتر**: `book` ('anwar' | 'previous' | 'zaha' | 'ali_qat')
* **الحقول**:
  * `date`: string
  * `icon`: string (علامة مميزة)
  * `name`: string (البيان)
  * `currency`: 'YER' | 'SAR' | 'USD'
  * `debit`: number (مدين - عليه)
  * `credit`: number (دائن - له)
  * `note`: string
  * `isCompleted`: boolean (شطب السجل المكتمل)
  * `runningBalance`?: number (رصيد تراكمي)
* **المخزن**: `suite_debts_records_v1`

#### ب. الالتزام المالي ومتابعة السداد (`DebtCommitment`)
* **المعرف**: `id` (مثل `التزامات-001`)
* **الحقول**:
  * `name`: string، `desc`?: string
  * `date`: string (تاريخ القيد)، `endDate`: string (تاريخ الاستحقاق)
  * `priority`: 'A' | 'B' | 'C'
  * `status`: string (مؤكد، منجز، جارية، متأخرة، إلخ)
  * `owner`: string، `category`: string
  * `amount`: number، `currency`: string
  * `dir`: 'debit' | 'credit'
  * `payments`: `DebtCommitmentPayment[]` (سجل دفعات السداد الجزئية: pid, date, amount, note)
* **المخزن**: `suite_debts_commitments_v1`

---

### 6. كيانات المهام والأعمال التشغيلية (Classic Tasks & Commitments)
* **المهمة (`Task`)**: `id` (T-XXXX), `title`, `start`, `end`, `cat`, `op`, `pri` (A,B,C,D), `status`, `resp`, `amount`
* **المخزن**: `suite_tasks_v2`
* **الالتزام (`Commitment`)**: `id`, `name`, `amount`, `pri`, `due`, `status`, `desc`
* **المخزن**: `suite_commitments_v2`

---

### 7. كيانات العهد والإشكاليات (Custody & Issues)
* **السجل (`CustodyIssueRecord`)**:
  * `id`: string
  * `section`: 'custody' (عهدة) | 'issue' (إشكالية)
  * `date`: string، `name`: string، `desc`: string، `cat`: string
  * `pri`: 'A' | 'B' | 'C'
  * `status`: 'مخطط' | 'قيد التنفيذ' | 'تم الانجاز' | 'معلق' | 'ملغي'
  * `resp`: string، `amount`?: number، `currency`?: string
* **المخزن**: `suite_custody_records_v1`

---

### 8. كيانات الملاحظات وقاعدة المعرفة (Knowledge & Notes)
* **الملاحظة (`NoteRecord`)**: `id` (NOTE-XXXX), `title`, `content`, `folderId`, `type`, `category`, `priority`, `status`, `tags`, `isLocked`, `attachments`, `tasks`, `versions`
* **المجلد (`NoteFolder`)**: `id`, `name`, `icon`, `color`, `parentId`
* **المخزن**: `suite_knowledge_notes_v1`, `suite_knowledge_folders_v1`

---

### 9. كيانات الروتين والعادات (Routines & Habits)
* **الروتين (`RoutineRecord`)**: `id`, `name`, `category`, `defaultTime`, `duration`, `frequency`, `steps`
* **التنفيذ والتكرار (`RoutineOccurrence` & `RoutineExecution`)**
* **المخزن**: `suite_routines_v1`, `suite_routines_occurrences_v1`, `suite_routines_executions_v1`

---

### 10. كيانات مساحة العمل الحديثة (Work OS Ecosystem)
* **المهام والمشاريع والأهداف**: `workos_v1_projects`, `workos_v1_tasks`, `workos_v1_goals`, `workos_v1_habits`, `workos_v1_appointments`
