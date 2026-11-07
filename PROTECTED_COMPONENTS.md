# سجل المكونات المحمية (Protected Components Registry)
## وثيقة ملزمة لسلامة شاشات الإدخال والتعديل وتجربة المستخدم

> **تنبيه دستوري**: كافة المكونات المسجلة أدناه هي مكونات **محمية (PROTECTED)** للحفاظ على استقرار النظام وسلامة النماذج.
> 
> **استثناء إداري معتمد**:
> **يمكن تعديل هذه المكونات المحمية حصراً وبدقة عند وجود طلب وتوجيه صريح ومحدد من مدير النظام بتعديل أشياء أو حقول معينة فيها**.
> في غياب هذا التوجيه الصريح، يُحظر المساس بترتيب الحقول أو خيارات الإدخال أو منطق التحقق ومعالجات الحفظ.
> 
> **المسموح به دائماً**: تحسينات التصميم التنسيقي البصري (الألوان، الخطوط، التباعد الداخلي والخارجي، الظلال، استجابة الشاشات) دون الإخلال بوظيفة أو سلوك المكون.

---

### فهرس المكونات المحمية المكتشفة في المنظومة (20 مكوناً)

1. `CustomerModal` (`src/components/customers/CustomerModal.tsx`)
2. `RecordVisitModal` (`src/components/customers/RecordVisitModal.tsx`)
3. `DoctorModal` (`src/components/doctors/DoctorModal.tsx`)
4. `RecordDoctorVisitModal` (`src/components/doctors/RecordDoctorVisitModal.tsx`)
5. `FinancialModal` (`src/components/financial/FinancialModal.tsx`)
6. `MovementModal` (`src/components/MovementModal.tsx`)
7. `TaskModal` (`src/components/tasks/TaskModal.tsx`)
8. `CommitmentModal` [المهام والالتزامات] (`src/components/tasks/CommitmentModal.tsx`)
9. `DebtRecordModal` (`src/components/debts/DebtRecordModal.tsx`)
10. `CommitmentModal` [الديون والالتزامات المالية] (`src/components/debts/CommitmentModal.tsx`)
11. `PartialPaymentModal` (`src/components/debts/PartialPaymentModal.tsx`)
12. `CustodyIssueModal` (`src/components/custody/CustodyIssueModal.tsx`)
13. `LinkModal` (`src/components/links/LinkModal.tsx`)
14. `NoteEditorModal` (`src/components/knowledge/NoteEditorModal.tsx`)
15. `RoutineWizardModal` (`src/components/routines/RoutineWizardModal.tsx`)
16. `RoutinePostponeModal` (`src/components/routines/RoutinePostponeModal.tsx`)
17. `RoutineSkipModal` (`src/components/routines/RoutineSkipModal.tsx`)
18. `WorkOSQuickAddModal` (`src/components/workos/WorkOSQuickAddModal.tsx`)
19. `WorkOSTaskDrawer` (`src/components/workos/WorkOSTaskDrawer.tsx`)
20. `WorkOSTaskDetailModal` (`src/components/workos/WorkOSTaskDetailModal.tsx`)

---

### تفاصيل المكونات المحمية

#### 1. CustomerModal
* **المسار**: `src/components/customers/CustomerModal.tsx`
* **الهدف**: إضافة وتعديل بطاقة عميل / صيدلية / مركز طبي وحساباته.
* **الكيان المرتبط**: `Customer`
* **الحقول وترتيبها**:
  1. المعرف التلقائي `id` (للقراءة فقط: CUST-XXXX)
  2. المعرف الفرعي `subId` (تلقائي / يدوي: ذهبي-001)
  3. اسم العميل `name` (إلزامي)
  4. المصدر `source` (القيصر الذهبي | توب مكياجي | عفيف | الأطباء | أخرى)
  5. المنطقة الجغرافية `region` (قائمة المناطق)
  6. خط سير الزيارة `route` (أيام الأسبوع أو شهري)
  7. مستوى الأهمية `significance` (A, B, C, √)
  8. حالة العميل/الزيارة `status` (مخطط، قيد تنفيذ، مكتمل، ملغي، مرحل، متابعة، مصفر)
  9. المندوب المسؤول `responsible` (قائمة المناديب)
  10. الهاتف / واتساب `phone`
  11. العنوان التفصيلي `address`
  12. الغرض والوصف `taskDesc`
  13. تاريخ البدء `dateBegin` وتاريخ الانتهاء `dateEnd`
  14. الأرصدة الافتتاحية: `balanceYER`, `balanceSAR`, `balanceUSD`
  15. خيار الحساب الداخلي `isInternalAccount` (نعم/لا)
  16. الملاحظات `notes`
