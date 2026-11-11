/**
 * مساعد دخول موحّد لاختبارات الانحدار — بعد إصلاح R2 (لا رموز افتراضية).
 *
 * القاعدة الجديدة: شاشة الدخول تطلب رمز المرور دائماً، والحساب الذي لا يملك رمزاً
 * يمرّ بخطوة «تعيين الرمز أول مرة» (حقلان: رمز + تأكيد). لذلك لم يعد هناك
 * «دخول سريع بضغطة واحدة» يمكن لاختبارات jsdom الاعتماد عليه.
 *
 * الاستخدام:
 *   import { TEST_PIN, withTestPin, loginWithPin } from './_login.mjs';
 *   w.localStorage.setItem(SETTINGS_KEY, withTestPin(settingsJson));   // أو اتركه للتعيين
 *   ...
 *   await loginWithPin(w, doc);                                        // يملأ الرمز ويضغط الدخول
 *   await loginWithPin(w, doc, { expectSetup: true });                 // يتحقق من مسار التعيين
 */

import { webcrypto } from 'node:crypto';

/** رمز اختباري مقبول (4–6 أرقام، غير شائع) */
export const TEST_PIN = '482615';

/** مفتاح جلسة الدخول (مسجّل في src/utils/storage/keys.ts) */
export const SESSION_KEY = 'suite_active_auth_session_v1';

/**
 * jsdom لا يوفّر `crypto.subtle`، والتطبيق يجزّئ رمز المرور بـ PBKDF2 (P2).
 * نزرع Web Crypto الحقيقي من Node داخل نافذة jsdom قبل تقييم الحزمة.
 */
export function ensureWebCrypto(w) {
  try {
    if (!w.crypto) return;
    if (!w.crypto.subtle) {
      Object.defineProperty(w.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });
    }
    if (!w.crypto.getRandomValues) {
      Object.defineProperty(w.crypto, 'getRandomValues', {
        value: (arr) => webcrypto.getRandomValues(arr),
        configurable: true,
      });
    }
    // jsdom لا يوفّر TextEncoder/TextDecoder — والتطبيق يستخدمهما في اشتقاق المفتاح
    if (!w.TextEncoder) w.TextEncoder = globalThis.TextEncoder;
    if (!w.TextDecoder) w.TextDecoder = globalThis.TextDecoder;
  } catch {
    /* تجاهل: بعض بيئات jsdom تمنع التعديل */
  }
}

/** يزرع جلسة دخول في التخزين قبل الإقلاع (للتحقق من الانتهاء/الاستعادة) */
export function seedSession(w, { userId = 'usr-1', expiresInMs = 60 * 60 * 1000, remember = true } = {}) {
  const session = {
    userId,
    loginTime: new Date().toISOString(),
    expiresAt: Date.now() + expiresInMs,
    remember,
  };
  w.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/** يقرأ مستخدمي الإعدادات المخزّنة (للتحقق من التجزئة وعدم تخزين النص) */
export function storedUsers(w, settingsKey = 'suite_unified_settings_v2') {
  try {
    const raw = w.localStorage.getItem(settingsKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch {
    return [];
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** يكتب قيمة في حقل React بطريقة يفهمها (setter الأصلي + حدثا input/change) */
export const setNativeValue = (w, el, value) => {
  const proto = el.tagName === 'TEXTAREA' ? w.HTMLTextAreaElement.prototype : w.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
};

/** حقل الرمز في شاشة الدخول */
export const findPinField = (doc) =>
  doc.querySelector('#login-pin') ||
  [...doc.querySelectorAll('input')].find((i) => /PIN|رمز/i.test(i.placeholder || '')) ||
  null;

/** حقل تأكيد الرمز (يظهر فقط في مسار التعيين الأول) */
export const findPinConfirmField = (doc) => doc.querySelector('#login-pin-confirm');

/** هل شاشة الدخول ما زالت معروضة؟ */
export const onLoginScreen = (doc) => !!findPinField(doc);

/** يضيف رمزاً اختبارياً لكل حساب بلا رمز داخل JSON الإعدادات المزروعة */
export function withTestPin(settingsJson, pin = TEST_PIN) {
  try {
    const settings = JSON.parse(settingsJson);
    if (Array.isArray(settings.users)) {
      settings.users = settings.users.map((u) => (u && u.pin ? u : { ...u, pin }));
    }
    return JSON.stringify(settings);
  } catch {
    return settingsJson;
  }
}

/**
 * ينفّذ الدخول فعلياً من الواجهة: ينتظر شاشة الدخول، يملأ الرمز (والتأكيد إن ظهر
 * مسار التعيين)، ويضغط زر الإرسال، ثم ينتظر مغادرة شاشة الدخول.
 * @returns {Promise<boolean>} true إن غادرت شاشة الدخول
 */
export async function loginWithPin(w, doc, options = {}) {
  const { pin = TEST_PIN, timeoutMs = 20000, expectSetup = false } = options;
  const deadline = Date.now() + timeoutMs;

  let field = null;
  while (Date.now() < deadline) {
    field = findPinField(doc);
    if (field) break;
    await sleep(100);
  }
  if (!field) return false;

  const setupShown = !!findPinConfirmField(doc);
  if (expectSetup && !setupShown) return false;

  setNativeValue(w, field, pin);
  const confirm = findPinConfirmField(doc);
  if (confirm) setNativeValue(w, confirm, pin);
  await sleep(80);

  const submit =
    doc.querySelector('form button[type="submit"]') ||
    [...doc.querySelectorAll('button')].find((b) => /تسجيل الدخول كـ|تعيين الرمز والدخول/.test(b.textContent || ''));
  if (!submit) return false;
  submit.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));

  while (Date.now() < deadline) {
    if (!onLoginScreen(doc)) return true;
    await sleep(150);
  }
  return false;
}
