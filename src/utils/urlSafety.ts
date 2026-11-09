/**
 * أمان الروابط (R32) — منطق نقي بلا DOM، يُختبر بالوحدات ويُستخدم في كل موضع
 * يُعرض فيه رابط من إدخال مستخدم (`href` أو `window.open`).
 *
 * العطب الذي يمنعه: رابط مرفق مكتوب يدوياً مثل `javascript:alert(1)` في سجل العهد،
 * أو `data:text/html,<script>…` في مرفق ملاحظة، يُنفَّذ داخل أصل التطبيق نفسه —
 * أي أن بيانات المستخدم تتحوّل إلى كود يعمل بصلاحياته على قاعدة البيانات المحلية.
 */

/** المخططات المسموح بها في الروابط الخارجية. */
const SAFE_PROTOCOLS = ['http:', 'https:'];

/** مخططات تُنفّذ كوداً أو تحمّل محتوى محلياً — مرفوضة دائماً. */
const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'file:', 'blob:', 'filesystem:', 'about:'];

export interface UrlSafetyOptions {
  /** السماح برابط بريد (mailto:) — يُستخدم في بطاقات التواصل. */
  allowMailto?: boolean;
  /** السماح برابط هاتف (tel:) — يُستخدم في أزرار الاتصال. */
  allowTel?: boolean;
}

/**
 * يُنظّف رابطاً خارجياً ويُعيده آمناً، أو `''` إن كان غير آمن.
 *
 * - يحذف محارف التحكّم والمسافات (تُستغل للتحايل: `java\tscript:`).
 * - يرفض المخططات الخطرة بلا استثناء.
 * - الروابط بلا مخطط (مثل `example.com/x`) تُكمَّل بـ`https://`.
 * - البروتوكول النسبي (`//host/path`) يُكمَّل بـ`https:`.
 */
export function sanitizeExternalUrl(raw: unknown, options: UrlSafetyOptions = {}): string {
  if (typeof raw !== 'string') return '';

  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u0020\u007F-\u009F]/g, '').trim();
  if (!cleaned) return '';

  const lowered = cleaned.toLowerCase();

  if (DANGEROUS_PROTOCOLS.some((protocol) => lowered.startsWith(protocol))) return '';
  if (options.allowMailto && lowered.startsWith('mailto:')) {
    return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(cleaned.slice(7)) ? cleaned : '';
  }
  if (options.allowTel && lowered.startsWith('tel:')) {
    return /^\+?[0-9\s\-().]{3,20}$/.test(cleaned.slice(4)) ? cleaned : '';
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(cleaned);
  if (hasScheme) {
    const scheme = cleaned.slice(0, cleaned.indexOf(':') + 1).toLowerCase();
    if (!SAFE_PROTOCOLS.includes(scheme)) return '';
    return parseSafe(cleaned) ? cleaned : '';
  }

  const withScheme = cleaned.startsWith('//') ? `https:${cleaned}` : `https://${cleaned}`;
  return parseSafe(withScheme) ? withScheme : '';
}

/** هل الرابط صالح لفتحه في نافذة جديدة؟ */
export function isSafeExternalUrl(raw: unknown, options: UrlSafetyOptions = {}): boolean {
  return sanitizeExternalUrl(raw, options) !== '';
}

function parseSafe(value: string): boolean {
  try {
    const parsed = new URL(value);
    return Boolean(parsed.hostname) && SAFE_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * يتحقّق من روابط `data:` (مرفقات الملاحظات) — يُسمح بالصور وPDF والنص العادي فقط،
 * ومرفوض `data:text/html` أو `data:image/svg+xml` لأنهما قد يحملان كوداً.
 */
export function isSafeDataUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!/^data:/i.test(trimmed)) return false;

  const match = /^data:([a-z0-9.+/-]+)(;[a-z0-9=._-]+)*;base64,/i.exec(trimmed);
  if (!match) return false;

  // مرفق بلا محتوى فعلي لا يُعرض
  if (trimmed.length <= match[0].length) return false;

  const mime = match[1].toLowerCase();
  if (mime === 'image/svg+xml' || mime === 'text/html' || mime === 'application/xhtml+xml') return false;
  return /^(image\/(png|jpe?g|gif|webp|bmp)|application\/pdf|text\/plain|application\/(msword|vnd\.[a-z0-9.+-]+|octet-stream)|text\/csv)$/.test(
    mime
  );
}

/** يحوّل رابطاً مكتوباً يدوياً إلى رابط قابل للفتح (يُستخدم في مكتبة الروابط). */
export function formatValidUrl(url: string): string {
  return sanitizeExternalUrl(url);
}

/** يُهيّئ قيمة `rel` آمنة لكل رابط يُفتح في نافذة جديدة. */
export const SAFE_LINK_REL = 'noopener noreferrer';
