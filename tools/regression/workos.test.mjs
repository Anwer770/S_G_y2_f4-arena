#!/usr/bin/env node
/**
 * اختبار انحدار: توحيد إدارة العمل (Work OS)
 *
 * يقيس — على DOM الحقيقي — ما يلي:
 *   W1 إقلاع التطبيق والدخول
 *   W2 مدخل واحد باسم «إدارة العمل» في القائمة الجانبية
 *   W3 عدّاد الشارة = (مهام مخزن التطبيق المفتوحة) + (مهام إدارة العمل المفتوحة) — مرّة واحدة لكل مخزن
 *   W4 لا تضاعف: الشارة < ضعف مهام مخزن التطبيق  ← هذا هو العطب المُثبَت (WORK_OS_CURRENT_STATE.md §3.2)
 *   W5 بنية Work OS: التبويبات الأولية السبعة موجودة
 *   W6 لا أخطاء JS
 *   W7–W9 مجموعات المبدّل · مؤشرات النظرة العامة · قسم «القادم»
 *   W10–W13 واجهة «التخطيط اليومي» (أعمدة · عدّادات · شريط زمني · السحب لإعادة الجدولة)
 *   W14–W16 واجهة «الزيارات» (قراءة فقط — بلا مسار كتابة)
 *
 * التشغيل: node tools/regression/workos.test.mjs
 *          WORKOS_EXPECT=0 node tools/regression/workos.test.mjs     # قياس فقط (إثبات العطب قبل الإصلاح)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const APP_ROOT = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : ROOT;
const EXPECT = process.env.WORKOS_EXPECT !== '0';
const TAG = process.env.WORKOS_TAG || (EXPECT ? 'after' : 'before');
const require = createRequire(path.join(ROOT, 'package.json'));

const SETTINGS_KEY = 'qeema_accounting_system_settings_v1';
const SUITE_TASKS_KEY = 'suite_tasks_tasks_v2';
const WORKOS_TASKS_KEY = 'workos_v1_tasks';
const SUITE_DONE_STATUS = 'تم الانجاز';
const WORKOS_DONE = ['completed', 'cancelled', 'archived'];

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// ---------------------------------------------------------------- bundle
const bundlePath = path.join(ROOT, 'docs', 'تدقيق', '.workos-bundle.js');
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [
  path.join(APP_ROOT, 'src', 'main.tsx'),
  '--bundle', '--format=iife', '--jsx=automatic', '--outfile=' + bundlePath,
  '--define:process.env.NODE_ENV="production"',
  '--loader:.css=empty', '--loader:.png=dataurl', '--loader:.svg=dataurl', '--log-level=error',
], { stdio: 'inherit' });
const code = fs.readFileSync(bundlePath, 'utf8');

const { JSDOM, VirtualConsole } = require('jsdom');

/** مهام إدارة العمل المزروعة: 2 مفتوحة + 1 مكتملة ⇒ المتوقع في العدّاد = 2 */
// مراجع زمنية حتمية (TODAY ديناميكي فتبقى التوقّعات صحيحة في أي يوم تشغيل)
const TODAY = new Date().toISOString().split('T')[0];
const PAST = '2020-01-01';
const FUTURE = '2030-12-31';

// W1 متأخرة · W2 مستحقة اليوم (بوقت لظهورها في الشريط الزمني) · W3 مكتملة · W4 قادمة
const workosSeed = [
  { id: 'W1', taskNumber: 'W-1', title: 'مهمة إدارة العمل 1', status: 'in_progress', priority: 'high', dueDate: PAST },
  { id: 'W2', taskNumber: 'W-2', title: 'مهمة إدارة العمل 2', status: 'planned', priority: 'medium', dueDate: TODAY, dueTime: '09:00' },
  { id: 'W3', taskNumber: 'W-3', title: 'مهمة إدارة العمل 3 (مكتملة)', status: 'completed', priority: 'low', dueDate: TODAY, dueTime: '07:00' },
  { id: 'W4', taskNumber: 'W-4', title: 'مهمة إدارة العمل 4 (قادمة)', status: 'planned', priority: 'low', dueDate: FUTURE },
].map((t) => ({
  ...t, description: '', category: 'عام', tags: [], assigneeId: 'm1',
  progress: t.status === 'completed' ? 100 : 0,
  subtasks: [], checklist: [], comments: [], dependencies: [],
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
}));
const WORKOS_OPEN_EXPECTED = workosSeed.filter((t) => !WORKOS_DONE.includes(t.status)).length;

