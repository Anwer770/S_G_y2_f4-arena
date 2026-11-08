#!/usr/bin/env node
/**
 * اختبار انحدار: نقاط الاستعادة المشفّرة + صدق الادعاءات (إصلاح R17)
 *
 * يثبت ثلاث طبقات:
 *   1) وظيفي: تشفير AES-GCM حقيقي عبر `src/utils/snapshotCrypto.ts`
 *      (دوران كامل · رفض الرمز الخاطئ · لا تسريب نص صريح · salt/IV مختلفان لكل عملية).
 *   2) مصدري: `DatabasesTab` لا يضع علامة تشفير بلا تشفير، ويستعمل الدالتين فعلياً.
 *   3) ادعاءات: لا «Google Drive» ولا «نقاط استعادة سحابية» ولا مزامنة سحابية في الواجهة،
 *      ولا `GEMINI` في ملفات النشر (تكملة R11).
 *
 * التشغيل: node tools/regression/snapshots.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ── بناء وحدة التشفير للاختبار (نفس مصدر التطبيق)
const BUNDLE = path.join(ROOT, 'docs', 'تدقيق', '.snapshot-crypto.mjs');
execFileSync(
  path.join(ROOT, 'node_modules', '.bin', 'esbuild'),
  [
    path.join(ROOT, 'src', 'utils', 'snapshotCrypto.ts'),
    '--bundle',
    '--format=esm',
    `--outfile=${BUNDLE}`,
    '--log-level=error',
  ],
  { stdio: 'inherit' }
);
const cryptoMod = await import(url.pathToFileURL(BUNDLE).href);
const { encryptSnapshot, decryptSnapshot, isEncryptedSnapshotPayload } = cryptoMod;

const SAMPLE = {
  exportedAt: '2026-11-08T00:00:00.000Z',
  modules: {
    customers: { items: [{ id: 'c1', name: 'شركة النور التجارية', phone: '0555123456' }] },
    financial: { items: [{ id: 'f1', amount: 1250, note: 'سند قبض' }] },
  },
};

// 1) دوران كامل
let payload = null;
let roundtripOk = false;
try {
  payload = await encryptSnapshot(SAMPLE, '4821');
  const back = await decryptSnapshot(payload, '4821');
  roundtripOk = JSON.stringify(back) === JSON.stringify(SAMPLE);
} catch (err) {
  console.log('   تفصيل:', err?.message);
}
check('S1 · التشفير وفك التشفير يعيدان البيانات نفسها حرفياً', roundtripOk);

// 2) الرمز الخاطئ يُرفض
let wrongPinRejected = false;
let wrongPinMsg = '';
try {
  await decryptSnapshot(payload, '0000');
} catch (err) {
  wrongPinRejected = true;
  wrongPinMsg = err?.message || '';
}
check('S2 · الرمز الخاطئ لا يفتح النسخة (لا استعادة صامتة)', wrongPinRejected, wrongPinMsg);

// 3) لا نص صريح داخل المغلّف
const serialized = payload ? JSON.stringify(payload) : '';
const leaks = ['شركة النور', 'customers', 'financial', '1250', '0555123456'].filter((m) => serialized.includes(m));
check('S3 · المغلّف المشفّر لا يحوي أي بيانات صريحة', leaks.length === 0,
  leaks.length ? 'تسريب: ' + leaks.join(' · ') : `${serialized.length} حرفاً مشفّراً`);

// 4) salt/IV عشوائيان لكل عملية
const second = await encryptSnapshot(SAMPLE, '4821');
check('S4 · salt وIV مختلفان في عمليتين بنفس البيانات والرمز',
  second.salt !== payload.salt && second.iv !== payload.iv,
  'salt/iv عشوائيان');

// 5) شكل المغلّف وحارسه
const shapeOk = isEncryptedSnapshotPayload(payload) &&
  payload.cipher === 'AES-GCM-256' &&
  payload.kdf === 'PBKDF2-SHA256' &&
  payload.iterations >= 100000 &&
  payload.v === 1;
check('S5 · المغلّف موسوم بالإصدار والخوارزمية وعدد دورات KDF', shapeOk,
  payload ? `${payload.cipher} · ${payload.kdf} · ${payload.iterations}` : 'بلا مغلّف');

const plainObj = { items: [{ id: 'c1' }], exportedAt: 'x' };
check('S6 · حارس النوع يرفض البيانات الصريحة (لا خلط بين الحالتين)',
  isEncryptedSnapshotPayload(payload) && !isEncryptedSnapshotPayload(plainObj));

// 7) تحقق صيغة الرمز
let weakPinRejected = 0;
for (const bad of ['123', 'abcde', '']) {
  try {
    await encryptSnapshot(SAMPLE, bad);
  } catch {
    weakPinRejected += 1;
  }
}
check('S7 · تُرفض رموز PIN غير المكوّنة من 4 أرقام', weakPinRejected === 3, `${weakPinRejected}/3`);

// ── 2) المصدري: لا علامة تشفير بلا تشفير
const dbTab = read('src/components/settings/tabs/DatabasesTab.tsx');
check('S8 · `DatabasesTab` يشفّر فعلياً ويفك التشفير عبر الدوال الحقيقية',
  dbTab.includes('encryptSnapshot(') && /decryptSnapshot[<(]/.test(dbTab) &&
  dbTab.includes('isEncryptedSnapshotPayload('));
check('S9 · علامة `isEncrypted` مشتقة من وجود مغلّف مشفّر لا من مجرد كتابة PIN',
  /isEncrypted:\s*!!payload/.test(dbTab) && !/isEncrypted:\s*usePin/.test(dbTab));
check('S10 · لا تُخزَّن بيانات صريحة مع نقطة مشفّرة (`data: null` عند التشفير)',
  /storedData\s*=\s*null/.test(dbTab) && /data:\s*storedData/.test(dbTab));

// ── 3) صدق الادعاءات في الواجهة وملفات النشر
const claimHits = [];
const AFFIRMATIVE_CLAIMS = {
  'النسخ الاحتياطي على Google Drive': /النسخ الاحتياطي على Google Drive/,
  'ربط حساب Google Drive': /ربط حساب Google Drive/,
  'نقاط الاستعادة السحابية': /نقاط الاستعادة السحابية/,
  'المزامنة السحابية': /المزامنة السحابية/,
  'نسخة مشفرة عند التصدير': /نسخة كاملة مشفرة/,
};
for (const [label, re] of Object.entries(AFFIRMATIVE_CLAIMS)) if (re.test(dbTab)) claimHits.push(label);
check('S11 · لا ادعاء سحابي/Google Drive/تشفير مضلّل في إعدادات قواعد البيانات', claimHits.length === 0,
  claimHits.length ? claimHits.join(' · ') : '0 إصابة');
check('S11ب · الواجهة تصرّح صراحةً بعدم وجود ربط سحابي (لا حذف صامت للميزة)',
  /لا يوجد ربط مبرمج/.test(dbTab));

const aiHits = [];
for (const f of ['metadata.json', '.env.example', 'README.md', 'index.html', 'vite.config.ts']) {
  if (fs.existsSync(path.join(ROOT, f)) && /GEMINI|MAJOR_CAPABILITY|@google\/genai/i.test(read(f))) aiHits.push(f);
}
check('S12 · لا ادعاء Gemini/AI في ملفات النشر (تكملة R11)', aiHits.length === 0,
  aiHits.length ? aiHits.join(' · ') : '0 إصابة');

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة اختبار نقاط الاستعادة المشفّرة (snapshots) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
