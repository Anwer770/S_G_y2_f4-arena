#!/usr/bin/env node
/**
 * بوابة سلامة الأنواع (R50) — `strictNullChecks` خارج الواجهة.
 *
 * السبب: `tsconfig` يترك `strictNullChecks` معطّلاً، فأي قيمة `undefined` تُقرأ بلا حماية
 * تمرّ من المترجم وتنفجر وقت التشغيل. وقد وقع هذا فعلاً في R50:
 * `InventoryService.calculateCurrentStock` يعلن `settings?` ثم يمرّرها إلى دالة تقرأ
 * `settings.skipCancelled` ⇒ `TypeError` حقيقي.
 *
 * القاعدة: طبقة البيانات (`src/services` · `src/utils` · `src/database` · `src/core` ·
 * `src/sync` · `src/types` · `src/data` · `src/app` · `tests/`) يجب أن تكون **صفر أخطاء**،
 * والواجهة (`src/components/**`) مسموح لها بالتراكم القائم فقط — سقف لا يزيد.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI_PREFIX = 'src/components/';
const baseline = Number(
  JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/regression/type-safety.baseline.json'), 'utf8')).uiErrors
);

let output = '';
try {
  execFileSync(process.execPath, ['./node_modules/typescript/bin/tsc', '--noEmit', '--strictNullChecks'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (error) {
  output = `${error.stdout || ''}${error.stderr || ''}`;
}

const errors = output
  .split('\n')
  .filter((line) => /^\S+\(\d+,\d+\): error TS\d+/.test(line))
  .map((line) => line.trim());

const uiErrors = errors.filter((line) => line.startsWith(UI_PREFIX));
const dataErrors = errors.filter((line) => !line.startsWith(UI_PREFIX));

let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures += 1;
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

check(
  'T1 · طبقة البيانات (services/utils/database/core/sync/app/tests) بلا أي خطأ نوعي',
  dataErrors.length === 0,
  dataErrors.length ? `${dataErrors.length} خطأ · أولها: ${dataErrors[0]}` : '0 خطأ'
);

check(
  'T2 · الواجهة لا تزيد أخطاءها عن السقف المسجَّل (تراكم ناقص فقط)',
  uiErrors.length <= baseline,
  `${uiErrors.length} من ${baseline}`
);

console.log('\n════════ حصيلة سلامة الأنواع ════════');
console.log(`البيانات: ${dataErrors.length} خطأ · الواجهة: ${uiErrors.length} خطأ (السقف ${baseline})`);
if (failures > 0) {
  console.log(`✖ فشل الاختبار (${failures})`);
  process.exit(1);
}
console.log('✔ نجح الاختبار');