* **منطق التحقق والحفظ**: التحقق من وجود اسم العميل، عدم تكرار الاسم، استدعاء `onSave(customer)`.

#### 2. RecordVisitModal
* **المسار**: `src/components/customers/RecordVisitModal.tsx`
* **الهدف**: تسجيل زيارة ميدانية لعميل مع مبالغ التحصيل المالي.
* **الكيان المرتبط**: `CustomerVisitRecord`
* **الحقول وترتيبها**:
  1. اسم العميل (عرض للقراءة فقط)
  2. تاريخ الزيارة `date` (تلقائي تاريخ اليوم)
  3. يوم الأسبوع `dayOfWeek` (محسوب تلقائياً)
  4. المندوب المنفذ `responsible`
  5. حالة الزيارة `status` (مكتمل، متابعة، مرحل، إلخ)
  6. المبالغ المحصلة: `amountCollectedYER`, `amountCollectedSAR`, `amountCollectedUSD`
  7. خيار تحديث رصيد العميل فوراً `updateCustomerBalance`
  8. ملاحظات ونتائج الزيارة `notes`
* **منطق الحفظ**: استدعاء `onSaveVisit(newVisit, updatedStatus, collectedYER)`.

#### 3. DoctorModal
* **المسار**: `src/components/doctors/DoctorModal.tsx`
* **الهدف**: إضافة وتعديل بطاقة طبيب / عيادة / مركز تخصصي.
* **الكيان المرتبط**: `DoctorRecord`
* **الحقول وترتيبها**:
  1. اسم الطبيب `name` (إلزامي)
  2. التخصص `specialty`
  3. اسم العيادة/المستشفى `clinicName`
  4. المصدر `source`
  5. المنطقة `region`
  6. المسار `route`
  7. الأهمية `significance`
  8. المندوب المسؤول `responsible`
  9. الهاتف `phone` والعنوان `address`
  10. وصف الزيارة `taskDesc` وتواريخ البدء والانتهاء `dateBegin`, `dateEnd`
  11. حالة المتابعة `status`
  12. ملاحظات `notes`
* **منطق الحفظ**: فحص التكرار، توليد المعرف `generateNextDoctorId`، استدعاء `onSave(doctor)`.

#### 4. RecordDoctorVisitModal
* **المسار**: `src/components/doctors/RecordDoctorVisitModal.tsx`
* **الهدف**: توثيق زيارة الطبيب، العينات المسلمة، وتفاعل الوصفات.
* **الكيان المرتبط**: `DoctorVisitLog`
* **الحقول وترتيبها**:
  1. التاريخ `date` واليوم `dayOfWeek`
  2. المندوب المسؤول `responsible`
  3. حالة الزيارة `status`
  4. العينات والمواد العلمية المقدمة `samplesGiven`
  5. نتيجة الزيارة ورأي الطبيب `visitResult`
  6. تاريخ المتابعة القادمة `nextFollowUpDate`
  7. ملاحظات الزيارة `notes`
* **منطق الحفظ**: استدعاء `onSaveVisit(visit, updatedDoctorStatus, samplesGiven, visitResult)`.

