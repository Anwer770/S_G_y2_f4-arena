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

const reading = (storage, key) => {
  const value = storage.getItem(key);
  return value === undefined ? null : value;
};
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

const storageModules = [
  'src/utils/storage/debts.ts',
  'src/utils/storage/knowledge.ts',
  'src/utils/storage/tasks.ts',
  'src/utils/storage/custody.ts',
  'src/utils/storage/links.ts',
  'src/utils/storage/routines.ts',
  'src/utils/storage/customers.ts',
  'src/utils/storage/doctors.ts',
  'src/utils/storage/financial.ts',
  'src/utils/storage/stock.ts',
  'src/utils/storage/settings.ts',
  'src/utils/storage/system.ts',
];
const directStorage = storageModules.filter((file) => /dbStorage\.(getItem|setItem)/.test(readFamily(file)));
check(
  'G11 · الدفاتر المرحَّلة لا تلمس التخزين مباشرةً (كل شيء عبر المستودع)',
  directStorage.length === 0,
  directStorage.join(' · ') || '0 تجاوز'
);

const repoUsage = storageModules.every((file) => /create(Collection|Object)Repository/.test(readFamily(file)));
check('G12 · الدفاتر المرحَّلة تستخدم المستودع العام', repoUsage);

// ── G14: تكافؤ السلوك في الوحدات المنقولة حديثاً (R35)
const parity = [];
const expectFallback = (name, loader, key) => {
  seed(key, '[]');
  const empty = loader();
  seed(key, JSON.stringify([{ id: 'X-1', title: 'سجل', name: 'سجل', url: 'https://x.y', status: 'قيد الاستخدام' }]));
  const one = loader();
  parity.push({ name, fallbackCount: empty.length, storedCount: one.length });
  return empty.length > 0 && one.length === 1;
};
const tasksOk = expectFallback('tasks', S.loadTasks, 'suite_tasks_items_v2');
const custodyOk = expectFallback('custody', S.loadCustodyIssues, 'suite_custody_records_v1');
const linksOk = expectFallback('links', S.loadLinksRecords, 'suite_links_records_v1');
check(
  'G14 · الوحدات المنقولة تحفظ سلوك «المصفوفة الفارغة ⇒ البذرة» (مهام · عهد · روابط)',
  tasksOk && custodyOk && linksOk,
  parity.map((p) => `${p.name}: بذرة ${p.fallbackCount} / محفوظ ${p.storedCount}`).join(' · ')
);

// سقف سجل تدقيق العهد = 100 سطر (سلوك محفوظ من الكود السابق)
const manyCustodyLogs = Array.from({ length: 250 }, (_, i) => ({
  id: `L-${i}`,
  timestamp: '2026-11-08',
  module: 'عهدة',
  action: 'إضافة',
  details: 'x',
}));
S.saveCustodyAuditLogs(manyCustodyLogs);
check(
  'G15 · سقف سجل تدقيق العهد (100 سطر) محفوظ بعد النقل',
  S.loadCustodyAuditLogs().length === 100,
  `${S.loadCustodyAuditLogs().length} سطراً`
);

// ── G16/G17: الوحدات المنقولة في R36 (روتين · عملاء · أطباء)
const seedParity = [];
const parityCheck = (name, loader, key, expectSeed) => {
  seed(key, '[]');
  const empty = loader();
  const ok = expectSeed ? empty.length > 0 : empty.length === 0;
  seedParity.push({ name, empty: empty.length, expectSeed });
  return ok;
};
const r36Ok =
  parityCheck('routines', S.loadRoutines, 'suite_routines_items_v1', true) &&
  parityCheck('routines.categories', S.loadRoutineCategories, 'suite_routines_categories_v1', true) &&
  parityCheck('routines.tags', S.loadRoutineTags, 'suite_routines_tags_v1', true) &&
  parityCheck('routines.templates', S.loadRoutineTemplates, 'suite_routines_templates_v1', true) &&
  parityCheck('routines.occurrences', S.loadRoutineOccurrences, 'suite_routines_occurrences_v1', false) &&
  parityCheck('routines.exceptions', S.loadRoutineExceptions, 'suite_routines_exceptions_v1', false) &&
  parityCheck('customers', S.loadCustomers, 'suite_customers_items_v2', true) &&
  parityCheck('customers.regions', S.loadCustomerRegions, 'suite_customers_regions_v2', true) &&
  parityCheck('customers.visits', S.loadCustomerVisits, 'suite_customers_visits_v2', false) &&
  parityCheck('doctors', S.loadDoctors, 'suite_doctors_items_v1', true) &&
  parityCheck('doctors.specialties', S.loadDoctorSpecialties, 'suite_doctors_specialties_v1', true) &&
  parityCheck('doctors.visits', S.loadDoctorVisits, 'suite_doctors_visits_v1', false);
