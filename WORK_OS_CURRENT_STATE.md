# WORK_OS_CURRENT_STATE — الوضع الحالي لوحدة العمل (Work OS)

> **نطاق هذه الوثيقة:** تحليل فقط — لا تعديل على الكود (قاعدة §48 من دستور التوحيد).
> **تاريخ القياس:** 2026-09-26 · **الالتزام المقاس:** `eb4d2f4`+ (آخر إيداع `098ef0c`) · **الفرع:** `arena/01a0d96e-46`
> **طريقة الجمع:** قراءة مباشرة للمصدر + `docs/تدقيق/inventory.json` (المكوّنات الحيّة/الميتة) + `protectedContracts.json` (المحمي) + `darkmode-coverage.json`.
> **ملاحظة منهجية:** كل سطر في هذه الوثيقة مسنود إلى ملف/سطر فعلي. ما لم يُتحقَّق منه مكتوب صراحةً بصيغة «غير محسوم».

---

## 0. الخلاصة التنفيذية (الأهم أولاً)

التوحيد المطلوب **منفَّذ جزئياً بالفعل**، وليس مشروعاً من الصفر. الفوارق الحقيقية أربعة فقط:

| # | الحالة | الأثر | التصنيف |
|---|---|---|---|
| 1 | **مخزنان حيّان للمهام** (`workos_v1_tasks` و`suite_tasks_tasks_v2`) ومفهوم «المهمة» يختلف في كل منهما | أرقام مختلفة لنفس المستخدم، و«إجمالي المهام» في النظرة العامة ≠ ما يراه في صفحة المهام | 🔴 **الأخطر** — مخالفة §26/§27 |
| 2 | **شارة «إدارة العمل» في القائمة الجانبية تجمع المهام مرتين** | العدّاد يُظهر ضعف العدد الفعلي | 🔴 عطب مُثبَت رياضياً |
| 3 | **«التخطيط اليومي» و«الزيارات» غير موجودين** كواجهات داخل Work OS | بندان من §46 خارج نطاق التعريف الحالي | 🟡 نطاق ناقص |
| 4 | **`WorkOSTasksView` (1308 سطراً) و`WorkOSDashboard` (497) كود ميت** | ازدواج منطق عرض مع نسخ حيّة | 🟡 دَين تقني |

**الخلاصة:** 8 من 10 بنود التعريف (DoD §46) محقّقة أصلاً؛ المتبقي بندان واجهيان + عطب عدّاد + دَين ميت. القرار المعماري الوحيد الخطير هو المخزنان (بند 1) وهو **يستلزم Specification منفصلة** لأنه تغيير Data Model (§45).

---

## 1. الإجابة على الأسئلة السبعة عشر (§48)

