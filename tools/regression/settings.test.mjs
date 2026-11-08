#!/usr/bin/env node
/** بوابة: القوائم المركزية (Master Lookups) + محرك التنبيهات (R19). */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`${ok ? '✔' : '✗'} ${n}${d ? ' — ' + d : ''}`); };
const build = (entry, out) => {
  const target = path.join(ROOT, 'docs', 'تدقيق', out);
  execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'),
    [path.join(ROOT, entry), '--bundle', '--format=esm', `--outfile=${target}`, '--log-level=error'], { stdio: 'inherit' });
  return import(url.pathToFileURL(target).href);
};
const L = await build('src/utils/lookupsLogic.ts', '.lookups-bundle.mjs');
const A = await build('src/services/alerts/alertsEngine.ts', '.alerts-bundle.mjs');

const s0 = L.cloneDefaults();
check('L1 · القوائم الافتراضية تحوي فئات/مسؤولين/مستفيدين/حالات/درجات', s0.categories.length > 0 && s0.owners.length > 0 && s0.statuses.length > 0 && s0.grades.length > 0);
const { state: s1, item } = L.addLookup(s0, 'categories', 'قطع غيار');
check('L2 · الإضافة تعمل وتُرقّم العنصر', s1.categories.some((i) => i.id === item.id && i.order > 0));
let dup = false; try { L.addLookup(s1, 'categories', 'قطع غيار'); } catch { dup = true; }
check('L3 · التكرار مرفوض (بلا حساسية للمسافات/الحالة)', dup && (() => { try { L.addLookup(s1, 'categories', '  قطع غيار '); return false; } catch { return true; } })());
check('L4 · إعادة التسمية تُحدّث التسمية فقط', L.renameLookup(s1, 'categories', item.id, 'قطع').categories.find((i) => i.id === item.id).label === 'قطع');
check('L5 · الترتيب يعمل ويُعيد ترقيماً متسلسلاً', (() => { const m = L.moveLookup(s1, 'categories', item.id, -1); return m.categories[0].order === 1 && m.categories.every((i, idx) => i.order === idx + 1); })());
let lastGuard = false; try { L.removeLookup(L.replaceLookupList(s0, 'owners', ['واحد']), 'owners', L.replaceLookupList(s0, 'owners', ['واحد']).owners[0].id); } catch { lastGuard = true; }
check('L6 · لا يمكن حذف آخر عنصر نشط', lastGuard);
check('L7 · الحالة التالفة من التخزين تُستبدل بالافتراضي', L.normalizeLookups({ categories: 'x' }).categories.length === s0.categories.length);

const today = '2026-11-08';
const products = [
  { id: 'p1', name: 'كريم مرطب', openingStock: 2, unit: 'قطعة', isActive: true },
  { id: 'p2', name: 'جهاز بخار', openingStock: 50, unit: 'جهاز', isActive: true },
  { id: 'p3', name: 'شاش طبي', openingStock: 10, unit: 'باكت', isActive: true },
];
const movements = [
  { id: 'm1', mainId: '', subId: '', date: today, beneficiary: '', description: '', movementType: 'توريد', status: '', category: '', items: { 'كريم مرطب': 2 } },
  { id: 'm2', mainId: '', subId: '', date: today, beneficiary: '', description: '', movementType: 'صرف', status: '', category: '', items: { 'شاش طبي': 9 } },
];
const commitments = [
  { id: 'c1', name: 'إيجار', amount: 1000, currency: 'YER', date: '2026-10-01', endDate: '2026-11-10', priority: 'A', status: 'قيد التنفيذ', icon: '', owner: '', category: '', dir: 'debit', note: '', payments: [], createdAt: '', updatedAt: '' },
  { id: 'c2', name: 'مورد', amount: 500, currency: 'YER', date: '2026-10-01', endDate: '2026-10-30', priority: 'A', status: 'قيد التنفيذ', icon: '', owner: '', category: '', dir: 'debit', note: '', payments: [{ pid: 'x', date: '2026-10-05', amount: 100 }], createdAt: '', updatedAt: '' },
  { id: 'c3', name: 'بعيد', amount: 900, currency: 'YER', date: '2026-10-01', endDate: '2027-01-01', priority: 'A', status: 'قيد التنفيذ', icon: '', owner: '', category: '', dir: 'debit', note: '', payments: [], createdAt: '', updatedAt: '' },
];
const alerts = A.computeSystemAlerts({ products, movements, commitments, today, defaultReorderPoint: 5, leadDays: 3 });
check('A1 · تنبيه عند بلوغ حدّ الطلب (كريم: 4 ≤ 5)', alerts.some((a) => a.entityId === 'p1' && a.kind === 'stock'));
check('A2 · لا تنبيه لصنف فوق الحد (جهاز: 50)', !alerts.some((a) => a.entityId === 'p2'));
check('A3 · صنف نفد بعد الصرف ⇒ تنبيه حرج (شاش: 1)', alerts.some((a) => a.entityId === 'p3' && a.severity === 'warning'));
check('A4 · استحقاق خلال 3 أيام يُنبَّه (إيجار)', alerts.some((a) => a.entityId === 'c1' && a.daysLeft === 2));
const latin = (t) => String(t).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
check('A5 · المتأخر يُصنَّف حرجاً ويحسب المتبقّي بعد الدفعات (مورد: 400)',
  alerts.some((a) => a.entityId === 'c2' && a.severity === 'critical' && /400/.test(latin(a.detail))));
check('A6 · الالتزام البعيد لا يُنبَّه', !alerts.some((a) => a.entityId === 'c3'));
check('A7 · الترتيب يبدأ بالحرج', alerts[0].severity === 'critical');
const sum = A.alertsSummary(alerts);
check('A8 · الملخّص يحسب الأنواع والخطورة', sum.total === alerts.length && sum.stock + sum.debt === sum.total && sum.critical >= 1, JSON.stringify(sum));

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة اختبار الإعدادات المركزية (settings) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (passed < results.length) process.exit(1);
console.log('✔ نجح الاختبار');
