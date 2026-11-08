#!/usr/bin/env node
/**
 * اختبار انحدار: أمانة الاستيراد — لا تُملأ الخلايا الفارغة بقيم افتراضية (إصلاح R18)
 *
 * المطلب (من المستخدم): عند استيراد ملف فيه خلايا فارغة، يجب أن تبقى فارغة —
 * التطبيق لا يخترع مصدراً أو منطقة أو مندوباً أو تاريخاً أو حالة من عنده.
 *
 * يثبت طبقتين:
 *   1) سلوكية: `src/utils/importFidelity.ts` (دوال نقية) — الفراغ يبقى فراغاً،
 *      المفاتيح المولّدة موسومة `AUTO-`، والأرقام الفارغة تُسجَّل كصفر صراحةً.
 *   2) مصدرية: المُحلّلات الأربعة (`customers` · `stock` · `financial` · `doctors`)
 *      خالية من أي قيمة افتراضية مخترعة، وتُرفق تقرير الأمانة في `warnings`.
 *
 * التشغيل: node tools/regression/imports.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ── 1) سلوكية: بناء الوحدة النقية للاختبار
const BUNDLE = path.join(ROOT, 'docs', 'تدقيق', '.imports-bundle.mjs');
execFileSync(
  path.join(ROOT, 'node_modules', '.bin', 'esbuild'),
  [`${path.join(ROOT, 'src', 'utils', 'importFidelity.ts')}`, '--bundle', '--format=esm', `--outfile=${BUNDLE}`, '--log-level=error'],
  { stdio: 'inherit' }
);
const F = await import(url.pathToFileURL(BUNDLE).href);

check(
  'P1 · الخلية الفارغة تُقرأ فارغة (لا قيمة افتراضية)',
  F.cellText({ 'الاسم': '', 'name': '' }, ['الاسم', 'name']) === '' &&
    F.cellText({}, ['الاسم', 'name']) === ''
);

check(
  'P2 · أول قيمة غير فارغة هي المقروءة (لا خلط بين المرشّحات)',
  F.cellText({ 'اسم العميل': '', 'Name': 'صيدلية النور' }, ['اسم العميل', 'Name']) === 'صيدلية النور'
);

const blankNum = F.cellNumber({ 'الرصيد': '' }, ['الرصيد']);
const realNum = F.cellNumber({ 'الرصيد': '1250' }, ['الرصيد']);
check(
  'P3 · الرقم الفارغ = 0 مع وسم «فارغ» للمراجعة، والرقم الحقيقي يُقرأ كما هو',
  blankNum.value === 0 && blankNum.blank === true && realNum.value === 1250 && realNum.blank === false,
  `فارغ=${blankNum.value}/${blankNum.blank} · حقيقي=${realNum.value}`
);

const generated = F.autoKey('CUST', 7);
check(
  'P4 · المفتاح المولّد موسوم AUTO- ويمكن تمييزه عن معرّفات الملف',
  generated === 'AUTO-CUST-0007' && F.isAutoKey(generated) && !F.isAutoKey('CUST-1001'),
  generated
);

const report = new F.ImportReport();
report.blank(3, 'المصدر');
report.blank(3, 'المنطقة');
report.generated(3, 'المعرف الرئيسي', 'AUTO-CUST-0003');
report.zeroed(4, 'الرصيد YER');
const summary = report.summary();
check(
  'P5 · تقرير الأمانة يعدّ الفراغ والمولّد والصفر ويذكر السطر',
  report.blanks === 2 &&
    report.generatedCount === 1 &&
    report.zeroedCount === 1 &&
    summary.some((l) => l.includes('AUTO-')) &&
    summary.some((l) => l.includes('السطر 3')),
  `${report.blanks} فارغ · ${report.generatedCount} مولّد · ${report.zeroedCount} صفر`
);

const clean = new F.ImportReport();
check(
  'P6 · لا ملاحظات ⇒ تصريح صريح بأن الاستيراد مطابق للملف',
  clean.summary().length === 1 && /مطابقة للملف/.test(clean.summary()[0])
);

check(
  'P7 · ترويسة السياسة تُعرض للمستخدم قبل الحفظ',
  typeof F.IMPORT_FIDELITY_BANNER === 'string' && /فارغة/.test(F.IMPORT_FIDELITY_BANNER)
);

// ── 2) مصدرية: لا قيم افتراضية في المُحلّلات
const excel = read('src/utils/excel.ts');
const doctors = read('src/utils/doctors.ts');

/** يستخرج جسم دالة تصدير معيّنة (من بدايتها حتى نهاية السطر السابق لأول `export` تالٍ). */
const fnBody = (src, signature) => {
  const start = src.indexOf(signature);
  if (start < 0) return '';
  const rest = src.slice(start + signature.length);
  const nextExport = rest.indexOf('\nexport ');
  return nextExport < 0 ? rest : rest.slice(0, nextExport);
};