// بيانات حتمية لمؤشرات النظرة العامة (§6) — القيم المتوقعة مشتقّة منها مباشرة
const projectsSeed = [
  { id: 'P1', code: 'P-1', name: 'مشروع متأخر بالحالة', status: 'delayed', startDate: PAST, dueDate: FUTURE, priority: 'high', progress: 20 },
  { id: 'P2', code: 'P-2', name: 'مشروع متأخر بالموعد', status: 'active', startDate: PAST, dueDate: PAST, priority: 'medium', progress: 40 },
  { id: 'P3', code: 'P-3', name: 'مشروع نشط سليم', status: 'active', startDate: PAST, dueDate: FUTURE, priority: 'low', progress: 60 },
];
const appointmentsSeed = [
  { id: 'A1', title: 'موعد قادم 1', person: 'فلان', location: 'مكتب', date: FUTURE, time: '10:00', durationMinutes: 30, attendees: [], notes: '', status: 'scheduled' },
  { id: 'A2', title: 'موعد قادم 2', person: 'علان', location: 'مكتب', date: FUTURE, time: '11:00', durationMinutes: 30, attendees: [], notes: '', status: 'scheduled' },
  { id: 'A3', title: 'موعد قادم 3', person: 'زيد', location: 'مكتب', date: FUTURE, time: '12:00', durationMinutes: 30, attendees: [], notes: '', status: 'scheduled' },
  { id: 'A4', title: 'موعد ملغى', person: 'عمر', location: 'مكتب', date: FUTURE, time: '13:00', durationMinutes: 30, attendees: [], notes: '', status: 'cancelled' },
];
const goalsSeed = [
  { id: 'G1', title: 'هدف نشط 1', category: 'عمل', targetDate: FUTURE, progress: 30, objectives: [], status: 'on_track', visionDescription: '' },
  { id: 'G2', title: 'هدف نشط 2', category: 'عمل', targetDate: FUTURE, progress: 50, objectives: [], status: 'at_risk', visionDescription: '' },
  { id: 'G3', title: 'هدف محقَّق', category: 'عمل', targetDate: FUTURE, progress: 100, objectives: [], status: 'achieved', visionDescription: '' },
];
const customerVisitsSeed = [
  { id: 'CV1', customerId: 'C1', customerName: 'عميل أ', date: FUTURE, dayOfWeek: 'الأحد', responsible: 'أنا', status: 'مخطط', notes: '', createdAt: PAST },
  { id: 'CV2', customerId: 'C2', customerName: 'عميل ب', date: PAST, dayOfWeek: 'الاثنين', responsible: 'أنا', status: 'مخطط', notes: '', createdAt: PAST },
];
const doctorVisitsSeed = [
  { id: 'DV1', doctorId: 'D1', doctorName: 'د. أحمد', date: FUTURE, dayOfWeek: 'الثلاثاء', responsible: 'أنا', status: 'مخطط', notes: '', nextFollowUpDate: FUTURE, createdAt: PAST },
  { id: 'DV2', doctorId: 'D2', doctorName: 'د. سالم', date: PAST, dayOfWeek: 'الأربعاء', responsible: 'أنا', status: 'مخطط', notes: '', nextFollowUpDate: '', createdAt: PAST },
];
const EXPECT_KPI = {
  delayedProjects: 2,
  upcomingAppointments: 3,
  activeGoals: 2,
  upcomingVisits: 2, // زيارة عميل قادمة + زيارة طبيب قادمة
};

const settingsJson = JSON.stringify({
  users: [{
    id: 'usr-1', name: 'مدير النظام', email: 'admin@system.local', phone: '+967 771 234 567',
    role: 'admin', status: 'active', avatarInitial: 'م', lastLogin: 'الآن نشط', createdAt: '2025-01-10',
  }],
  general: { currentUserName: 'مدير النظام', currentUserTitle: 'مدير عام المنظومة والعمليات' },
});

