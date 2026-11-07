# COMPONENT_MAP.md
# خريطة وتصنيف مكونات النظام (Component Map)

> **دستور المشروع:** كل مكوّن يؤدي وظيفة إضافة، تعديل، تسجيل، أو حذف بيانات هو **مكوّن محمي (PROTECTED)**.
> لا يجوز تعديل حقوله، ترتيبها، أقسامه، شروط تحققه، دوال حفظه، أو معامِلاته.
> يُسمح فقط بالتحسين البصري (Visual Refactoring) دون المساس بالبنية الوظيفية.

---

## تصنيف المكونات الإجمالي

| التصنيف | الوصف | عدد المكونات |
|---|---|---:|
| **PROTECTED** | نوافذ الإدخال، النماذج، وأدراج التعديل المحمية وظيفياً وهيكلياً | **46** |
| **SAFE_TO_REFACTOR** | شاشات العرض، الجداول، لوحات المؤشرات، والبطاقات التلخيصية | **95** |
| **SHARED** | عناصر الواجهة المشتركة (شريط التنقل، القوائم الجانبية، أزرار، شارات) | **26** |
| **UNKNOWN / LEGACY** | مكونات قديمة غير موصولة أو قيد التوثيق (ممنوع حذفها دون تدقيق) | **23** |

---

## 1. المكونات المحمية (PROTECTED COMPONENTS — 46 مكوّناً)