| # | السؤال | الجواب | الدليل |
|---|---|---|---|
| 1 | أين توجد **Tasks**؟ | `components/tasks/TasksModule.tsx` (حيّ) + `components/workos/WorkOSTasksTab.tsx` (حيّ) | استيرادان فعليان |
| 2 | أين يوجد **TaskFlow**؟ | `components/taskflow/` — **8 ملفات، كلها ميتة** (`reachableFromEntry=false`)، 5 منها مكوّنات محمية | `inventory.json` |
| 3 | أين توجد **Projects**؟ | `components/workos/WorkOSProjectsTab.tsx` (حيّ) · `WorkOSProjectsView.tsx` (**ميت**) | استيراد واحد من `WorkOSModule` |
| 4 | أين يوجد **Work OS**؟ | `components/workos/WorkOSModule.tsx` — **1575 سطراً، المدخل الوحيد الحيّ**، يُحمَّل بـ`React.lazy` من `AppRouter.tsx:52` | `AppRouter.tsx:190` |
| 5 | أين يوجد **Kanban**؟ | `WorkOSKanbanTab.tsx` (حيّ) — تبويب داخلي `kanban` | `WorkOSModule.tsx:643` |
| 6 | أين يوجد **Timeline**؟ | `WorkOSTimelineTab.tsx` (حيّ) — تبويب داخلي `timeline` | `WorkOSModule.tsx:644` |
| 7 | أين يوجد **Daily Planner**؟ | **غير موجود كواجهة.** توجد البيانات (`dailyRoutine`, `DailyRoutineBlock`) + واجهتا `routine` و`habits` | بحث عن «التخطيط اليومي» = صفر نتائج |
| 8 | أين توجد **Goals**؟ | `WorkOSGoalsView.tsx` (حيّ) — واجهة ثانوية `goals` | `WorkOSModule.tsx:1081` |
| 9 | أين توجد **Routines**؟ | `components/routines/` (13 ملفاً حياً) + `WorkOSRoutineView.tsx` داخل Work OS | استيراد من `WorkOSModule` |
| 10 | أين يوجد **Calendar**؟ | `WorkOSAppointmentsCommitmentsView.tsx` (حيّ) — واجهة ثانوية `calendar` | `WorkOSModule.tsx:1195` |
| 11 | أين توجد **Visits**؟ | **خارج Work OS**: `CustomerVisitRecord` و`DoctorVisitLog` في `types/index.ts:221,288` ضمن وحدتي العملاء والأطباء (CRM) | `types/index.ts:669,678` |
| 12 | **Routes**؟ | **لا يوجد URL Router إطلاقاً.** التنقّل حالة React: `useState<ActiveModuleTab>` في `App.tsx:84`. `AppRouter.tsx` مبدّل مكوّنات لا موجّه | `App.tsx:84` |
| 13 | **Components**؟ | `workos`: 29 ملفاً (23 حيّ · 6 ميت) · `tasks`: 5 حيّ · `taskflow`: 8 ميت · `routines`: 13 حيّ | `inventory.json` |
| 14 | **State**؟ | حالة واحدة لكل وحدة Work OS: `useState<WorkOSData>(() => loadWorkOSData())` — **مصدر واحد للواجهة الداخلية** | `WorkOSModule.tsx:123` |
| 15 | **Storage**؟ | `workos_v1_*` (**17 مفتاحاً**) + `suite_tasks_tasks_v2` + مفتاح ميت `suite_tasks_items_v2` | تفصيل في §3 |
| 16 | **Forms المحمية**؟ | **19 مكوّناً** في نطاق العمل (7 روتين · 5 TaskFlow ميت · 2 مهام · 5 Work OS) | تفصيل في §5 |
| 17 | **العلاقات**؟ | `WorkTask.projectId → WorkProject` · `GoalObjective.linkedProjectId → WorkProject` · `AppointmentItem.linkedTaskId → WorkTask` · `WorkTask.customerRef → CRM` | `types/workos.ts` |

---

## 2. بنية التنقّل الحالية (كما هي فعلاً)

### 2.1 المستوى الأول — القائمة الجانبية: 12 مدخلاً

`Sidebar.tsx` يعرض 12 وحدة. مدخل العمل **واحد بالفعل**:

```text
اللوحة التحكم · ادارة السجل اليومي · ادارة الديون والالتزامات · ادارة صرف وتوريد
★ إدارة العمل والمشاريع والمهام (id: workos)
ادارة العملاء وزيارات · ادارة الاطباء وزيارات · ادارة الروتين والعادات
ادارة الملاحظات · ادارة العهد والاشكاليات · مكتبة الروابط · الاعدادات
```

### 2.2 مدخلان خفيّان (بلا زر في القائمة) يقودان إلى Work OS

`ActiveModuleTab` يحوي 14 قيمة (`types/index.ts:584`) منها `'tasks'` و`'taskflow'` **غير موجودتين في القائمة الجانبية**،
وكلتاهما تُوجَّه إلى `WorkOSModule` نفسه:

```ts
// AppRouter.tsx:190
{(activeTab === 'workos' || activeTab === 'tasks' || activeTab === 'taskflow') && (
  <WorkOSModule initialView={activeTab === 'taskflow' ? 'taskflow' : activeTab === 'tasks' ? 'tasks' : 'dashboard'} … />

// WorkOSModule.tsx:127-133
if (initialView === 'taskflow')      return 'kanban';   // ← TaskFlow أصبح Kanban
if (initialView === 'classic_tasks') return 'tasks';
if (initialView === 'tasks')         return 'tasks';
```

**النتيجة:** «إعادة توجيه الـLegacy Route → إدارة العمل» (§30) **منفَّذة فعلاً** — بل إن `App.tsx:557,570` ما زال ينادي `setActiveTab('tasks')` لفتح المهام من إشعار.

### 2.3 المستوى الثاني — داخل Work OS

**7 تبويبات أولية** (معلَّقة في الكود بـ«As mandated by the Work OS Unified Master Prompt»):