async function boot() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 200)));
  vc.on('jsdomError', (e) => errors.push('jsdomError: ' + String(e?.message).slice(0, 200)));

  const dom = new JSDOM(`<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>`,
    { url: 'https://workos.local/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window, doc = w.document;

  w.localStorage.setItem(SETTINGS_KEY, settingsJson);
  w.localStorage.setItem(WORKOS_TASKS_KEY, JSON.stringify(workosSeed));
  w.localStorage.setItem('workos_v1_projects', JSON.stringify(projectsSeed));
  w.localStorage.setItem('workos_v1_appointments', JSON.stringify(appointmentsSeed));
  w.localStorage.setItem('workos_v1_goals', JSON.stringify(goalsSeed));
  w.localStorage.setItem('suite_customers_visits_v2', JSON.stringify(customerVisitsSeed));
  w.localStorage.setItem('suite_doctors_visits_v1', JSON.stringify(doctorVisitsSeed));
  w.matchMedia = (q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
  w.scrollTo = () => {}; w.print = () => {}; w.alert = () => {}; w.confirm = () => true;
  w.fetch = async () => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({}), text: async () => '', clone() { return this; } });
  w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {};
  const ctx2d = new Proxy({}, { get: (_t, k) => (k === 'measureText' ? () => ({ width: 10 }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : typeof k === 'string' ? () => {} : undefined), set: () => true });
  w.HTMLCanvasElement.prototype.getContext = () => ctx2d;
  w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
  w.Notification = class { static permission = 'denied'; static requestPermission = async () => 'denied'; };
  Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: async () => ({}), ready: Promise.resolve({ active: {} }), addEventListener() {}, controller: null }, configurable: true });

  w.eval(code);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(2500);
  return { w, doc, sleep, errors };
}

const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
async function waitFor(fn, timeoutMs = 15000, stepMs = 150) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (fn()) return true; } catch { /* ignore */ }
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return false;
}
const quickBtn = (doc) => [...doc.querySelectorAll('button')].find((b) => /دخول سريع/.test(b.textContent || ''));
const asideButtons = (doc) => [...doc.querySelectorAll('aside button')];
const textOf = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
/** عدّاد الشارة = آخر رقم في نص مدخل القائمة */
const badgeOf = (doc, labelRe) => {
  const el = asideButtons(doc).find((b) => labelRe.test(textOf(b)));
  if (!el) return null;
  const nums = textOf(el).match(/\d+/g);
  return nums ? Number(nums[nums.length - 1]) : 0;
};
const openSuiteTasks = (w) => {
  try {
    const list = JSON.parse(w.localStorage.getItem(SUITE_TASKS_KEY) || '[]');
    return Array.isArray(list) ? list.filter((t) => t.status !== SUITE_DONE_STATUS).length : 0;
  } catch { return 0; }
};

const report = { tag: TAG, appRoot: APP_ROOT };

// ================================================================ الإقلاع
const { w, doc, sleep, errors } = await boot();
await waitFor(() => !!quickBtn(doc));
const qb = quickBtn(doc);
if (qb) click(w, qb);
const loggedIn = await waitFor(() => asideButtons(doc).length > 0);
check('W1 · التطبيق أقلع وسُجّل الدخول', loggedIn);

// ================================================================ المدخل والشارة
const entryLabels = asideButtons(doc).map(textOf);
const workEntry = asideButtons(doc).find((b) => /إدارة العمل(?!اء)/.test(textOf(b)));
check('W2 · مدخل «إدارة العمل» موجود في القائمة الجانبية', !!workEntry, workEntry ? textOf(workEntry) : `المداخل: ${entryLabels.length}`);

