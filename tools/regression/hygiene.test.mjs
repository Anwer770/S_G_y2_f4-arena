#!/usr/bin/env node
/**
 * بوابة النظافة (Hygiene) — تحرس المستودع من التراكم: ملفات ميتة، سجلات،
 * علامات مؤجلة، مخرجات بناء محفوظة، وتبعيات غير مستخدمة.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const results = [];
const check = (n, ok, d = '') => {
  results.push({ n, ok });
  console.log(`${ok ? '✔' : '✗'} ${n}${d ? ' — ' + d : ''}`);
};

const walk = (dir, acc = []) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (['node_modules', 'dist', 'dev-dist', '.git'].includes(entry)) continue;
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
};

const srcFiles = walk(path.join(ROOT, 'src'));
const rel = (f) => path.relative(ROOT, f);

/* H1 — لا ملفات يتيمة: كل ملف يُستورد من مكان ما (عدا نقطة الدخول) */
const referenced = new Set();
for (const file of srcFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const re = /from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(text))) {
    const spec = m[1] || m[2];
    if (!spec.startsWith('.')) continue;
    const abs = path.resolve(path.dirname(file), spec);
    for (const candidate of [abs, `${abs}.ts`, `${abs}.tsx`, path.join(abs, 'index.ts'), path.join(abs, 'index.tsx')]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) referenced.add(path.resolve(candidate));
    }
  }
}
const orphans = srcFiles.filter((f) => !referenced.has(path.resolve(f)) && !/main\.tsx$/.test(f));
check('H1 · لا ملفات مصدرية يتيمة (كل ملف مستورد)', orphans.length === 0, orphans.map(rel).join(' · '));

/* H2 — لا console.log في كود التطبيق */
const logFiles = srcFiles.filter((f) => /console\.log\s*\(/.test(fs.readFileSync(f, 'utf8')));
check('H2 · لا console.log في src', logFiles.length === 0, logFiles.map(rel).join(' · '));

/* H3 — لا علامات مؤجلة (TODO/FIXME) */
const todoFiles = srcFiles.filter((f) => /(\/\/|\/\*)\s*(TODO|FIXME)\b/.test(fs.readFileSync(f, 'utf8')));
check('H3 · لا علامات TODO/FIXME متروكة', todoFiles.length === 0, todoFiles.map(rel).join(' · '));

/* H4 — لا مخرجات بناء أو حزم اختبار محفوظة */
const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
const trackedArtifacts = tracked.filter(
  (f) => /^(dist|dev-dist)\//.test(f) || /^server\.js$/.test(f) || /^standalone_app\.html$/.test(f) || /bundle\.mjs$/.test(f) || /\.map$/.test(f)
);
check('H4 · لا مخرجات بناء أو حزم اختبار محفوظة في git', trackedArtifacts.length === 0, trackedArtifacts.slice(0, 6).join(' · '));

/* H5 — كل التبعيات مستخدمة فعلاً */
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const depNames = Object.keys(pkg.dependencies || {}).filter((d) => !d.startsWith('@types/'));
const haystack = [
  ...srcFiles.map((f) => fs.readFileSync(f, 'utf8')),
  fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8'),
  fs.existsSync(path.join(ROOT, 'index.html')) ? fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') : '',
  JSON.stringify(pkg.scripts || {}),
].join('\n');
const unusedDeps = depNames.filter((d) => !new RegExp(`(from\\s*['"]|require\\(['"]|import\\s*['"])${d.replace(/[/@.]/g, (c) => '\\' + c)}`).test(haystack));
check('H5 · لا تبعيات غير مستخدمة في dependencies', unusedDeps.length === 0, unusedDeps.join(' · '));

/* H6 — لا ملف مصدري يتجاوز 100KB (حد الصيانة) */
const big = srcFiles
  .map((f) => ({ f: rel(f), kb: Math.round(fs.statSync(f).size / 1024) }))
  .filter((x) => x.kb > 100)
  .sort((a, b) => b.kb - a.kb);
check('H6 · لا ملف يتجاوز 100KB', big.length === 0, big.map((x) => `${x.f} ${x.kb}KB`).join(' · '));

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة فحص النظافة (hygiene) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (passed < results.length) process.exit(1);
console.log('✔ نجح الاختبار');