| # | المعرّف | التسمية | المكوّن | عدّاد |
|---|---|---|---|---|
| 1 | `overview` | نظرة عامة | `WorkOSOverviewTab` | — |
| 2 | `projects` | المشاريع | `WorkOSProjectsTab` | `data.projects.length` |
| 3 | `tasks` | المهام | `WorkOSTasksTab` | `data.tasks.length` |
| 4 | `kanban` | كانبان | `WorkOSKanbanTab` | — |
| 5 | `timeline` | الجدول الزمني | `WorkOSTimelineTab` | — |
| 6 | `priorities` | الأولويات | `WorkOSPrioritiesTab` | — |
| 7 | `workload` | عبء الفريق | `WorkOSTeamWorkloadTab` | — |

**9 واجهات ثانوية** (`secondaryView`): `inbox` · `routine` · `habits` · `goals` · `calendar` · `works` · `notes` · `automation` · `reports` + `classic_tasks`.

**شريط علوي موحّد** `WorkOSUnifiedTopBar`: بحث · إضافة سريعة · مؤقّت تشغيل · كثافة العرض · إخفاء المكتمل · فلترة المتأخر/العاجل.
**بحث شامل موجود:** `WorkOSCommandPaletteModal` · **لوحة إضافة سريعة:** `WorkOSQuickAddModal` (7 أنواع: مهمة · مشروع · ملاحظة · موعد · التزام · عادة · هدف).
**فلترة:** `WorkOSFilterStrip` (الحالة · الأولوية · المشروع · المسؤول …).

---

## 3. التخزين — نقطة الخطر الأولى 🔴

### 3.1 مخزنان حيّان لنفس المفهوم

| المخزن | المفتاح | النوع | المستودع | من يقرأ/يكتب |
|---|---|---|---|---|
| **Suite Tasks** | `suite_tasks_tasks_v2` | `Task` | `SuiteTaskRepository` (`WorkTaskRepository.ts:15-17`) | `TaskService` → `App.tsx:118` → **`TasksModule` · الإشعارات · عدّادات اللوحة · شارة القائمة** |
| **Work OS Tasks** | `workos_v1_tasks` | `WorkTask` | `WorkTaskRepository` (`WorkTaskRepository.ts:55`) | `workosStorage.loadWorkOSData()` → **`WorkOSTasksTab` · Kanban · Timeline · Priorities · الأهداف** |
| **Work OS Projects** | `workos_v1_projects` | `WorkProject` | `WorkTaskRepository:105` | واجهات Work OS |
| مفتاح ميت | `suite_tasks_items_v2` | `Task[]` | — | `storage.ts:531` يكتبه **ولا قارئ له** |

### 3.2 الأثر المُثبَت على المستخدم

1. **رقمان مختلفان لنفس الكلمة:** «إجمالي المهام» في `overview` يُحسب من `data.tasks` (مخزن Work OS)، بينما صفحة «المهام» عبر `classic_tasks` → `TasksModule` تُغذّى من `props.tasks` (مخزن Suite). المستخدم يرى رقمين متعارضين في الشاشة نفسها.
2. **عطب شارة القائمة الجانبية (عطب مُثبَت):**
   ```ts
   // App.tsx:466-472 — القيمتان متطابقتان حرفياً
   taskflowCount: tasks.filter((t) => t.status !== 'تم الانجاز').length,
   tasksCount:    tasks.filter((t) => t.status !== 'تم الانجاز').length,
   // Sidebar.tsx:122 — والشارة تجمعهما!
   count: (tasksCount || 0) + (taskflowCount || 0) + (workosCount || 0),
   ```
   ⇒ الشارة تُظهر **ضعف** عدد المهام المفتوحة (`workosCount` غير مُمرَّر أصلاً = 0).
3. **اختلاف الحقول:** `Task` (Suite) يستخدم حالات عربية نصّية (`'تم الانجاز'`)، بينما `WorkTask` يستخدم `TaskStatus` إنجليزياً (`'new' | 'planned' | 'in_progress' | …`). أي دمج يلزمه **Migration** لا مجرد تغيير مفتاح.

### 3.3 نماذج الحالة (للتوثيق)

- **حالات `WorkTask`** (10): `new · planned · ready · in_progress · blocked · review · completed · cancelled · archived · delayed`
- **أولويات:** `urgent · high · medium · low · none`
- **حالات `WorkProject`** (7): `planned · active · paused · delayed · completed · cancelled · archived`
- **كانبان** يُبنى على هذه الحالات القائمة (لا حالات جديدة) ✅ مطابق لـ§16

---

