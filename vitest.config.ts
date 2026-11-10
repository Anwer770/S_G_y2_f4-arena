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
      ],
      /**
       * السقوف رُفعت في R44 بعد إدخال وحدتَي المنطق إلى المقام (كانتا خارج القياس):
       * 91.05% قديماً كانت على مقام ناقص، و91.89% اليوم على المقام الكامل.
       * القيم أدنى من المقيس بهامش صغير ⇒ أي تراجع حقيقي يُفشل البوابة.
       */
      thresholds: {
        /**
         * R48: رُفعت بعد إدخال **طبقة المستودعات كلها** في المقام (كانت 9 من 10 خارجه).
         * المقيس اليوم: أسطر 99.3 · دوال 99.28 · فروع 91.72 · تعابير 98.71.
         */
        lines: 97,
        functions: 97,
        branches: 89,
        statements: 96,
        // سقف مستقلّ للوحدات التي رُفعت تغطيتها — لا يُخفّض بتراجع تدريجي
        'src/utils/lookupsLogic.ts': { lines: 95, functions: 95, branches: 90, statements: 95 },
        'src/utils/auditAutoExportLogic.ts': { lines: 95, functions: 95, branches: 95, statements: 95 },
        /** R46: سجل النظام (بذرة/فراغ/سقف 1000/تدقيق) ومشغّل الأتمتة واشتقاق الأحداث. */
        'src/utils/storage/system.ts': { lines: 95, functions: 95, branches: 95, statements: 95 },
        'src/utils/automation/automationRunner.ts': { lines: 95, functions: 95, branches: 90, statements: 95 },
        'src/utils/automation/automationDerive.ts': { lines: 95, functions: 95, branches: 85, statements: 95 },
        /** R47: الترحيلات والمنسّقات — منطق صامت يكتب بيانات المستخدم. */
        'src/database/schema/entries.ts': { lines: 98, functions: 98, branches: 95, statements: 98 },
        'src/utils/formatters.ts': { lines: 98, functions: 98, branches: 95, statements: 98 },
        /**
         * R48: طبقة المستودعات — سقف لكل ملف عند **المقيس اليوم** (أسطر/دوال/تعابير 100%
         * في العشرة كلها). أي سطر جديد بلا اختبار يُفشل البوابة فوراً. الفروع أدنى في
         * `BaseRepository`… إلخ لأنها فروع دفاعية (تخزين معطوب · قيمة غير كائنية) لا تُبلَغ
         * إلا بمحاكاة فشل، والمقيس مذكور في `docs/تدقيق/14-طبقة-المستودعات.md`.
         */
        'src/database/repositories/BaseRepository.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/database/repositories/ObjectRepository.ts': { lines: 100, functions: 100, branches: 94, statements: 100 },
        'src/database/repositories/ValueRepository.ts': { lines: 100, functions: 100, branches: 93, statements: 100 },
        'src/database/repositories/CollectionRepository.ts': {
          lines: 100,
          functions: 100,
          branches: 94,
          statements: 100,
        },
        'src/database/repositories/DebtRepository.ts': { lines: 100, functions: 100, branches: 90, statements: 100 },
        'src/database/repositories/CustomerRepository.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/database/repositories/FinancialRepository.ts': {
          lines: 100,
          functions: 100,
          branches: 72,
          statements: 100,
        },
        'src/database/repositories/ProductRepository.ts': { lines: 100, functions: 100, branches: 75, statements: 100 },
        'src/database/repositories/WorkTaskRepository.ts': {
          lines: 100,
          functions: 100,
          branches: 90,
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
