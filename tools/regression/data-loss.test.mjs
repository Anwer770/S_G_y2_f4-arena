#!/usr/bin/env node
/**
 * اختبار انحدار: منع فقدان البيانات عند الإقلاع البارد (R1)
 *
 * السيناريو المُثبت سابقاً:
 *   قاعدة تحتوي مجموعة كبيرة (> 500KB) ⇒ القراءة الأولى قبل اكتمال تهيئة IndexedDB
 *   تُعيد null ⇒ تُبنى الحالة من البيانات الافتراضية ⇒ أول حفظ يستبدل بيانات المستخدم.
 *
 * هذا الاختبار:
 *   1. يزرع مجموعة حقيقية كبيرة في IndexedDB (fake-indexeddb) قبل إقلاع التطبيق.
 *   2. يُقلع التطبيق فعلياً ويقرأ العدّاد الظاهر في الواجهة (شريط الوحدات الجانبي).
 *   3. ينفّذ حفظاً حقيقياً من الواجهة (قيد مالي).
 *   4. يتأكد أن IndexedDB ما زال يحتوي المجموعة الحقيقية + السجل الجديد (لا استبدال).
 *
 * التشغيل:  node tools/regression/data-loss.test.mjs
 *           APP_ROOT=/path/to/old-commit node tools/regression/data-loss.test.mjs   (يثبت كشف العطل)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const APP_ROOT = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : ROOT;
const DEPS_ROOT = process.env.DEPS_ROOT ? path.resolve(process.env.DEPS_ROOT) : ROOT;
const require = createRequire(path.join(DEPS_ROOT, 'package.json'));

const DB_NAME = 'PrimoERP_IndexedDB';
const STORE = 'keyval';
const FIN_KEY = 'suite_fin_transactions_v2';
const RECORDS = Number(process.env.SEED_RECORDS || 900);
const LONG_TEXT = 'بيان تفصيلي لاختبار سلامة البيانات بعد الإقلاع البارد مع نص طويل يحاكي قيوداً حقيقية مسجَّلة من المستخدم '.repeat(5);

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ---------------------------------------------------------------- bundle
const { e2b } = { e2b: null }; // (لا اعتماد على بيئة خارجية)
const esbuildBin = path.join(DEPS_ROOT, 'node_modules', '.bin', 'esbuild');
const bundlePath = path.join(ROOT, 'docs', 'تدقيق', '.data-loss-bundle.js');
console.log(`▸ تجزيء التطبيق من: ${APP_ROOT}`);
execFileSync(esbuildBin, [
  path.join(APP_ROOT, 'src', 'main.tsx'),
  '--bundle', '--format=iife', '--jsx=automatic',
  '--outfile=' + bundlePath,
  '--define:process.env.NODE_ENV="production"',
  '--loader:.css=empty', '--loader:.png=dataurl', '--loader:.svg=dataurl',
  '--log-level=error',
], { stdio: 'inherit' });
const code = fs.readFileSync(bundlePath, 'utf8');

// ---------------------------------------------------------------- deps
const { JSDOM, VirtualConsole } = require('jsdom');
const { indexedDB: fakeIDB, IDBKeyRange: fakeKeyRange } = require('fake-indexeddb');

const openDb = () => new Promise((res, rej) => {
  const r = fakeIDB.open(DB_NAME, 1);
  r.onupgradeneeded = () => {
    const db = r.result;
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
  };
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const put = (db, key, value) => new Promise((res) => {
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(value, key);
  tx.oncomplete = () => res(true);
});
const read = (db, key) => new Promise((res) => {
  const tx = db.transaction(STORE, 'readonly');
  const q = tx.objectStore(STORE).get(key);
  q.onsuccess = () => res(q.result ?? null);
});

// ---------------------------------------------------------------- 1) seed realistic dataset
const seedRecords = Array.from({ length: RECORDS }, (_, i) => ({
  id: `FIN-${1000 + i}`,
  subId: `FIN-${1000 + i}`,
  date: '2026-01-15',
  movement: i % 3 === 0 ? 'ايرادات' : 'مصروفات',
  restriction: i % 2 === 0 ? 'قبض' : 'صرف',
  category: 'مبيعات',
  account: 'الصندوق الرئيسي',
  statement: `قيد حقيقي رقم ${i} — ${LONG_TEXT}`,
  amountYER: 1000 + i,
  amountSAR: 0,
  amountUSD: 0,
  importance: 'عادي',
  createdAt: '2026-01-15T08:00:00.000Z',
}));
const serialized = JSON.stringify(seedRecords);
const sizeKB = Math.round(serialized.length / 1024);

const seedDb = await openDb();
await put(seedDb, FIN_KEY, serialized);
const seededBack = await read(seedDb, FIN_KEY);
seedDb.close();
check('زرع مجموعة اختبار في IndexedDB',
  JSON.parse(seededBack).length === RECORDS,
  `${RECORDS} سجلاً / ${sizeKB}KB (حد المرآة المحلية 500KB)`);
check('المجموعة تتجاوز حد المرآة المحلية (500KB) — شرط إثبات العطل',
  serialized.length > 500000,
  `${sizeKB}KB ${serialized.length > 500000 ? '>' : '≤'} 500KB`);

// ---------------------------------------------------------------- 2) boot the app
const errors = [];
const vc = new VirtualConsole();
vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 300)));
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + String(e?.message).slice(0, 300)));

const dom = new JSDOM(
  `<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>`,
  { url: 'https://data-loss.local/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc }
);
const w = dom.window;
const doc = w.document;

w.indexedDB = fakeIDB;
w.IDBKeyRange = fakeKeyRange;
w.matchMedia = (q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
w.scrollTo = () => {}; w.print = () => {}; w.alert = () => {}; w.confirm = () => true;
w.fetch = async () => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({}), text: async () => '', clone() { return this; } });
w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {};
const ctx2d = new Proxy({}, { get: (_t, k) => (k === 'measureText' ? () => ({ width: 10 }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : typeof k === 'string' ? () => {} : undefined), set: () => true });
w.HTMLCanvasElement.prototype.getContext = () => ctx2d;
w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
w.Notification = class { static permission = 'denied'; static requestPermission = async () => 'denied'; };
Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: async () => ({}), ready: Promise.resolve({ active: {} }), addEventListener() {}, controller: null }, configurable: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));

w.eval(code);
await sleep(3000);

// ---------------------------------------------------------------- 3) assert state built from real data
const loginBtn = [...doc.querySelectorAll('button')].find((b) => /تسجيل الدخول كـ|دخول سريع/.test(b.textContent || ''));
if (loginBtn) { click(loginBtn); await sleep(2500); }

const sidebarText = (doc.querySelector('aside') || doc.body).textContent.replace(/\s+/g, ' ');
const finBadge = (() => {
  const el = [...doc.querySelectorAll('aside button, aside a')].find((e) => /السجل اليومي|المالي/.test(e.textContent || ''));
  if (!el) return null;
  const digits = (el.textContent || '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
})();

check('الواجهة أقلعت بعد اكتمال الجاهزية',
  /اللوحة التحكم/.test(sidebarText), 'ظهرت قشرة التطبيق');
check(`العدّاد المالي في الواجهة يعرض المجموعة الحقيقية (${RECORDS}) وليس البيانات الافتراضية (5)`,
  finBadge === RECORDS,
  `قيمة العدّاد المقروءة من الواجهة: ${finBadge === null ? 'غير موجود' : finBadge}`);

let countBeforeSave = null;
{
  const db = await openDb();
  countBeforeSave = JSON.parse((await read(db, FIN_KEY)) || '[]').length;
  db.close();
}
check('بيانات IndexedDB سليمة قبل الحفظ', countBeforeSave === RECORDS, `${countBeforeSave} سجلاً`);

// ---------------------------------------------------------------- 4) real save through the UI
const finNav = [...doc.querySelectorAll('aside button, aside a')].find((e) => /السجل اليومي|المالي/.test(e.textContent || ''));
let saved = false;
if (finNav) {
  click(finNav);
  await sleep(1500);
  const addBtn = [...doc.querySelectorAll('button')].find((b) => /قيد جديد|إضافة|جديد/.test(b.textContent || ''));
  if (addBtn) {
    click(addBtn);
    await sleep(1500);
    const setVal = (el, v) => {
      const proto = el.tagName === 'SELECT' ? w.HTMLSelectElement.prototype
        : el.tagName === 'TEXTAREA' ? w.HTMLTextAreaElement.prototype
        : w.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new w.Event('input', { bubbles: true }));
      el.dispatchEvent(new w.Event('change', { bubbles: true }));
    };
    for (const inp of [...doc.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea')].filter((i) => !i.value).slice(0, 6)) {
      const t = (inp.type || 'text').toLowerCase();
      setVal(inp, t === 'date' ? '2026-02-01' : t === 'number' ? '500' : t === 'time' ? '10:00' : 'سجل اختبار سلامة البيانات');
    }
    for (const s of doc.querySelectorAll('select')) if (s.options.length > 1) setVal(s, s.options[1].value);
    const saveBtn = [...doc.querySelectorAll('button')].find((b) => /^حفظ|حفظ ال|إضافة السجل|تأكيد/.test((b.textContent || '').trim()));
    if (saveBtn) { click(saveBtn); await sleep(2500); saved = true; }
  }
}
check('نُفّذ حفظ حقيقي من الواجهة', saved);

const db = await openDb();
const afterRaw = await read(db, FIN_KEY);
db.close();
const countAfterSave = afterRaw ? JSON.parse(afterRaw).length : 0;

check('لم تُستبدل بيانات المستخدم بعد الحفظ (Before Count ≤ After Count)',
  countAfterSave >= RECORDS,
  `قبل: ${countBeforeSave} · بعد: ${countAfterSave}${countAfterSave < RECORDS ? '  ← فقدان بيانات!' : ''}`);
check('السجل الجديد أُضيف فعلاً',
  countAfterSave === RECORDS + (saved ? 1 : 0),
  `المتوقع ${RECORDS + (saved ? 1 : 0)} — الفعلي ${countAfterSave}`);

// ---------------------------------------------------------------- 5) summary
const failed = results.filter((r) => !r.ok);
console.log('\n════════ حصيلة اختبار سلامة البيانات ════════');
console.log(`نجح: ${results.length - failed.length} / ${results.length}`);
if (errors.length) console.log(`أخطاء JS مرصودة: ${errors.length} (${errors[0].slice(0, 90)}…)`);
if (failed.length) {
  console.log('✗ فشل الاختبار — سلوك فقدان البيانات ما زال قائماً');
  process.exitCode = 1;
} else {
  console.log('✔ نجح الاختبار — البيانات محفوظة بعد الإقلاع البارد');
}
fs.rmSync(bundlePath, { force: true });
process.exit(process.exitCode ?? 0);
