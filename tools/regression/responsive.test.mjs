#!/usr/bin/env node
/**
 * اختبار انحدار: استجابة الجداول (Phase 4 · البند: 35 جدولاً)
 *
 * يتحقّق — على الجداول التي تُصيَّر فعلاً في DOM — من ثلاثة شروط:
 *   1) كل جدول له سلف يحمل حاوية تمرير أفقية (`overflow-x-auto`) ⇒ لا فيضان للصفحة على الجوال.
 *   2) كل جدول يحمل عرضاً أدنى (`min-w-[...]`) ⇒ لا سحق للأعمدة على الشاشات الضيقة.
 *   3) كل جدول يحمل `print:min-w-0` ⇒ الطباعة تبقى كما هي (لا يُقصّ الجدول على الورق).
 *
 * التشغيل: node tools/regression/responsive.test.mjs
 *          RESP_EXPECT=0 APP_ROOT=/tmp/pre-tables node tools/regression/responsive.test.mjs   (قياس فقط)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const APP_ROOT = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : ROOT;
const EXPECT = process.env.RESP_EXPECT !== '0';
const TAG = process.env.RESP_TAG || (EXPECT ? 'after' : 'before');
const require = createRequire(path.join(ROOT, 'package.json'));

const SETTINGS_KEY = 'qeema_accounting_system_settings_v1';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

const bundlePath = path.join(ROOT, 'docs', 'تدقيق', '.resp-bundle.js');
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [
  path.join(APP_ROOT, 'src', 'main.tsx'),
  '--bundle', '--format=iife', '--jsx=automatic', '--outfile=' + bundlePath,
  '--define:process.env.NODE_ENV="production"',
  '--loader:.css=empty', '--loader:.png=dataurl', '--loader:.svg=dataurl', '--log-level=error',
], { stdio: 'inherit' });
const code = fs.readFileSync(bundlePath, 'utf8');
const { JSDOM, VirtualConsole } = require('jsdom');

const settingsJson = JSON.stringify({
  users: [{ id: 'usr-1', name: 'مدير النظام', email: 'admin@system.local', role: 'admin', status: 'active', avatarInitial: 'م', lastLogin: 'الآن', createdAt: '2025-01-10' }],
  general: { currentUserName: 'مدير النظام', currentUserTitle: 'مدير عام المنظومة والعمليات' },
});

async function boot() {
  const errors = [];
  const navErrors = [];
  const pushErr = (msg) => {
    // «Not implemented: navigation» قيد في jsdom لا عطل في التطبيق — يُفصل ولا يُفشل الاختبار
    if (/Not implemented: navigation/i.test(msg)) navErrors.push(msg);
    else errors.push(msg);
  };
  const vc = new VirtualConsole();
  vc.on('error', (...a) => pushErr(a.map(String).join(' ').slice(0, 200)));
  vc.on('jsdomError', (e) => pushErr('jsdomError: ' + String(e?.message).slice(0, 200)));
  const dom = new JSDOM(`<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>`,
    { url: 'https://resp.local/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window, doc = w.document;
  w.localStorage.setItem(SETTINGS_KEY, settingsJson);
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
  w.eval(code);
  await new Promise((r) => setTimeout(r, 2500));
  return { w, doc, errors, navErrors, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) };
}

const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
const waitFor = async (fn, timeoutMs = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { try { if (fn()) return true; } catch {} await new Promise((r) => setTimeout(r, 150)); }
  return false;
};

/** يفحص كل جدول في جذر معيّن ويعيد تقريراً */
function inspectTables(root, where) {
  const rows = [];
  for (const table of root.querySelectorAll('table')) {
    const cls = table.getAttribute('class') || '';
    let hasScroll = false, node = table.parentElement, depth = 0;
    while (node && depth < 20) {
      if (/overflow-x-auto/.test(node.getAttribute('class') || '')) { hasScroll = true; break; }
      node = node.parentElement; depth++;
    }
    const minw = (cls.match(/min-w-\[(\d+)px\]/) || [])[1] || null;
    const printOk = /print:min-w-0/.test(cls);
    const cols = table.querySelectorAll('thead th, thead td').length || table.querySelectorAll('tr:first-child th, tr:first-child td').length;
    rows.push({ where, cols, minw, printOk, hasScroll });
  }
  return rows;
}

