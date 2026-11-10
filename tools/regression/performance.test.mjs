/**
 * R58 — بوابة ميزانية الإقلاع.
 *
 * لا تقيس ضغط gzip ولا الحزم التي ينتقل إليها المستخدم لاحقاً؛ تقيس المورد JS الأساسي
 * الذي يبدأ به المتصفح وملفات modulepreload، لأنهما ما يحجبان الرسم الأول. يجب تشغيل
 * `npm run build` قبلها حتى تُفحص الحزمة الفعلية لا تخمينات المصدر.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const ASSETS = path.join(DIST, 'assets');
const MAX_BOOT_ENTRY_BYTES = 1_450_000;

const read = (file) => fs.readFileSync(file, 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(fs.existsSync(path.join(DIST, 'index.html')), 'R58: شغّل npm run build قبل بوابة الأداء.');
const html = read(path.join(DIST, 'index.html'));
const entry = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/i)?.[1];
assert(entry, 'R58: لم يُعثر على سكربت module ابتدائي في dist/index.html.');

const entryPath = path.join(DIST, entry.replace(/^\//, ''));
assert(fs.existsSync(entryPath), `R58: ملف البداية غير موجود: ${entry}`);
const entryBytes = fs.statSync(entryPath).size;
const preloads = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/gi)].map((match) => match[1]);
const assets = fs.readdirSync(ASSETS);
const reactAsset = assets.find((name) => /^vendor-react-.*\.js$/.test(name));
const reactBytes = reactAsset ? fs.statSync(path.join(ASSETS, reactAsset)).size : 0;
const routerSource = read(path.resolve('src/app/router/AppRouter.tsx'));

const failures = [];
if (entryBytes > MAX_BOOT_ENTRY_BYTES) {
  failures.push(
    `entry=${entryBytes.toLocaleString('en-US')}B يتجاوز ميزانية ${MAX_BOOT_ENTRY_BYTES.toLocaleString('en-US')}B`
  );
}
if (reactBytes < 10_000) {
  failures.push(`vendor-react غير فعّال (${reactBytes}B)`);
}
if (routerSource.includes('allTabs = [')) {
  failures.push('الموجّه يعيد تسخين كل التبويبات بعد الإقلاع');
}
for (const heavyVendor of ['vendor-xlsx-', 'vendor-charts-']) {
  if (preloads.some((href) => href.includes(heavyVendor))) {
    failures.push(`${heavyVendor.slice(0, -1)} يُحمَّل قبل أول تفاعل`);
  }
}

if (failures.length) {
  throw new Error(`R58: انحدار ميزانية الإقلاع — ${failures.join(' · ')}`);
}

console.log(
  `✔ R58 · entry ${(entryBytes / 1024).toFixed(2)} KiB ≤ ${(MAX_BOOT_ENTRY_BYTES / 1024).toFixed(2)} KiB · ` +
    `vendor-react ${(reactBytes / 1024).toFixed(2)} KiB · preloads: ${preloads.length}`
);
