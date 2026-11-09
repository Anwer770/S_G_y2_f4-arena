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
// ملفات الإعداد الجذرية تُستورد منها وحدات بناء (مثل سياسة CSP في vite.config.ts) ⇒ ليست يتيمة
const rootConfigs = ['vite.config.ts', 'vitest.config.ts']
  .map((f) => path.join(ROOT, f))
  .filter((f) => fs.existsSync(f));
for (const file of [...srcFiles, ...rootConfigs]) {
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
  (f) =>
    /^(dist|dev-dist)\//.test(f) ||
    /^server\.js$/.test(f) ||
    /^standalone_app\.html$/.test(f) ||
    /bundle\.mjs$/.test(f) ||
    /\.map$/.test(f)
);
check(
  'H4 · لا مخرجات بناء أو حزم اختبار محفوظة في git',
  trackedArtifacts.length === 0,
  trackedArtifacts.slice(0, 6).join(' · ')
);

/* H5 — كل التبعيات مستخدمة فعلاً */
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const depNames = Object.keys(pkg.dependencies || {}).filter((d) => !d.startsWith('@types/'));
const haystack = [
  ...srcFiles.map((f) => fs.readFileSync(f, 'utf8')),
  fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8'),
  fs.existsSync(path.join(ROOT, 'index.html')) ? fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') : '',
  JSON.stringify(pkg.scripts || {}),
].join('\n');
const unusedDeps = depNames.filter(
  (d) =>
    !new RegExp(`(from\\s*['"]|require\\(['"]|import\\s*['"])${d.replace(/[/@.]/g, (c) => '\\' + c)}`).test(haystack)
);
check('H5 · لا تبعيات غير مستخدمة في dependencies', unusedDeps.length === 0, unusedDeps.join(' · '));

/* H6 — لا ملف مصدري يتجاوز 100KB (حد الصيانة) */
const big = srcFiles
  .map((f) => ({ f: rel(f), kb: Math.round(fs.statSync(f).size / 1024) }))
  .filter((x) => x.kb > 100)
  .sort((a, b) => b.kb - a.kb);
check('H6 · لا ملف يتجاوز 100KB', big.length === 0, big.map((x) => `${x.f} ${x.kb}KB`).join(' · '));

/* H7 — ميزانية any: نوع صريح بدل any في كل المواضع النوعية (ratchet = 0) */
const ANY_BUDGET = 0;
/* النمط يغطي كل مواضع النوع: `: any` · `as any` · `<any>` · `any[]` · `any |`
   · `, any>` · `[any]` — ولا يطابق نصوصاً مثل step="any" ولا كلمة company. */
const ANY_PATTERN =
  /:\s*any\b|\bas\s+any\b|<\s*any\s*>|<\s*any\s*\[\s*\]\s*>|\bany\s*\[\s*\]|\bany\s*\||\|\s*any\b|,\s*any\s*[>,)\]]|\[\s*any\s*\]/g;
const anyHits = [];
for (const f of srcFiles) {
  const text = fs.readFileSync(f, 'utf8');
  const n = (text.match(ANY_PATTERN) || []).length;
  if (n > 0) anyHits.push(`${rel(f)}×${n}`);
}
const anyCount = anyHits.reduce((sum, x) => sum + Number(x.split('×')[1]), 0);
check(`H7 · لا any في الأنواع (${anyCount}/${ANY_BUDGET})`, anyCount <= ANY_BUDGET, anyHits.join(' · '));

/* H8 — قيم حالات المهام داخل الاتحاد المعرّف فقط */
const VALID_TASK_STATUS = [
  'new',
  'planned',
  'ready',
  'in_progress',
  'blocked',
  'review',
  'completed',
  'cancelled',
  'archived',
  'delayed',
];
const badStatus = [];
for (const f of srcFiles) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/status\s*=\s*'([a-z_]+)'/g)) {
    if (m[1].includes('_') && !VALID_TASK_STATUS.includes(m[1]) && !['active', 'inactive', 'anon'].includes(m[1])) {
      badStatus.push(`${rel(f)}: ${m[1]}`);
    }
  }
}
check('H8 · لا حالة مهمة خارج الاتحاد (in_review سابقاً)', badStatus.length === 0, badStatus.join(' · '));