## 4. المكوّنات: الحيّ مقابل الميت

### 4.1 `workos/` — 29 ملفاً (23 حيّ · **6 ميت**)

| الميت | السطور | ملاحظة |
|---|---|---|
| `WorkOSTasksView.tsx` | **1308** | نسخة عرض مهام موازية لـ`WorkOSTasksTab` (513) — ازدواج منطق |
| `WorkOSDashboard.tsx` | 497 | لوحة موازية لـ`WorkOSOverviewTab` (381) |
| `WorkOSProjectsView.tsx` | — | نسخة موازية لـ`WorkOSProjectsTab` (647) |
| `WorkOSTaskDetailModal.tsx` | 623 | **محمي** (§5) لكنه ميت |
| `WorkOSEisenhowerMatrix.tsx` | 464 | مصفوفة أيزنهاور غير موصولة |
| `WorkOSTeamWorkloadView.tsx` | — | نسخة موازية لـ`WorkOSTeamWorkloadTab` (278) |

> ⚠️ **لا يُحذف أي منها** (§31). تُوثَّق كدَين تقني، ويُقرَّر لاحقاً إمّا إحياؤها أو حذفها في مهمة مصرَّح بها.

### 4.2 `taskflow/` — 8 ملفات، **كلها ميتة** (منها 5 محمية)

`TaskFlowModule` · `TaskFlowBoardView` · `TaskFlowTimelineView` · `TaskFlowTaskModal`🔒 · `TaskFlowProjectsModal`🔒 · `TaskFlowMembersModal`🔒 · `TaskFlowImportExportModal`🔒 · `TaskFlowUserSwitchModal`🔒
⇒ منطق TaskFlow موجود ومحفوظ برمجياً، ووصوله الوظيفي مُغطّى داخل Work OS (`taskflow → kanban`).

---

## 5. المكونات المحمية في نطاق العمل (19 من 46)

| الوحدة | العدد | المكوّنات |
|---|---|---|
| `routines/` | 7 | `RoutineWizardModal` · `RoutineDetailModal` · `RoutineTimerModal` · `RoutineTemplatesModal` · `RoutineSkipModal` · `RoutinePostponeModal` · `RoutineAIAssistantModal` |
| `taskflow/` | 5 | `TaskFlowTaskModal` · `TaskFlowProjectsModal` · `TaskFlowMembersModal` · `TaskFlowImportExportModal` · `TaskFlowUserSwitchModal` (كلها داخل وحدة ميتة) |
| `tasks/` | 2 | **`TaskModal`** · **`CommitmentModal`** ← النموذجان الفعليان للمهام |
| `workos/` | 5 | `WorkOSQuickAddModal` · `WorkOSCommandPaletteModal` · `WorkOSTaskDrawer` · `WorkOSAICopilotModal` · `WorkOSTaskDetailModal` (ميت) |

**نموذج الإدخال الحيّ للمهمة = `tasks/TaskModal`** (§13: «استخدم Task Modal الحالي» ✅).
**نموذج الإدخال السريع = `WorkOSQuickAddModal`** (7 أنواع، §11 ✅) — وكلاهما محمي.

---

## 6. العلاقات الحالية (لا تُخترَع علاقات جديدة — §19)

```text
WorkProject ──1:N──▶ WorkTask            (WorkTask.projectId)
WorkProject ──1:N──▶ GoalObjective       (GoalObjective.linkedProjectId)
WorkTask    ──1:N──▶ WorkSubtask         (WorkTask.subtasks)
WorkTask    ──N:M──▶ WorkTask            (WorkTask.dependencies[])
WorkTask    ──1:N──▶ TimeEntry / Comment / ChecklistItem
WorkTask    ──recurrence──▶ محرّك التكرار (none|daily|weekly|monthly|yearly)
AppointmentItem ──▶ WorkTask             (AppointmentItem.linkedTaskId)
WorkTask ──customerRef──▶ CRM (العملاء)   ← الجسر الوحيد الحالي نحو الزيارات
WorkCommitment / WorkMeeting / WorkNote / HabitItem / DailyRoutineBlock / InboxItem / AutomationRule
```

**الزيارات:** لا علاقة مباشرة بينها وبين `WorkTask` غير `customerRef`. أي ربط أقوى = تغيير Data Model ⇒ **خارج النطاق**.

---

## 7. مؤشرات «نظرة عامة» — الموجود مقابل المطلوب (§6)