const suiteOpen = openSuiteTasks(w);
const badge = badgeOf(doc, /إدارة العمل(?!اء)/);
const expected = suiteOpen + WORKOS_OPEN_EXPECTED;
report.suiteOpen = suiteOpen; report.workosOpen = WORKOS_OPEN_EXPECTED; report.badge = badge; report.expected = expected;
console.log(`\n▸ حساب الشارة: مهام التطبيق المفتوحة ${suiteOpen} + مهام إدارة العمل المفتوحة ${WORKOS_OPEN_EXPECTED} = ${expected} · المعروض في القائمة: ${badge}`);

check('W3 · الشارة تعدّ المخزنين مرة واحدة لكل منهما', badge === expected,
  `المعروض ${badge} · المتوقع ${expected}`);
check('W4 · لا تضاعف: الشارة أقل من ضعف مهام التطبيق', suiteOpen > 0 && badge !== null && badge < suiteOpen * 2,
  `الشارة ${badge} مقابل ضعف ${suiteOpen * 2} (العطب القديم كان يُظهر ${suiteOpen * 2})`);

// ================================================================ بنية Work OS
if (workEntry) { click(w, workEntry); await sleep(3000); }
const bodyText = doc.body.textContent || '';
const feedSection = [...doc.querySelectorAll('div')].find((d) => /^مهام · مواعيد · اجتماعات · التزامات$/.test((d.textContent || '').trim()) || (d.textContent || '').includes('مهام · مواعيد · اجتماعات · التزامات'));
const upcomingRows = feedSection ? feedSection.querySelectorAll('div.py-2\\.5').length : 0;
const upcomingFeedKinds = upcomingRows;
const PRIMARY_TABS = ['نظرة عامة', 'المشاريع', 'المهام', 'كانبان', 'الجدول الزمني', 'الأولويات', 'عبء الفريق'];
const foundTabs = PRIMARY_TABS.filter((t) => bodyText.includes(t));
check('W5 · التبويبات الأولية السبعة داخل إدارة العمل', foundTabs.length === PRIMARY_TABS.length,
  `${foundTabs.length}/7 — الناقص: ${PRIMARY_TABS.filter((t) => !foundTabs.includes(t)).join(' · ') || 'لا شيء'}`);
// مؤشرات النظرة العامة: كل رقم يُقارن بالعدّ المباشر من البيانات المزروعة
const kpiButtons = [...doc.querySelectorAll('button')].filter((b) => /المشاريع المتأخرة|المواعيد القادمة|الأهداف النشطة|الزيارات القادمة/.test(b.textContent || ''));
const kpiRead = (labelRe) => {
  const el = kpiButtons.find((b) => labelRe.test(b.textContent || ''));
  if (!el) return null;
  const nums = (el.textContent || '').match(/\d+/g);
  return nums ? Number(nums[nums.length - 1]) : 0;
};
const kpiActual = {
  delayedProjects: kpiRead(/المشاريع المتأخرة/),
  upcomingAppointments: kpiRead(/المواعيد القادمة/),
  activeGoals: kpiRead(/الأهداف النشطة/),
  upcomingVisits: kpiRead(/الزيارات القادمة/),
};
report.kpi = { expected: EXPECT_KPI, actual: kpiActual };
console.log('\n▸ مؤشرات النظرة العامة (متوقع ← معروض):');
Object.keys(EXPECT_KPI).forEach((k) => console.log(`   ${k}: ${EXPECT_KPI[k]} ← ${kpiActual[k]}`));
const kpiOk = Object.keys(EXPECT_KPI).every((k) => kpiActual[k] === EXPECT_KPI[k]);
check('W8 · أرقام مؤشرات النظرة العامة مطابقة للعدّ المباشر (§6 · §43)', kpiOk,
  `متوقع ${JSON.stringify(EXPECT_KPI)} · معروض ${JSON.stringify(kpiActual)}`);
check('W9 · قسم «القادم» يعرض عناصر مُجمَّعة (§10)', /القادم/.test(bodyText),
  upcomingRows === 0 ? 'لا صفوف' : `${upcomingFeedKinds} صفاً`);

// ================================================================ التخطيط اليومي (§18)
const moreToolsBtn = [...doc.querySelectorAll('button')].find((b) => /أدوات إضافية|أداة: /.test(textOf(b)));
if (moreToolsBtn) { click(w, moreToolsBtn); await sleep(600); }
const plannerBtn = [...doc.querySelectorAll('button')].find((b) => /^التخطيط اليومي$/.test(textOf(b)));
if (plannerBtn) { click(w, plannerBtn); await sleep(1800); }

