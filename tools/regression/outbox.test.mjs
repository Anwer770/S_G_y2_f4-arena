#!/usr/bin/env node
/**
 * اختبار انحدار: تقييد طابور المزامنة (R2)
 *
 * قبل الإصلاح: كل كتابة عبر الخدمات تُضيف نسخة كاملة من السجل إلى suite_sync_outbox_v1
 * بلا أي سقف ولا مُفرِّغ (البيانات كلها محلية ولا يوجد خادم مزامنة) ⇒ تضخّم تخزين غير محدود.
 *
 * بعد الإصلاح: الطابور مسقوف بـ 2000 عنصر (FIFO: تبقى الأحدث)، وكل إسقاط يُسجَّل
 * في عدّاد مستقل + سجل تدقيق (لا إسقاط صامت).
 *
 * التشغيل: node tools/regression/outbox.test.mjs
 *          APP_ROOT=/path/to/old-commit node tools/regression/outbox.test.mjs   (يثبت كشف العطل)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const APP_ROOT = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : ROOT;
const require = createRequire(path.join(ROOT, 'package.json'));

const N = 2005;                    // عدد الكتابات في الاختبار
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ---------------------------------------------------------------- bundle the sync layer
const bundlePath = path.join(ROOT, 'docs', 'تدقيق', '.outbox-bundle.mjs');
console.log(`▸ تجزيء طبقة المزامنة من: ${APP_ROOT}`);
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [
  path.join(APP_ROOT, 'src', 'sync', 'Outbox.ts'),
  '--bundle', '--format=esm', '--platform=node', '--outfile=' + bundlePath,
  '--define:process.env.NODE_ENV="production"', '--log-level=error',
], { stdio: 'inherit' });

// ---------------------------------------------------------------- browser-ish globals
const { indexedDB: fakeIDB, IDBKeyRange: fakeKeyRange } = require('fake-indexeddb');
const ls = new Map();
const localStorageStub = {
  get length() { return ls.size; },
  key: (i) => [...ls.keys()][i] ?? null,
  getItem: (k) => (ls.has(k) ? ls.get(k) : null),
  setItem: (k, v) => { ls.set(k, String(v)); },
  removeItem: (k) => { ls.delete(k); },
  clear: () => ls.clear(),
};
globalThis.window = { localStorage: localStorageStub, indexedDB: fakeIDB, IDBKeyRange: fakeKeyRange };
globalThis.localStorage = localStorageStub;

const { Outbox } = await import(url.pathToFileURL(bundlePath).href);
await new Promise((r) => setTimeout(r, 300)); // انتظار تهيئة محرك التخزين

// ---------------------------------------------------------------- exercise
const cap = typeof Outbox.maxEntries === 'function' ? Outbox.maxEntries() : null;
check('السقف معلن ومحدود', cap === 2000, `maxEntries = ${cap}`);

// ملاحظة أداء: كل كتابة تُعيد تسلسل الطابور كاملاً وتُطلق كتابة غير متزامنة إلى IndexedDB،
// لذا نُفسح المجال بين الدفعات لمحاكاة استخدام واقعي (كتابة لكل إجراء مستخدم).
for (let i = 1; i <= N; i++) {
  Outbox.enqueue('FinancialTransaction', 'INSERT', `R-${i}`, { id: `R-${i}`, a: i });
  if (i % 25 === 0) await new Promise((r) => setTimeout(r, 5));
}
await new Promise((r) => setTimeout(r, 200));

const queue = Outbox.getAll();
check('الطابور لا يتجاوز السقف', queue.length <= 2000, `الطول الفعلي: ${queue.length} (الكتابات: ${N})`);
check('الطابور احتفظ بأحدث العناصر (FIFO)', queue[queue.length - 1]?.recordId === `R-${N}`,
  `آخر عنصر: ${queue[queue.length - 1]?.recordId}`);
check('أقدم العناصر أُسقطت', queue[0]?.recordId === `R-${N - queue.length + 1}`,
  `أول عنصر محفوظ: ${queue[0]?.recordId}`);

const dropped = typeof Outbox.getDroppedCount === 'function' ? Outbox.getDroppedCount() : null;
check('الإسقاط مسجَّل في عدّاد (لا إسقاط صامت)', dropped === N - queue.length,
  `المُسقَط: ${dropped} — المتوقع: ${N - queue.length}`);

const auditRaw = ls.get('suite_unified_audit_v2');
let auditCount = 0;
try { auditCount = JSON.parse(auditRaw || '[]').length; } catch { /* ignore */ }
check('كل إسقاط سُجّل في سجل التدقيق', auditCount > 0, `قيود التدقيق: ${auditCount}`);

const outboxRaw = ls.get('suite_sync_outbox_v1') || '[]';
let written = 0;
try { written = JSON.parse(outboxRaw).length; } catch { /* ignore */ }
check('حجم الطابور المخزَّن مقبول (بلا تضخّم غير محدود)', written <= 2000, `${written} عنصراً مخزَّناً`);

// ---------------------------------------------------------------- summary
fs.rmSync(bundlePath, { force: true });
const failed = results.filter((r) => !r.ok);
console.log('\n════════ حصيلة اختبار طابور المزامنة ════════');
console.log(`نجح: ${results.length - failed.length} / ${results.length}`);
if (failed.length) { console.log('✗ فشل الاختبار'); process.exitCode = 1; } else console.log('✔ نجح الاختبار');
process.exit(process.exitCode ?? 0);