const { w, doc, errors, navErrors, sleep } = await boot();
const quickBtn = () => [...doc.querySelectorAll('button')].find((b) => /دخول سريع/.test(b.textContent || ''));
await waitFor(() => !!quickBtn());
const qb = quickBtn();
if (qb) click(w, qb);
const loggedIn = await waitFor(() => /اللوحة التحكم|لوحة التحكم/.test(doc.body.textContent || ''));
check('R1 · التطبيق أقلع وسُجّل الدخول', loggedIn);

const navSel = 'aside button, aside a, nav button, nav a';
const label = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
const labels = [...new Set([...doc.querySelectorAll(navSel)].map(label).filter(Boolean))];
let all = [];
console.log(`▸ وحدات في القائمة الجانبية: ${labels.length}`);

/** يجرّب فتح نوافذ (إضافة/تفاصيل/كشف/طباعة) ويفحص كل جدول داخل أي نافذة تظهر */
async function probeDialogs(w, doc, root, where, sleep) {
  const pick = (re, limit) => [...root.querySelectorAll('button, [role="button"]')]
    .filter((b) => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      const meta = (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || '');
      if (/حذف|مسح|إعادة ضبط|خروج|تسجيل الخروج/.test(t)) return false;
      // لا نلمس أزرار التنقّل/الهيدر (طيّ القائمة، تبديل الوحدات) — تُفسد مسار الفحص
      if (b.closest('aside, nav, header, [role="banner"], [role="navigation"]')) return false;
      if (!t && !meta.trim()) return false;   // أزرار أيقونية بلا وصف
      return re.pattern ? re.pattern.test(t) || re.pattern.test(meta) : false;
    }).slice(0, limit);
  const attempts = [
    ...pick({ pattern: /إضافة|اضافة|جديد|جديدة|تسجيل |كشف|تفاصيل|عرض|تقرير|محضر|بيان|أرشيف|نسخ|استيراد/, test: () => false }, 3),
    ...pick({ pattern: /كشف|تفاصيل|عرض|تقرير|بيان|أرشيف|نسخ|استيراد/, test: () => false }, 3),
  ];
  // صفوف الجدول: غالباً تفتح نافذة التفاصيل/الكشف
  const rows = [...root.querySelectorAll('tbody tr')].slice(0, 2)
    .filter((r) => r.querySelector('td'));
  const extras = rows.map((r) => ({ node: r, label: 'صف جدول' }))
    .concat(attempts.map((b) => ({ node: b, label: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30) })));

  for (const { node: b, label: bText } of extras) {
    if (doc.querySelectorAll('aside button, aside a').length === 0) break;   // القائمة اختفت: توقّف
    click(w, b);
    await sleep(800);
    if (process.env.RESP_DEBUG) console.log(`     · نقر «${bText}» ⇒ aside=${doc.querySelectorAll('aside button, aside a').length} dialog=${!!doc.querySelector('[role="dialog"]')}`);
    const dlg = doc.querySelector('[role="dialog"], [aria-modal="true"], .fixed.inset-0');
    if (!dlg) continue;
    const found = inspectTables(dlg, where + ' › نافذة');
    if (found.length) all = all.concat(found);
    const cancel = [...dlg.querySelectorAll('button')].find((x) => /إلغاء|إغلاق|رجوع|تراجع|تم/.test(x.textContent || ''));
    if (cancel) click(w, cancel);
    else doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(500);
  }
}