const customersBody = fnBody(excel, 'export async function parseCustomersExcelFile(');
const stockBody = fnBody(excel, 'export async function parseExcelForImport(');
const financialBody = fnBody(excel, 'export async function parseFinancialExcelOrCSV(');
const doctorsBody = fnBody(doctors, 'export async function parseDoctorsExcelOrCSV(');

const scanForbidden = (body, list) => list.filter((needle) => body.includes(needle));

const customersBad = scanForbidden(customersBody, [
  "'القيصر الذهبي'",
  "'صنعاء'",
  "'السبت'",
  "'انور'",
  "'مخطط'",
  'CUST-${',
  'new Date().toISOString().split',
]);
check('P8 · مُحلّل العملاء: لا مصدر/منطقة/مسار/مندوب/حالة/تاريخ مخترع', customersBad.length === 0,
  customersBad.length ? customersBad.join(' · ') : 'نظيف');

const stockBad = scanForbidden(stockBody, ["'غير محدد'", 'حركة مستوردة', "'تم التنفيذ'", "'مبيعات'", 'Categ-']);
check('P9 · مُحلّل دفتر الصرف/التوريد: لا جهة/وصف/حالة/فئة مخترعة', stockBad.length === 0,
  stockBad.length ? stockBad.join(' · ') : 'نظيف');

const financialBad = scanForbidden(financialBody, [
  "'ايرادات'",
  "'سند قبض'",
  "'نقدا'",
  "'تحصيل'",
  "'حساب الصندوق العام'",
  "'حساب غير محدد'",
  'String(1000 + index)',
  'ACC-${',
]);
check('P10 · مُحلّل السجل المالي: لا حركة/قيد/دفع/فئة/حساب مخترع', financialBad.length === 0,
  financialBad.length ? financialBad.join(' · ') : 'نظيف');

const doctorsBad = scanForbidden(doctorsBody, ["'الأطباء'", "'عام'", "'انور'", "'2026-08-01'", "'2026-08-07'", 'DOC-${']);
check('P11 · مُحلّل الأطباء: لا مصدر/تخصص/مندوب/تواريخ مخترعة', doctorsBad.length === 0,
  doctorsBad.length ? doctorsBad.join(' · ') : 'نظيف');

check(
  'P12 · المُحلّلات الأربعة تُرفق تقرير الأمانة في تحذيرات الاستيراد',
  customersBody.includes('report.summary()') &&
    stockBody.includes('report.summary()') &&
    financialBody.includes('report.summary()') &&
    doctorsBody.includes('report.summary()')
);

const types = read('src/types/index.ts');
check(
  "P13 · الأنواع تسمح بالقيمة الفارغة ('' = غير مذكور في الملف)",
  /export type CustomerSource = ''/.test(types) &&
    /export type VisitStatus = ''/.test(types) &&
    /export type DoctorVisitStatus = ''/.test(types)
);

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة اختبار أمانة الاستيراد (imports) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
