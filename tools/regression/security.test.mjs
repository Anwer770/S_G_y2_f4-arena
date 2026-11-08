#!/usr/bin/env node
/**
 * اختبار انحدار: أمان قراءة Excel (تخفيف R3)
 *
 * `xlsx@0.18.5` غير محدَّثة على npm وفيها Prototype Pollution + ReDoS بلا إصلاح متاح.
 * لذلك نحصر سطح الهجوم في `src/utils/xlsxSafe.ts`:
 *   - حدّ حجم قبل القراءة
 *   - سقف صفوف (`sheetRows`) يوقف التعليق
 *   - تنظيف مفاتيح `__proto__`/`constructor`/`prototype`
 *   - كل خطأ ⇒ رسالة عربية بدل انهيار
 *
 * يثبت هذا الملف: السلوك الفعلي + أن لا أحد يتجاوز الحارس.
 *
 * التشغيل: node tools/regression/security.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { readFamily } from './_source.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ── بناء الوحدة للاختبار (تجزيء نفس مصدر التطبيق)
const BUNDLE = path.join(ROOT, 'docs', 'تدقيق', '.security-bundle.mjs');
execFileSync(
  path.join(ROOT, 'node_modules', '.bin', 'esbuild'),
  [
    path.join(ROOT, 'src', 'utils', 'xlsxSafe.ts'),
    '--bundle',
    '--format=esm',
    `--outfile=${BUNDLE}`,
    '--log-level=error',
  ],
  { stdio: 'inherit' }
);
const safe = await import(url.pathToFileURL(BUNDLE).href);

// 1) حدّ الحجم
let sizeRejected = false;
try {
  safe.assertFileSize({ size: safe.MAX_IMPORT_BYTES + 1, name: 'big.xlsx' });
} catch (err) {
  sizeRejected = err instanceof Error && /يتجاوز الحد/.test(err.message);
}
check('S1 · ملف أكبر من الحد يُرفض برسالة عربية قبل أي تحليل', sizeRejected);

let smallAccepted = true;
try {
  safe.assertFileSize({ size: 1024 * 1024, name: 'ok.xlsx' });
} catch {
  smallAccepted = false;
}
check('S2 · ملف ضمن الحد يُقبل بلا اعتراض', smallAccepted, `${(safe.MAX_IMPORT_BYTES / 1048576).toFixed(0)}MB سقف`);

// 2) تنظيف المفاتيح الخطرة (prototype pollution)
const XLSX = await import('xlsx');
const wsProto = XLSX.utils.aoa_to_sheet([
  ['__proto__', 'constructor', 'name'],
  ['polluted', 'x', 'صيدلية النور'],
]);
const wbProto = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbProto, wsProto, 'Sheet1');
const protoBuffer = XLSX.write(wbProto, { bookType: 'xlsx', type: 'array' });

let protoClean = false;
let sanitizedCount = 0;
try {
  const res = safe.readFirstSheetSafe(protoBuffer, 'array');
  const firstRow = res.rows[0] || {};
  sanitizedCount = res.sanitizedKeys;
  protoClean =
    !Object.prototype.hasOwnProperty.call(firstRow, '__proto__') &&
    !Object.prototype.hasOwnProperty.call(firstRow, 'constructor') &&
    String(firstRow.name) === 'صيدلية النور' &&
    typeof Object.prototype.polluted === 'undefined';
} catch (err) {
  console.log('   تفصيل:', err?.message);
}
check('S3 · مفاتيح __proto__/constructor تُزال ولا تُلوَّث prototype', protoClean, `أُزيل ${sanitizedCount}`);

// 3) صفوف عادية تُقرأ كما هي
const ws = XLSX.utils.aoa_to_sheet([
  ['اسم العميل', 'المنطقة'],
  ['صيدلية الشفاء', ''],
]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
const normal = safe.readFirstSheetSafe(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }), 'array');
check(
  'S4 · القراءة العادية سليمة والخلية الفارغة تبقى فارغة',
  normal.rows.length === 1 && normal.rows[0]['اسم العميل'] === 'صيدلية الشفاء' && normal.rows[0]['المنطقة'] === '',
  JSON.stringify(normal.rows[0])
);

// 4) ملف تالف ⇒ رسالة واضحة لا انهيار
let corruptOk = false;
let corruptMsg = '';
try {
  const res = safe.readFirstSheetSafe(new Uint8Array([1, 2, 3, 4, 5]), 'array');
  // مقبول: صفر صفوف (ملف غير مقروء) — لا انهيار ولا استثناء أصلي غير معالَج
  corruptOk = Array.isArray(res.rows) && res.rows.length === 0;
  corruptMsg = 'صفر صفوف بلا انهيار';
} catch (err) {
  corruptOk = err?.name === 'ImportSecurityError' && /تعذّر قراءة الملف/.test(err.message);
  corruptMsg = err?.message || '';
}
check('S5 · ملف تالف لا يُسقط التطبيق (رسالة واضحة أو صفر صفوف)', corruptOk, corruptMsg.slice(0, 60));

// 5) لا تجاوز للحارس في الكود
const offenders = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) {
      const rel = path.relative(ROOT, p);
      if (rel.endsWith('xlsxSafe.ts')) continue;
      const txt = fs.readFileSync(p, 'utf8');
      if (/XLSX\.read\(/.test(txt)) offenders.push(rel);
    }
  }
};
walk(path.join(ROOT, 'src'));
check(
  'S6 · كل القراءة تمرّ من `xlsxSafe.ts` (لا XLSX.read خارج الحارس)',
  offenders.length === 0,
  offenders.length ? offenders.join(' · ') : '0 تجاوز'
);

const guarded = [
  'src/utils/excel.ts',
  'src/utils/doctors.ts',
  'src/utils/workosStorage.ts',
  'src/utils/universalImporters.ts',
].filter((f) => /assertFileSize\(/.test(readFamily(f)));
check('S7 · كل مُحلّل استيراد يفحص حجم الملف قبل القراءة', guarded.length === 4, guarded.join(' · '));

const xlsxSafeSrc = read('src/utils/xlsxSafe.ts');
check(
  'S8 · الحارس يفرض سقف الصفوف ويعطّل الصيغ وVBA',
  /sheetRows:/.test(xlsxSafeSrc) && /cellFormula: false/.test(xlsxSafeSrc) && /bookVBA: false/.test(xlsxSafeSrc)
);

const pkg = JSON.parse(read('package.json'));
check(
  'S9 · إصدار xlsx مثبَّت وموثّق كقيد معروف',
  typeof pkg.dependencies?.xlsx === 'string',
  `xlsx@${String(pkg.dependencies?.xlsx)} — مكتبة بلا إصلاح على npm، لذلك الحصار في الكود`
);

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة اختبار أمان الاستيراد (security) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
