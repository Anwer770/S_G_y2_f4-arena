#!/usr/bin/env node
/**
 * اختبار انحدار: هوية التطبيق وإصداره الواحد (إصلاح R7 · R10 · R11)
 *
 * يثبت أن الإصدار والاسم لهما **مصدر واحد** (`src/constants/appMeta.ts`) يقرأه:
 *   الحزمة (`package.json`) · بيانات النشر (`metadata.json`) · PWA (`vite.config.ts`)
 *   · صفحة الدخول (`LoginScreen.tsx`) · عنوان الصفحة (`main.tsx`) · التوثيق (`PRD.md`).
 *
 * ويثبت أيضاً زوال ادعاءين موثّقين في سجل المخاطر:
 *   - R11: لا `GEMINI` ولا مفاتيح API ولا صلاحيات غير مستخدمة (ميكروفون) في أي مكان.
 *   - R10: `standalone_app.html` لم يبقَ في الجذر، بل أُرشف في `legacy/` بتوضيح.
 *
 * التشغيل: node tools/regression/identity.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ─────────────────────────────── 1) المصدر الوحيد
const metaPath = 'src/constants/appMeta.ts';
check('I1 · ملف الهوية الوحيد موجود ويُصدّر الاسم والإصدار', exists(metaPath));
const metaSrc = exists(metaPath) ? read(metaPath) : '';
const grab = (key) => (metaSrc.match(new RegExp(`export const ${key} = '([^']+)'`)) || [])[1] || null;

const APP_NAME = grab('APP_NAME');
const APP_SHORT_NAME = grab('APP_SHORT_NAME');
const APP_TAGLINE = grab('APP_TAGLINE');
const APP_VERSION = grab('APP_VERSION');
const hasAll = !!(APP_NAME && APP_SHORT_NAME && APP_TAGLINE && APP_VERSION);
check('I2 · الثوابت الأربعة معرّفة بقيم فعلية', hasAll,
  hasAll ? `${APP_NAME} · ${APP_SHORT_NAME} · ${APP_VERSION}` : 'ثابت مفقود');

// ─────────────────────────────── 2) تطابق الحزمة والنشر والتوثيق
const pkg = JSON.parse(read('package.json'));
check('I3 · إصدار `package.json` = `APP_VERSION`', pkg.version === APP_VERSION,
  `package=${pkg.version} · appMeta=${APP_VERSION}`);

const meta = JSON.parse(read('metadata.json'));
check('I4 · `metadata.json` (الاسم والإصدار) مطابق للمصدر الوحيد',
  meta.name === APP_NAME && meta.version === APP_VERSION,
  `name=${meta.name} · version=${meta.version}`);

const prdVersion = (read('PRD.md').match(/\|\s*\*\*الإصدار\*\*\s*\|\s*`([0-9]+\.[0-9]+\.[0-9]+)`/) || [])[1] || null;
check('I5 · إصدار `PRD.md` = `APP_VERSION` (التوثيق يقرأ المصدر نفسه)', prdVersion === APP_VERSION,
  `prd=${prdVersion} · appMeta=${APP_VERSION}`);

// ─────────────────────────────── 3) PWA والصفحة
const viteCfg = read('vite.config.ts');
const pwaOk = viteCfg.includes("from './src/constants/appMeta'") &&
  /name:\s*APP_NAME/.test(viteCfg) &&
  /short_name:\s*APP_SHORT_NAME/.test(viteCfg) &&
  /description:\s*APP_TAGLINE/.test(viteCfg);
check('I6 · بيانات PWA تُقرأ من الثوابت (لا اسم منتج مكتوب نصياً)', pwaOk,
  pwaOk ? 'name/short_name/description = APP_*' : 'PWA ما زال يستخدم نصوصاً ثابتة');

const titleTag = (read('index.html').match(/<title>([^<]+)<\/title>/) || [])[1] || '';
check('I7 · عنوان `index.html` = `APP_NAME`', titleTag.trim() === APP_NAME, `title="${titleTag.trim()}"`);

const mainSrc = read('src/main.tsx');
check('I8 · `main.tsx` يضبط عنوان الصفحة من الثوابت',
  mainSrc.includes('APP_VERSION_LABEL') && /document\.title\s*=/.test(mainSrc));

const loginSrc = read('src/components/auth/LoginScreen.tsx');
check('I9 · شاشة الدخول تعرض الإصدار من الثابت لا من رقم مكتوب',
  loginSrc.includes('APP_VERSION_LABEL') && loginSrc.includes('APP_NAME') && !/v[0-9]+\.[0-9]+\.[0-9]+/.test(loginSrc));

// ─────────────────────────────── 4) لا إصدارات/أسماء نسخ مكرّرة في src
const offenders = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      const rel = path.relative(ROOT, p);
      if (rel === metaPath) continue;
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((line, i) => {
        // إصدارات مخطط البيانات الموثّقة في تعليق (`// ... v1.0.0`) ليست إصدار التطبيق
        const code = line.replace(/\/\/.*$/, '');
        for (const m of code.matchAll(/\bv\d+\.\d+\.\d+\b/g)) offenders.push(`${rel}:${i + 1}:${m[0]}`);
      });
    }
  }
};
walk(path.join(ROOT, 'src'));
check('I10 · لا يوجد رقم إصدار معروض نصياً داخل `src` خارج ملف الهوية', offenders.length === 0,
  offenders.length ? offenders.slice(0, 3).join(' · ') : '0 إصابة');

// ─────────────────────────────── 5) R11: لا ادعاء AI ولا مفاتيح ولا صلاحيات غير مستخدمة
const aiFiles = ['metadata.json', '.env.example', 'README.md', 'index.html', 'vite.config.ts', 'src/main.tsx'];
const aiHits = [];
for (const f of aiFiles) {
  if (!exists(f)) continue;
  const txt = read(f);
  if (/GEMINI|MAJOR_CAPABILITY|generativeai|@google\/genai/i.test(txt)) aiHits.push(f);
}
check('I11 · لا ادعاء Gemini/AI ولا مفاتيح API في ملفات النشر والتشغيل', aiHits.length === 0,
  aiHits.length ? 'إصابة في: ' + aiHits.join(' · ') : '0 إصابة');

const srcAll = [];
const collect = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) srcAll.push(fs.readFileSync(p, 'utf8'));
  }
};
collect(path.join(ROOT, 'src'));
const allSrc = srcAll.join('\n');
const unusedPerms = [];
if (/getUserMedia|mediaDevices/.test(allSrc)) unusedPerms.push('getUserMedia مستخدم بلا صلاحية معلنة');
if (/microphone/.test(read('metadata.json'))) unusedPerms.push('metadata.json يطلب ميكروفوناً');
if (/GEMINI_API_KEY/.test(read('.env.example'))) unusedPerms.push('.env.example يحوي GEMINI_API_KEY');
check('I12 · لا صلاحيات مطلوبة بلا استخدام (الميكروفون) ولا متغيّرات بيئة وهمية', unusedPerms.length === 0,
  unusedPerms.length ? unusedPerms.join(' · ') : '0 إصابة');

// ادعاءات غير منفّذة في واجهة «عن التطبيق»
const aboutSrc = exists('src/components/settings/tabs/AboutAppTab.tsx') ? read('src/components/settings/tabs/AboutAppTab.tsx') : '';
const aboutClaims = [];
if (/تشفير البيانات محلياً وسحابياً/.test(aboutSrc)) aboutClaims.push('تشفير سحابي');
if (/v\d+\.\d+\.\d+/.test(aboutSrc.replace(/\/\/.*$/gm, ''))) aboutClaims.push('إصدار مكتوب نصياً');
check('I16 · «عن التطبيق» لا يدّعي تشفيراً سحابياً ويعرض الإصدار من الثابت', aboutClaims.length === 0,
  aboutClaims.length ? aboutClaims.join(' · ') : 'نظيف');

// ─────────────────────────────── 6) R10: النسخة اليتيمة مؤرشفة لا معتمدة
check('I13 · `standalone_app.html` لم يبقَ في الجذر (أُرشف في `legacy/`)',
  !exists('standalone_app.html') && exists('legacy/standalone_app_v2.7.html'),
  exists('legacy/standalone_app_v2.7.html') ? 'legacy/standalone_app_v2.7.html' : 'النسخة المؤرشفة مفقودة');

const legacyDoc = exists('legacy/README.md') ? read('legacy/README.md') : '';
check('I14 · `legacy/README.md` يوضّح أن الملف غير مدعوم وغير مستورد', /غير مدعوم/.test(legacyDoc));

const refsToLegacy = [];
for (const f of ['src/main.tsx', 'vite.config.ts', 'index.html']) {
  if (exists(f) && /standalone_app/.test(read(f))) refsToLegacy.push(f);
}
check('I15 · لا مرجع للنسخة المؤرشفة من نقطة الدخول أو البناء', refsToLegacy.length === 0,
  refsToLegacy.length ? refsToLegacy.join(' · ') : '0 مرجع');

// ─────────────────────────────── الحصيلة
const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة اختبار الهوية والإصدار (identity) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
