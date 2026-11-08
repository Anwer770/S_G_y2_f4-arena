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

/** رمز اختباري مقبول (4–6 أرقام، غير شائع) */
export const TEST_PIN = '482615';

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