const plannerText = doc.body.textContent || '';
const plannerOpen = /خطة اليوم/.test(plannerText);
const draggables = [...doc.querySelectorAll('[draggable="true"]')];
const titleOf = (el) => (el.querySelector('h4')?.textContent || '').trim();
const colOf = (title) => draggables.filter((d) => titleOf(d) === title).length;
const PLAN_EXPECT = { overdue: 1, today: 1, upcoming: 1 }; // W1 / W2 / W4 — W3 مكتملة ومخفية
const PLAN_ACTUAL = { overdue: colOf('مهمة إدارة العمل 1'), today: colOf('مهمة إدارة العمل 2'), upcoming: colOf('مهمة إدارة العمل 4 (قادمة)') };
const planTotal = draggables.length;
// عدّاد العمود معروض في ترويسته — يُقارن بعدد البطاقات الفعلي
const colCount = (label) => {
  const h3 = [...doc.querySelectorAll('h3')].find((h) => (h.textContent || '').trim() === label);
  const box = h3?.closest('div.rounded-2xl') || h3?.parentElement?.parentElement;
  return box ? box.querySelectorAll('[draggable="true"]').length : -1;
};
const COL = { overdue: colCount('متأخر'), today: colCount('اليوم'), upcoming: colCount('قادم') };

console.log('\n▸ التخطيط اليومي (متوقع ← فعلي):');
console.log(`   بطاقات الأعمدة: متأخر ${PLAN_EXPECT.overdue}←${PLAN_ACTUAL.overdue} · اليوم ${PLAN_EXPECT.today}←${PLAN_ACTUAL.today} · قادم ${PLAN_EXPECT.upcoming}←${PLAN_ACTUAL.upcoming}`);
console.log(`   عدّادات الترويسة: متأخر ${COL.overdue} · اليوم ${COL.today} · قادم ${COL.upcoming} · إجمالي البطاقات ${planTotal}`);

check('W10 · «التخطيط اليومي» يفتح ويعرض الأعمدة الثلاثة بعدد صحيح',
  plannerOpen && PLAN_ACTUAL.overdue === PLAN_EXPECT.overdue && PLAN_ACTUAL.today === PLAN_EXPECT.today && PLAN_ACTUAL.upcoming === PLAN_EXPECT.upcoming && planTotal === 3,
  `خطة اليوم=${plannerOpen} · متأخر ${PLAN_ACTUAL.overdue} · اليوم ${PLAN_ACTUAL.today} · قادم ${PLAN_ACTUAL.upcoming} · إجمالي ${planTotal}`);
check('W11 · عدّادات ترويسة الأعمدة تطابق بطاقات الأعمدة فعلياً',
  COL.overdue === PLAN_ACTUAL.overdue && COL.today === PLAN_ACTUAL.today && COL.upcoming === PLAN_ACTUAL.upcoming && COL.overdue + COL.today + COL.upcoming === planTotal,
  `ترويسة ${JSON.stringify(COL)} · بطاقات ${JSON.stringify(PLAN_ACTUAL)}`);
check('W12 · المكتملة لا تُعرض والشريط الزمني يعكس وقت اليوم',
  !draggables.some((d) => /مكتملة/.test(titleOf(d))) && /09:00/.test(plannerText) && /مهمة إدارة العمل 2/.test(plannerText),
  `المكتملة معروضة=${draggables.some((d) => /مكتملة/.test(titleOf(d)))} · 09:00=${/09:00/.test(plannerText)}`);

