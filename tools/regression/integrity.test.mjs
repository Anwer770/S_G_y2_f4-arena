#!/usr/bin/env node
/**
 * اختبار انحدار: سلامة الحسابات والتكامل المرجعي واستمرارية التخزين
 * يغطي الإصلاحات:
 *   R12 — تصنيف الحركة المالية المجهولة (كانت تُحتسب مقبوضاً بصمت)
 *   R13 — طلب التخزين الدائم + مراقبة الحصة + تذكير التصدير
 *   R14 — منع البيانات اليتيمة عند حذف صنف/عميل
 *
 * التشغيل: node tools/regression/integrity.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ---------------------------------------------------------------- bundle
const entryPath = path.join(ROOT, 'docs', 'تدقيق', '.integrity-entry.ts');
const bundlePath = path.join(ROOT, 'docs', 'تدقيق', '.integrity-bundle.mjs');

fs.writeFileSync(
  entryPath,
  `export * from '../../src/utils/financial';
export * from '../../src/utils/storagePersistence';
export * from '../../src/utils/stock';
export * from '../../src/utils/customers';
`,
  'utf8'
);

const esbuildBin = path.join(ROOT, 'node_modules', '.bin', 'esbuild');
console.log('▸ تجزيء وحدات المنطق للاختبار…');
execFileSync(
  esbuildBin,
  [
    entryPath,
    '--bundle',
    '--format=esm',
    '--platform=neutral',
    '--outfile=' + bundlePath,
    '--log-level=error',
  ],
  { stdio: 'inherit' }
);

const M = await import(url.pathToFileURL(bundlePath).href);

// تنظيف مخرجات التجزيء (ملفات مولّدة لا تُترك في المستودع)
const cleanupBundles = () => {
  try { fs.rmSync(entryPath, { force: true }); } catch {}
  try { fs.rmSync(bundlePath, { force: true }); } catch {}
};
process.on('exit', cleanupBundles);

// ================================================================ R12
console.log('\n── R12: تصنيف الحركة المالية ─────────────────────────────');
check('تصنيف «ايرادات» = مقبوض', M.classifyFinancialMovement('ايرادات') === 'income');
check('تصنيف «الصندوق» = مقبوض', M.classifyFinancialMovement('الصندوق') === 'income');
check('تصنيف «منصرف» = مدفوع', M.classifyFinancialMovement('منصرف') === 'expense');
check('تصنيف «سلفه» = مدفوع', M.classifyFinancialMovement('سلفه') === 'expense');
check(
  'تصنيف قيمة فارغة/مجهولة = غير مصنف',
  M.classifyFinancialMovement('') === 'unclassified' &&
    M.classifyFinancialMovement(undefined) === 'unclassified' &&
    M.classifyFinancialMovement('حركة مخترعة') === 'unclassified'
);
check(
  'تصنيف يتحمّل المسافات الزائدة',
  M.classifyFinancialMovement('  ايرادات  ') === 'income'
);

const txns = [
  { id: 'ACC-1', movement: 'ايرادات', amountYER: 1000, amountSAR: 100, amountUSD: 20 },
  { id: 'ACC-2', movement: 'منصرف', amountYER: 400, amountSAR: 0, amountUSD: 0 },
  { id: 'ACC-3', movement: 'نوع غير معروف', amountYER: 250, amountSAR: 0, amountUSD: 0 },
];

const sum = M.calculateFinancialSummary(txns);
check('الوارد = 1000 (لا يشمل المجهول)', sum.totalIncomeYER === 1000, `المحصّل=${sum.totalIncomeYER}`);
check('المصروف = 400', sum.totalExpenseYER === 400, `المحصّل=${sum.totalExpenseYER}`);
check('الصافي = 600 (لا 850)', sum.netBalanceYER === 600, `المحصّل=${sum.netBalanceYER}`);
check(
  'دلو «غير مصنف» = 250 / قيد واحد',
  sum.unclassifiedYER === 250 && sum.unclassifiedCount === 1,
  `المحصّل=${sum.unclassifiedYER} / ${sum.unclassifiedCount}`
);
check(
  'العملات الأخرى غير متأثرة بالتصنيف',
  sum.totalSAR === 100 && sum.totalUSD === 20
);
check('عدد الحركات = 3', sum.transactionCount === 3);

// ================================================================ R13
console.log('\n── R13: استمرارية التخزين وتذكير التصدير ───────────────');
const initial = M.getExportReminderState();
check('قبل أي تصدير: التذكير مستحق', initial.due === true && initial.daysSinceExport === null);

const DAY = 24 * 60 * 60 * 1000;
M.markDataExported(new Date(Date.now() - 2 * DAY));
const recent = M.getExportReminderState();
check('تصدير قبل يومين: لا تذكير', recent.due === false && recent.daysSinceExport === 2, `أيام=${recent.daysSinceExport}`);

M.markDataExported(new Date(Date.now() - 10 * DAY));
const stale = M.getExportReminderState();
check('تصدير قبل 10 أيام: تذكير مستحق', stale.due === true && stale.daysSinceExport === 10, `أيام=${stale.daysSinceExport}`);

M.markDataExported(new Date());
check('تصدير الآن: لا تذكير', M.getExportReminderState().due === false);

check('formatBytes(0) = صفر', M.formatBytes(0) === '0 بايت', M.formatBytes(0));
check('formatBytes(1536) بالكيلوبايت', M.formatBytes(1536).includes('كيلوبايت'), M.formatBytes(1536));

const health = await M.getStorageHealth();
check(
  'صحة التخزين تُرجع كائن كامل بلا استثناء',
  health && typeof health.supported === 'boolean' && health.usageRatio >= 0 && health.usageRatio <= 1,
  `supported=${health?.supported}`
);

// محاكاة navigator.storage لاختبار المسار الكامل (إن سمحت البيئة)
let navigatorMocked = false;
try {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      storage: {
        persist: async () => true,
        persisted: async () => true,
        estimate: async () => ({ usage: 100, quota: 1000 }),
      },
    },
  });
  navigatorMocked = true;
} catch {
  navigatorMocked = false;
}

if (navigatorMocked) {
  const granted = await M.requestPersistentStorage();
  const mockedHealth = await M.getStorageHealth();
  check('requestPersistentStorage يمنح الديمومة', granted === true);
  check('الحالة بعد الطلب = granted', M.getPersistState() === 'granted');
  check(
    'قراءة الحصة: 100/1000 → نسبة 0.1',
    mockedHealth.usage === 100 && mockedHealth.quota === 1000 && mockedHealth.usageRatio === 0.1,
    `${mockedHealth.usage}/${mockedHealth.quota}`
  );
  check('persisted=true عند منح المتصفح', mockedHealth.persisted === true);
} else {
  console.log('↷ تخطي فحوص محاكاة navigator.storage (البيئة لا تسمح بالتعريف)');
}

// ================================================================ R14
console.log('\n── R14: التكامل المرجعي عند الحذف ───────────────────────');
const records = [
  { subId: 'IN-0001', items: { 'صنف أ': 5, 'صنف ب': 2 } },
  { subId: 'OUT-0001', items: { 'صنف أ': 3 } },
  { subId: 'IN-0002', items: { 'صنف ج': 7 } },
];

check('عدد أذون «صنف أ» = 2', M.getMovementsForProduct(records, 'صنف أ').length === 2);
check('عدد أذون «صنف ج» = 1', M.getMovementsForProduct(records, 'صنف ج').length === 1);
check('صنف غير مستخدم → صفر أذون', M.getMovementsForProduct(records, 'صنف د').length === 0);
check('اسم فارغ → صفر أذون', M.getMovementsForProduct(records, '').length === 0);

const blocked = M.canDeleteProduct(records, 'صنف أ');
check(
  'منع حذف صنف له حركات (RESTRICT)',
  blocked.allowed === false && blocked.linkedCount === 2 && Boolean(blocked.reason),
  `العدد=${blocked.linkedCount}`
);
check('السماح بحذف صنف بلا حركات', M.canDeleteProduct(records, 'صنف د').allowed === true);

const customers = [
  { id: 'CUST-1001', name: 'عميل 1' },
  { id: 'CUST-1002', name: 'عميل 2' },
];
const visits = [
  { id: 'VST-1', customerId: 'CUST-1001' },
  { id: 'VST-2', customerId: 'CUST-1001' },
  { id: 'VST-3', customerId: 'CUST-1002' },
];

const cascadePlan = M.planCustomerDeletion(customers, visits, 'CUST-1001');
check(
  'عميل بزيارتين → يتطلب حذفاً متتابعاً',
  cascadePlan.found === true &&
    cascadePlan.requiresCascade === true &&
    cascadePlan.relatedVisits.length === 2
);
check(
  'عميل بزيارة واحدة → 1 مرتبطة',
  M.planCustomerDeletion(customers, visits, 'CUST-1002').relatedVisits.length === 1
);
const cleanPlan = M.planCustomerDeletion(customers, [], 'CUST-1001');
check('عميل بلا زيارات → تأكيد واحد فقط', cleanPlan.requiresCascade === false);
check('معرّف غير موجود → found=false', M.planCustomerDeletion(customers, visits, 'CUST-9').found === false);

// ================================================================ summary
const failed = results.filter((r) => !r.ok);
console.log('\n──────────────────────────────────────────────────────────');
console.log(`النتيجة: ${results.length - failed.length}/${results.length} ناجح`);
if (failed.length) {
  console.error('فشل:', failed.map((f) => f.name).join(' | '));
  process.exit(1);
}
console.log('✔ كل فحوص السلامة (R12/R13/R14) ناجحة');