| # | اسم المكوّن | مسار الملف | أسطر الكود | الحقول المستهدفة للحماية | Callbacks |
|---|---|---|---:|---:|---|
| 1 | `NoteEditorModal` | `src/components/knowledge/NoteEditorModal.tsx` | 1,165 | 38 حقل حالة | `onClose`, `onSave` |
| 2 | `RoutineWizardModal` | `src/components/routines/RoutineWizardModal.tsx` | 975 | 26 حقل حالة | `onClose`, `onSave` |
| 3 | `FinancialModal` | `src/components/financial/FinancialModal.tsx` | 682 | 24 حقل حالة | `onClose`, `onSave`, `onAddOption` |
| 4 | `WorkOSTaskDrawer` | `src/components/workos/WorkOSTaskDrawer.tsx` | 642 | 15 حقل حالة | `onClose`, `onSaveTask`, `onDeleteTask`, `onConvertToProject` |
| 5 | `CustomerStatementModal` | `src/components/customers/CustomerStatementModal.tsx` | 631 | 5 حقول حالة | `onClose` |
| 6 | `WorkOSTaskDetailModal` | `src/components/workos/WorkOSTaskDetailModal.tsx` | 623 | 19 حقل حالة | `onClose`, `onSaveTask`, `onDeleteTask`, `onStartTimer` |
| 7 | `MovementModal` | `src/components/MovementModal.tsx` | 613 | 12 حقل حالة | `onClose`, `onSave` |
| 8 | `NoteDetailModal` | `src/components/knowledge/NoteDetailModal.tsx` | 571 | 6 حقول حالة | `onClose`, `onEdit`, `onDelete`, `onTogglePin` |
| 9 | `CustomerModal` | `src/components/customers/CustomerModal.tsx` | 540 | 20 حقل حالة | `onClose`, `onSave` |
| 10 | `DoctorModal` | `src/components/doctors/DoctorModal.tsx` | 504 | 3 حقول مجمعة | `onClose`, `onSave` |
| 11 | `RoutineTimerModal` | `src/components/routines/RoutineTimerModal.tsx` | 497 | 14 حقل حالة | `onClose`, `onComplete` |
| 12 | `CustodyIssueModal` | `src/components/custody/CustodyIssueModal.tsx` | 439 | 15 حقل حالة | `onClose`, `onSave` |
| 13 | `CustomerDetailsModal` | `src/components/customers/CustomerDetailsModal.tsx` | 421 | عرض وحذف وتعديل | `onClose`, `onEditCustomer`, `onDeleteCustomer`, `onAddVisit` |
| 14 | `CommitmentModal` (debts) | `src/components/debts/CommitmentModal.tsx` | 407 | 15 حقل حالة | `onClose`, `onSave` |
| 15 | `DoctorDetailsModal` | `src/components/doctors/DoctorDetailsModal.tsx` | 401 | تفاصيل ومتابعة | `onClose`, `onEdit`, `onDelete`, `onRecordVisit` |
| 16 | `FinancialVoucherModal` | `src/components/financial/FinancialVoucherModal.tsx` | 400 | سند صرف وقبض | `onClose` |
| 17 | `WorkOSQuickAddModal` | `src/components/workos/WorkOSQuickAddModal.tsx` | 384 | 15 حقل إدخال سريع | `onClose`, `onAddTask`, `onAddProject`, `onAddNote` |
| 18 | `DueAlertsModal` | `src/components/notifications/DueAlertsModal.tsx` | 383 | تنبيهات وإنجاز | `onClose`, `onToggleCompleteTask`, `onToggleCompleteCommitment` |
| 19 | `TaskFlowImportExportModal` | `src/components/taskflow/TaskFlowImportExportModal.tsx` | 367 | استيراد وتصدير | `onClose`, `onImportTasks`, `onResetData` |
| 20 | `TaskFlowMembersModal` | `src/components/taskflow/TaskFlowMembersModal.tsx` | 367 | إدارة الأعضاء | `onClose`, `onSaveMember`, `onDeleteMember`, `onToggleActive` |
| 21 | `UniversalDataExchangeModal` | `src/components/common/UniversalDataExchangeModal.tsx` | 357 | تبادل البيانات | `onClose`, `onDownloadTemplate`, `onImportFile` |
| 22 | `LinkModal` | `src/components/links/LinkModal.tsx` | 347 | 12 حقل حالة | `onClose`, `onSave` |
| 23 | `FinancialPrintModal` | `src/components/financial/FinancialPrintModal.tsx` | 335 | طباعة تقارير مالية | `onClose` |
| 24 | `TaskFlowProjectsModal` | `src/components/taskflow/TaskFlowProjectsModal.tsx` | 335 | مشاريع TaskFlow | `onClose`, `onSaveProject`, `onDeleteProject` |
| 25 | `TaskModal` | `src/components/tasks/TaskModal.tsx` | 331 | 13 حقل حالة | `onClose`, `onSave` |
| 26 | `ImportFinancialModal` | `src/components/financial/ImportFinancialModal.tsx` | 330 | استيراد معاملات | `onClose`, `onImportTransactions` |
| 27 | `TemplatesLibraryModal` | `src/components/knowledge/TemplatesLibraryModal.tsx` | 321 | مكتبة القوالب | `onClose`, `onUseTemplate`, `onAddTemplate`, `onDeleteTemplate` |
| 28 | `TaskFlowTaskModal` | `src/components/taskflow/TaskFlowTaskModal.tsx` | 306 | مهمة TaskFlow | `onClose`, `onSave`, `onDelete` |
| 29 | `AIAssistantModal` | `src/components/knowledge/AIAssistantModal.tsx` | 296 | مساعد الذكاء | `onClose`, `onCreateNoteFromAi` |
| 30 | `PartialPaymentModal` | `src/components/debts/PartialPaymentModal.tsx` | 292 | دفعات جزئية للديون | `onClose`, `onAddPayment`, `onDeletePayment` |
| 31 | `DebtRecordModal` | `src/components/debts/DebtRecordModal.tsx` | 288 | 10 حقول حالة | `onClose`, `onSave` |
| 32 | `ImportDoctorsModal` | `src/components/doctors/ImportDoctorsModal.tsx` | 280 | استيراد أطباء | `onClose`, `onImportDoctors` |
| 33 | `RecordDoctorVisitModal` | `src/components/doctors/RecordDoctorVisitModal.tsx` | 272 | تسجيل زيارة طبيب | `onClose`, `onSaveVisit` |
| 34 | `RecordVisitModal` | `src/components/customers/RecordVisitModal.tsx` | 267 | تسجيل زيارة عميل | `onClose`, `onSaveVisit` |
| 35 | `RoutineDetailModal` | `src/components/routines/RoutineDetailModal.tsx` | 256 | تفاصيل الروتين | `onClose`, `onStartTimer`, `onEdit`, `onDuplicate` |
| 36 | `ImportCustomersModal` | `src/components/customers/ImportCustomersModal.tsx` | 255 | استيراد عملاء | `onClose`, `onImport` |
| 37 | `CommitmentModal` (tasks) | `src/components/tasks/CommitmentModal.tsx` | 235 | التزامات المهام | `onClose`, `onSave` |
| 38 | `WorkOSAICopilotModal` | `src/components/workos/WorkOSAICopilotModal.tsx` | 234 | مساعد Work OS | `onClose`, `onAddTaskFromAI` |
| 39 | `RoutineAIAssistantModal` | `src/components/routines/RoutineAIAssistantModal.tsx` | 221 | مساعد الروتين | `onClose`, `onRoutineGenerated` |
| 40 | `WorkOSCommandPaletteModal` | `src/components/workos/WorkOSCommandPaletteModal.tsx` | 218 | لوحة الأوامر السريعة | `onClose`, `onSelectTask`, `onSelectView` |
| 41 | `MovementDetailsModal` | `src/components/MovementDetailsModal.tsx` | 207 | تفاصيل حركة الصرف | `onClose`, `onEdit` |
| 42 | `RoutineTemplatesModal` | `src/components/routines/RoutineTemplatesModal.tsx` | 203 | قوالب الروتين | `onClose`, `onApplyTemplate` |
| 43 | `RoutinePostponeModal` | `src/components/routines/RoutinePostponeModal.tsx` | 155 | تأجيل الروتين | `onClose`, `onPostpone` |
| 44 | `TaskFlowUserSwitchModal` | `src/components/taskflow/TaskFlowUserSwitchModal.tsx` | 154 | تبديل مستخدم TaskFlow | `onClose`, `onSwitchUser` |
| 45 | `VersionHistoryModal` | `src/components/knowledge/VersionHistoryModal.tsx` | 144 | تاريخ إصدارات الملاحظة | `onClose`, `onRestoreVersion` |
| 46 | `RoutineSkipModal` | `src/components/routines/RoutineSkipModal.tsx` | 107 | تخطي موعد روتين | `onClose`, `onSkip` |