/* H10 — لا تعطيل لمفحص الأنواع (لا @ts-ignore / @ts-expect-error / @ts-nocheck) */
const suppressorFiles = srcFiles.filter((f) => /@ts-(ignore|expect-error|nocheck)/.test(fs.readFileSync(f, 'utf8')));
check('H10 · لا تعطيل لمفحص الأنواع', suppressorFiles.length === 0, suppressorFiles.map(rel).join(' · '));

/* H9 — سقوف حجم الوحدات المفكَّكة (ratchet): لا تعود الملفات الكبيرة بعد التفكيك.
   R30: كل ملفات المشروع صارت ≤ 900 سطراً، والقائمة تحرس ألّا تعود أي وحدة للتضخّم. */
const MODULE_LINE_BUDGETS = [
  { file: 'src/components/financial/FinancialModule.tsx', max: 900 },
  { file: 'src/utils/storage.ts', max: 900 },
  { file: 'src/components/workos/WorkOSModule.tsx', max: 900 },
  { file: 'src/utils/workosStorage.ts', max: 900 },
  { file: 'src/utils/workos/workosKeys.ts', max: 900 },
  { file: 'src/utils/workos/workosSeeds.ts', max: 900 },
  { file: 'src/utils/workos/workosLoaders.ts', max: 900 },
  { file: 'src/utils/workos/workosExporters.ts', max: 900 },
  { file: 'src/utils/workos/workosAutomation.ts', max: 900 },
  { file: 'src/utils/debts.ts', max: 900 },
  { file: 'src/utils/debts/debtCatalogs.ts', max: 900 },
  { file: 'src/utils/debts/debtSeeds.ts', max: 900 },
  { file: 'src/utils/debts/debtCommitmentSeeds.ts', max: 900 },
  { file: 'src/utils/debts/debtAnalytics.ts', max: 900 },
  { file: 'src/utils/debts/debtExporters.ts', max: 900 },
  { file: 'src/utils/excel.ts', max: 900 },
  { file: 'src/utils/excel/excelCore.ts', max: 900 },
  { file: 'src/utils/excel/excelExporters.ts', max: 900 },
  { file: 'src/utils/excel/excelImporters.ts', max: 900 },
  { file: 'src/components/dashboard/UnifiedDashboard.tsx', max: 900 },
  { file: 'src/components/dashboard/dashboardModel.ts', max: 900 },
  { file: 'src/components/dashboard/useDashboardModel.ts', max: 900 },
  { file: 'src/components/dashboard/LiveClock.tsx', max: 900 },
  { file: 'src/components/dashboard/DashboardHeader.tsx', max: 900 },
  { file: 'src/components/dashboard/DashboardQuickActions.tsx', max: 900 },
  { file: 'src/components/dashboard/DashboardPulseCards.tsx', max: 900 },
  { file: 'src/components/dashboard/DashboardFinanceInventory.tsx', max: 900 },
  { file: 'src/components/dashboard/DashboardModuleHubs.tsx', max: 900 },
  { file: 'src/components/RecordsView.tsx', max: 900 },
  { file: 'src/components/records/recordsTypes.ts', max: 900 },
  { file: 'src/components/records/useRecordsViewModel.ts', max: 900 },
  { file: 'src/components/workos/WorkOSQuickAddModal.tsx', max: 900 },
  { file: 'src/components/workos/QuickAddModalHeader.tsx', max: 900 },
  { file: 'src/components/workos/workosQuickAddConfig.ts', max: 900 },
  { file: 'src/components/knowledge/KnowledgeModule.tsx', max: 900 },
  { file: 'src/components/knowledge/knowledgeTypes.ts', max: 900 },
  { file: 'src/components/knowledge/useKnowledgeModel.ts', max: 900 },
  { file: 'src/components/knowledge/NoteEditorModal.tsx', max: 900 },
  { file: 'src/components/knowledge/noteEditorTypes.ts', max: 900 },
  { file: 'src/components/knowledge/useNoteEditorModel.ts', max: 900 },
  { file: 'src/components/routines/RoutinesModule.tsx', max: 900 },
  { file: 'src/components/routines/useRoutinesModel.ts', max: 900 },
  { file: 'src/components/routines/RoutineWizardModal.tsx', max: 900 },
  { file: 'src/components/routines/routineWizardConfig.ts', max: 900 },
  { file: 'src/components/routines/useRoutineWizardModel.ts', max: 900 },
  { file: 'src/components/tasks/CalendarView.tsx', max: 900 },
  { file: 'src/components/tasks/calendarTypes.ts', max: 900 },
  { file: 'src/components/tasks/useCalendarModel.ts', max: 900 },
  { file: 'src/components/tasks/calendar/CalendarDayModal.tsx', max: 900 },
];

