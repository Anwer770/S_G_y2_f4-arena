# مصفوفة العمليات والبيانات (CRUD Matrix)
## توثيق عمليات الإنشاء والقراءة والتحديث والحذف ومواقع التخزين والعلاقات لكل كيان

| الكيان (Entity) | الإنشاء (Create) | القراءة (Read) | التحديث (Update) | الحذف (Delete) | محرك التخزين (Storage Key) | العلاقات والارتباطات (Relations) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **الأصناف المخزنية (`Product`)** | `InventoryView.tsx` / استيراد Excel | `inventoryService.getAllProducts()` | تعديل الصنف، تفعيل/تعطيل | منع الحذف إذا كان للصنف حركات مخزنية | `suite_stock_products_v1` | ترتبط مع `MovementRecord.items` وتؤثر على `ProductStock` |
| **أذونات المخزون (`MovementRecord`)** | `MovementModal.tsx` (Protected) | `inventoryService.getAllMovements()` | `MovementModal.tsx` | حذف فردي / جماعي مع تحديث الأرصدة | `suite_stock_records_v1` | تُنشئ قيداً مالياً في السجل اليومي عند الترحيل |
| **القيود المالية (`FinancialTransaction`)** | `FinancialModal.tsx` (Protected) / استيراد Excel | `financialService.getAll()` | `FinancialModal.tsx` | حذف القيد المالي مع تأكيد الحذف | `suite_fin_transactions_v2` | ترتبط بالعملاء والموردين والصندوق والمخزون |
| **العملاء (`Customer`)** | `CustomerModal.tsx` (Protected) / استيراد Excel | `customerService.getAll()` | `CustomerModal.tsx` | حذف العميل مع تنبيه إذا كانت لديه زيارات أو ديون | `suite_customers_v1` | ترتبط بـ `CustomerVisitRecord` وسندات التحصيل والديون |
| **زيارات العملاء (`CustomerVisitRecord`)** | `RecordVisitModal.tsx` (Protected) | سجل الزيارات، بطاقة العميل | عرض النتائج وتحديث الحالة | حذف الزيارة | `suite_customer_visits_v1` | تحدث رصيد مديونية العميل وتاريخ آخر زيارة |
| **الأطباء (`DoctorRecord`)** | `DoctorModal.tsx` (Protected) / استيراد Excel | `doctorService.getAll()` | `DoctorModal.tsx` | حذف الطبيب مع تأكيد | `suite_doctors_v1` | ترتبط بـ `DoctorVisitLog` والعينات الطبية |
| **زيارات الأطباء (`DoctorVisitLog`)** | `RecordDoctorVisitModal.tsx` (Protected) | جدول الزيارات والتقارير | تعديل النتيجة وموعد المتابعة | حذف الزيارة | `suite_doctor_visits_v1` | تحدث حالة الطبيب والعينات وتاريخ المتابعة |
| **سجلات الديون (`DebtRecord`)** | `DebtRecordModal.tsx` (Protected) | دفاتر الديون الأربعة | `DebtRecordModal.tsx` / شطب | حذف القيد مع تسجيل في سجل التدقيق | `suite_debts_records_v1` | مصنفة حسب الدفتر (أنور، زها، سابق، علي قات) |
| **الالتزامات المالية (`DebtCommitment`)** | `CommitmentModal.tsx` [Debts] | جدول الالتزامات والإنذارات | `CommitmentModal.tsx` / إكمال | حذف الالتزام وسجل دفعاته | `suite_debts_commitments_v1` | ترتبط بـ `DebtCommitmentPayment` ودفعات السداد |
| **دفعات السداد (`DebtCommitmentPayment`)**| `PartialPaymentModal.tsx` (Protected)| بطاقة الالتزام ومؤشر السداد | إضافة دفعة جديدة | حذف الدفعة مع إعادة احتساب المتبقي | جزء من مصفوفة `DebtCommitment.payments` | تحدث رصيد الالتزام المالي مباشرة |
| **المهام الكلاسيكية (`Task`)** | `TaskModal.tsx` (Protected) / استيراد Excel | `taskService.getAllTasks()` | `TaskModal.tsx` / إنجاز | حذف المهمة مع أرشفة في سجل التدقيق | `suite_tasks_v2` | ترتبط بجدول المواعيد والمسؤولين والتقويم |
| **التزامات المهام (`Commitment`)** | `CommitmentModal.tsx` [Tasks] | جدول الالتزامات | تعديل الالتزام / إنجاز | حذف الالتزام | `suite_commitments_v2` | تنبه في لوحة التحكم ومودال الاستحقاقات |
| **العهد والإشكاليات (`CustodyIssueRecord`)**| `CustodyIssueModal.tsx` (Protected) | جدول العهد والفرز والطباعة | `CustodyIssueModal.tsx` | حذف القيد | `suite_custody_records_v1` | تنقسم إلى عهد مالية / إشكاليات معلقة |
| **مكتبة الروابط (`LinkRecord`)** | `LinkModal.tsx` (Protected) / استيراد | شبكة البطاقات والجدول | `LinkModal.tsx` / مفضلة | حذف الرابط | `suite_links_records_v1` | تصنيفات الأدوات وتوليد QR للروابط |
| **الملاحظات والمعرفة (`NoteRecord`)** | `NoteEditorModal.tsx` (Protected) | محرك البحث والمجلدات | `NoteEditorModal.tsx` / قفل / أرشفة | حذف ناعم (سلة المهملات) / حذف نهائي | `suite_knowledge_notes_v1` | ترتبط بالعملاء والمشاريع والمهام وإصدارات النسخ |
| **الروتينات والعادات (`RoutineRecord`)** | `RoutineWizardModal.tsx` (Protected)| قائمة الروتين والتقويم وسلاسل الإنجاز| `RoutineWizardModal.tsx` | حذف الروتين | `suite_routines_v1` | تولد `RoutineOccurrence` ومؤقتات التنفيذ |
| **مهام ومشاريع Work OS** | `WorkOSQuickAddModal` / `Drawer` | كانبان، الجدول الزمني، عبء العمل | `WorkOSTaskDrawer` / `DetailModal` | حذف المهمة | `workos_v1_tasks` / `workos_v1_projects` | توحيد كامل لبيانات الإنتاجية والمشاريع |
