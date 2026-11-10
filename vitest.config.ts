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
        'src/database/dbStorage.ts',
        'src/utils/stock.ts',
        'src/utils/storage/stock.ts',
        'src/services/inventory/InventoryService.ts',
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