check(
  'G16 · الوحدات المنقولة (روتين · عملاء · أطباء) تحفظ سلوك الفراغ: القوائم ⇒ البذرة والزيارات ⇒ قبول الفراغ',
  r36Ok,
  seedParity.map((p) => `${p.name}:${p.empty}${p.expectSeed ? '(بذرة)' : '(فراغ)'}`).join(' ')
);

// الحفظ ثم القراءة يعمل عبر المستودع لكل الوحدات الثلاث
const saveRoundTrip = [];
const trip = (name, loader, saver, record, key) => {
  seed(key, '[]');
  saver([record]);
  const back = loader();
  saveRoundTrip.push({ name, n: back.length, id: back[0]?.id });
  return back.length === 1 && back[0]?.id === record.id;
};
const tripOk =
  trip('routines', S.loadRoutines, S.saveRoutines, { id: 'RTN-X', title: 'روتين' }, 'suite_routines_items_v1') &&
  trip('customers', S.loadCustomers, S.saveCustomers, { id: 'CUS-X', name: 'عميل' }, 'suite_customers_items_v2') &&
  trip('doctors', S.loadDoctors, S.saveDoctors, { id: 'DOC-X', name: 'طبيب' }, 'suite_doctors_items_v1');
check(
  'G17 · الحفظ والقراءة عبر المستودع (روتين · عملاء · أطباء)',
  tripOk,
  saveRoundTrip.map((r) => `${r.name}:${r.n}`).join(' ')
);

// G18: كائن الإعدادات يُدمج فوق الافتراضي (سلوك loadRoutineSettings حرفياً)
seed('suite_routines_settings_v1', JSON.stringify({ autoGenerateOccurrences: false, حقلLegacy: 7 }));
const settings = S.loadRoutineSettings();
seed('suite_routines_settings_v1', 'null');
const settingsNullRaw = S.loadRoutineSettings();
const defaultsKeys = Object.keys(S.loadRoutineSettings() || {});
seed('suite_routines_settings_v1', JSON.stringify({ autoGenerateOccurrences: false }));
const settingsKeys = Object.keys(S.loadRoutineSettings());
check(
  'G18 · إعدادات الروتين: الكائن المحفوظ يُدمج فوق الافتراضي والحقل القديم يبقى',
  settings.autoGenerateOccurrences === false &&
    settings.حقلLegacy === 7 &&
    settingsKeys.length > 1 &&
    settingsNullRaw !== null,
  `حقول الافتراضي=${settingsKeys.length} · القديم محفوظ=${settings.حقلLegacy === 7}`
);

// G19: سقوف سجلات التدقيق (500) للوحدات الثلاث بعد النقل
const makeLogs = (n, extra) => Array.from({ length: n }, (_, i) => ({ id: `L-${i}`, ...extra }));
seed('suite_routines_audit_v1', '[]');
S.saveRoutineAuditLogs(makeLogs(700, { timestamp: 'x', action: 'إضافة', routineName: 'r', details: 'd' }));
seed('suite_customers_audit_v2', '[]');
S.saveCustomerAuditLogs(makeLogs(700, { time: 'x', action: 'إضافة', customerName: 'c', details: 'd' }));
seed('suite_doctors_audit_v1', '[]');
S.saveDoctorAuditLogs(makeLogs(700, { time: 'x', action: 'إضافة', doctorName: 'd', details: 'x' }));
const limits = [S.loadRoutineAuditLogs().length, S.loadCustomerAuditLogs().length, S.loadDoctorAuditLogs().length];
check(
  'G19 · سقف سجل التدقيق 500 سطر في الوحدات الثلاث',
  limits.every((n) => n === 500),
  limits.join(' · ')
);