/* ratchet: لا ملف جديد يتجاوز السقف — القائمة أعلاه تُوسَّع مع كل تفكيك (R30) */
const FROZEN_LARGE_FILES = [];

const overBudget = [];
for (const { file, max } of [...MODULE_LINE_BUDGETS, ...FROZEN_LARGE_FILES]) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  const n = fs.readFileSync(full, 'utf8').split('\n').length;
  if (n > max) overBudget.push(`${file} ${n}>${max}`);
}
check('H9 · سقف حجم الوحدات المفكَّكة', overBudget.length === 0, overBudget.join(' · '));

/* H11 — حائط الحماية الآلي (CI) يشغّل كل البوابات: لا انضباط «يدوي» فقط */
const CI_DIR = path.join(ROOT, '.github', 'workflows');
const CI_GATES = [
  'npm run hygiene',
  'npm run identity',
  'npm run integrity',
  'npm run imports',
  'npm run security',
  'npm run storage-keys',
  'npm run settings',
  'npm run snapshots',
  'npm run auth',
  'npm run data-loss',
  'npm run workos',
  'npm run outbox',
  'npm run automation',
  'npm run csp',
  'npm run schema',
  'npm run typography',
  'npm run darkmode',
  'npm run tables',
  'npm run tables:assert',
  'npm run regression',
  'npm run lint:eslint',
  'npm run format:check',
  'npm run test:unit:coverage',
];
const ciText = fs.existsSync(CI_DIR)
  ? fs
      .readdirSync(CI_DIR)
      .filter((f) => /\.ya?ml$/.test(f))
      .map((f) => fs.readFileSync(path.join(CI_DIR, f), 'utf8'))
      .join('\n')
  : '';
const missingCiGates = CI_GATES.filter((g) => !ciText.includes(g));
check(
  'H11 · CI (GitHub Actions) يشغّل كل بوابات الانحدار',
  ciText.length > 0 && missingCiGates.length === 0,
  ciText.length === 0 ? 'لا يوجد .github/workflows/*.yml' : missingCiGates.join(' · ')
);

/* H12 — CI يفحص الأنواع ويبني قبل البوابات (لا بوابة تصميم بلا بناء) */
const CI_MUST = ['npm ci', 'npm run lint', 'npm run build'];
const missingCiSteps = CI_MUST.filter((c) => !ciText.includes(c));
check(
  'H12 · CI يثبّت من lockfile ويفحص الأنواع ويبني الإنتاج',
  missingCiSteps.length === 0,
  missingCiSteps.join(' · ')
);

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة فحص النظافة (hygiene) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (passed < results.length) process.exit(1);
console.log('✔ نجح الاختبار');
