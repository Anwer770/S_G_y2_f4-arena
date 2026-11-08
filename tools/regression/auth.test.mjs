#!/usr/bin/env node
/**
 * اختبار انحدار: تشديد المصادقة (R3 + R2)
 *
 * يقيس السلوك الفعلي للتطبيق في حالتين:
 *   A) حساب بلا رمز (الحالة الافتراضية بعد R2) ⇒ لا يدخل إطلاقاً، ويُوجَّه إلى
 *      «تعيين الرمز أول مرة»: '1234' مرفوض، وتأكيد غير مطابق مرفوض، ثم رمز مقبول
 *      يُحفظ ويُدخل الحساب. (كان قبل R2 يدخل بضغطة واحدة برمز 1234 الضمني = ثغرة.)
 *   B) حساب برمز مخصص '9876' ⇒ لا يُقبل '1234'، ويُقبل '9876' فقط.
 *
 * التشغيل: node tools/regression/auth.test.mjs
 *          APP_ROOT=/path/to/old-commit node tools/regression/auth.test.mjs   (يثبت كشف العطل)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { TEST_PIN, findPinField, setNativeValue, loginWithPin, ensureWebCrypto, storedUsers, seedSession, SESSION_KEY } from './_login.mjs';

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
async function boot(settingsJson, tag, prepare) {
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

  if (prepare) prepare(w, doc);
  ensureWebCrypto(w);
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
const bodyText = (doc) => (doc.body.textContent || '').replace(/\s+/g, ' ');
const pickBtn = (doc) => [...doc.querySelectorAll('button')].find((b) => /^دخول ←$/.test((b.textContent || '').trim()));
const confirmField = (doc) => doc.querySelector('#login-pin-confirm');
const submitBtn = (doc) => doc.querySelector('form button[type="submit"]');
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));

/** يملأ رمزاً (وتأكيداً عند الحاجة) ويضغط زر الإرسال دون انتظار النجاح */
async function submitCredentials(w, doc, pin, confirm) {
  const field = findPinField(doc);
  if (!field) return false;
  setNativeValue(w, field, pin);
  const conf = confirmField(doc);
  if (conf && confirm !== undefined) setNativeValue(w, conf, confirm);
  await new Promise((r) => setTimeout(r, 120));
  const btn = submitBtn(doc);
  if (!btn) return false;
  click(w, btn);
  await new Promise((r) => setTimeout(r, 1200));
  return true;
}

// ================================================================ A) حساب بلا رمز — R2
{
  const { w, doc, errors } = await boot(seedSettings(baseUsers), 'nopin');
  const loginReady = await waitFor(() => !!findPinField(doc) && /اختر حسابك للمتابعة/.test(bodyText(doc)));
  check('A1 · شاشة الدخول اكتملت وفيها حقل رمز إلزامي', loginReady);

  check('A2 · حساب بلا رمز يُوجَّه إلى مسار «تعيين الرمز أول مرة» (لا دخول بضغطة)',
    /تعيين رمز المرور لأول مرة/.test(bodyText(doc)) && !!confirmField(doc) && !isLoggedIn(doc),
    'حقلان: رمز + تأكيد، ولا فتح للحساب قبل التعيين');

  // زر «دخول» في بطاقة الحساب لم يعد يدخل بضغطة — يطلب التعيين فقط
  const pb = pickBtn(doc);
  if (pb) { click(w, pb); await new Promise((r) => setTimeout(r, 900)); }
  check('A3 · زر «دخول» لا يفتح الحساب بضغطة بل يطلب التعيين', !!pb && !isLoggedIn(doc),
    pb ? 'ظهر تنبيه طلب التعيين' : 'لم يُوجد زر «دخول»');

  // الرمز الشائع 1234 مرفوض عند التعيين (ومنه كان يُفتح الحساب قبل الإصلاح)
  await submitCredentials(w, doc, '1234', '1234');
  const commonRejected = !isLoggedIn(doc) && /رمز غير مقبول|غير شائع/.test(bodyText(doc));
  check('A4 · رمز شائع (1234) مرفوض عند التعيين ولا يفتح الحساب', commonRejected,
    commonRejected ? 'ظهر رفض صريح' : 'قُبل رمز شائع أو لم تظهر رسالة');

  // تأكيد غير مطابق مرفوض
  const accept = findPinField(doc);
  if (accept) setNativeValue(w, accept, TEST_PIN);
  const confMismatch = confirmField(doc);
  if (confMismatch) setNativeValue(w, confMismatch, '777111');
  await new Promise((r) => setTimeout(r, 120));
  const sb = submitBtn(doc);
  if (sb) click(w, sb);
  await new Promise((r) => setTimeout(r, 1200));
  const mismatchRejected = !isLoggedIn(doc) && /التأكيد|تأكيد الرمز/.test(bodyText(doc));
  check('A5 · تأكيد غير مطابق يُرفض ولا يُنشئ الرمز', mismatchRejected);

  // التعيين الصحيح يدخل
  const okField = findPinField(doc);
  if (okField) setNativeValue(w, okField, TEST_PIN);
  const okConf = confirmField(doc);
  if (okConf) setNativeValue(w, okConf, TEST_PIN);
  await new Promise((r) => setTimeout(r, 120));
  const okBtn = submitBtn(doc);
  if (okBtn) click(w, okBtn);
  const entered = await waitFor(() => isLoggedIn(doc), 12000);
  check('A6 · رمز مقبول (4–6 أرقام) يُحفظ ويُدخل الحساب', entered);

  const savedUser = storedUsers(w).find((u) => u.id === 'usr-1') || {};
  const hashedOk =
    !!savedUser.pinHash && !!savedUser.pinSalt && Number(savedUser.pinIterations) >= 20000 &&
    !savedUser.pin && !savedUser.password;
  check('A7 · الرمز حُفظ كملخّص PBKDF2 فقط — لا نص صريح في التخزين', hashedOk,
    hashedOk
      ? `PBKDF2 · ${savedUser.pinIterations} دورة · الحجم ${savedUser.pinHash.length} حرفاً`
      : `pin=${savedUser.pin ?? '—'} · hash=${savedUser.pinHash ? 'موجود' : 'مفقود'}`);

  check('A8 · لا أخطاء JS', errors.length === 0, errors[0] || '');
}

