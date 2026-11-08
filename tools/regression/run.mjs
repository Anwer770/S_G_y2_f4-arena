#!/usr/bin/env node
/**
 * شبكة أمان الانحدار (Regression Harness) — Phase 2
 * تُشغّل التطبيق فعلياً في DOM وهمي، تزور كل الوحدات، تنفّذ CRUD،
 * وتقارن عدّادات التخزين قبل/بعد. تُستخدم قبل وبعد أي تعديل.
 *
 *   node tools/regression/run.mjs            # تشغيل + مقارنة بـ baseline إن وُجد
 *   node tools/regression/run.mjs --save     # حفظ النتيجة كخط أساس
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT_DIR = path.join(ROOT, 'docs', 'تدقيق');
const BASELINE = path.join(OUT_DIR, 'baseline.json');
const BUNDLE = path.join(OUT_DIR, '.regression-bundle.js');
const SAVE = process.argv.includes('--save');

function log(...a) { console.log(...a); }

// ---------------------------------------------------------------- 1) bundle app
log('▸ تجزيء التطبيق (esbuild)…');
execFileSync(
  path.join(ROOT, 'node_modules', '.bin', 'esbuild'),
  ['src/main.tsx', '--bundle', '--format=iife', '--jsx=automatic',
   '--outfile=' + BUNDLE,
   '--define:process.env.NODE_ENV="production"',
   '--loader:.css=empty', '--loader:.png=dataurl', '--loader:.svg=dataurl',
   '--log-level=error'],
  { cwd: ROOT, stdio: 'inherit' }
);
const code = fs.readFileSync(BUNDLE, 'utf8');

// ---------------------------------------------------------------- 2) jsdom env
const { JSDOM, VirtualConsole } = await import('jsdom');

const errors = [];
const warnings = [];
const vc = new VirtualConsole();
vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 400)));
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + String(e?.message).slice(0, 400)));
vc.on('warn', (...a) => warnings.push(a.map(String).join(' ').slice(0, 200)));

const dom = new JSDOM(
  `<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>`,
  { url: 'https://regression.local/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc }
);
const w = dom.window;
const doc = w.document;

w.matchMedia = (q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
w.scrollTo = () => {}; w.print = () => {}; w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
w.fetch = async () => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({}), text: async () => '', clone() { return this; } });
w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {};
const ctx2d = new Proxy({}, { get: (_t, k) => (k === 'measureText' ? () => ({ width: 10 }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : typeof k === 'string' ? () => {} : undefined), set: () => true });
w.HTMLCanvasElement.prototype.getContext = () => ctx2d;
w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
w.Notification = class { static permission = 'denied'; static requestPermission = async () => 'denied'; };
Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: async () => ({}), ready: Promise.resolve({ active: {} }), addEventListener() {}, controller: null }, configurable: true });
w.addEventListener('unhandledrejection', (e) => errors.push('unhandledrejection: ' + String(e.reason).slice(0, 400)));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
const byText = (re, scope = doc) => [...scope.querySelectorAll('button, a')].find((b) => re.test((b.textContent || '').replace(/\s+/g, ' ')));

function storageSnapshot() {
  const snap = {};
  try {
    for (let i = 0; i < w.localStorage.length; i++) {
      const k = w.localStorage.key(i);
      const raw = w.localStorage.getItem(k) || '';
      let count = null;
      try { const p = JSON.parse(raw); if (Array.isArray(p)) count = p.length; } catch {}
      snap[k] = { bytes: raw.length, records: count };
    }
  } catch {}
  return snap;
}

// ---------------------------------------------------------------- 3) run
const report = { startedAt: new Date().toISOString(), steps: [], tabs: {}, storage: {}, errors: [], warnings: [] };

w.eval(code);
await sleep(2000);
report.steps.push({ step: 'boot', rootLen: doc.getElementById('root').innerHTML.length, loggedOut: /تسجيل الدخول/.test(doc.body.textContent) });

const loginBtn = byText(/تسجيل الدخول كـ|دخول سريع/) || [...doc.querySelectorAll('button')].pop();
if (loginBtn) { click(loginBtn); await sleep(2500); }
report.steps.push({ step: 'login', sawShell: /اللوحة التحكم/.test(doc.body.textContent) });

report.storage.before = storageSnapshot();

// visit every sidebar module
const navLabels = [...new Set([...doc.querySelectorAll('aside button, aside a, nav button, nav a')]
  .map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim())
  .filter((t) => t.length > 1))];

for (const label of navLabels) {
  const el = [...doc.querySelectorAll('aside button, aside a, nav button, nav a')]
    .find((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().startsWith(label));
  if (!el) continue;
  const before = errors.length;
  click(el);
  await sleep(900);
  report.tabs[label] = { newErrors: errors.length - before, domLen: doc.getElementById('root').innerHTML.length };
}
report.steps.push({ step: 'tabs', visited: Object.keys(report.tabs).length });

// CRUD exercise: add one financial record through the UI (no schema assumptions)
// ملاحظة: التطبيق Keep-Alive (كل التبويبات في DOM) ويحتوي أزرار «حفظ» مخفية —
// لذا يجب حصر التفاعل في العناصر الظاهرة وداخل نافذة الإدخال فقط.
const isVisible = (el) => {
  let n = el;
  while (n && n.nodeType === 1) {
    if (n.getAttribute && n.getAttribute('aria-hidden') === 'true') return false;
    const st = (n.getAttribute && n.getAttribute('style')) || '';
    if (/display:\s*none/i.test(st)) return false;
    if (n.hasAttribute && n.hasAttribute('hidden')) return false;
    n = n.parentElement;
  }
  return true;
};
const textOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
const setVal = (el, v) => {
  try {
    const proto = el.tagName === 'SELECT' ? w.HTMLSelectElement.prototype
      : el.tagName === 'TEXTAREA' ? w.HTMLTextAreaElement.prototype
      : w.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (!descriptor || !descriptor.set) return false;
    descriptor.set.call(el, v);
    el.dispatchEvent(new w.Event('input', { bubbles: true }));
    el.dispatchEvent(new w.Event('change', { bubbles: true }));
    return true;
  } catch {
    return false;
  }
};

const finNav = [...doc.querySelectorAll('aside button, aside a')].find((e) => /السجل اليومي|المالي/.test(e.textContent || ''));
if (finNav) {
  click(finNav); await sleep(1200);
  const addBtn = [...doc.querySelectorAll('button')].filter(isVisible).find((b) => /قيد جديد/.test(textOf(b)));
  if (addBtn) {
    click(addBtn); await sleep(1200);

    const overlays = [...doc.querySelectorAll('div[class*="z-50"]')]
      .filter(isVisible)
      .filter((o) => o.querySelectorAll('select').length >= 2);
    const scope = overlays.length ? overlays[overlays.length - 1] : doc;

    const inputs = [...scope.querySelectorAll(
      'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=submit]):not([type=button]), textarea'
    )].filter((i) => !i.value);

    let filled = 0;
    for (const inp of inputs) {
      const t = (inp.type || 'text').toLowerCase();
      const ok = setVal(inp, t === 'date' ? '2026-01-15' : t === 'number' ? '100' : t === 'time' ? '09:00' : 'اختبار انحدار');
      if (ok) filled++;
    }
    for (const sel of scope.querySelectorAll('select')) {
      const real = [...sel.options].find((o) => o.value && o.value.trim() !== '');
      if (real) setVal(sel, real.value);
    }

    const save = [...scope.querySelectorAll('button')]
      .filter(isVisible)
      .find((b) => /^(حفظ|حفظ فوري|حفظ القيد|حفظ التعديلات|تسجيل القيد في السجل|تأكيد|إضافة السجل)$/.test(textOf(b)));
    const saved = Boolean(save) && !save.disabled;
    if (saved) { click(save); await sleep(1500); }
    report.steps.push({ step: 'crud-create', filledInputs: filled, saved });
  }
}

report.storage.after = storageSnapshot();
report.errors = errors;
report.warnings = warnings.slice(0, 10);
report.finishedAt = new Date().toISOString();

// ---------------------------------------------------------------- 4) compare
const diffs = [];
const keys = new Set([...Object.keys(report.storage.before || {}), ...Object.keys(report.storage.after || {})]);
for (const k of keys) {
  const b = report.storage.before?.[k], a = report.storage.after?.[k];
  if (!b) { diffs.push(`+ مفتاح جديد: ${k} (${a?.records ?? '-'} سجلاً)`); continue; }
  if (!a) { diffs.push(`- مفتاح اختفى: ${k}`); continue; }
  if (b.records !== a.records) diffs.push(`~ ${k}: ${b.records} → ${a.records}`);
}
report.diffVsSelf = diffs;

let regression = [];
if (!SAVE && fs.existsSync(BASELINE)) {
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  // هوية التبويب لا تشمل أرقام العدّادات (الشارة) — وإلا فكل تغيّر مشروع في عدّاد
  // يُقرأ كانحدار كاذب (حدث فعلاً عند إصلاح عدّاد «إدارة العمل» المضاعف).
  const tabId = (t) => String(t).replace(/[\u0660-\u0669\d]+/g, '').replace(/\s+/g, ' ').trim();
  const baseTabsRaw = Object.keys(base.tabs || {}), nowTabsRaw = Object.keys(report.tabs || {});
  const baseTabs = [...new Set(baseTabsRaw.map(tabId))];
  const nowTabs = [...new Set(nowTabsRaw.map(tabId))];
  const missingTabs = baseTabs.filter((t) => !nowTabs.includes(t));
  const newTabErrors = nowTabsRaw.filter((t) => (report.tabs[t].newErrors || 0) > 0);
  if (missingTabs.length) regression.push(`تبويبات اختفت: ${missingTabs.join(', ')}`);
  if (newTabErrors.length) regression.push(`أخطاء JS في تبويبات: ${newTabErrors.join(', ')}`);
  const baseKeys = Object.keys(base.storage?.before || {});
  const lostKeys = baseKeys.filter((k) => !(k in (report.storage.before || {})));
  if (lostKeys.length) regression.push(`مفاتيح تخزين اختفت: ${lostKeys.join(', ')}`);
  if (report.errors.length > (base.errors?.length || 0)) regression.push(`أخطاء JS: ${base.errors?.length || 0} → ${report.errors.length}`);
}
report.regression = regression;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, SAVE ? 'baseline.json' : 'last-run.json'), JSON.stringify(report, null, 1));
fs.rmSync(BUNDLE, { force: true });

// ---------------------------------------------------------------- 5) print summary
log('');
log('════════ تقرير الانحدار ════════');
log(`التبويبات المزارة        : ${Object.keys(report.tabs).length}`);
log(`أخطاء JS                : ${report.errors.length}`);
Object.entries(report.tabs).forEach(([t, v]) => { if (v.newErrors) log(`   ✗ ${t}: ${v.newErrors} خطأ`); });
log(`مفاتيح التخزين (قبل)     : ${Object.keys(report.storage.before || {}).length}`);
log(`تغيّرات خلال التشغيل     : ${diffs.length ? '\n   ' + diffs.join('\n   ') : 'لا شيء'}`);
if (SAVE) log('✔ حُفظت النتيجة كخط أساس: docs/تدقيق/baseline.json');
else if (regression.length) { log('✗ انحدار محتمل:'); regression.forEach((r) => log('   ' + r)); process.exitCode = 1; }
else log(fs.existsSync(BASELINE) ? '✔ لا انحدار مقابل خط الأساس' : 'ℹ لا يوجد خط أساس بعد — شغّل مع --save');
if (report.errors.length) { log('أخطاء:'); report.errors.slice(0, 8).forEach((e) => log('   - ' + e)); }

// إنهاء صريح: jsdom يُبقي مؤقتات التطبيق حيّة فلا تنتهي العملية وحدها
log('── انتهى ──');
process.exit(process.exitCode ?? 0);
