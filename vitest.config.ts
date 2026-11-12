import { defineConfig } from 'vitest/config';

/**
 * اختبارات الوحدات للمنطق النقي (P3).
 *
 * الفصل عن بوابات jsdom مقصود:
 *   - `tools/regression/*.test.mjs` ⇒ سلوك الواجهة الكامل داخل DOM وهمي (e2e محلي).
 *   - `tests/unit/**` ⇒ دوال نقية بلا DOM: تجزئة الرمز، حماية الدخول، أمانة الاستيراد،
 *     المحرّك المحاسبي، المنسّقات. سريعة (ثوانٍ) وتعمل مع كل دفعة في الـ CI.
 */
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    globals: false,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text'],
      include: [
        'src/utils/pinCrypto.ts',
        'src/utils/authGuard.ts',
        'src/utils/importFidelity.ts',
        'src/utils/autoJournaling.ts',
        'src/utils/formatters.ts',
        'src/utils/lookupsLogic.ts',
        'src/utils/auditAutoExportLogic.ts',
        'src/utils/storage/system.ts',
        'src/utils/automation/automationRules.ts',
        'src/utils/automation/automationDerive.ts',
        'src/utils/automation/automationRunner.ts',
        'src/utils/automation/automationEvents.ts',
        'src/utils/urlSafety.ts',
        'src/utils/security/csp.ts',
        'src/database/schema/engine.ts',
        'src/database/schema/entries.ts',
        'src/database/repositories/CollectionRepository.ts',
        /**
         * R48: طبقة المستودعات كاملة. كانت 9 ملفات من 10 **خارج المقام** — وهي الطبقة
         * التي يمرّ منها كل حفظ/قراءة في التطبيق. القياس الصادق قبل الاختبارات: 79.6% أسطر.
         */
        'src/database/repositories/BaseRepository.ts',
        'src/database/repositories/ObjectRepository.ts',
        'src/database/repositories/ValueRepository.ts',
        'src/database/repositories/DebtRepository.ts',
        'src/database/repositories/CustomerRepository.ts',
        'src/database/repositories/FinancialRepository.ts',
        'src/database/repositories/ProductRepository.ts',
        'src/database/repositories/WorkTaskRepository.ts',
        'src/database/repositories/OtherRepositories.ts',
        'src/utils/storage/backup.ts',
        'src/services/backup/BackupService.ts',
        'src/services/backup/snapshotStore.ts',
        'src/utils/snapshotCrypto.ts',
        'src/utils/excel/excelCore.ts',
        'src/utils/excel/excelExporters.ts',
        'src/utils/excel/excelImporters.ts',
        'src/utils/xlsxSafe.ts',
        'src/database/adapters/IndexedDBAdapter.ts',
        'src/utils/notes.ts',
        'src/utils/tasks.ts',
        'src/utils/debts/debtAnalytics.ts',
        'src/utils/debts/debtSeeds.ts',
        'src/utils/debts/debtCommitmentSeeds.ts',
        /** R56: الاستيراد الموحّد وتنبيهات الاستحقاق — تُدخل أولاً بلا اختبارات لقياس الفجوة. */
        'src/utils/universalImporters.ts',
        'src/utils/universalDataTemplates.ts',
        'src/utils/dueAlerts.ts',
        'src/utils/linksExport.ts',
        /** R58: جدولة العمل غير الحرج بعد الرسم الأول — تُقاس قبل اختبارها. */
        'src/utils/deferredWork.ts',
        /** R55: منطق مساحة العمل يُدخل في المقام قبل اختبارات هذه الدفعة. */
        'src/utils/workos/workosSeeds.ts',
        'src/utils/workos/workosLoaders.ts',
        'src/utils/workos/workosExporters.ts',
        'src/utils/workos/workosAutomation.ts',
        /** R57: إعدادات النظام والعهد تدخلان المقام قبل اختبارات الدفعة. */
        'src/utils/settingsStorage.ts',
        'src/utils/storage/custody.ts',
        'src/database/dbStorage.ts',
        /** R77: ديمومة التخزين وتذكير التصدير يدخلان المقام قبل اختبار واجهات المتصفح. */
        'src/utils/storagePersistence.ts',
        /** R78: خدمات دفاتر العهدة والدين والمعرفة والروابط تدخل المقام قبل اختبار أثر CRUD. */
        'src/services/custody/CustodyService.ts',
        'src/services/debts/DebtService.ts',
        'src/services/knowledge/KnowledgeService.ts',
        'src/services/links/LinksService.ts',
        /** R79: خدمة المهام تدخل المقام قبل اختبار CRUD الدفاتر ومهام WorkOS ومشروعاته. */
        'src/services/work/TaskService.ts',
        /** R80: تبديل وإنجاز مهام WorkOS يدخل المقام قبل اختبار الكتابة الصامتة. */
        'src/services/workos/WorkOSTaskService.ts',
        /** R81: خدمة أرشيف التدقيق تدخل المقام قبل اختبار التخزين والمجلد والتنزيل. */
        'src/services/audit/auditAutoExport.ts',
        /** R82: مصدر سجل التدقيق يدخل المقام قبل اختبار السجل الساخن والأرشيف. */
        'src/core/audit/AuditService.ts',
        /** R83: إجراءات الأتمتة تدخل المقام قبل اختبار الأثر الجانبي والتكرار. */
        'src/utils/automation/automationActions.ts',
        /** R84: زمن تشغيل الأتمتة يدخل المقام قبل اختبار الإقلاع والمسح والإيقاف. */
        'src/utils/automation/automationRuntime.ts',
        'src/utils/stock.ts',
        'src/utils/storage/stock.ts',
        'src/services/inventory/InventoryService.ts',
        /** R63: الحسابات والترشيح الماليان يدخلان المقام قبل اختبار عقد الدفتر. */
        'src/utils/financial.ts',
        'src/services/financial/FinancialService.ts',
        /** R64: دليل الأطباء وخدمة الزيارات يدخلان المقام قبل اختبار العقود. */
        'src/utils/doctors.ts',
        'src/services/crm/DoctorService.ts',
        /** R65: محرك جدول الروتين وخدمة حفظه يدخلان المقام قبل اختبار العقود. */
        'src/utils/routines.ts',
        'src/services/routines/RoutineService.ts',
        /** R66: ديمومة قوائم الروتين، سجلاته وإعداداته تدخل المقام قبل اختبار العقد. */
        'src/utils/storage/routines.ts',
        /** R67: إنذارات المخزون والالتزامات تدخل المقام قبل اختبار الحساب. */
        'src/services/alerts/alertsEngine.ts',
        /** R68: سجل العملاء وخدمة حفظه يدخلان المقام قبل اختبار العقود. */
        'src/utils/customers.ts',
        /** R69: استمرارية دفتر العملاء تدخل المقام قبل اختبار الغياب والفراغ والتدقيق. */
        'src/utils/storage/customers.ts',
        /** R70: استمرارية دفتر الأطباء تدخل المقام قبل اختبار الغياب والفراغ والتدقيق. */
        'src/utils/storage/doctors.ts',
        /** R71: استمرارية السجل المالي تدخل المقام قبل اختبار البذور والدفاتر المستقلة. */
        'src/utils/storage/financial.ts',
        /** R72: استمرارية دفتر الديون تدخل المقام قبل اختبار الغياب والفراغ والتدقيق. */
        'src/utils/storage/debts.ts',
        /** R73: استمرارية دفتر المهام تدخل المقام قبل اختبار الغياب والفراغ والتدقيق. */
        'src/utils/storage/tasks.ts',
        /** R74: استمرارية قاعدة المعرفة تدخل المقام قبل اختبار الغياب والفراغ والتدقيق. */
        'src/utils/storage/knowledge.ts',
        /** R75: استمرارية مكتبة الروابط تدخل المقام قبل اختبار البذور والمقاييس والاستعادة. */
        'src/utils/storage/links.ts',
        /** R76: استمرارية إعدادات التطبيق تدخل المقام قبل اختبار الترحيل وعزل المفتاح الموحد. */
        'src/utils/storage/settings.ts',
        'src/services/crm/CustomerService.ts',
        /** R62: طابور المزامنة الموحد — يدخل المقام قبل اختبارات الترحيل والدفعات. */
        'src/sync/Outbox.ts',
        'src/utils/syncOutbox.ts',
      ],
      /**
       * السقوف رُفعت في R44 بعد إدخال وحدتَي المنطق إلى المقام (كانتا خارج القياس):
       * 91.05% قديماً كانت على مقام ناقص، و91.89% اليوم على المقام الكامل.
       * القيم أدنى من المقيس بهامش صغير ⇒ أي تراجع حقيقي يُفشل البوابة.
       */
      thresholds: {
        /**
         * R49: بعد إغلاق 63 ذراعاً دفاعياً من 65 قِيست غير مغطّاة.
         * المقيس اليوم: أسطر **100** · دوال **100** · تعابير **99.91** · فروع **99.74**.
         * الذراعان الباقيتان غير قابلتين للبلوغ بنيوياً (انظر `docs/تدقيق/15-الفروع-الدفاعية.md`).
         */
        lines: 99,
        functions: 99,
        branches: 99,
        statements: 99,
        /**
         * سقف لكل ملف عند **المقيس**. الملفان الوحيدان دون 100 لهما ذراع غير قابل للبلوغ
         * موثَّق: `automationRunner` (فحص `!plan` بعد فرض `triggerEvent`) و`formatters`
         * (بديل `ARABIC_DAYS` و`getDay()` محصور بين 0 و6).
         */
        'src/database/schema/engine.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/database/schema/entries.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/autoJournaling.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/authGuard.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/pinCrypto.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/urlSafety.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/security/csp.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/importFidelity.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/lookupsLogic.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/auditAutoExportLogic.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/storage/system.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/automation/automationRules.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/automation/automationDerive.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/automation/automationEvents.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** المقيس: أسطر 100 · دوال 100 · تعابير 98.70 · فروع 98.28 (فحص `!plan` غير قابل للبلوغ). */
        'src/utils/automation/automationRunner.ts': { lines: 100, functions: 100, branches: 98, statements: 98 },
        /** المقيس: أسطر 100 · دوال 100 · تعابير 100 · فروع 98.63. */
        'src/utils/formatters.ts': { lines: 100, functions: 100, branches: 98, statements: 100 },
        /**
         * R51: مسار الاستعادة — `backup.ts` وحدَتا النسخ/التخزين المؤقت والتشفير.
         * إدخالها بلا اختبارات أنزل الإجمالي إلى 82.57% أسطر (كلها كانت خارج المقام).
         * الآن **100** في الأربعة، ويشمل ذلك ذراعَي حرّاس البيئة في `snapshotCrypto`.
         */
        'src/utils/storage/backup.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/backup/BackupService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/backup/snapshotStore.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/snapshotCrypto.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /**
         * R52: طبقة Excel — كانت خارج المقام (1,116 سطراً): إدخالها بلا اختبارات أنزل
         * الإجمالي إلى 78.78% أسطر. الآن: الأسطر والتعابير والدوال **100** في الأربعة.
         *
         * الفروع: ذراع «الحاجز» في `xlsxSafe` (`workbook.Sheets?.[sheetName]`) لا تُبلَغ
         * إلا إذا أعادت `xlsx` مصنّفاً بلا خريطة أوراق — يحاكيها `xlsxSafeGuard.test.ts`
         * ويُثبت أن العائد `[]`، لكن عدّاد v8 ينسب الذراع لمسار آخر.
         * وفي القوالب الثلاثة `if (!worksheet['!views'])`: `json_to_sheet` لا يضع `!views`
         * أبداً في هذه النسخة، فالذراع الأخرى غير قابلة للبلوغ بنيوياً.
         */
        'src/utils/excel/excelCore.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/excel/excelImporters.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/excel/excelExporters.ts': { lines: 100, functions: 100, branches: 98, statements: 100 },
        'src/utils/xlsxSafe.ts': { lines: 100, functions: 100, branches: 92, statements: 100 },
        /**
         * R53: محرّك التخزين الدائم — الطبقة التي تحمل **كل** بيانات المستخدم، وكانت خارج
         * المقام (374 سطراً): إدخالها بلا اختبارات أنزل الإجمالي إلى 93.06% أسطر.
         * الآن الأسطر والدوال والتعابير **100**، والفروع **99**.
         *
         * الذراع الباقية غير قابلة للبلوغ بنيوياً: `if (!db.objectStoreNames.contains(store))`
         * داخل `onupgradeneeded` — هذا الحدث لا يقع إلا عند **إنشاء** قاعدة جديدة، وحينها
         * لا يكون المخزن موجوداً بالضرورة، فالذراع الأخرى (الموجود) لا تُنفَّذ أبداً.
         */
        'src/database/adapters/IndexedDBAdapter.ts': { lines: 100, functions: 100, branches: 99, statements: 100 },
        /** R53: جسر `dbStorage` (34 سطراً) — يكتب عبره كل مستودع؛ 100 في الأربعة. */
        'src/database/dbStorage.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /**
         * R54: دفتر الملاحظات والديون. أُدخلت الملفات الخمسة أولاً بلا اختبارات فانخفض
         * المقام إلى 78.35% أسطر؛ الآن الأسطر والدوال والتعابير 100 في الخمسة.
         *
         * الفروع الواقعية المتبقية: `notes` 98% (عدم تكرار وسم «عاجل» مستحيل لأن
         * الكود لا يضيفه إلا في الشرط نفسه)، و`debtAnalytics` 94% (بدائل العملة
         * الفارغة تقع قبل تطبيعها إلى YER فلا تصل إلى مسار العملة المجهولة).
         */
        'src/utils/notes.ts': { lines: 100, functions: 100, branches: 98, statements: 100 },
        'src/utils/tasks.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/debts/debtAnalytics.ts': { lines: 100, functions: 100, branches: 94, statements: 100 },
        'src/utils/debts/debtSeeds.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/debts/debtCommitmentSeeds.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /**
         * R56: الاستيراد الموحّد وتنبيهات الاستحقاق. بعد قياس الفجوة (48 ملفاً بلا
         * اختبارات جديدة) أُغلقت بدائل الترويسات والتحقق التقويمي وكل مخرجات القوالب؛
         * الملفات الأربعة 100% في الأسطر/الدوال/الفروع/التعابير.
         */
        'src/utils/universalImporters.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/universalDataTemplates.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/dueAlerts.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/linksExport.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R58: جدولة العمل غير الحرج؛ اختبار المتصفح ووقت الخمول وكل مسارات الإلغاء 100%. */
        'src/utils/deferredWork.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R55: سقوف مساحة العمل؛ القياس الأحمر يسبق إضافة اختبار الدفعة. */
        'src/utils/workos/workosSeeds.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/workos/workosLoaders.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/workos/workosExporters.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/workos/workosAutomation.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R57: إعدادات النظام والعهد؛ تُقاس أولاً ثم تُغلق كل قراراتها عند 100%. */
        'src/utils/settingsStorage.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/storage/custody.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /**
         * R48/R49: طبقة المستودعات — الأسطر والدوال والتعابير والفروع **100** في العشرة كلها
         * بعد إغلاق 15 ذراعاً في R49 وإزالة سقوطَين ميتَين في `ProductRepository`.
         */
        /**
         * R50: طبقة المخزون (حساب الأرصدة وأرقام الأذون) — كانت خارج المقام كلها.
         * إدخالها بلا اختبارات أنزل الإجمالي إلى 87.64% أسطر، والآن 100% في الملفات الثلاثة.
         */
        'src/utils/stock.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/storage/stock.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/inventory/InventoryService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R63: تجميع الدفتر والترشيح وخدمة الحفظ/الحذف/العكس؛ كل عقد مالي قابل للقياس. */
        'src/utils/financial.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/financial/FinancialService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R64: دليل الأطباء، الزيارة والاستيراد؛ لا يُخفى تطبيع حالة أو أثر Outbox/Audit. */
        'src/utils/doctors.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/crm/DoctorService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R65: التكرار التقويمي، KPI الروتين، والحفظ ذو الأثرين Audit/Outbox. */
        'src/utils/routines.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/routines/RoutineService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R66: كل دفاتر الروتين تسلك المستودع الصحيح وتحفظ فصل الغياب عن الفراغ. */
        'src/utils/storage/routines.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R67: إنذارات المخزون والالتزامات لا تخفي تاريخاً أو إذناً أو نموذج دين غير صالح. */
        'src/services/alerts/alertsEngine.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R68: عملاء الزيارات وإحصاءاتهم وحفظهم لا يخفون قراراً أو أثر تدقيق/طابور. */
        'src/utils/customers.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/crm/CustomerService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R69: تخزين العملاء يحفظ فصل البذور عن الزيارات وسجل التدقيق المقصوص. */
        'src/utils/storage/customers.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R70: تخزين الأطباء يحفظ فصل البذور عن الزيارات وسجل التدقيق المقصوص. */
        'src/utils/storage/doctors.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R71: السجل المالي وقوائمه لا يخلطان مفاتيحاً ولا يمرران قائمة فارغة بلا عقد. */
        'src/utils/storage/financial.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R72: دفتر الديون يحفظ فصل البذور عن سجل التدقيق ومعرفه الفريد. */
        'src/utils/storage/debts.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R73: دفتر المهام يحفظ فصل البذور عن سجل التدقيق ومعرفه الفريد. */
        'src/utils/storage/tasks.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R74: قاعدة المعرفة تحفظ دلالة الفراغ وسجل التدقيق بمعرف فريد. */
        'src/utils/storage/knowledge.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R75: مكتبة الروابط تحفظ البذور والدفاتر ومقاييس التصنيف والاستعادة. */
        'src/utils/storage/links.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R76: إعدادات التطبيق لا تشارك مفتاح إعدادات النظام ولا تفقد الترحيل أو العزل. */
        'src/utils/storage/settings.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R77: طلب الديمومة والحصة وتذكير التصدير لا يخفون غياب واجهة أو فشل متصفح. */
        'src/utils/storagePersistence.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R78: كل كتابة CRUD في الدفاتر المساندة تثبت المستودع والتدقيق وطابور المزامنة. */
        'src/services/custody/CustodyService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/debts/DebtService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/knowledge/KnowledgeService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/services/links/LinksService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R79: كتابة المهام والالتزامات وWorkOS تثبت المستودع والطابور، والتدقيق عند وجوده. */
        'src/services/work/TaskService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R80: لا تغيّر المهمة المطابقة فقط، وتكتب مرة واحدة عبر المسار الصامت بلا أتمتة. */
        'src/services/workos/WorkOSTaskService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R81: الأرشيف لا يخفي قرار الاستحقاق أو التخزين أو مسار المجلد/التنزيل. */
        'src/services/audit/auditAutoExport.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R82: سجل التدقيق لا يخفي الكتابة أو سقف السجل الساخن أو الأرشيف. */
        'src/core/audit/AuditService.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R83: إجراءات الأتمتة لا تخفي الإشعار أو مهام المتابعة أو أثرها الجانبي. */
        'src/utils/automation/automationActions.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R84: وقت التشغيل لا يخفي تكرار الإقلاع أو فشل المسح أو حدث بداية اليوم. */
        'src/utils/automation/automationRuntime.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        /** R62: الطابور الرسمي وواجهة التوافق القديمة؛ لا يُخفى أي ذراع ترحيل أو قص. */
        'src/sync/Outbox.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/utils/syncOutbox.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/database/repositories/BaseRepository.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/database/repositories/ObjectRepository.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/database/repositories/ValueRepository.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/database/repositories/CollectionRepository.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/database/repositories/DebtRepository.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/database/repositories/CustomerRepository.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/database/repositories/FinancialRepository.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/database/repositories/ProductRepository.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/database/repositories/WorkTaskRepository.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/database/repositories/OtherRepositories.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  },
});