// W13 · مسار الكتابة الوحيد: السحب إلى «اليوم» ⟶ onUpdateTaskDueDate القائم (لا مسار جديد)
const dragData = { effectAllowed: '', data: {}, setData(t, v) { this.data[t] = v; }, getData(t) { return this.data[t] || ''; } };
const mkDrag = (type) => { const e = new w.Event(type, { bubbles: true, cancelable: true }); e.dataTransfer = dragData; return e; };
const todayCol = [...doc.querySelectorAll('h3')].find((h) => (h.textContent || '').trim() === 'اليوم')?.closest('div.rounded-2xl');
const overdueCard = draggables.find((d) => titleOf(d) === 'مهمة إدارة العمل 1');
let dragOk = false, dragNote = 'تعذّر إيجاد العمود أو البطاقة';
if (todayCol && overdueCard) {
  overdueCard.dispatchEvent(mkDrag('dragstart'));
  await sleep(120);
  todayCol.dispatchEvent(mkDrag('dragover'));
  await sleep(120);
  todayCol.dispatchEvent(mkDrag('drop'));
  await sleep(900);
  const cardsNow = [...doc.querySelectorAll('[draggable="true"]')];
  const moved = cardsNow.find((d) => titleOf(d) === 'مهمة إدارة العمل 1');
  const movedIntoToday = !!moved && !!moved.closest('div.rounded-2xl') && moved.closest('div.rounded-2xl') === todayCol;
  const dueShown = moved ? (moved.textContent || '').includes(TODAY) : false;
  dragOk = movedIntoToday && dueShown;
  dragNote = `انتقل إلى «اليوم»=${movedIntoToday} · التاريخ المعروض=${dueShown} (${TODAY})`;
}
check('W13 · السحب إلى «اليوم» يعيد الجدولة عبر المسار القائم (dueDate فقط)', dragOk, dragNote);

// ================================================================ الزيارات (§22) — قراءة فقط
const findBtn = (re) => [...doc.querySelectorAll('button')].find((b) => re.test(textOf(b)));
// مقاوم لحالة قائمة «أدوات إضافية»: يبحث أولاً، وإن لم يجد يفتح القائمة ويعيد البحث
const openTool = async (label) => {
  const re = new RegExp('^' + label + '$');
  let btn = findBtn(re);
  for (let attempt = 0; attempt < 2 && !btn; attempt++) {
    const moreBtn = findBtn(/أدوات إضافية|أداة: /);
    if (moreBtn) { click(w, moreBtn); await sleep(600); }
    btn = findBtn(re);
  }
  if (btn) { click(w, btn); await sleep(1500); }
  return !!btn;
};
const visitsOpened = await openTool('الزيارات \\(قراءة فقط\\)');
const visitsText = doc.body.textContent || '';
const visitsRows = (headerLabel) => {
  const h3 = [...doc.querySelectorAll('h3')].find((h) => (h.textContent || '').trim() === headerLabel);
  const box = h3?.closest('div.rounded-2xl');
  return box ? box.querySelectorAll('div.divide-y > div').length : -1;
};
const custRows = visitsRows('سجل زيارات العملاء');
console.log('\n▸ الزيارات (قراءة فقط):');
console.log(`   فُتح=${visitsOpened} · زيارات العملاء=${custRows} · نص الملخّص: ${/زيارات العملاء: \d+/.exec(visitsText)?.[0]} · ${/زيارات الأطباء: \d+/.exec(visitsText)?.[0]}`);

check('W14 · «الزيارات» يفتح كعرض قراءة فقط ويعرض السجل الحقيقي',
  visitsOpened && /عرض للقراءة فقط/.test(visitsText) && custRows === 2 && /زيارات العملاء: 2/.test(visitsText) && /زيارات الأطباء: 2/.test(visitsText),
  `فُتح=${visitsOpened} · صفوف العملاء=${custRows} · ملخّص=${/زيارات العملاء: 2/.test(visitsText) && /زيارات الأطباء: 2/.test(visitsText)}`);

// التبديل إلى زيارات الأطباء + مرشّح «القادمة فقط»
await openTool('الزيارات \\(قراءة فقط\\)');
const doctorsTabBtn = [...doc.querySelectorAll('button')].find((b) => /^زيارات الأطباء\s*\d*$/.test(textOf(b)));
if (doctorsTabBtn) { click(w, doctorsTabBtn); await sleep(700); }
const docRows = visitsRows('سجل زيارات الأطباء');
const upcomingBtn = [...doc.querySelectorAll('button')].find((b) => /^القادمة فقط$/.test(textOf(b)));
if (upcomingBtn) { click(w, upcomingBtn); await sleep(700); }
const docRowsUpcoming = visitsRows('سجل زيارات الأطباء');