// ── G20/G21/G22: الوحدات المنقولة في R37 (مالية · مخزون)
const finModules = [
  ['financial.transactions', S.loadFinancialTransactions, 'suite_fin_transactions_v2'],
  ['financial.movements', S.loadFinancialMovements, 'suite_fin_movements_v2'],
  ['financial.restrictions', S.loadFinancialRestrictions, 'suite_fin_restrictions_v2'],
  ['financial.movementTypes', S.loadFinancialMovementTypes, 'suite_fin_movement_types_v2'],
  ['financial.importance', S.loadFinancialImportanceList, 'suite_fin_importance_v2'],
  ['financial.categoryAccounts', S.loadFinancialCategoryAccounts, 'suite_fin_category_accounts_v2'],
  ['financial.restrictionAccounts', S.loadFinancialRestrictionAccounts, 'suite_fin_restriction_accounts_v2'],
  ['financial.accountNames', S.loadFinancialAccountNames, 'suite_fin_account_names_v2'],
];
const finResults = finModules.map(([name, loader, key]) => {
  seed(key, '[]');
  const empty = loader();
  seed(key, JSON.stringify([name.endsWith('transactions') ? { id: 'FIN-X' } : 'محفوظ']));
  const one = loader();
  return { name, seed: empty.length, stored: one.length };
});
check(
  'G20 · الوحدة المالية: كل قوائمها الثماني تُرجع البذرة عند [] وتقرأ المحفوظ',
  finResults.every((r) => r.seed > 0 && r.stored === 1),
  finResults.map((r) => `${r.name.split('.')[1]}:${r.seed}`).join(' ')
);

// G21 · المفاتيح القديمة: تُقرأ إن غاب الحالي، ولا تتقدّم عليه إن وُجد
seed('stock_ledger_products_v1', JSON.stringify([{ id: 'P-OLD', name: 'منتج قديم' }]));
S.dbStorage.removeItem('suite_stock_products_v2');
const legacyProducts = S.loadProducts();
seed('suite_stock_products_v2', JSON.stringify([{ id: 'P-NEW', name: 'منتج جديد' }]));
const currentProducts = S.loadProducts();
seed('stock_ledger_categories_v1', JSON.stringify(['قديم']));
S.dbStorage.removeItem('suite_stock_categories_v2');
const legacyCategories = S.loadStockCategories();
// المصفوفة الفارغة في المفتاح الحالي تمنع الرجوع للقديم (سلوك `getItem(new) || getItem(old)`)
seed('suite_stock_categories_v2', '[]');
const emptyOverLegacy = S.loadStockCategories();
check(
  'G21 · المخزون: المفاتيح القديمة تُقرأ عند غياب الحالي وتُحجب عند وجوده (حتى لو فارغاً)',
  legacyProducts.length === 1 &&
    legacyProducts[0].id === 'P-OLD' &&
    currentProducts[0].id === 'P-NEW' &&
    legacyCategories[0] === 'قديم' &&
    emptyOverLegacy.length > 1,
  `قديم=${legacyProducts[0]?.id} · حالي=${currentProducts[0]?.id} · فارغ⇒بذرة=${emptyOverLegacy.length}`
);

