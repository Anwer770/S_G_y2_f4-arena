#!/usr/bin/env node
/**
 * اختبار انحدار: سياسة أمان المحتوى (CSP) — R32.
 *
 * يقيس **المخرج الحقيقي** لا النية:
 *   C1 وحدة CSP تُجزيء وتُحمّل من المصدر نفسه
 *   C2 بصمة كل سكربت مضمَّن في `index.html` تُحسب وتطابق ما يُنتج السياسة
 *   C3 السياسة الناتجة تمرّ الفحص الأمني (بلا unsafe-inline/unsafe-eval في script-src)
 *   C4 وسم CSP يُحقن في نسخة البناء `dist/index.html` (يجب `npm run build` قبله)
 *   C5 كل `<script>` في `dist/index.html` إما خارجي (self) أو مضمَّن وبصمته في السياسة
 *   C6 سياسة Vite تقيّد الحقن بمرحلة البناء (لا تكسر خادم التطوير/HMR)
 *
 * التشغيل: npm run build && node tools/regression/csp.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { read } from './_source.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ── 1) تجزيء وحدة CSP من المصدر
const BUNDLE = path.join(ROOT, 'docs', 'تدقيق', '.csp-bundle.mjs');
fs.mkdirSync(path.dirname(BUNDLE), { recursive: true });
execFileSync(
  path.join(ROOT, 'node_modules', '.bin', 'esbuild'),
  [path.join(ROOT, 'src', 'utils', 'security', 'csp.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${BUNDLE}`, '--log-level=error'],
  { stdio: 'inherit' }
);
const csp = await import(url.pathToFileURL(BUNDLE).href);
check('C1 · وحدة CSP تُجزيء وتُحمّل', typeof csp.buildCspPolicy === 'function' && typeof csp.injectCspMeta === 'function');

// ── 2) سياسة مبنية من index.html الحقيقي
const indexHtml = read('index.html');
const policy = csp.buildCspPolicy({ html: indexHtml });
const inlineScripts = csp.extractInlineScripts(indexHtml);
const expectedHashes = inlineScripts.map(
  (body) => `'sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}'`
);
check(
  'C2 · بصمات السكربتات المضمَّنة محسوبة من النص الفعلي',
  inlineScripts.length >= 1 && expectedHashes.every((h) => policy.includes(h)),
  `${inlineScripts.length} سكربت مضمَّن · ${expectedHashes.length} بصمة`
);

const verdict = csp.validateCspPolicy(policy);
check('C3 · السياسة تمرّ الفحص الأمني', verdict.ok, verdict.problems.join(' · ') || 'بلا ملاحظات');
check(
  'C3b · script-src بلا unsafe-inline/unsafe-eval وبلا نجمة',
  !/'unsafe-(inline|eval)'/.test((policy.match(/script-src[^;]*/) || [''])[0]) && !/script-src[^;]*\*/.test(policy)
);
check(
  'C3c · لا تُسمح سكربتات من أصل خارجي',
  !/script-src[^;]*https?:/.test(policy) && !/script-src[^;]*\/\//.test(policy)
);

// ── 3) نسخة البناء الفعلية
const distPath = path.join(ROOT, 'dist', 'index.html');
const hasDist = fs.existsSync(distPath);
check(
  'C4 · dist/index.html مبني ويحوي وسم CSP',
  hasDist && /http-equiv=["']Content-Security-Policy["']/i.test(fs.readFileSync(distPath, 'utf8')),
  hasDist ? '' : 'شغّل `npm run build` أولاً'
);

let builtPolicy = '';
let builtInline = [];
if (hasDist) {
  const built = fs.readFileSync(distPath, 'utf8');
  // القيمة محاطة بعلامات تنصيص مزدوجة وداخلها علامات مفردة (الكلمات المفتاحية) ⇒ لا نقطع عندها
  const match =
    /http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]+)"/i.exec(built) ||
    /content="([^"]+)"[^>]*http-equiv=["']Content-Security-Policy["']/i.exec(built);
  builtPolicy = (match ? match[1] : '').replace(/&quot;/g, '"');
  builtInline = csp.extractInlineScripts(built);

  const builtVerdict = csp.validateCspPolicy(builtPolicy);
  check(
    'C4b · سياسة النسخة المبنية تمرّ الفحص',
    builtPolicy.length > 0 && builtVerdict.ok,
    builtVerdict.problems.join(' · ') || 'بلا ملاحظات'
  );

  const sha = (body) => crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  const missing = builtInline.filter((body) => !builtPolicy.includes(`sha256-${sha(body)}`));
  check(
    'C5 · كل سكربت مضمَّن في النسخة المبنية له بصمة مطابقة في السياسة',
    missing.length === 0,
    `${builtInline.length} سكربت مضمَّن · ${missing.length} بلا بصمة`
  );
}

// ── 4) الحقن مقيّد بالبناء
const viteConfig = read('vite.config.ts');
check(
  'C6 · حقن CSP مقيّد بمرحلة البناء (apply: build) فلا يتعطّل خادم التطوير',
  /inject-csp/.test(viteConfig) && /apply:\s*'build'/.test(viteConfig) && /injectCspMeta/.test(viteConfig)
);

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة سياسة أمان المحتوى (csp) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (builtPolicy) console.log(`السياسة: ${builtPolicy.replace(/&quot;/g, '"').slice(0, 240)}…`);
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
