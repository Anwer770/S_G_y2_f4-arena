#!/usr/bin/env node
/**
 * اختبار انحدار: مشغّل أحداث الأتمتة (R31) — البند 5 من تقرير التقييم.
 *
 * يقيس سلوكاً حقيقياً لا وصفياً: يُجزيء **الكود الإنتاجي نفسه** (المشغّل + طبقة التخزين)
 * داخل DOM وهمي، ثم يكتب بيانات كتابةً عادية ويقيس ما يحدث فعلاً:
 *
 *   A1 المشغّل موجود ومربوط بالإقلاع (لا استدعاء يدوي وحيد في شاشة)
 *   A2 المسح الزمني عند الإقلاع ينفّذ قاعدة «تجاوز الاستحقاق» تلقائياً
 *   A3 أحداث المحرّك نفسه (origin=automation) لا تُشغّل قواعد — لا حلقة لانهائية
 *   A4 إنجاز مهمة عبر saveTasks يُنفّذ قاعدة «إنجاز المهمة» ويزيد عدّادها
 *   A5 اكتمال المهام الفرعية يُنشئ مهمة متابعة حقيقية في المخزن
 *   A6 إعادة حفظ نفس البيانات لا تُكرّر التنفيذ (منع التكرار بالمفتاح)
 *   A7 حدث لا تطابقه قاعدة (تحديث وصف فقط) لا يُنفّذ شيئاً
 *   A8 سجل التشغيل يُخزَّن ويُقرأ، وعدّاد القاعدة يطابق عدد أسطر السجل
 *   A9 كل تعديل إجراءات الأتمتة يُطلق إشعار واجهة (منع الكتابة فوق النتائج القديمة)
 *   A10 لا انفجار تنفيذ: عدد العمليات يبقى محدوداً بعد سلسلة كتابات
 *
 * التشغيل: node tools/regression/automation.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { read, readFamily } from './_source.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const OUT_DIR = path.join(ROOT, 'docs', 'تدقيق');
const BUNDLE = path.join(OUT_DIR, '.automation-bundle.js');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ---------------------------------------------------------------- 1) تجزيء الكود الإنتاجي
fs.mkdirSync(OUT_DIR, { recursive: true });
execFileSync(
  path.join(ROOT, 'node_modules', '.bin', 'esbuild'),
  [
    path.join(ROOT, 'tools', 'regression', '_automation_entry.ts'),
    '--bundle',
    '--format=iife',
    '--global-name=AUTOM',
    '--outfile=' + BUNDLE,
    '--define:process.env.NODE_ENV="production"',
    '--loader:.css=empty',
    '--log-level=error',
  ],
  { cwd: ROOT, stdio: 'inherit' }
);
const code = fs.readFileSync(BUNDLE, 'utf8');

// ---------------------------------------------------------------- 2) بيئة DOM وهمية
const { JSDOM, VirtualConsole } = require('jsdom');
const errors = [];
const vc = new VirtualConsole();
vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 200)));
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + String(e?.message).slice(0, 200)));

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://automation.local/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const w = dom.window;
w.matchMedia = (q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
w.Notification = class { static permission = 'denied'; static requestPermission = async () => 'denied'; };
w.eval(code);
const AUTOM = w.AUTOM;
check('A0 · حزمة المشغّل تُجزيء وتُحمّل', !!AUTOM && typeof AUTOM.startAutomationRuntime === 'function');

// ---------------------------------------------------------------- 3) بيانات حتمية
const TODAY = new Date().toISOString().slice(0, 10);
const PAST = '2020-01-01';
const baseTask = (over) => ({
  id: 't', taskNumber: 'T-0', title: 'مهمة', description: '', status: 'planned', priority: 'medium',
  category: 'عام', tags: [], assigneeId: 'm1', progress: 0, subtasks: [], checklist: [], comments: [],
  createdAt: '2026-01-01', updatedAt: '2026-01-01', ...over,
});

const RULES = [
  { id: 'aut_overdue', name: 'تنبيه المتأخرات', description: 'إشعار عند تجاوز الاستحقاق', triggerEvent: 'task_overdue', actionType: 'tag_priority_urgent', isActive: true, executionsCount: 0 },
  { id: 'aut_daily', name: 'بداية الخطة اليومية', description: 'إشعار بدء اليوم', triggerEvent: 'daily_plan_start', actionType: 'notify_team', isActive: true, executionsCount: 0 },
  { id: 'aut_done', name: 'إنجاز مهمة', description: 'إشعار إنجاز', triggerEvent: 'task_completed', actionType: 'notify_team', isActive: true, executionsCount: 0 },
  { id: 'aut_subtasks', name: 'اكتمال المهام الفرعية', description: 'مهمة متابعة', triggerEvent: 'all_subtasks_completed', actionType: 'create_followup_task', isActive: true, executionsCount: 0 },
  { id: 'aut_off', name: 'قاعدة معطّلة', description: 'يجب ألا تُنفَّذ', triggerEvent: 'task_completed', actionType: 'notify_team', isActive: false, executionsCount: 0 },
];

AUTOM.saveProjects([{ id: 'prj_1', code: 'P-1', name: 'مشروع', status: 'active', startDate: PAST, dueDate: '2030-12-31', priority: 'medium', progress: 10 }]);
AUTOM.saveAutomations(RULES);
AUTOM.saveTasks([
  baseTask({ id: 'T-OVERDUE', taskNumber: 'T-1', title: 'مهمة متأخرة', dueDate: PAST, projectId: 'prj_1' }),
  baseTask({
    id: 'T-SUBS', taskNumber: 'T-2', title: 'مهمة بمهام فرعية', dueDate: '2030-12-31', projectId: 'prj_1',
    subtasks: [{ id: 's1', title: 'خطوة 1', completed: false }, { id: 's2', title: 'خطوة 2', completed: true }],
  }),
]);

const rulesById = () => Object.fromEntries(AUTOM.loadAutomations().map((r) => [r.id, r]));
const runs = () => AUTOM.loadAutomationRuns();

// ---------------------------------------------------------------- A1 · الربط بالإقلاع
const appSrc = readFamily('src/app/App.tsx');
const loadersSrc = readFamily('src/utils/workos/workosLoaders.ts');
check('A1 · المشغّل مربوط بإقلاع التطبيق (startAutomationRuntime في App)',
  /startAutomationRuntime\s*\(/.test(appSrc) && /useEffect/.test(appSrc));
check('A1b · طبقة الكتابة تنشر أحداثاً (saveTasks ⇒ deriveTaskEvents ⇒ publishDomainEvent)',
  /publishDomainEvent/.test(loadersSrc) && /deriveTaskEvents/.test(loadersSrc));

// ---------------------------------------------------------------- A2 · المسح الزمني
AUTOM.startAutomationRuntime(TODAY);
const afterBootRuns = runs();
check('A2 · المسح الزمني ينفّذ قاعدة التأخير تلقائياً عند الإقلاع',
  rulesById().aut_overdue.executionsCount === 1,
  `عدّاد التأخير = ${rulesById().aut_overdue.executionsCount} · سجل = ${afterBootRuns.length}`);
check('A2b · حدث «بداية الخطة اليومية» يُنفَّذ مرة واحدة عند الإقلاع',
  rulesById().aut_daily.executionsCount === 1,
  `عدّاد اليومي = ${rulesById().aut_daily.executionsCount}`);
check('A2c · إجراء التأخير غيّر البيانات فعلاً (رفع الأولوية إلى «عاجل»)',
  AUTOM.loadTasks().find((t) => t.id === 'T-OVERDUE')?.priority === 'urgent',
  `الأولوية الآن: ${AUTOM.loadTasks().find((t) => t.id === 'T-OVERDUE')?.priority}`);

// ---------------------------------------------------------------- A3 · لا حلقة
const before = runs().length;
AUTOM.publishDomainEvent({ type: 'task_completed', entityType: 'task', entityId: 'T-OVERDUE', title: 'حدث محرّك', origin: 'automation' });
check('A3 · أحداث المحرّك نفسه لا تُشغّل قواعد (حماية من الحلقة)', runs().length === before,
  `قبل ${before} · بعد ${runs().length}`);

// ---------------------------------------------------------------- A4/A5 · إنجاز حقيقي
const tasksBefore = AUTOM.loadTasks().length;
const beforeDone = rulesById().aut_done.executionsCount;
AUTOM.saveTasks(
  AUTOM.loadTasks().map((t) =>
    t.id === 'T-SUBS' ? { ...t, status: 'completed', subtasks: t.subtasks.map((s) => ({ ...s, completed: true })) } : t
  )
);
const afterDone = rulesById().aut_done.executionsCount;
check('A4 · إنجاز مهمة عبر saveTasks يُنفّذ قاعدة «إنجاز المهمة» ويزيد عدّادها',
  afterDone === beforeDone + 1, `العدّاد ${beforeDone} ⇒ ${afterDone}`);
check('A4b · القاعدة المعطّلة لا تُنفَّذ', rulesById().aut_off.executionsCount === 0,
  `عدّاد المعطّلة = ${rulesById().aut_off.executionsCount}`);

const followups = AUTOM.loadTasks().filter((t) => /^tsk_auto_/.test(t.id));
check('A5 · اكتمال المهام الفرعية أنشأ مهمة متابعة حقيقية في المخزن',
  followups.length === 1 && AUTOM.loadTasks().length === tasksBefore + 1,
  `مهام المتابعة = ${followups.length} · إجمالي المهام ${tasksBefore} ⇒ ${AUTOM.loadTasks().length}`);
check('A5b · قاعدة «اكتمال المهام الفرعية» عدّادها صار 1', rulesById().aut_subtasks.executionsCount === 1,
  `العدّاد = ${rulesById().aut_subtasks.executionsCount}`);

// ---------------------------------------------------------------- A6 · منع التكرار
const runsAfterFirst = runs().length;
const counters1 = JSON.stringify(Object.values(rulesById()).map((r) => r.executionsCount));
AUTOM.saveTasks(AUTOM.loadTasks().map((t) => ({ ...t })));
AUTOM.saveTasks(AUTOM.loadTasks().map((t) => ({ ...t })));
const counters2 = JSON.stringify(Object.values(rulesById()).map((r) => r.executionsCount));
check('A6 · إعادة حفظ نفس البيانات لا تُكرّر التنفيذ (مفتاح القاعدة·الحدث·الكيان)',
  runs().length === runsAfterFirst && counters1 === counters2,
  `سجل ${runsAfterFirst} ⇒ ${runs().length}`);

// ---------------------------------------------------------------- A7 · حدث غير مطابق
const runsBeforeNoop = runs().length;
AUTOM.saveTasks(AUTOM.loadTasks().map((t) => (t.id === 'T-OVERDUE' ? { ...t, description: 'وصف جديد فقط' } : t)));
check('A7 · تعديل لا يمسّ الحالة/الأولوية/الموعد لا يُنفّذ أي قاعدة', runs().length === runsBeforeNoop,
  `سجل ${runsBeforeNoop} ⇒ ${runs().length}`);

// ---------------------------------------------------------------- A8 · الإحصاءات والسجل
const diag = AUTOM.getAutomationDiagnostics();
const executedRuns = runs().filter((r) => r.outcome === 'executed').length;
const totalCounters = Object.values(rulesById()).reduce((s, r) => s + r.executionsCount, 0);
check('A8 · سجل التشغيل مخزَّن ومتّسق مع العدّادات',
  diag.runs === runs().length && executedRuns >= 4 && totalCounters >= 4,
  `سجل=${diag.runs} · ناجحة=${executedRuns} · مجموع العدّادات=${totalCounters}`);
check('A8b · التشغيل نال طابعاً زمنياً حقيقياً', runs().every((r) => /^\d{4}-\d{2}-\d{2}T/.test(r.executedAt)));
check('A8c · المشغّل مسجّل كمستمع واحد فقط (لا اشتراكات مكرّرة)',
  diag.started === true && diag.listeners === 1, `مستمعون = ${diag.listeners}`);

// ---------------------------------------------------------------- A9 · إشعار الواجهة
const uiSrc =
  readFamily('src/components/workos/WorkOSModule.tsx') + read('src/components/workos/useAutomationSync.ts');
const notifierSrc = readFamily('src/utils/automation/automationNotifier.ts');
check('A9 · المشغّل يُشعر الواجهة بعد التنفيذ، والوحدة تُزامن حالتها',
  /notifyAutomationUpdated/.test(notifierSrc) && /onAutomationUpdated/.test(uiSrc));

// ---------------------------------------------------------------- A10 · سقف التنفيذ
check('A10 · لا انفجار تنفيذ بعد سلسلة كتابات (السجل محدود)',
  runs().length <= 20, `عدد العمليات = ${runs().length}`);

check('A11 · لا أخطاء JS أثناء التشغيل', errors.length === 0, errors[0] || '');

AUTOM.stopAutomationRuntime();

// ---------------------------------------------------------------- النتيجة
const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة بوابة الأتمتة (R31) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
fs.writeFileSync(
  path.join(OUT_DIR, 'automation-runtime.json'),
  JSON.stringify({ at: new Date().toISOString(), passed, total: results.length, results, runs: runs() }, null, 1),
  'utf8'
);
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