`kpiStats` المحسوبة فعلاً في `WorkOSModule`: `totalTasks` · `openTasks` · `completedTasks` · `dueTodayTasks` · `inProgressTasks` · `overdueTasks` · `urgentTasks` · `totalProjects` · `activeProjects` · `overallCompletionRate`.

| المؤشر المطلوب (§6) | الحالة |
|---|---|
| إجمالي المهام · مهام اليوم · المتأخرة · قيد التنفيذ · المكتملة | ✅ موجود (من مخزن Work OS) |
| المشاريع النشطة | ✅ موجود |
| **المشاريع المتأخرة** | ⚠️ `ProjectStatus` يحوي `delayed` لكن لا KPI محسوب بعد |
| **المواعيد القادمة** | ⚠️ البيانات موجودة (`data.appointments`) بلا KPI |
| **الزيارات القادمة** | ❌ بياناتها خارج Work OS (CRM) |
| **الأهداف النشطة** | ⚠️ البيانات موجودة (`data.goals`) بلا KPI |

---

## 8. المخاطر المصنّفة

| # | الخطر | الشدة | يحتاج |
|---|---|---|---|
| R-A | ازدواج مخزن المهام + اختلاف الحالات (عربي/إنجليزي) | 🔴 عالٍ | **Specification منفصلة** + Migration Plan (§45) |
| R-B | عطب شارة القائمة (ضعف العدد) | 🔴 مُثبَت | إصلاح سطر واحد في `Sidebar.tsx:122` |
| R-C | 6 مكوّنات ميتة في `workos` (منها `WorkOSTasksView` 1308 سطراً) | 🟡 متوسط | قرار: إحياء أم حذف بمهمة مصرَّح بها |
| R-D | 5 مكوّنات محمية داخل `taskflow` الميت | 🟡 متوسط | لا حذف (§31) — تُترك كما هي |
| R-E | غياب «التخطيط اليومي» و«الزيارات» | ✅ **مغلق** | الواجهتان منفَّذتان (الزيارات قراءة فقط بلا مسار كتابة) |
| R-F | تسمية القائمة «إدارة العمل والمشاريع والمهام» أطول من المطلوب «إدارة العمل» | 🟢 منخفض | تغيير نصّي في 3 ملفات (`Sidebar` · `Navbar` · `Header`) |

---

## 9. ما هو **غير محسوم** (يُصرَّح به بدل تخمينه)

1. **`workosCount`** — يُقرأ في `Sidebar.tsx:122` ولا أجده مُمرَّراً من `App.tsx`؛ الأرجح أنه دائماً `0`، ولم أتتبّع كل مسارات `MainLayout`. (غير محسوم)
2. **`suite_tasks_items_v2`** — يُكتب في `storage.ts:531` بلا قارئ مرصود، لكن قد يُقرأ عبر قراءة مباشرة بـ`dbStorage.getItem` في موضع لم أفحصه. (غير محسوم)
3. **مدى استخدام `WorkTaskRepository` للكتابة** — مُستورَد في `services/work/TaskService` و`services/dashboard/DashboardService`، لكن واجهات Work OS تستخدم `workosStorage` مباشرة؛ إن كان الاثنان يكتبان نفس المفتاح فأيّهما يسبق؟ (يحتاج فحص سباق — مرشَّح لاختبار R1 القائم)
4. **عدد الزيارات القابلة للعرض** في نطاق العمل (يعتمد على تعريف «زيارة مرتبطة بالعمل») — لم يُقس.

---

## 10. المراجع داخل المستودع

| المرجع | المحتوى |
|---|---|
| `docs/تدقيق/01-خريطة-المعمارية.md` | خريطة الوحدات الـ14 |
| `docs/تدقيق/02-سجل-المكونات-المحمية.md` | المكوّنات الـ46 المحمية |
| `docs/تدقيق/03-عقود-البيانات-والتخزين.md` | 66 مفتاح تخزين |
| `docs/تدقيق/04-مصفوفة-CRUD-والعلاقات.md` | CRUD والعلاقات |
| `docs/تدقيق/05-التكرار-والضعف-والأداء.md` | R5 = مسارا البيانات المزدوجان (هذه الوثيقة تؤكّده بالأدلة) |
| `docs/تدقيق/inventory.json` | الحيّ/الميت لكل ملف (227) |
| `WORK_OS_TARGET_STATE.md` | الوضع المستهدف |
| `WORK_OS_MIGRATION_PLAN.md` | خطة التنفيذ التدريجي |
