#!/usr/bin/env node
/**
 * اختبار انحدار: تشديد المصادقة (R3)
 *
 * يقيس السلوك الفعلي للتطبيق في ثلاث حالات:
 *   A) حساب برمز افتراضي (بلا PIN مخصص) ⇒ «الدخول السريع» يعمل كما كان  ← لا انحدار
 *   B) حساب برمز مخصص '9876' ⇒ لا يُقبل '1234' (كان يُقبل قبل الإصلاح = تجاوز)
 *   C) الحساب نفسه بالرمز الصحيح '9876' ⇒ يدخل بنجاح                        ← لا تعطيل
 *
 * التشغيل: node tools/regression/auth.test.mjs
 *          APP_ROOT=/path/to/old-commit node tools/regression/auth.test.mjs   (يثبت كشف العطل)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const APP_ROOT = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : ROOT;
const require = createRequire(path.join(ROOT, 'package.json'));

const SETTINGS_KEY = 'qeema_accounting_system_settings_v1';
const CUSTOM_PIN = '9876';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ---------------------------------------------------------------- bundle
const bundlePath = path.join(ROOT, 'docs', 'تدقيق', '.auth-bundle.js');
console.log(`▸ تجزيء التطبيق من: ${APP_ROOT}`);
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [
  path.join(APP_ROOT, 'src', 'main.tsx'),
  '--bundle', '--format=iife', '--jsx=automatic', '--outfile=' + bundlePath,
  '--define:process.env.NODE_ENV="production"',
  '--loader:.css=empty', '--loader:.png=dataurl', '--loader:.svg=dataurl', '--log-level=error',
], { stdio: 'inherit' });
const code = fs.readFileSync(bundlePath, 'utf8');

const { JSDOM, VirtualConsole } = require('jsdom');

const baseUsers = [
  {
    id: 'usr-1', name: 'مدير النظام', email: 'admin@system.local', phone: '+967 771 234 567',
    role: 'admin', status: 'active', avatarInitial: 'م', lastLogin: 'الآن نشط', createdAt: '2025-01-10',
  },
  {
    id: 'usr-2', name: 'محاسب رئيسي', email: 'accountant@system.local', role: 'accountant',
    status: 'active', avatarInitial: 'م', lastLogin: 'أمس', createdAt: '2025-01-10',
  },
];

function seedSettings(users) {
  return JSON.stringify({
    users,
    general: { currentUserName: 'مدير النظام', currentUserTitle: 'مدير عام المنظومة والعمليات' },
  });
}

/** يُقلع التطبيق في DOM جديد مع بيانات إعدادات مزروعة */
async function boot(settingsJson, tag) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 200)));
  vc.on('jsdomError', (e) => errors.push('jsdomError: ' + String(e?.message).slice(0, 200)));

  const dom = new JSDOM(`<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>`,
    { url: `https://auth-${tag}.local/`, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  const doc = w.document;

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
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(2500);

  return { w, doc, sleep, errors };
}

const isLoggedIn = (doc) => /اللوحة التحكم/.test((doc.body.textContent || ''));

/** ينتظر تحقّق شرط فعلي (بدل مؤقت ثابت) — يمنع قياس الحالة قبل اكتمال الرسم */
async function waitFor(fn, timeoutMs = 12000, stepMs = 150) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { if (fn()) return true; } catch { /* ignore */ }
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return false;
}
const pinInput = (doc) => [...doc.querySelectorAll('input[type="password"], input[type="text"]')]
  .find((i) => /PIN|رمز/i.test(i.placeholder || ''));
const setInput = (w, el, v) => {
  Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, v);
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
};
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
const submitBtn = (doc) => [...doc.querySelectorAll('button')].find((b) => /تسجيل الدخول كـ/.test(b.textContent || ''));
const quickBtn = (doc) => [...doc.querySelectorAll('button')].find((b) => /دخول سريع/.test(b.textContent || ''));

// ================================================================ A) حساب افتراضي — لا انحدار
{
  const { w, doc, errors } = await boot(seedSettings(baseUsers), 'default');
  const loginReady = await waitFor(() => !!quickBtn(doc) && /اختر حسابك للمتابعة/.test(doc.body.textContent));
  check('A1 · شاشة الدخول اكتمل رسمها وفيها زر «الدخول السريع»', loginReady);
  const qb = quickBtn(doc);
  if (qb) { click(w, qb); await new Promise((r) => setTimeout(r, 2200)); }
  check('A2 · الحساب الافتراضي (بلا PIN مخصص) يدخل بضغطة واحدة — بلا انحدار', isLoggedIn(doc));
  check('A3 · لا أخطاء JS', errors.length === 0, errors[0] || '');
}

// ================================================================ B) رمز مخصص — لا تجاوز
{
  const users = baseUsers.map((u) => (u.id === 'usr-1' ? { ...u, pin: CUSTOM_PIN } : u));
  const { w, doc, errors } = await boot(seedSettings(users), 'custom');
  const loginReady = await waitFor(() => !!quickBtn(doc) && /اختر حسابك للمتابعة/.test(doc.body.textContent));
  check('B1 · شاشة الدخول اكتمل رسمها والحساب المخصص ظاهر', loginReady && /مدير النظام/.test(doc.body.textContent));

  const qb = quickBtn(doc);
  if (qb) { click(w, qb); await new Promise((r) => setTimeout(r, 1500)); }
  const refusedSilently = !isLoggedIn(doc);
  const askedForPin = /محمي برمز خاص/.test(doc.body.textContent || '');
  check('B2 · «الدخول السريع» لا يفتح حساباً محمياً برمز خاص ويطلب الرمز', refusedSilently && askedForPin,
    askedForPin ? 'ظهرت رسالة طلب الرمز' : 'لم تظهر رسالة طلب الرمز');

  const pin = pinInput(doc);
  check('B3 · حقل الرمز متاح', !!pin);
  if (pin) {
    setInput(w, pin, '1234');
    const sb = submitBtn(doc);
    if (sb) { click(w, sb); await waitFor(() => /رمز المرور أو PIN غير صحيح/.test(doc.body.textContent || ''), 6000); }
  }
  check('B4 · الرمز العام 1234 لم يعد يفتح حساباً له رمز مخصص', !isLoggedIn(doc),
    'هذا هو التجاوز الذي أُغلق (كان يدخل قبل الإصلاح)');

  const pin2 = pinInput(doc);
  if (pin2) {
    setInput(w, pin2, CUSTOM_PIN);
    const sb = submitBtn(doc);
    if (sb) { click(w, sb); await waitFor(() => isLoggedIn(doc), 10000); }
  }
  check('B5 · الرمز الصحيح للحساب يفتح بنجاح — لا تعطيل للمستخدم', isLoggedIn(doc));
  check('B6 · لا أخطاء JS', errors.length === 0, errors[0] || '');
}

fs.rmSync(bundlePath, { force: true });
const failed = results.filter((r) => !r.ok);
console.log('\n════════ حصيلة اختبار المصادقة ════════');
console.log(`نجح: ${results.length - failed.length} / ${results.length}`);
if (failed.length) { console.log('✗ فشل الاختبار'); process.exitCode = 1; } else console.log('✔ نجح الاختبار');
process.exit(process.exitCode ?? 0);
