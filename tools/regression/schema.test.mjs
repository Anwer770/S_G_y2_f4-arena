#!/usr/bin/env node
/**
 * اختبار انحدار: ترحيل المخططات المُرقَّم والمستودعات (R33 — البند 7).
 *
 * يقيس سلوكاً حقيقياً على الكود الإنتاجي داخل DOM وهمي:
 *   G1 محرّك الترحيل يعمل على تخزين التطبيق نفسه
 *   G2 بيانات قديمة (بلا إصدار) تُرحَّل: المصفوفات الفرعية تُكمَّل والحقول الناقصة تُضاف
 *   G3 لا فقدان: كل سجل موجود قبل الترحيل موجود بعده بنفس المعرّف والعنوان
 *   G4 نسخة احتياطية للقيمة الأصلية محفوظة قبل الترحيل
 *   G5 idempotent: تشغيل ثانٍ لا يُغيّر شيئاً ولا يكتب
 *   G6 بيانات بإصدار أحدث لا تُهبَط
 *   G7 JSON تالف لا يُمسح ولا يُسقط الإقلاع
 *   G8 مستودع الديون يحفظ سلوك «المصفوفة الفارغة ⇒ البذرة» حرفياً
 *   G9 مستودع المعرفة يحفظ سلوك «المصفوفة الفارغة مقبولة» حرفياً
 *   G10 الإقلاع يشغّل الترحيل قبل تركيب الواجهة (ترتيب في main.tsx)
 *
 * التشغيل: node tools/regression/schema.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { read, readFamily } from './_source.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const OUT_DIR = path.join(ROOT, 'docs', 'تدقيق');
const BUNDLE = path.join(OUT_DIR, '.schema-bundle.js');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

fs.mkdirSync(OUT_DIR, { recursive: true });
execFileSync(
  path.join(ROOT, 'node_modules', '.bin', 'esbuild'),
  [
    path.join(ROOT, 'tools', 'regression', '_schema_entry.ts'),
    '--bundle',
    '--format=iife',
    '--global-name=SCHEMA',
    '--outfile=' + BUNDLE,
    '--define:process.env.NODE_ENV="production"',
    '--log-level=error',
  ],
  { cwd: ROOT, stdio: 'inherit' }
);
const code = fs.readFileSync(BUNDLE, 'utf8');

const { JSDOM, VirtualConsole } = require('jsdom');
const errors = [];
const vc = new VirtualConsole();
vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 200)));
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + String(e?.message).slice(0, 200)));

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://schema.local/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const w = dom.window;
w.eval(code);
const S = w.SCHEMA;
check('G1 · محرّك الترحيل يُجزيء ويُحمّل', typeof S.bootSchema === 'function' && Array.isArray(S.SCHEMA_ENTRIES));

// ── بيانات «قديمة»: بلا إصدار، وبأشكال ناقصة كما تصل من استيراد أو نسخة سابقة
const LEGACY_TASKS = [
  { id: 'T-1', title: 'مهمة قديمة 1', status: 'planned' }, // بلا مصفوفات ولا تقدم
  { id: 'T-2', title: 'مهمة قديمة 2', status: 'completed', progress: 100 },
  { title: 'مهمة بلا معرّف' },
];
const LEGACY_PROJECTS = [{ id: 'P-1', name: 'مشروع قديم', progress: 140 }];
const LEGACY_NOTES = [{ id: 'N-1', title: 'ملاحظة قديمة', attachments: [{ name: 'ملف.pdf' }, null] }];

// البذر يمرّ من طبقة التخزين نفسها التي يقرأ منها التطبيق (IndexedDB في الذاكرة + localStorage)
const seed = (key, raw) => S.dbStorage.setItem(key, raw);
seed('workos_v1_tasks', JSON.stringify(LEGACY_TASKS));
seed('workos_v1_projects', JSON.stringify(LEGACY_PROJECTS));
seed('suite_knowledge_notes_v1', JSON.stringify(LEGACY_NOTES));
seed('suite_debts_records_v1', '{ملف تالف');

const readJson = (key) => {
  try {
    return JSON.parse(S.dbStorage.getItem(key));
  } catch {
    return null;
  }
};

// ── G2/G3/G4: تشغيل الترحيل الحقيقي
const report = S.bootSchema();
const tasks = readJson('workos_v1_tasks') || [];
const projects = readJson('workos_v1_projects') || [];
const notes = readJson('suite_knowledge_notes_v1') || [];
const versions = S.readVersions ? S.readVersions(S.dbStorage) : {};

check(
  'G2 · بيانات قديمة تُرحَّل (مصفوفات فرعية وتقدم ومعرّفات)',
  report.upgraded >= 3 &&
    tasks.every((t) => Array.isArray(t.subtasks) && Array.isArray(t.tags) && typeof t.progress === 'number') &&
    projects[0].progress === 100 &&
    notes[0].attachments.length === 2,
  `رُحِّل ${report.upgraded} · مهام ${tasks.length}`
);

check(
  'G3 · لا فقدان بيانات: كل سجل موجود بعده بنفس المعرّف والعنوان',
  tasks.length === LEGACY_TASKS.length &&
    LEGACY_TASKS.filter((t) => t.id).every((t) => tasks.some((x) => x.id === t.id && x.title === t.title)),
  `${tasks.length}/${LEGACY_TASKS.length} سجلاً`
);

check(
  'G3b · السجل بلا معرّف نال معرّفاً فريداً بدل اختفائه',
  tasks.every((t) => typeof t.id === 'string' && t.id.length > 0) &&
    new Set(tasks.map((t) => t.id)).size === tasks.length
);

check(
  'G4 · نسخة احتياطية للقيمة الأصلية محفوظة قبل الترحيل',
  S.dbStorage.getItem('workos_v1_tasks' + S.BACKUP_SUFFIX) === JSON.stringify(LEGACY_TASKS),
  S.BACKUP_SUFFIX
);

// ── G5: idempotent
const snapshot = JSON.stringify([tasks, projects, notes]);
const secondReport = S.bootSchema();
const afterSecond = JSON.stringify([
  readJson('workos_v1_tasks'),
  readJson('workos_v1_projects'),
  readJson('suite_knowledge_notes_v1'),
]);
check(
  'G5 · تشغيل ثانٍ لا يُغيّر شيئاً (idempotent)',
  secondReport.upgraded === 0 && afterSecond === snapshot,
  `ترحيلات ثانية = ${secondReport.upgraded}`
);

// ── G6: لا هبوط لإصدار أحدث
S.dbStorage.setItem(S.SCHEMA_META_KEY, JSON.stringify({ workos_v1_tasks: 99 }));
const futureReport = S.bootSchema();
const futureIds = (readJson('workos_v1_tasks') || []).map((t) => t.id);
check(
  'G6 · بيانات بإصدار أحدث تُترك كما هي (لا هبوط)',
  futureIds.join(',') === tasks.map((t) => t.id).join(',') &&
    futureReport.outcomes.some((o) => o.key === 'workos_v1_tasks' && o.status === 'skipped-future'),
  futureReport.outcomes.find((o) => o.key === 'workos_v1_tasks')?.status || ''
);

// ── G7: JSON تالف
const corrupt = readJson('suite_debts_records_v1');
check(
  'G7 · JSON تالف يُترك بلا مسح ويُسجَّل كفشل بلا إسقاط الإقلاع',
  S.dbStorage.getItem('suite_debts_records_v1') === '{ملف تالف' && report.failed >= 1 && corrupt === null,
  `failed = ${report.failed}`
);

// ── G8/G9: سلوك المستودعات محفوظ حرفياً
seed('suite_debts_records_v1', '[]');
const debtsFallback = S.loadDebts();
seed('suite_debts_records_v1', JSON.stringify([{ id: 'D-1', book: 'book1', amount: 5 }]));
const debtsSaved = S.loadDebts();
check(
  'G8 · مستودع الديون: المصفوفة الفارغة ⇒ البذرة، والمصفوفة غير الفارغة ⇒ المحفوظ',
  Array.isArray(debtsFallback) && debtsFallback.length > 0 && debtsSaved.length === 1 && debtsSaved[0].id === 'D-1',
  `بذرة=${debtsFallback.length} · محفوظ=${debtsSaved.length}`
);

seed('suite_knowledge_notes_v1', '[]');
const notesEmpty = S.loadNotes();
S.saveNotes([{ id: 'N-9', title: 'محفوظة' }]);
const notesAfter = S.loadNotes();
check(
  'G9 · مستودع المعرفة: المصفوفة الفارغة مقبولة (لا رجوع للبذرة) والحفظ يعمل',
  Array.isArray(notesEmpty) && notesEmpty.length === 0 && notesAfter.length === 1 && notesAfter[0].id === 'N-9',
  `فارغة=${notesEmpty.length} · بعد الحفظ=${notesAfter.length}`
);

const audit = S.loadDebtAuditLogs();
S.logDebtAudit('إضافة', 'دفتر', 'اختبار', 'سطر');
check(
  'G9b · سجل التدقيق يُقرأ ويُكتب عبر المستودع',
  Array.isArray(audit) && S.loadDebtAuditLogs().length >= 1,
  `${S.loadDebtAuditLogs().length} سطراً`
);

// ── G10: الترتيب في الإقلاع
const mainSrc = read('src/main.tsx');
const bootIdx = mainSrc.indexOf('bootSchema(');
const renderIdx = mainSrc.lastIndexOf('renderApp()');
check(
  'G10 · الترحيل يعمل قبل تركيب الواجهة (main.tsx)',
  bootIdx > -1 && renderIdx > -1 && bootIdx < renderIdx,
  `bootSchema عند ${bootIdx} · renderApp عند ${renderIdx}`
);

const storageModules = ['src/utils/storage/debts.ts', 'src/utils/storage/knowledge.ts'];
const directStorage = storageModules.filter((file) => /dbStorage\.(getItem|setItem)/.test(readFamily(file)));
check(
  'G11 · الدفاتر المرحَّلة لا تلمس التخزين مباشرةً (كل شيء عبر المستودع)',
  directStorage.length === 0,
  directStorage.join(' · ') || '0 تجاوز'
);

const repoUsage = storageModules.every((file) => /createCollectionRepository/.test(readFamily(file)));
check('G12 · الدفاتر المرحَّلة تستخدم المستودع العام', repoUsage);

check('G13 · لا أخطاء JS أثناء التشغيل', errors.length === 0, errors[0] || '');

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة ترحيل المخططات والمستودعات (R33) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
fs.writeFileSync(
  path.join(OUT_DIR, 'schema-runtime.json'),
  JSON.stringify({ at: new Date().toISOString(), passed, total: results.length, report, results }, null, 1),
  'utf8'
);
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
