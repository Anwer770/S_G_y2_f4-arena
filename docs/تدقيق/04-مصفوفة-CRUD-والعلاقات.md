# 04 — مصفوفة CRUD والعلاقات والحالة
> مُولَّد آلياً — `tools/audit/audit2.py`

## 1) معالجات CRUD المركزية في `src/app/App.tsx` (25 معالجاً)
| المعالج | الوسائط |
|---|---|
| `handleSaveMovement` | `record: Movement` |
| `handleDeleteRecord` | `record: Movement` |
| `handleBulkDelete` | `subIds: string[]` |
| `handleCloneRecord` | `record: Movement` |
| `handleAddProduct` | `product: Item` |
| `handleEditProduct` | `oldName: string, updatedProduct: Item` |
| `handleDeleteProduct` | `product: Item` |
| `handleToggleProductActive` | `product: Item` |
| `handleSaveFinancialTxn` | `txn: FinancialTransaction` |
| `handleDeleteFinancialTxn` | `id: string` |
| `handleImportFinancialTxns` | `imported: FinancialTransaction[],
    mode: 'append' | 'replace'` |
| `handleAddFinancialOption` | `type: 'category' | 'account' | 'restriction' | 'movementType' | 'restrictionAcco` |
| `handleSaveTask` | `task: Task` |
| `handleDeleteTask` | `id: string` |
| `handleToggleCompleteTask` | `id: string` |
| `handleSaveCommitment` | `comm: Commitment` |
| `handleDeleteCommitment` | `id: string` |
| `handleToggleCompleteCommitment` | `id: string` |
| `handleClearCompletedTasks` | `` |
| `handleUpdateCustomers` | `newCustomers: Customer[]` |
| `handleUpdateVisits` | `newVisits: CustomerVisitRecord[]` |
| `handleUpdateDoctors` | `newDoctors: DoctorRecord[]` |
| `handleUpdateDoctorVisits` | `newVisits: DoctorVisitLog[]` |
| `handleImportBackup` | `backup: UnifiedBackupState` |
| `handleResetAllData` | `` |

## 2) حالة التطبيق (useState) — 34 حالة
| الحالة | المُحدِّث |
|---|---|
| `activeTab` | `setActiveTab` |
| `products` | `setProducts` |
| `records` | `setRecords` |
| `categories` | `setCategories` |
| `statuses` | `setStatuses` |
| `settings` | `setSettings` |
| `seq` | `setSeq` |
| `stockAuditLogs` | `setStockAuditLogs` |
| `financialTransactions` | `setFinancialTransactions` |
| `movements` | `setMovements` |
| `restrictions` | `setRestrictions` |
| `movementTypes` | `setMovementTypes` |
| `importanceList` | `setImportanceList` |
| `categoryAccounts` | `setCategoryAccounts` |
| `restrictionAccounts` | `setRestrictionAccounts` |
| `accountNames` | `setAccountNames` |
| `tasks` | `setTasks` |
| `commitments` | `setCommitments` |
| `taskCategories` | `setTaskCategories` |
| `taskOperations` | `setTaskOperations` |
| `taskAssignees` | `setTaskAssignees` |
| `taskAuditLogs` | `setTaskAuditLogs` |
| `customers` | `setCustomers` |
| `customerVisits` | `setCustomerVisits` |
| `customerAuditLogs` | `setCustomerAuditLogs` |
| `doctors` | `setDoctors` |
| `doctorVisits` | `setDoctorVisits` |
| `doctorAuditLogs` | `setDoctorAuditLogs` |
| `routinesCount` | `setRoutinesCount` |
| `debtsCount` | `setDebtsCount` |
| `debtCommitmentsCount` | `setDebtCommitmentsCount` |
| `custodyCount` | `setCustodyCount` |
| `isAlertsModalOpen` | `setIsAlertsModalOpen` |
| `isToastDismissed` | `setIsToastDismissed` |

📌 **ملاحظة معمارية:** لا يوجد Store مركزي (Redux/Zustand). الحالة كلها في `MainApp` وتُمرَّر عبر props إلى `AppRouter` (تسليم ~150 prop). هذا هو أكبر مصدر لإعادة الرسم وللتعقيد — يُعالج في Phase 3 بلا تغيير السلوك.

## 3) حمولة دوال التحميل/الحفظ المستوردة في App.tsx
- دوال التحميل: **19** · دوال الحفظ: **18**
- لكن أجزاءً من الحالة تُحمَّل عبر الخدمات بدلاً منها (`inventoryService.getAllProducts()` · `financialService.getAll()` · `taskService.getAllTasks()` · `customerService.getAll()` · `doctorService.getAll()`) → **مساران متوازيان لنفس البيانات** (doc 03 §5).

## 4) طبقة الخدمات والمستودعات
| الملف | عدد الدوال | أمثلة |
|---|---:|---|
| `src/database/repositories/BaseRepository.ts` | 0 | `` |
| `src/database/repositories/CustomerRepository.ts` | 0 | `` |
| `src/database/repositories/DebtRepository.ts` | 0 | `` |
| `src/database/repositories/FinancialRepository.ts` | 0 | `` |
| `src/database/repositories/OtherRepositories.ts` | 0 | `` |
| `src/database/repositories/ProductRepository.ts` | 0 | `` |
| `src/database/repositories/WorkTaskRepository.ts` | 0 | `` |
| `src/database/repositories/index.ts` | 0 | `` |
| `src/services/backup/BackupService.ts` | 3 | `createBackup` `resetSystem` `restoreBackup` |
| `src/services/crm/CustomerService.ts` | 0 | `` |
| `src/services/crm/DoctorService.ts` | 0 | `` |
| `src/services/custody/CustodyService.ts` | 0 | `` |
| `src/services/dashboard/DashboardService.ts` | 1 | `getRealtimeKPIs` |
| `src/services/debts/DebtService.ts` | 0 | `` |
| `src/services/financial/FinancialService.ts` | 0 | `` |
| `src/services/index.ts` | 0 | `` |
| `src/services/inventory/InventoryService.ts` | 0 | `` |
| `src/services/work/TaskService.ts` | 0 | `` |

## 5) حقول العلاقات بين الكيانات (مرجع التكامل)
| الحقل | مرات الاستخدام |
|---|---:|
| `projectId` | 99 |
| `taskId` | 55 |
| `customerId` | 15 |
| `noteId` | 13 |
| `doctorId` | 11 |
| `commitmentId` | 10 |
| `debtId` | 7 |
| `parentId` | 1 |

## 6) الاستيراد/التصدير (Excel) — يجب الحفاظ عليه (§20)
- `src/utils/excel.ts` · `excelExport.ts` · `universalImporters.ts` · `universalDataTemplates.ts`
- نوافذ الاستيراد: `ImportCustomersModal` · `ImportDoctorsModal` · `ImportFinancialModal` · `TaskFlowImportExportModal` · `UniversalDataExchangeModal`
- التصدير متاح في الشاشات الجدولية + التقارير + `custodyExport.ts` · `linksExport.ts`