#### 5. FinancialModal
* **المسار**: `src/components/financial/FinancialModal.tsx`
* **الهدف**: تسجيل وتعديل القيود وسندات الصرف والقبض والحركات المالية.
* **الكيان المرتبط**: `FinancialTransaction`
* **الحقول وترتيبها**:
  1. معرف القيد `id` (ACC-XXXX)
  2. التاريخ `date` واليوم `day` (محسوب)
  3. درجة الأهمية `importance` (√, A, B, ترحيل، تنفيذ)
  4. نوع الحركة `movement` (ايرادات، منصرف، الصندوق، حساب له، حساب عليه)
  5. نوع السند والقيد `restriction` (سند قبض، سند صرف، فاتورة، أمر صرف)
  6. طريقة الدفع `movementType` (نقدا، كريمي، جيب، صراف، اجل)
  7. فئة الحساب `categoryAccount`
  8. حساب التقييد `restrictionAccount`
  9. اسم الحساب `accountName`
  10. رقم السند / المرجع `number`
  11. مبالغ العملات الثلاث: ريال يمني `amountYER`، ريال سعودي `amountSAR`، دولار `amountUSD`
  12. البيان والشرح `description`
* **منطق الحفظ**: توليد المعرف، ضبط الأصفار، استدعاء `onSave(txn)`.

#### 6. MovementModal
* **المسار**: `src/components/MovementModal.tsx`
* **الهدف**: إنشاء وتحرير أذونات توريد وصرف الأصناف المخزنية مع السطور المتعددة.
* **الكيان المرتبط**: `MovementRecord`
* **الحقول وترتيبها**:
  1. نوع الحركة `movementType` (صرف | توريد)
  2. رقم الإذن `subId` (تلقائي حسب التسلسل: IN-XXXX أو OUT-XXXX)
  3. التصنيف الرئيسي `mainId`
  4. التاريخ `date` واليوم
  5. المستفيد / المورد / الجهة `beneficiary`
  6. التصنيف `category` (مبيعات، عينات، دعم، هدية، عهدة، تالف، أخرى)
  7. حالة الإذن `status` (تم التنفيذ، قيد التنفيذ، تم ترحيل، ملغي)
  8. البيان والوصف `description`
  9. جدول الأصناف والكميات المتعددة (Item Lines: اختيار الصنف + الكمية)
  10. الملاحظات `note`
* **منطق الحفظ**: فحص رصيد المستودع عند الصرف، تحديث تسلسل الأرقام `seq`، استدعاء `onSave(record)`.

#### 7. TaskModal
* **المسار**: `src/components/tasks/TaskModal.tsx`
* **الهدف**: إنشاء وتعديل المهام التشغيلية اليومية.
* **الكيان المرتبط**: `Task`
* **الحقول وترتيبها**:
  1. معرف المهمة `id` (T-XXXX) والمعرف الفرعي `sub`
  2. عنوان المهمة `title` (إلزامي)
  3. تاريخ البدء `start` وتاريخ الانتهاء `end`
  4. الفئة `cat` والعملية `op`
  5. مستوى الأولوية `pri` (A حرجة، B عالية، C متوسطة، D منخفضة)
  6. حالة المهمة `status` (مخطط، الهدف، قيد التنفيذ، تم الانجاز، مؤجل، ملغي)
  7. الموظف المسؤول `resp`
  8. المبلغ المالي المرتبط `amount` (إن وجد)
  9. تفاصيل المهمة `desc`
* **منطق الحفظ**: استدعاء `onSave(task)`.

#### 8. CommitmentModal [دفتر المهام]
* **المسار**: `src/components/tasks/CommitmentModal.tsx`
* **الهدف**: تسجيل التزامات دفتر المهام والمواعيد المالية.
* **الكيان المرتبط**: `Commitment`
* **الحقول وترتيبها**:
  1. المعرف `id` (التزامات-XXX)
  2. اسم الالتزام / الجهة `name` (إلزامي)
  3. المبلغ `amount` (إلزامي أكبر من صفر)
  4. الأهمية `pri` (A, B, C)
  5. تاريخ الاستحقاق `due`
  6. الحالة `status`
  7. البيان والملاحظات `desc`
