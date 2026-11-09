/**
 * سياسة أمان المحتوى (CSP) — R32. منطق نقي (بلا Vite ولا DOM) حتى يُختبر ويُقاس.
 *
 * لماذا CSP وهذه السياسة تحديداً؟
 *   - `script-src 'self'` بلا `unsafe-inline`/`unsafe-eval`: أي سكربت مُحقَن (لصق، إضافة متصفح،
 *     استيراد ملف) لا يُنفَّذ — وهذا أهم سطر دفاع في تطبيق يخزّن كل شيء محلياً.
 *   - السكربت الوحيد المضمَّن في `index.html` (تهيئة الوضع الليلي قبل الرسم لمنع الوميض)
 *     يُسمح به بـ**بصمة SHA-256** محسوبة من النص نفسه وقت البناء ⇒ لا يُسمح بأي سكربت مضمَّن آخر.
 *   - `object-src 'none'` + `base-uri 'self'` + `form-action 'none'` + `frame-ancestors 'none'`:
 *     إغلاق نواقل حقن قديمة (تضمين، تغيير أساس الروابط، إرسال نموذج لجهة خارجية، تأطير).
 *   - `style-src` يسمح بـ`'unsafe-inline'` لأن التطبيق يستخدم أنماطاً سطرية للعرض (أشرطة التقدّم)
 *     وخطوط Google؛ لا يوجد تنفيذ كود عبر CSS.
 */
import { createHash } from 'node:crypto';

export interface CspOptions {
  /** بصمات إضافية لسكربتات مضمَّنة (تُحسب آلياً في العادة). */
  extraScriptHashes?: string[];
}

export const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'blob:'],
  'connect-src': ["'self'", 'blob:', 'data:'],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"],
  'frame-ancestors': ["'none'"],
};

/** يستخرج نصوص كل سكربت مضمَّن (بلا `src`) من HTML. */
export function extractInlineScripts(html: string): string[] {
  const scripts: string[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const attrs = match[1] || '';
    const body = match[2] || '';
    if (/\bsrc\s*=/i.test(attrs)) continue; // سكربت خارجي — يغطيه 'self'
    if (!body.trim()) continue;
    scripts.push(body);
  }
  return scripts;
}

/** بصمة SHA-256 بصيغة CSP لسكربت مضمَّن. */
export function inlineScriptHash(scriptBody: string): string {
  const digest = createHash('sha256').update(scriptBody, 'utf8').digest('base64');
  return `'sha256-${digest}'`;
}

/** يبني سلسلة السياسة، مع إضافة بصمات السكربتات المضمَّنة. */
export function buildCspPolicy(options: CspOptions & { html?: string } = {}): string {
  const hashes = [...(options.extraScriptHashes || [])];
  if (options.html) hashes.push(...extractInlineScripts(options.html).map(inlineScriptHash));

  const directives = Object.entries(CSP_DIRECTIVES).map(([name, values]) => {
    const list = name === 'script-src' && hashes.length ? [...values, ...hashes] : values;
    return `${name} ${list.join(' ')}`.trim();
  });

  return directives.join('; ');
}

/** يتحقّق أن السياسة تحقّق الحد الأدنى الأمني (تُستخدم في البوابة). */
export function validateCspPolicy(policy: string): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const byDirective = new Map<string, string>();
  policy.split(';').forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const [name, ...values] = trimmed.split(/\s+/);
    byDirective.set(name, values.join(' '));
  });

  const scriptSrc = byDirective.get('script-src') || '';
  if (!scriptSrc) problems.push('لا توجد script-src');
  if (/'unsafe-inline'/.test(scriptSrc)) problems.push("script-src يحوي 'unsafe-inline'");
  if (/'unsafe-eval'/.test(scriptSrc)) problems.push("script-src يحوي 'unsafe-eval'");
  if (/\*/.test(scriptSrc)) problems.push('script-src يحوي نجمة');
  if ((byDirective.get('object-src') || '') !== "'none'") problems.push("object-src ليست 'none'");
  if ((byDirective.get('base-uri') || '') !== "'self'") problems.push("base-uri ليست 'self'");
  if ((byDirective.get('frame-ancestors') || '') !== "'none'") problems.push("frame-ancestors ليست 'none'");
  if (!byDirective.has('default-src')) problems.push('لا توجد default-src');

  return { ok: problems.length === 0, problems };
}

/** يُدخل وسم CSP داخل `<head>` في HTML (يُستدعى وقت البناء فقط). */
export function injectCspMeta(html: string, options: CspOptions = {}): string {
  if (/http-equiv=["']Content-Security-Policy["']/i.test(html)) return html;
  const policy = buildCspPolicy({ ...options, html });
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy.replace(/"/g, '&quot;')}" />`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (head) => `${head}\n    ${meta}`);
  return `${meta}\n${html}`;
}
