#!/usr/bin/env node
/**
 * بوابة قرار النمط المعماري (R34 — البند 8).
 *
 * القرار المعماري ليس كوداً، لكنه قابل للفحص:
 *   D1 الملف موجود وبالعنوان الصحيح
 *   D2 الأقسام الإلزامية موجودة (السياق · الخيارات · المصفوفة · القرار · شروط الانتقال · لا رجعة · المعايير)
 *   D3 الخيارات الثلاثة مذكورة ومفاضَلة بأوزان صريحة
 *   D4 قرار صريح مكتوب (لا «قيد الدراسة»)
 *   D5 **كل ملف يشير إليه القرار موجود فعلاً في المستودع** (لا استشهاد وهمي)
 *   D6 كل رابط داخلي في القرار يُحلّ إلى ملف حقيقي
 *   D7 القرار مُكتشَف: `README.md` و`PRD.md` يربطان إليه
 *   D8 البوابة نفسها مسجّلة في `package.json` و`verify` والـ CI
 *
 * التشغيل: node tools/audit/check_decision_doc.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const DOC_REL = 'docs/تدقيق/08-قرار-النمط-المعماري.md';
const DOC_PATH = path.join(ROOT, DOC_REL);

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// D1 وجود الملف
const docExists = exists(DOC_REL);
check('D1 · ملف القرار المعماري موجود', docExists, DOC_REL);
const doc = docExists ? fs.readFileSync(DOC_PATH, 'utf8') : '';

// D2 الأقسام الإلزامية
const REQUIRED_SECTIONS = [
  '## 1) السياق',
  '## 3) الخيارات المطروحة',
  '## 4) مصفوفة التقييم',
  '## 5) القرار وتبريره',
  '## 6) شروط الانتقال',
  '## 8) نقاط لا رجعة',
  '## 10) معايير قبول هذا القرار',
];
const missingSections = REQUIRED_SECTIONS.filter((section) => !doc.includes(section));
check(
  'D2 · كل الأقسام الإلزامية موجودة',
  docExists && missingSections.length === 0,
  missingSections.join(' · ') || `${REQUIRED_SECTIONS.length}/${REQUIRED_SECTIONS.length}`
);

// D3 الخيارات الثلاثة + أوزان
const options = ['الخيار (أ)', 'الخيار (ب)', 'الخيار (ج)'].filter((label) => doc.includes(label));
const weights = (doc.match(/×[23]/g) || []).length;
check(
  'D3 · الخيارات الثلاثة مفاضَلة بأوزان صريحة',
  options.length === 3 && weights >= 8 && /المجموع المرجّح/.test(doc),
  `خيارات ${options.length}/3 · أوزان ${weights}`
);

// D4 قرار صريح
check(
  'D4 · قرار صريح مُعتمد (لا «قيد الدراسة»)',
  /\*\*القرار:\*\*/.test(doc) && /المُعتمد/.test(doc) && !/قيد الدراسة|سيُحسم لاحقاً/.test(doc),
  /المُعتمد/.test(doc) ? 'مكتوب ومُعتمد' : 'غير حاسم'
);

// D5 كل مرجع ملف موجود فعلاً (فحص مسارات حقيقي)
const referenced = [...doc.matchAll(/`((?:src|docs|tools)\/[^`]+?\.(?:ts|tsx|mjs|md|json))`/g)].map((m) => m[1]);
const uniqueRefs = [...new Set(referenced)];
const missingRefs = uniqueRefs.filter((rel) => !exists(rel));
check(
  'D5 · كل ملف يشير إليه القرار موجود في المستودع',
  uniqueRefs.length >= 8 && missingRefs.length === 0,
  missingRefs.length ? `مفقود: ${missingRefs.join(' · ')}` : `${uniqueRefs.length} مرجعاً كلها موجودة`
);

// D6 الروابط الداخلية تُحلّ
const docDir = path.dirname(DOC_PATH);
const links = [...doc.matchAll(/\]\((\.[^)]+?)\)/g)].map((m) => m[1]);
const brokenLinks = links.filter((link) => !fs.existsSync(path.resolve(docDir, link)));
check(
  'D6 · كل رابط داخلي في القرار يُحلّ إلى ملف حقيقي',
  links.length >= 3 && brokenLinks.length === 0,
  brokenLinks.length ? brokenLinks.join(' · ') : `${links.length} رابطاً`
);

// D7 الوصول: README + PRD
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const prd = fs.readFileSync(path.join(ROOT, 'PRD.md'), 'utf8');
check(
  'D7 · القرار مُكتشَف من README وPRD',
  readme.includes('08-قرار-النمط-المعماري.md') && prd.includes('08-قرار-النمط-المعماري.md')
);

// D8 التسجيل في الأدوات والـ CI
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'verify.yml'), 'utf8');
check(
  'D8 · البوابة مسجّلة في package.json وverify والـ CI',
  Boolean(pkg.scripts?.['docs:decision']) &&
    (/docs:decision|check_decision_doc\.mjs/.test(String(pkg.scripts?.verify || ''))) &&
    workflow.includes('npm run docs:decision')
);

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة بوابة القرار المعماري (docs:decision) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
