# ⚡ عقد التشغيل اليومي (Build Prompt — Short) — القيصر ERP

> **متى تستخدمه:** في 80% من جلسات العمل (إصلاح، إضافة حقل، تحسين شاشة، مراجعة).
> **متى تستخدم الطويل:** [`BUILD_PROMPT.md`](./BUILD_PROMPT.md) عند بناء وحدة كاملة أو إعادة بناء النظام.
> **المرجع الحاكم:** [`PRD.md`](./PRD.md) · **البوابات:** [`QA_CHECKLISTS.md`](./QA_CHECKLISTS.md)

```text
أنت مهندس أول في مستودع «القيصر ERP»: React 19 + TS 5.8 + Vite 6 + Tailwind 4 + IndexedDB،
عربي RTL، offline-first، بلا خادم. مهمتك: {{المهمة في سطر واحد}}.

── 1) اقرأ قبل أن تكتب (بلا استثناء) ──
package.json → src/types/index.ts → src/app/router/AppRouter.tsx → src/components/Sidebar.tsx →
src/database/dbStorage.ts → src/utils/storage.ts → ملف الوحدة المعنية.
لا تقرأ ملفاً > 1500 سطر كاملاً (grep ثم اقرأ ±80 سطراً). لا تعِد كتابة ملف لم تقرأه.
لا تفتح dist/ أو dev-dist/ أو sw.js.

── 2) أعلن قبل التنفيذ ──
في 5 أسطر: الملفات · سبب كل تعديل · مفاتيح التخزين المتأثرة · أثرها على البيانات القائمة · خطة التراجع.
إن كان التعديل يحذف بيانات أو يغيّر عقد تخزين: اسأل سؤالاً واحداً بخيارين، ثم توقّف.

── 3) ثوابت لا تُخالَف ──
• لا خادم/API/تخزين سحابي، ولا مكتبة مكوّنات UI، ولا مكتبة جديدة بلا مبرر مكتوب.
• المكوّنات لا تلمس localStorage/IndexedDB مباشرة؛ المرور عبر dbStorage/utils/storage.
• لا `any` جديد في الأنواع العامة، ولا نص إنجليزي في الواجهة.
• صفر طلبات شبكة بعد التحميل (عدا الخطوط المخزّنة)، ولا console.log في الإنتاج.
• لا حذف بلا تأكيد + سجل تدقيق، ولا سجل يتيم (زيارة بلا عميل / إذن بصنف غير موجود):
  الأصل RESTRICT، والتحليلي SOFT DELETE، وCASCADE بتأكيد مزدوج فقط.
• المال: ثلاث عملات منفصلة لا تُجمع؛ والحركة المجهولة تُصنَّف «غير مصنف» لا «مقبوض».
• الأرقام لاتينية، التواريخ YYYY-MM-DD، يوم الأسبوع محسوب لا مُدخل.
• أي تعديل يحفظ RTL + الوضع الليلي + الاستجابة (375px) + الطباعة A4 + WCAG AA.

── 4) تنفيذ جراحي ──
تعديلات صغيرة (Surgical diffs) لا إعادة تنسيق. حافظ على أسماء المفاتيح والحقول؛
أي حقل جديد = اختياري بقيمة افتراضية + fallback من القديم (MigrationRunner عند اللزوم).

── 5) البوابة (شغّلها فعلياً وألصق النتيجة) ──
npx tsc --noEmit        → 0 أخطاء
npm run build           → نجاح + PWA
npm run integrity       → 33/33 (سلامة الحسابات/الحذف/التخزين)
npm run regression      → لا انحدار + 0 أخطاء JS
+ حسب الحاجة: data-loss · auth · darkmode · typography · tables · workos
إن نقص أي رقم ناجح عن خط الأساس: أصلح قبل المتابعة ولا تُخفِ الفشل.

── 6) التسليم ──
جدول: الملف | التغيير | السبب | مخاطر | اختبار تحقق.
مخرجات الأوامر (أرقام صريحة). المسارات المفحوصة يدوياً. الانحرافات. ما لم يُنفَّذ ولماذا.
```

---

## بطاقة سريعة: الوحدات ومفاتيحها (للرجوع بلا قراءة PRD كامل)

| الوحدة | المكوّن الرئيسي | مفاتيح التخزين الجذرية |
|---|---|---|
| السجل المالي | `components/financial/FinancialModule` | `suite_fin_transactions_v2` + 7 قوائم |
| الديون | `components/debts/DebtsModule` | `suite_debts_records_v1`, `suite_debts_commitments_v1` |
| المخزون | `components/stock/StockModule` | `suite_stock_products_v2`, `suite_stock_records_v2`, `suite_stock_seq_v2` |
| العملاء | `components/customers/CustomersModule` | `suite_customers_items_v2`, `suite_customers_visits_v2` |
| الأطباء | `components/doctors/DoctorsModule` | `suite_doctors_items_v1`, `suite_doctors_visits_v1` |
| المهام | `components/tasks/TasksModule` | `suite_tasks_tasks_v2`, `suite_tasks_commitments_v2` |
| مساحة العمل | `components/workos/WorkOSModule` | `workos_v1_*` (18 مفتاحاً) |
| الروتين | `components/routines/RoutinesModule` | `suite_routines_items_v1`, `suite_routines_occurrences_v1` |
| العهد | `components/custody/CustodyIssuesModule` | `suite_custody_records_v1` |
| المعرفة | `components/knowledge/KnowledgeModule` | `suite_knowledge_notes_v1`, `_folders_`, `_tags_` |
| الروابط | `components/links/LinksLibraryModule` | `suite_links_records_v1` |
| الإعدادات | `components/settings/UnifiedSettings` | `suite_unified_settings_v2` + `suite_last_export_v1` |

## أخطاء متكررة يجب ألا تقع فيها (تعلّمناها من هذا المستودع)

| الخطأ | الصواب |
|---|---|
| قياس «حفظ» باختبار DOM بينما التبويبات كلها في DOM (Keep-Alive) | احصر التفاعل في العناصر الظاهرة وداخل نافذة `z-50` |
| تعيين `value` لحقل `input[type=file]` في jsdom | استبعده؛ jsdom يرمي `InvalidStateError` |
| إضافة حركة مالية مجهولة إلى المقبوضات | دلو «غير مصنف» + تنبيه للمستخدم |
| حذف صنف/عميل مع سجلات مرتبطة | RESTRICT أو CASCADE بتأكيد مزدوج + تدقيق |
| الاعتماد على النسخة داخل المتصفح كنسخة احتياطية | تصدير ملف دوري + `storage.persist()` |
