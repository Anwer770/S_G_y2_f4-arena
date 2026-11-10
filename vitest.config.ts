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
      ],
      /**
       * السقوف رُفعت في R44 بعد إدخال وحدتَي المنطق إلى المقام (كانتا خارج القياس):
       * 91.05% قديماً كانت على مقام ناقص، و91.89% اليوم على المقام الكامل.
       * القيم أدنى من المقيس بهامش صغير ⇒ أي تراجع حقيقي يُفشل البوابة.
       */
      thresholds: {
        /**
         * R46: رُفعت بعد تغطية قرارات سجل النظام ومشغّل الأتمتة واشتقاق الأحداث.
         * المقيس اليوم: أسطر 94.98 · دوال 98 · فروع 86.82 · تعابير 94.45.
         */
        lines: 92,
        functions: 95,
        branches: 84,
        statements: 92,
        // سقف مستقلّ للوحدات التي رُفعت تغطيتها — لا يُخفّض بتراجع تدريجي
        'src/utils/lookupsLogic.ts': { lines: 95, functions: 95, branches: 90, statements: 95 },
        'src/utils/auditAutoExportLogic.ts': { lines: 95, functions: 95, branches: 95, statements: 95 },
        /** R46: سجل النظام (بذرة/فراغ/سقف 1000/تدقيق) ومشغّل الأتمتة واشتقاق الأحداث. */
        'src/utils/storage/system.ts': { lines: 95, functions: 95, branches: 95, statements: 95 },
        'src/utils/automation/automationRunner.ts': { lines: 95, functions: 95, branches: 90, statements: 95 },
        'src/utils/automation/automationDerive.ts': { lines: 95, functions: 95, branches: 85, statements: 95 },
      },
    },
  },
});