---

## 2. المكونات القابلة للتحسين البصري والمعماري (SAFE_TO_REFACTOR)

وهي مكونات العرض والتحليل والجداول والرسوم البيانية التي لا تؤثر على حفظ أو بنية السجلات التجارية:
* **لوحات التحكم والملخصات**:
  * `src/components/dashboard/UnifiedDashboard.tsx`
  * `src/components/workos/WorkOSOverviewTab.tsx`
  * `src/components/workos/WorkOSKPICards.tsx`
  * `src/components/workos/WorkOSPrioritiesTab.tsx`
  * `src/components/workos/WorkOSTeamWorkloadTab.tsx`
  * `src/components/workos/WorkOSReportsView.tsx`
* **جداول وقوائم العرض**:
  * `src/components/financial/FinancialModule.tsx` (قوائم المعاملات وتفاصيل اليومية)
  * `src/components/stock/RecordsView.tsx` (سجلات صرف وتوريد البضائع)
  * `src/components/customers/CustomerDirectory.tsx` و `BalancesLedger.tsx`
  * `src/components/doctors/DoctorDirectory.tsx` و `DoctorReports.tsx`
  * `src/components/debts/DebtLedgerTable.tsx` و `CommitmentsTable.tsx`
  * `src/components/custody/CustodyIssuesTable.tsx`
  * `src/components/tasks/TasksModule.tsx` و `CommitmentsTable.tsx`
  * `src/components/workos/WorkOSTasksTab.tsx` و `WorkOSProjectsTab.tsx`
  * `src/components/workos/WorkOSKanbanTab.tsx` و `WorkOSTimelineTab.tsx`
  * `src/components/workos/WorkOSDailyPlannerView.tsx` و `WorkOSVisitsView.tsx`
  * `src/components/knowledge/NotesListView.tsx` و `NotesGridView.tsx`
  * `src/components/links/LinksTableView.tsx` و `LinksGridView.tsx`
* **تبويبات الإعدادات**:
  * `src/components/settings/tabs/` (CompanyTab, UsersTab, DatabasesTab, AuditTab, BackupTab, ThemeTab, etc.)

---

## 3. المكونات المشتركة (SHARED COMPONENTS)

عناصر الهيكل والتصميم التي تتشاركها شاشات النظام:
* **الهيكل الرئيسي**: `MainLayout.tsx`, `Sidebar.tsx`, `Header.tsx`, `Navbar.tsx`.
* **محددات التصفية والبحث**: `WorkOSFilterStrip.tsx`, `WorkOSUnifiedTopBar.tsx`.
* **التنبيهات والمحركات البصرية**: `Toast.tsx`, `StatusBadge.tsx`, `EmptyState.tsx`, `LoadingSpinner.tsx`.
* **تثبيت PWA**: `PWAInstallPrompt.tsx`.

---

## 4. المكونات القديمة أو غير الموصولة (UNKNOWN / LEGACY)

مكونات تم حصرها في التدقيق ويجب عدم حذفها دون موافقة صريحة:
* شاشات TaskFlow المنفصلة: `TaskFlowModule.tsx`, `TaskFlowBoard.tsx`, `TaskFlowTimeline.tsx`.
* شاشات WorkOS الموروثة: `WorkOSTasksView.tsx`, `WorkOSDashboard.tsx`, `WorkOSEisenhowerMatrix.tsx`.
* ملفات المزامنة المستقبلية غير المفعلة: `SyncEngine.ts`, `Inbox.ts`, `ConflictResolver.ts`.