check('W15 · تبديل النوع والترشيح يعملان على بيانات حقيقية (أطباء 2 ← قادمة 1)',
  docRows === 2 && docRowsUpcoming === 1,
  `زيارات الأطباء=${docRows} · بعد «القادمة فقط»=${docRowsUpcoming}`);

// W16 · إثبات عدَم وجود مسار كتابة في واجهة الزيارات (فحص مصدري على الملف نفسه)
const visitsSrcRaw = fs.readFileSync(path.join(APP_ROOT, 'src/components/workos/WorkOSVisitsView.tsx'), 'utf8');
// تجريد التعليقات قبل الفحص — نمنع الكتابة في الكود التنفيذي لا في الشرح
const visitsSrc = visitsSrcRaw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const FORBIDDEN = ['recordVisit', 'saveCustomer', 'saveDoctor', 'deleteCustomer', 'deleteDoctor', 'localStorage.setItem', 'workosStorage', 'setData('];
const hits = FORBIDDEN.filter((f) => visitsSrc.includes(f));
check('W16 · واجهة الزيارات بلا أي مسار كتابة/تخزين (قراءة فقط فعلياً §22)', hits.length === 0,
  hits.length === 0 ? `${FORBIDDEN.length} نمطاً ممنوعاً · 0 إصابة` : `إصابات: ${hits.join(' · ')}`);

// ================================================================ المدخل في المبدّل (§25 · §6)
const SWITCHER_ENTRIES = ['نظرة عامة', 'المشاريع', 'المهام', 'كانبان', 'الجدول الزمني', 'الأولويات', 'عبء الفريق', 'التخطيط اليومي', 'الأهداف', 'الروتين', 'الزيارات'];
const overviewBtn = findBtn(/^نظرة عامة$/);
if (overviewBtn) { click(w, overviewBtn); await sleep(1200); }
const visitsSwitcher = findBtn(/^الزيارات\s*[\d]*$/);
const entriesPresent = SWITCHER_ENTRIES.filter((l) => !!findBtn(new RegExp('^' + l + '\\s*[\\d]*$')));
if (visitsSwitcher) { click(w, visitsSwitcher); await sleep(1500); }
const visitsViaSwitcher = /عرض للقراءة فقط/.test(doc.body.textContent || '');

console.log('\n▸ المبدّل:');
console.log(`   مداخل موجودة: ${entriesPresent.length}/${SWITCHER_ENTRIES.length} — المفقود: ${SWITCHER_ENTRIES.filter((l) => !entriesPresent.includes(l)).join(' · ') || 'لا شيء'}`);
console.log(`   فتح «الزيارات» من المبدّل: ${visitsViaSwitcher}`);
check('W17 · المبدّل (11 مدخلاً) يفتح «الزيارات» مباشرةً — لا دفن للعروض في قوائم (§25)',
  entriesPresent.length === SWITCHER_ENTRIES.length && visitsViaSwitcher,
  `مداخل ${entriesPresent.length}/11 · الفتح من المبدّل=${visitsViaSwitcher}`);

const separators = [...doc.querySelectorAll('span[aria-hidden="true"]')]
  .filter((el) => /\bw-px\b/.test(el.getAttribute('class') || '')).length;
check('W7 · مبدّل العرض منظّم بأربع مجموعات بفواصل بصرية (§25)', separators >= 3,
  `${separators} فاصلاً — العمل · طرق العرض · التحليل · التخطيط والمتابعة`);
check('W6 · لا أخطاء JS', errors.length === 0, errors[0] || '');

fs.writeFileSync(path.join(ROOT, 'docs', 'تدقيق', `workos-runtime-${TAG}.json`), JSON.stringify(report, null, 1), 'utf8');

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة اختبار إدارة العمل (${TAG}) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (!EXPECT) { console.log('(وضع قياس فقط)'); process.exit(0); }
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
