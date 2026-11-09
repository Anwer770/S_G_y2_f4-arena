/**
 * اختبارات وحدة لأمان الروابط وسياسة CSP (R32).
 *
 * الغرض: إثبات أن الروابط الخطرة (javascript: · data: · vbscript: · file: …) لا تُمرَّر
 * أبداً إلى `href` أو `window.open`، وأن سياسة CSP الناتجة لا تسمح بسكربت مضمَّن بلا بصمة
 * ولا بـ`unsafe-eval`.
 */
import { describe, it, expect } from 'vitest';
import {
  sanitizeExternalUrl,
  isSafeExternalUrl,
  isSafeDataUrl,
  formatValidUrl,
  SAFE_LINK_REL,
} from '../../src/utils/urlSafety';
import {
  extractInlineScripts,
  inlineScriptHash,
  buildCspPolicy,
  validateCspPolicy,
  injectCspMeta,
  CSP_DIRECTIVES,
} from '../../src/utils/security/csp';

describe('منظّف الروابط الخارجية', () => {
  it('يقبل http و https كما هي', () => {
    expect(sanitizeExternalUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(sanitizeExternalUrl('http://example.com')).toBe('http://example.com');
  });

  it('يكمل الرابط بلا مخطط بـhttps', () => {
    expect(sanitizeExternalUrl('example.com/x')).toBe('https://example.com/x');
    expect(sanitizeExternalUrl('//example.com/y')).toBe('https://example.com/y');
  });

  it('يرفض javascript: بكل أشكاله (بما فيها الحروف الكبيرة ومحارف التحكّم)', () => {
    expect(sanitizeExternalUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeExternalUrl('JaVaScRiPt:alert(1)')).toBe('');
    expect(sanitizeExternalUrl('java\tscript:alert(1)')).toBe('');
    expect(sanitizeExternalUrl('  javascript:alert(1)')).toBe('');
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });

  it('يرفض data: وvbscript: وfile: وblob:', () => {
    for (const bad of [
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      'blob:https://x/y',
      'about:blank',
    ]) {
      expect(sanitizeExternalUrl(bad)).toBe('');
    }
  });

  it('يرفض غير النصوص والفارغ', () => {
    expect(sanitizeExternalUrl(undefined)).toBe('');
    expect(sanitizeExternalUrl(null)).toBe('');
    expect(sanitizeExternalUrl(123)).toBe('');
    expect(sanitizeExternalUrl('   ')).toBe('');
  });

  it('يسمح mailto/tel عند الطلب فقط وبصيغة صحيحة', () => {
    expect(sanitizeExternalUrl('mailto:a@b.com')).toBe('');
    expect(sanitizeExternalUrl('mailto:a@b.com', { allowMailto: true })).toBe('mailto:a@b.com');
    expect(sanitizeExternalUrl('mailto:not-an-email', { allowMailto: true })).toBe('');
    expect(sanitizeExternalUrl('tel:+967771234567', { allowTel: true })).toBe('tel:+967771234567');
    expect(sanitizeExternalUrl('tel:+++', { allowTel: true })).toBe('');
  });

  it('formatValidUrl سلوكه متوافق مع الروابط العادية', () => {
    expect(formatValidUrl('google.com')).toBe('https://google.com');
    expect(formatValidUrl('javascript:alert(1)')).toBe('');
    expect(SAFE_LINK_REL).toContain('noopener');
  });
});

describe('روابط data: للمرفقات', () => {
  it('يقبل الصور وPDF والنص العادي', () => {
    expect(isSafeDataUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isSafeDataUrl('data:application/pdf;base64,JVBERi0=')).toBe(true);
    expect(isSafeDataUrl('data:text/plain;charset=utf-8;base64,aGVsbG8=')).toBe(true);
  });

  it('يرفض HTML وSVG وغير data', () => {
    expect(isSafeDataUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeDataUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isSafeDataUrl('https://example.com/x.png')).toBe(false);
    expect(isSafeDataUrl('data:image/png;base64,')).toBe(false);
    expect(isSafeDataUrl(undefined)).toBe(false);
  });
});

describe('سياسة CSP', () => {
  const html = `<!doctype html><html><head><script>var a=1;</script><script src="/x.js"></script></head><body></body></html>`;

  it('يستخرج السكربتات المضمَّنة فقط', () => {
    expect(extractInlineScripts(html)).toEqual(['var a=1;']);
  });

  it('البصمة تُحسب وتظهر في script-src', () => {
    const hash = inlineScriptHash('var a=1;');
    expect(hash).toMatch(/^'sha256-[A-Za-z0-9+/=]+'$/);

    const policy = buildCspPolicy({ html });
    expect(policy).toContain(hash);
    expect(policy).toContain("script-src 'self'");
  });

  it('السياسة تمرّ الفحص الأمني ولا تحوي unsafe-eval أو unsafe-inline في السكربتات', () => {
    const policy = buildCspPolicy({ html });
    const verdict = validateCspPolicy(policy);
    expect(verdict.problems).toEqual([]);
    expect(verdict.ok).toBe(true);
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(CSP_DIRECTIVES['script-src']).toEqual(["'self'"]);
  });

  it('الفحص يرفض سياسة ضعيفة', () => {
    const weak = validateCspPolicy("default-src *; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*");
    expect(weak.ok).toBe(false);
    expect(weak.problems.length).toBeGreaterThanOrEqual(3);
  });

  it('الحقن يضع الوسم داخل head مرة واحدة فقط', () => {
    const once = injectCspMeta(html);
    expect(once).toContain('http-equiv="Content-Security-Policy"');
    expect(once.indexOf('<meta http-equiv')).toBeLessThan(once.indexOf('</head>'));
    expect(injectCspMeta(once)).toBe(once);
  });
});
