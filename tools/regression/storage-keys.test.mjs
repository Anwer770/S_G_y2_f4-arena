#!/usr/bin/env node
/**
 * بوابة مفاتيح التخزين (R24) — تفكيك storage.ts يجب ألا يغيّر مفتاحاً واحداً،
 * وألا تُضاف مفاتيح مكرّرة أو غير مستخدمة.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const results = [];
const check = (n, ok, d = '') => {
  results.push({ n, ok });
  console.log(`${ok ? '✔' : '✗'} ${n}${d ? ' — ' + d : ''}`);
};
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/** القائمة المرجعية المجمّدة — أي تغيير هنا يعني فقدان بيانات مستخدمين. */
const EXPECTED_KEYS = [
  'suite_stock_products_v2', 'suite_stock_records_v2', 'suite_stock_categories_v2',
  'suite_stock_statuses_v2', 'suite_stock_seq_v2',
  'suite_fin_transactions_v2', 'suite_fin_movements_v2', 'suite_fin_restrictions_v2',
  'suite_fin_movement_types_v2', 'suite_fin_importance_v2', 'suite_fin_category_accounts_v2',
  'suite_fin_restriction_accounts_v2', 'suite_fin_account_names_v2',
  'suite_custody_records_v1', 'suite_custody_categories_v1', 'suite_custody_responsibles_v1',
  'suite_custody_statuses_v1', 'suite_custody_priorities_v1', 'suite_custody_audit_v1',
  'suite_tasks_items_v2', 'suite_tasks_commitments_v2', 'suite_tasks_categories_v2',
  'suite_tasks_operations_v2', 'suite_tasks_assignees_v2', 'suite_tasks_audit_v2',
  'suite_customers_items_v2', 'suite_customers_visits_v2', 'suite_customers_sources_v2',
  'suite_customers_regions_v2', 'suite_customers_routes_v2', 'suite_customers_responsibles_v2',
  'suite_customers_audit_v2',
  'suite_doctors_items_v1', 'suite_doctors_visits_v1', 'suite_doctors_regions_v1',
  'suite_doctors_routes_v1', 'suite_doctors_responsibles_v1', 'suite_doctors_specialties_v1',
  'suite_doctors_audit_v1',
  'suite_debts_records_v1', 'suite_debts_commitments_v1', 'suite_debts_categories_v1',
  'suite_debts_owners_v1', 'suite_debts_audit_v1',
  'suite_knowledge_notes_v1', 'suite_knowledge_folders_v1', 'suite_knowledge_tags_v1',
  'suite_knowledge_templates_v1', 'suite_knowledge_audit_v1',
  'suite_routines_items_v1', 'suite_routines_occurrences_v1', 'suite_routines_executions_v1',
  'suite_routines_categories_v1', 'suite_routines_tags_v1', 'suite_routines_templates_v1',
  'suite_routines_exceptions_v1', 'suite_routines_audit_v1', 'suite_routines_settings_v1',
  'suite_links_records_v1', 'suite_links_classifications_v1', 'suite_links_categories_v1',
  'suite_links_types_v1', 'suite_links_importances_v1',
  'suite_unified_settings_v2', 'suite_app_settings_v1', 'suite_unified_audit_v2', 'suite_unified_autobackup_v2',
];

const keysSrc = read('src/utils/storage/keys.ts');
const actual = [...keysSrc.matchAll(/'((?:suite)_[a-z0-9_]+)'/g)].map((m) => m[1]);

check('K1 · لا مفتاح تخزين تغيّر أو حُذف بعد التفكيك', EXPECTED_KEYS.every((k) => actual.includes(k)) && actual.length >= EXPECTED_KEYS.length,
  EXPECTED_KEYS.filter((k) => !actual.includes(k)).join(' · '));
check('K2 · لا مفاتيح مكرّرة في السجل', new Set(actual).size === actual.length);
check('K3 · كل مفتاح معرّف ومستخدم عبر STORAGE_KEYS', (() => {
  const files = ['src/utils/storage.ts', ...fs.readdirSync(path.join(ROOT, 'src/utils/storage'))
    .filter((f) => f.endsWith('.ts') && f !== 'keys.ts')
    .map((f) => `src/utils/storage/${f}`)];
  const body = files.map(read).join('\n');
  const consts = [...keysSrc.matchAll(/^ {2}([A-Z_]+):/gm)].map((m) => m[1]);
  const unused = consts.filter((c) => !new RegExp(`STORAGE_KEYS\\.${c}\\b`).test(body));
  check.lastUnused = unused.join(' · ');
  return unused.length === 0;
})(), check.lastUnused);
check('K4 · لا تكرار لمفتاح خام ' + 'suite_stock_products_v2' + ' خارج keys.ts', (() => {
  const files = ['src/utils/storage.ts', 'src/utils/storage/stock.ts', 'src/utils/storage/financial.ts',
    'src/utils/storage/debts.ts', 'src/utils/storage/settings.ts'];
  return files.every((f) => !files.some((g) => g !== 'src/utils/storage/keys.ts' && read(g).includes("'suite_stock_products_v2'")));
})());
check('K5 · وحدات التفكيك موجودة ومستوردة من الواجهة القديمة', ['stock', 'financial', 'debts', 'settings', 'keys', 'tasks', 'customers', 'doctors', 'knowledge', 'routines', 'custody', 'links', 'system']
  .every((m) => fs.existsSync(path.join(ROOT, `src/utils/storage/${m}.ts`))) &&
  /export \* from '\.\/storage\/stock'/.test(read('src/utils/storage.ts')) &&
  /export \* from '\.\/storage\/financial'/.test(read('src/utils/storage.ts')));
check('K6 · storage.ts لم يعد يحوي تعريفات مفاتيح أو دوال مخزون مكرّرة', (() => {
  const s = read('src/utils/storage.ts');
  return !/const STORAGE_KEYS = \{/.test(s) && !/export function loadProducts\(/.test(s) &&
    !/export function loadFinancialTransactions\(/.test(s) && !/export function loadDebts\(/.test(s) &&
    !/export function loadCustomers\(/.test(s) && !/export function loadTasks\(/.test(s) &&
    !/export function loadNotes\(/.test(s) && !/export function loadRoutines\(/.test(s) &&
    !/export function loadCustodyIssues\(/.test(s) && !/export function loadLinksRecords\(/.test(s);
})());
check('K7 · حجم storage.ts انخفض بعد التفكيك الكامل', fs.statSync(path.join(ROOT, 'src/utils/storage.ts')).size < 30000,
  `${Math.round(fs.statSync(path.join(ROOT, 'src/utils/storage.ts')).size / 1024)}KB`);

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة حماية مفاتيح التخزين (storage-keys) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (passed < results.length) process.exit(1);
console.log('✔ نجح الاختبار');