// ================================================================ B) رمز مخصص — لا تجاوز
{
  const users = baseUsers.map((u) => (u.id === 'usr-1' ? { ...u, pin: CUSTOM_PIN } : u));
  const { w, doc, errors } = await boot(seedSettings(users), 'custom');
  const loginReady = await waitFor(() => !!findPinField(doc) && /مدير النظام/.test(bodyText(doc)));
  check('B1 · شاشة الدخول اكتملت ولا مسار تعيين (الحساب يملك رمزاً)', loginReady && !confirmField(doc));

  const pb = pickBtn(doc);
  if (pb) { click(w, pb); await new Promise((r) => setTimeout(r, 900)); }
  const askedForPin = /محمي برمز مرور|رمز مرور/.test(bodyText(doc));
  check('B2 · زر «دخول» لا يفتح الحساب المحمي بضغطة بل يطلب الرمز', !isLoggedIn(doc) && askedForPin,
    askedForPin ? 'ظهرت رسالة طلب الرمز' : 'لم تظهر رسالة طلب الرمز');

  // إرسال بلا رمز مرفوض برسالة صريحة
  const sb0 = submitBtn(doc);
  if (sb0) { click(w, sb0); await new Promise((r) => setTimeout(r, 900)); }
  check('B3 · الإرسال برمز فارغ مرفوض برسالة صريحة', !isLoggedIn(doc) && /أدخل رمز المرور/.test(bodyText(doc)),
    'الحقل الفارغ لم يعد يمرّ كأنه صحيح');

  await submitCredentials(w, doc, '1234');
  check('B4 · الرمز العام 1234 لم يعد يفتح حساباً له رمز مخصص', !isLoggedIn(doc),
    'هذا هو التجاوز الذي أُغلق (كان يدخل قبل الإصلاح)');

  await submitCredentials(w, doc, CUSTOM_PIN);
  const entered = await waitFor(() => isLoggedIn(doc), 12000);
  check('B5 · الرمز الصحيح للحساب يفتح بنجاح — لا تعطيل للمستخدم', entered);
  check('B6 · لا أخطاء JS', errors.length === 0, errors[0] || '');
}

// ================================================================ C) مساعد الدخول الموحّد (يستخدمه بقية الاختبارات)
{
  const users = baseUsers.map((u) => ({ ...u, pin: TEST_PIN }));
  const { w, doc, errors } = await boot(seedSettings(users), 'helper');
  const done = await loginWithPin(w, doc);
  check('C1 · loginWithPin يدخل حساباً له رمز معيَّن', done && isLoggedIn(doc));
  check('C2 · لا أخطاء JS', errors.length === 0, errors[0] || '');
}

