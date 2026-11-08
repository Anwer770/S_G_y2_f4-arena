/**
 * المصدر الوحيد لهوية التطبيق وإصداره (إصلاح R7).
 *
 * من يقرأ هذا الملف:
 *   - الواجهة: `src/main.tsx` (عنوان الصفحة) و`src/components/auth/LoginScreen.tsx` (ترويسة الدخول والتذييل).
 *   - إعداد PWA: `vite.config.ts` (name / short_name / description + عنوان `index.html`).
 *   - بوابة الانحدار: `tools/regression/identity.test.mjs` تقارن هذا الملف بـ `package.json`
 *     و`metadata.json` و`index.html` وببيانات PWA، وتمنع تكرار رقم إصدار نصّي في أي مكان آخر.
 *
 * القاعدة: لا تكتب رقم إصدار أو اسم منتج نصّياً خارج هذا الملف.
 * رقم `APP_VERSION` يجب أن يطابق `version` في `package.json` (تتحقق منه البوابة).
 */
export const APP_NAME = 'المنظومة الإدارية المتكاملة';
export const APP_SHORT_NAME = 'القيصر ERP';
export const APP_TAGLINE = 'نظام إدارة العمليات والمخزون والحسابات والمهام الميدانية والمطابقات';

/** الإصدار الظاهر للمستخدم — يتبع إصدار حزمة `caesar-erp-unified`. */
export const APP_VERSION = '3.4.0';

export const APP_VERSION_LABEL = `v${APP_VERSION}`;