console.log('DEBUG nav count:', doc.querySelectorAll(navSel).length);
for (const lb of labels) {
  if (!globalThis.__dbg) { globalThis.__dbg = 1;
    console.log('DEBUG same doc?', doc === w.document, '| all elements:', doc.querySelectorAll('*').length,
      '| aside:', doc.querySelectorAll('aside').length, '| body childs:', doc.body.children.length,
      '| html len:', doc.documentElement.outerHTML.length);
  }
  if (!globalThis.__dbg2) { globalThis.__dbg2 = 1;
    console.log('DEBUG selector split:', JSON.stringify(navSel),
      '| navSel:', doc.querySelectorAll(navSel).length,
      '| aside button:', doc.querySelectorAll('aside button').length,
      '| aside a:', doc.querySelectorAll('aside a').length,
      '| nav button:', doc.querySelectorAll('nav button').length,
      '| labels[0]:', JSON.stringify(labels[0]));
  }
  const cands0 = [...doc.querySelectorAll(navSel)];
  const el = cands0.find((e) => label(e) === lb);
  if (!el) { console.log('DEBUG miss:', JSON.stringify(lb), 'first:', JSON.stringify(cands0.slice(0,2).map(label))); continue; }
  click(w, el);
  await sleep(1300);
  let root = doc.getElementById('root');
  all = all.concat(inspectTables(root, lb));

  // تبويبات فرعية داخل الوحدة (إعدادات، تقارير، ...)
  const subSel = '[role="tab"], [role="tablist"] button';
  const subs = [...new Set([...root.querySelectorAll(subSel)].map(label).filter(Boolean))].slice(0, 8);
  for (const sub of subs) {
    const sb = [...root.querySelectorAll(subSel)].find((e) => label(e) === sub);
    if (!sb) continue;
    click(w, sb);
    await sleep(900);
    root = doc.getElementById('root');
    all = all.concat(inspectTables(root, lb + ' › ' + sub));
    await probeDialogs(w, doc, root, lb + ' › ' + sub, sleep);
  }
  await probeDialogs(w, doc, root, lb, sleep);
}

const uniq = new Map();
for (const t of all) {
  const k = `${t.where}|${t.cols}|${t.minw}|${t.hasScroll}|${t.printOk}`;
  uniq.set(k, t);
}
const tables = [...uniq.values()];
const noScroll = tables.filter((t) => !t.hasScroll);
const noMin = tables.filter((t) => !t.minw);
const noPrint = tables.filter((t) => !t.printOk);

console.log(`\n── الجداول المُصيَّرة فعلاً (${tables.length}) ──`);
console.log(`   الشاشة                                  أعمدة   min-w   تمرير  طباعة`);
for (const t of tables.sort((a, b) => b.cols - a.cols)) {
  console.log(`   ${t.where.padEnd(36).slice(0, 36)}${String(t.cols).padStart(5)}${(t.minw ? t.minw + 'px' : '—').padStart(9)}`
    + `${(t.hasScroll ? '✔' : '✖').padStart(7)}${(t.printOk ? '✔' : '✖').padStart(7)}`);
}
console.log(`   الإجمالي: ${tables.length} جدولاً · بلا حاوية تمرير: ${noScroll.length} · بلا عرض أدنى: ${noMin.length} · بلا تصفير طباعة: ${noPrint.length}`);

const report = { tag: TAG, tables, errors, navErrors, counts: { total: tables.length, noScroll: noScroll.length, noMin: noMin.length, noPrint: noPrint.length } };
fs.writeFileSync(path.join(ROOT, 'docs', 'تدقيق', `responsive-runtime-${TAG}.json`), JSON.stringify(report, null, 1), 'utf8');

if (EXPECT) {
  check('R2a · عُثر على جداول فعلية للفحص (لا نجاح فارغ)', tables.length >= 6, `${tables.length} جدولاً مُصيَّراً`);
  check('R2 · كل جدول مُصيَّر داخل حاوية تمرير أفقية', noScroll.length === 0,
    noScroll.length ? noScroll.slice(0, 3).map((t) => `${t.where} (${t.cols} أعمدة)`).join(' · ') : `${tables.length} جدولاً`);
  check('R3 · كل جدول له عرض أدنى يمنع سحق الأعمدة', noMin.length === 0,
    noMin.length ? noMin.slice(0, 3).map((t) => t.where).join(' · ') : '');
  check('R4 · كل جدول عليه print:min-w-0 (الطباعة بلا تغيير)', noPrint.length === 0,
    noPrint.length ? noPrint.slice(0, 3).map((t) => t.where).join(' · ') : '');
  check('R5 · الجداول العريضة (≥8 أعمدة) كلها بعرض أدنى ≥ 820px',
    tables.filter((t) => t.cols >= 8).every((t) => Number(t.minw) >= 820),
    `أكثر الجداول عموماً: ${Math.max(...tables.map((t) => t.cols), 0)} أعمدة`);
  check('R6 · لا أخطاء JS في التطبيق', errors.length === 0, errors[0] || '');
  if (navErrors.length) console.log(`   ℹ ${navErrors.length} خطأ تنقّل خاص بـjsdom (قيد أداة القياس، مُعزول)`);
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة اختبار استجابة الجداول (${TAG}) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (!EXPECT) { console.log('(وضع قياس فقط)'); process.exit(0); }
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