// G22 · عدّاد التسلسل: لا دمج جزئي (عدّاد ناقص = عدّاد تالف ⇒ الافتراضي كاملاً)
seed('suite_stock_seq_v2', JSON.stringify({ IN: 50, OUT: 900 }));
const seqSaved = S.loadStockSeq();
seed('suite_stock_seq_v2', JSON.stringify({ IN: 50 }));
const seqPartial = S.loadStockSeq();
seed('suite_stock_seq_v2', '{تالف');
const seqCorrupt = S.loadStockSeq();
S.dbStorage.removeItem('suite_stock_seq_v2');
seed('stock_ledger_seq_v1', JSON.stringify({ IN: 7, OUT: 8 }));
const seqLegacy = S.loadStockSeq();
S.saveStockSeq({ IN: 71, OUT: 801 });
const seqWritten = S.loadStockSeq();
const seqKeyRaw = JSON.parse(S.dbStorage.getItem('suite_stock_seq_v2'));
check(
  'G22 · عدّاد التسلسل: المحفوظ الصحيح يُقرأ، والناقص/التالف يعود للافتراضي كاملاً، والقديم يُقرأ ويُكتب للمفتاح الحالي',
  seqSaved.IN === 50 &&
    seqSaved.OUT === 900 &&
    seqPartial.IN === S.DEFAULT_STOCK_SEQ.IN &&
    seqPartial.OUT === S.DEFAULT_STOCK_SEQ.OUT &&
    seqCorrupt.OUT === S.DEFAULT_STOCK_SEQ.OUT &&
    seqLegacy.IN === 7 &&
    seqWritten.IN === 71 &&
    seqKeyRaw.IN === 71,
  `محفوظ=${seqSaved.IN}/${seqSaved.OUT} · ناقص=${seqPartial.IN}/${seqPartial.OUT} · قديم=${seqLegacy.IN}/${seqLegacy.OUT}`
);

// ── G23/G24: لا تخزين في المكوّنات + خدمة مهام مساحة العمل (R40)
const componentFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel);
    else if (/\.tsx?$/.test(entry.name)) componentFiles.push(rel);
  }
};
walk('src/components');
const componentHits = componentFiles.filter((f) => /dbStorage\.(getItem|setItem|removeItem|getStats)/.test(read(f)));
check(
  'G23 · لا مكوّن يلمس التخزين مباشرةً (كل شيء عبر خدمة أو مستودع)',
  componentHits.length === 0,
  componentHits.slice(0, 5).join(' · ') || `0 تجاوز في ${componentFiles.length} ملف واجهة`
);

const WT_KEY = 'workos_v1_tasks';
const seedTasks = [
  { id: 'WT-1', title: 'مهمة قيد التنفيذ', status: 'in_progress', progress: 50 },
  { id: 'WT-2', title: 'مهمة مكتملة', status: 'completed', progress: 100, taskNumber: 'TN-2' },
];
seed(WT_KEY, JSON.stringify(seedTasks));
const storedTasks = () => readJson(WT_KEY) || [];
const toggleOn = S.toggleWorkOSTaskCompletion('WT-1');
const afterToggleOn = storedTasks().find((t) => t.id === 'WT-1');
const toggleOff = S.toggleWorkOSTaskCompletion('WT-1');
const afterToggleOff = storedTasks().find((t) => t.id === 'WT-1');
const missingToggle = S.toggleWorkOSTaskCompletion('لا-يوجد');
const byTaskNumber = S.completeWorkOSTask('TN-2');
const afterByNumber = storedTasks().find((t) => t.id === 'WT-2');
const runsKey = reading(S.dbStorage, 'workos_v1_automation_runs');
const serviceSrc = read('src/services/workos/WorkOSTaskService.ts');
check(
  'G24 · خدمة مهام مساحة العمل: تبديل الإنجاز (ثم عكسه) · مطابقة برقم المهمة · لا كتابة عند عدم المطابقة · بلا أحداث أتمتة',
  toggleOn &&
    afterToggleOn.status === 'completed' &&
    afterToggleOn.progress === 100 &&
    toggleOff &&
    afterToggleOff.status === 'in_progress' &&
    afterToggleOff.progress === 50 &&
    missingToggle === false &&
    byTaskNumber === true &&
    afterByNumber.status === 'completed' &&
    runsKey === null &&
    /saveTasksWithoutEvents/.test(serviceSrc) &&
    !/\bsaveTasks\(/.test(serviceSrc),
  `قلب=${afterToggleOn.status}/${afterToggleOn.progress} · عكس=${afterToggleOff.status}/${afterToggleOff.progress} · بالرقم=${afterByNumber.status} · أحداث=${runsKey === null ? 'لا شيء' : 'مكتوبة'}`
);

check('G13 · لا أخطاء JS أثناء التشغيل', errors.length === 0, errors[0] || '');

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة ترحيل المخططات والمستودعات (R40) ════════`);
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