* **منطق الحفظ**: استدعاء `onSave(commitment)`.

#### 9. DebtRecordModal
* **المسار**: `src/components/debts/DebtRecordModal.tsx`
* **الهدف**: قيد حركة دين فردية داخل دفاتر الديون (أنور، زها، سابق، علي قات).
* **الكيان المرتبط**: `DebtRecord`
* **الحقول وترتيبها**:
  1. الدفتر المالي `book` (anwar | previous | zaha | ali_qat)
  2. التاريخ `date`
  3. الأيقونة المميزة `icon`
  4. البيان / الاسم `name` (إلزامي)
  5. العملة `currency` (YER, SAR, USD)
  6. مدين (عليه) `debit`
  7. دائن (له) `credit`
  8. ملاحظات `note`
  9. علامة الشطب والاكتمال `isCompleted`
* **منطق الحفظ**: فحص إدخال مدين أو دائن على الأقل، استدعاء `onSave(record)`.

#### 10. CommitmentModal [دفتر الديون والالتزامات]
* **المسار**: `src/components/debts/CommitmentModal.tsx`
* **الهدف**: إدارة التزامات الديون والأقساط ومواعيد الاستحقاق وجداول السداد.
* **الكيان المرتبط**: `DebtCommitment`
* **الحقول وترتيبها**:
  1. معرف الالتزام `id` (التزامات-XXX)
  2. اسم الالتزام `name` (إلزامي)
  3. الوصف `desc`
  4. تاريخ القيد `date` وتاريخ الاستحقاق `endDate`
  5. الأولوية `priority` (A, B, C)
  6. الحالة `status`
  7. الأيقونة `icon`
  8. المسؤول `owner`
  9. التصنيف `category`
  10. المبلغ `amount` والعملة `currency`
  11. الاتجاه `dir` (مدين 'عليه' | دائن 'له')
  12. الملاحظات `note`
* **منطق الحفظ**: استدعاء `onSave(commitment)`.

#### 11. PartialPaymentModal
* **المسار**: `src/components/debts/PartialPaymentModal.tsx`
* **الهدف**: تسجيل دفعة سداد جزئية من التزام مالي معين ومتابعة المتبقي.
* **الكيان المرتبط**: `DebtCommitmentPayment`
* **الحقول وترتيبها**:
  1. ملخص الالتزام والمبلغ الكلي والمدفوع والمتبقي (عرض)
  2. مبلغ دفعة السداد `amount` (إلزامي ولا يتجاوز المتبقي)
  3. تاريخ الدفعة `date`
  4. ملاحظات الدفعة `note`
  5. جدول سجل الدفعات السابقة مع زر الحذف
* **منطق الحفظ**: استدعاء `onAddPayment(commitmentId, newPayment)`.

#### 12. CustodyIssueModal
* **المسار**: `src/components/custody/CustodyIssueModal.tsx`
* **الهدف**: قيد ومتابعة العهد المالية والعينية والإشكاليات المعلقة.
* **الكيان المرتبط**: `CustodyIssueRecord`
* **الحقول وترتيبها**:
  1. القسم `section` (عهدة | إشكالية)
  2. التاريخ `date`
  3. الاسم / الموضوع `name` (إلزامي)
  4. الوصف والتفاصيل `desc`
  5. الفئة `cat`
  6. الأولوية `pri` (A, B, C)
  7. الحالة `status` (مخطط، قيد التنفيذ، تم الإنجاز، معلق، ملغي)
  8. المسؤول `resp`
  9. المبلغ `amount` والعملة `currency`
  10. الملاحظات `notes`
  11. الرابط المرجعي `link`
* **منطق الحفظ**: استدعاء `onSave(record)`.