// ================================================================ D) الإقفال المؤقت بعد المحاولات الفاشلة (P2)
{
  const users = baseUsers.map((u) => (u.id === 'usr-1' ? { ...u, pin: CUSTOM_PIN } : u));
  const { w, doc, errors } = await boot(seedSettings(users), 'lockout');
  await waitFor(() => !!findPinField(doc));

  for (let i = 0; i < 5; i++) {
    await submitCredentials(w, doc, '135790');
  }
  const lockedText = bodyText(doc);
  check('D1 · بعد 5 محاولات فاشلة يُقفل الحساب مؤقتاً برسالة عربية صريحة',
    !isLoggedIn(doc) && /مقفل|قفل/i.test(lockedText), lockedText.match(/[^.]*مقفل[^.]*/)?.[0]?.slice(0, 90) || '');

  await submitCredentials(w, doc, CUSTOM_PIN);
  check('D2 · الرمز الصحيح مرفوض أيضاً أثناء الإقفال (لا تجاوز بالانتظار)', !isLoggedIn(doc) && /مقفل|قفل/i.test(bodyText(doc)),
    'الإقفال يعيش في التخزين ولا يُصفَّر بإعادة المحاولة');

  const guardRaw = w.localStorage.getItem('suite_auth_guard_v1');
  check('D3 · حالة الإقفال محفوظة في التخزين (لا تُصفَّر بإعادة التحميل)', !!guardRaw && /lockedUntil/.test(guardRaw),
    guardRaw ? `guard=${guardRaw.slice(0, 60)}…` : 'لا يوجد سجل حماية');
  check('D4 · لا أخطاء JS', errors.length === 0, errors[0] || '');
}

// ================================================================ E) انتهاء الجلسة (P2)
{
  const users = baseUsers.map((u) => ({ ...u, pin: TEST_PIN }));
  const { w, doc, errors } = await boot(seedSettings(users), 'expired', (win) =>
    seedSession(win, { expiresInMs: -1000 })
  );
  await waitFor(() => !!findPinField(doc) || isLoggedIn(doc));
  check('E1 · جلسة منتهية لا تُدخل التطبيق — يُطلب الرمز من جديد', !!findPinField(doc) && !isLoggedIn(doc),
    'الانتهاء بعد 8 ساعات يمنع الاستعادة الصامتة');
  check('E2 · الجلسة المنتهية مُسحت من التخزين', !w.localStorage.getItem(SESSION_KEY));
  check('E3 · لا أخطاء JS', errors.length === 0, errors[0] || '');
}

// ================================================================ F) استعادة جلسة سارية (P2)
{
  const users = baseUsers.map((u) => ({ ...u, pin: TEST_PIN }));
  const { w, doc, errors } = await boot(seedSettings(users), 'valid', (win) => seedSession(win, { expiresInMs: 60 * 60 * 1000 }));
  const restored = await waitFor(() => isLoggedIn(doc));
  check('F1 · جلسة سارية (أقل من 8 ساعات و«تذكّر») تُستعاد بلا طلب الرمز', restored && !findPinField(doc));
  check('F2 · لا أخطاء JS', errors.length === 0, errors[0] || '');
}

// ================================================================ G) جلسة بصيغة قديمة (بلا انتهاء) — تُرفض
{
  const users = baseUsers.map((u) => ({ ...u, pin: TEST_PIN }));
  const { w, doc } = await boot(seedSettings(users), 'legacy', (win) =>
    win.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: 'usr-1', loginTime: new Date().toISOString() }))
  );
  await waitFor(() => !!findPinField(doc) || isLoggedIn(doc));
  check('G1 · جلسة قديمة بلا `expiresAt` تُعدّ منتهية ولا تفتح التطبيق', !!findPinField(doc) && !isLoggedIn(doc),
    'لا استعادة صامتة لجلسات بلا سقف زمني');
}

fs.rmSync(bundlePath, { force: true });
const failed = results.filter((r) => !r.ok);
console.log('\n════════ حصيلة اختبار المصادقة ════════');
console.log(`نجح: ${results.length - failed.length} / ${results.length}`);
if (failed.length) { console.log('✗ فشل الاختبار'); process.exitCode = 1; } else console.log('✔ نجح الاختبار');
process.exit(process.exitCode ?? 0);
