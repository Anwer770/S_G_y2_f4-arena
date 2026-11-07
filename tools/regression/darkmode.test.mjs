#!/usr/bin/env node
/**
 * اختبار انحدار: تغطية الوضع الليلي على مستوى DOM الحقيقي (Phase 4)
 *
 * لا يقيس النص المصدري بل **ما وصل فعلاً إلى DOM**: يُقلع التطبيق في وضع ليلي
 * (app_theme_mode=dark)، يسجّل الدخول، يزور كل الوحدات، ويعدّ العناصر التي تحمل
 * أصناف dark: في كل وحدة. ثم يقارن بحد أدنى متوقّع لكل وحدة متخلّفة سابقاً.
 *
 * التشغيل:
 *   node tools/regression/darkmode.test.mjs                    # بعد الإصلاح (يفشل إن نقصت التغطية)
 *   DARK_EXPECT=0 APP_ROOT=/tmp/pre-dark node tools/regression/darkmode.test.mjs   # قياس فقط (إثبات قبل/بعد)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const APP_ROOT = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : ROOT;
const EXPECT = process.env.DARK_EXPECT !== '0';
const TAG = process.env.DARK_TAG || (EXPECT ? 'after' : 'before');
const require = createRequire(path.join(ROOT, 'package.json'));

const SETTINGS_KEY = 'qeema_accounting_system_settings_v1';
const THEME_KEY = 'app_theme_mode';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ---------------------------------------------------------------- bundle
const bundlePath = path.join(ROOT, 'docs', 'تدقيق', '.dark-bundle.js');
console.log(`▸ تجزيء التطبيق من: ${APP_ROOT}`);
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [
  path.join(APP_ROOT, 'src', 'main.tsx'),
  '--bundle', '--format=iife', '--jsx=automatic', '--outfile=' + bundlePath,
  '--define:process.env.NODE_ENV="production"',
  '--loader:.css=empty', '--loader:.png=dataurl', '--loader:.svg=dataurl', '--log-level=error',
], { stdio: 'inherit' });
const code = fs.readFileSync(bundlePath, 'utf8');

const { JSDOM, VirtualConsole } = require('jsdom');

const users = [{
  id: 'usr-1', name: 'مدير النظام', email: 'admin@system.local', phone: '+967 771 234 567',
  role: 'admin', status: 'active', avatarInitial: 'م', lastLogin: 'الآن نشط', createdAt: '2025-01-10',
}];
const settingsJson = JSON.stringify({
  users,
  general: { currentUserName: 'مدير النظام', currentUserTitle: 'مدير عام المنظومة والعمليات' },
  theme: 'dark',
});

/** يُقلع التطبيق في DOM جديد، بوضع ليلي مسبَق الضبط */
async function boot() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 200)));
  vc.on('jsdomError', (e) => errors.push('jsdomError: ' + String(e?.message).slice(0, 200)));

  const dom = new JSDOM(`<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>`,
    { url: 'https://dark.local/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  const doc = w.document;

  w.localStorage.setItem(SETTINGS_KEY, settingsJson);
  w.localStorage.setItem(THEME_KEY, 'dark');
  w.matchMedia = (q) => ({ matches: /prefers-color-scheme:\s*dark/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
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
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(2500);
  return { w, doc, sleep, errors };
}

const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
const quickBtn = (doc) => [...doc.querySelectorAll('button')].find((b) => /دخول سريع/.test(b.textContent || ''));
const isLoggedIn = (doc) => /اللوحة التحكم|لوحة التحكم/.test(doc.body.textContent || '');

/** يعدّ العناصر التي تحمل صنفاً ليلِيّاً واحداً على الأقل */
const darkCount = (root) => root.querySelectorAll('[class*="dark:"]').length;

async function waitFor(fn, timeoutMs = 15000, stepMs = 150) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { if (fn()) return true; } catch { /* ignore */ }
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return false;
}

const report = { appRoot: APP_ROOT, tag: TAG, themeApplied: false, views: {}, errors: [] };

// ================================================================ الإقلاع + الدخول
const { w, doc, sleep, errors } = await boot();
check('D1 · الوضع الليلي طُبِّق على <html> (class="dark")', await waitFor(() => doc.documentElement.classList.contains('dark')),
  'الربط الفعلي بين مفتاح التطبيق وأنماط Tailwind');
report.themeApplied = doc.documentElement.classList.contains('dark');

const loginReady = await waitFor(() => !!quickBtn(doc));
check('D2 · شاشة الدخول اكتمل رسمها', loginReady);
const qb = quickBtn(doc);
if (qb) { click(w, qb); }
check('D3 · دخول ناجح للحساب الافتراضي', await waitFor(() => isLoggedIn(doc)), '');

// ================================================================ زيارة الوحدات
const navSelector = 'aside button, aside a, nav button, nav a';
const navLabel = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
const labels = [...new Set([...doc.querySelectorAll(navSelector)].map(navLabel).filter(Boolean))];
console.log(`▸ وحدات في القائمة الجانبية: ${labels.length}`);

for (const label of labels) {
  const el = [...doc.querySelectorAll(navSelector)].find((e) => navLabel(e) === label);
  if (!el) continue;
  const before = errors.length;
  click(w, el);
  await sleep(1300);
  const root = doc.getElementById('root');
  const view = { dark: darkCount(root), dom: root.innerHTML.length, newErrors: errors.length - before };
  // تبويبات فرعية داخل الوحدة (workos وغيرها)
  const subSelector = '[role="tab"], [role="tablist"] button, .tab-button';
  const subs = [...new Set([...root.querySelectorAll(subSelector)].map(navLabel).filter(Boolean))];
  const subStats = {};
  for (const s of subs.slice(0, 12)) {
    const sb = [...root.querySelectorAll(subSelector)].find((e) => navLabel(e) === s);
    if (!sb) continue;
    click(w, sb);
    await sleep(700);
    subStats[s] = darkCount(root);
  }
  if (Object.keys(subStats).length) {
    view.subTabs = subStats;
    view.dark = Math.max(view.dark, ...Object.values(subStats));
  }
  // فتح نافذة منبثقة (نموذج إدخال) وقياس التغطية الليلية داخلها — المكونات المحمية
  const cands = [...root.querySelectorAll('button, [role="button"]')].filter((b) => {
    const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
    const meta = (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || '');
    if (/حذف|مسح|إعادة ضبط|تصدير|طباعة|خروج|خروج/.test(t)) return false;
    return /إضافة|اضافة|جديد|جديدة|تسجيل /.test(t) || /إضافة|جديد/.test(meta) || /^\+$/.test(t);
  }).slice(0, 4);
  const before2 = errors.length;
  let dlg = null;
  for (const btn of cands) {
    click(w, btn);
    await sleep(1200);
    dlg = doc.querySelector('[role="dialog"], [aria-modal="true"], .fixed.inset-0');
    if (dlg) break;
  }
  if (dlg) {
    const darkInDialog = dlg.querySelectorAll('[class*="dark:"]').length;
    const fields = dlg.querySelectorAll('input, select, textarea').length;
    view.modal = { opened: true, fields, dark: darkInDialog, newErrors: errors.length - before2 };
    report.modals = report.modals || {};
    report.modals[label] = view.modal;
    const cancel = [...dlg.querySelectorAll('button')].find((b) => /إلغاء|إغلاق|رجوع|تراجع/.test(b.textContent || ''));
    if (cancel) { click(w, cancel); }
    else { doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); }
    await sleep(700);
  }
  report.views[label] = view;
}

const totalDark = Object.values(report.views).reduce((s, v) => s + (v.dark || 0), 0);
const viewsWithDark = Object.entries(report.views).filter(([, v]) => (v.dark || 0) > 0).map(([k]) => k);
report.totalDark = totalDark;
report.viewsWithDark = viewsWithDark;
report.errors = errors;

console.log('\n── عدد عناصر DOM الحاملة لأصناف dark: لكل وحدة ──');
Object.entries(report.views)
  .sort((a, b) => (b[1].dark || 0) - (a[1].dark || 0))
  .forEach(([k, v]) => console.log(`   ${String(v.dark || 0).padStart(5)}  ${k}${v.subTabs ? '  (فرعية: ' + Math.max(...Object.values(v.subTabs)) + ')' : ''}`));
console.log(`   ${String(totalDark).padStart(5)}  الإجمالي · وحدات فيها تغطية: ${viewsWithDark.length}/${Object.keys(report.views).length}`);

if (EXPECT) {
  // الحدود الدنيا مشتقّة من القياس الفعلي بعد الكودمود (هامش أمان) — تمنع الانحدار الصامت.
  // المطابقة بالتعبير النمطي لأن أسماء الوحدات في القائمة الجانبية تحمل عدّادات أرقاماً.
  const FLOORS = [
    [/اللوحة التحكم/, 100, 'اللوحة التحكم (Dashboard)'],
    [/السجل اليومي|السجلات/, 60, 'السجل اليومي (Records)'],
    [/العهد/, 300, 'العهد والإشكاليات (Custody)'],
    [/الروابط/, 200, 'مكتبة الروابط (Links)'],
    [/الديون/, 120, 'الديون والالتزامات (Debts)'],
    [/العملاء/, 100, 'العملاء والزيارات (Customers)'],
    [/الاطباء|الأطباء/, 80, 'الأطباء والزيارات (Doctors)'],
    [/إدارة العمل(?!اء)/, 60, 'Work OS (إدارة العمل)'],
    [/صرف وتوريد/, 100, 'الصرف والتوريد (Financial/Stock)'],
    [/الروتين/, 50, 'الروتين والعادات (Routines)'],
  ];
  for (const [re, floor, name] of FLOORS) {
    const hit = Object.entries(report.views).find(([k]) => re.test(k));
    if (!hit) continue;
    check(`D4 · «${name}» فيها تغطية ليلية في DOM`, (hit[1].dark || 0) >= floor, `${hit[1].dark || 0} عنصراً (الحد ${floor})`);
  }
  check('D5 · لا أخطاء JS أثناء التنقّل', errors.length === 0, errors[0] || '');
  check('D6 · أغلب الوحدات المزارة فيها تغطية ليلية', viewsWithDark.length >= Math.ceil(Object.keys(report.views).length * 0.6),
    `${viewsWithDark.length}/${Object.keys(report.views).length}`);
  const stray = Object.entries(report.views).filter(([, v]) => v.newErrors > 0);
  check('D7 · لا أخطاء جديدة عند زيارة أي وحدة', stray.length === 0, stray.map(([k]) => k).join(', '));
  const modals = Object.entries(report.modals || {});
  const opened = modals.filter(([, m]) => m.opened);
  check('D8 · فُتحت نوافذ إدخال فعلية للقياس', opened.length >= 4, `${opened.length} نافذة`);
  const darkModals = opened.filter(([, m]) => m.dark >= 3);
  check('D9 · النوافذ المنبثقة (مكونات محمية) مغطّاة ليلياً', opened.length > 0 && darkModals.length === opened.length,
    `${darkModals.length}/${opened.length} — أقل نافذة: ${opened.length ? Math.min(...opened.map(([, m]) => m.dark)) : 0} عنصراً`);
  console.log('\n── النوافذ المنبثقة (نماذج الإدخال المحمية) ──');
  modals.forEach(([k, m]) => console.log(`   ${String(m.dark).padStart(4)} عنصراً داكن · ${String(m.fields).padStart(3)} حقلاً  ${k}`));
}

fs.writeFileSync(path.join(ROOT, 'docs', 'تدقيق', `darkmode-runtime-${TAG}.json`),
  JSON.stringify(report, null, 1), 'utf8');

// ================================================================ الحصيلة
const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة اختبار الوضع الليلي (${TAG}) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (!EXPECT) { console.log('(وضع قياس فقط — بلا تحقق من الحدود الدنيا)'); process.exit(0); }
const failed = results.filter((r) => !r.ok);
if (failed.length) { console.log('✖ فشل الاختبار'); failed.forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : ''))); process.exit(1); }
console.log('✔ نجح الاختبار');
process.exit(0);