#### 13. LinkModal
* **المسار**: `src/components/links/LinkModal.tsx`
* **الهدف**: إضافة وتعديل بطاقة موقع / رابط / أداة ذكية في مكتبة الروابط.
* **الكيان المرتبط**: `LinkRecord`
* **الحقول وترتيبها**:
  1. اسم الموقع / الأداة `siteName` (إلزامي)
  2. الرابط URL `url` (إلزامي مع فحص الصياغة)
  3. التصنيف الرئيسي `classification`
  4. الفئة `category`
  5. النوع `type`
  6. درجة الأهمية `importance` (A, B, C)
  7. الوصف `desc`
  8. المفضلة `isFavorite`
  9. الملاحظات `notes`
* **منطق الحفظ**: استدعاء `onSave(link)`.

#### 14. NoteEditorModal
* **المسار**: `src/components/knowledge/NoteEditorModal.tsx`
* **الهدف**: محرر الملاحظات والمعرفة وقواعد البيانات الشخصية الغنية.
* **الكيان المرتبط**: `NoteRecord`
* **الحقول وترتيبها**:
  1. العنوان `title` (إلزامي)
  2. شريط أدوات التنسيق (العناوين، القوائم، الجداول، الاقتباس، الكود)
  3. المحتوى `content` (النص الكامل)
  4. المجلد `folderId`
  5. النوع `type` والتصنيف `category`
  6. الأولوية `priority` والحالة `status`
  7. الوسوم `tags`
  8. الربط بكيانات (عميل، طبيب، مهمة، مشروع)
  9. قائمة المهام المضمنة `tasks`
  10. التذكيرات والمراجعة الدورية `reminders`, `nextReviewDate`
  11. قفل الملاحظة برقم سري `isLocked`, `pinCode`
  12. المرفقات `attachments`
* **منطق الحفظ**: استدعاء `onSave(noteData, isNew)`.

#### 15. RoutineWizardModal
* **المسار**: `src/components/routines/RoutineWizardModal.tsx`
* **الهدف**: معالج إنشاء وتعديل العادات والروتينات المتكررة وخطواتها.
* **الكيان المرتبط**: `RoutineRecord`
* **الحقول وترتيبها**:
  1. اسم الروتين `name` والاسم المختصر `shortName`
  2. الوصف والهدف `description`, `purpose`
  3. التصنيف `category` والوسوم `tags`
  4. وقت البدء المخطط `defaultTime` والمدة الإجمالية بالدقائق `duration`
  5. نوع التكرار وأيام التفعيل (أيام الأسبوع أو يومي/أسبوعي/شهري)
  6. جدول الخطوات التفصيلية (اسم الخطوة + مدتها بالدقائق)
  7. الإشعارات والصوت `notificationEnabled`, `soundEnabled`
  8. الأيقونة واللون المميز `icon`, `color`
* **منطق الحفظ**: استدعاء `onSave(routine)`.

#### 16. RoutinePostponeModal & 17. RoutineSkipModal
* **المسار**: `src/components/routines/RoutinePostponeModal.tsx` و `RoutineSkipModal.tsx`
* **الهدف**: تأجيل أو تخطي تكرار روتين مع توثيق الأسباب دون كسر الإحصائيات.

#### 18. WorkOSQuickAddModal
* **المسار**: `src/components/workos/WorkOSQuickAddModal.tsx`
* **الهدف**: الإضافة السريعة لمختلف عناصر مساحة العمل (مهمة، مشروع، ملاحظة، موعد، التزام، عادة، هدف).
* **الكيان المرتبط**: كيانات `workos` المتعددة.

#### 19. WorkOSTaskDrawer & 20. WorkOSTaskDetailModal
* **المسار**: `src/components/workos/WorkOSTaskDrawer.tsx` و `WorkOSTaskDetailModal.tsx`
* **الهدف**: درج التعديل السريع ونافذة تفاصيل مهام Work OS والمهام الفرعية وسجل الوقت.
