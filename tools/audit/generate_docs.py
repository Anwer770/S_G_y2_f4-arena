#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""يولّد وثائق التدقيق الجدولية من مخرجات audit.py / audit2.py / audit3.py"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D = os.path.join(ROOT, 'docs', 'تدقيق')

def load(name):
    with open(os.path.join(D, name), encoding='utf-8') as f:
        return json.load(f)

a1 = load('inventory.json')
a2 = load('audit2.json')
a3 = load('protectedContracts.json')

# ============================================================ 02 — Protected registry
rows2 = []
for r in a3:
    reg = next((x for x in a2['protectedRegistry'] if x['file'] == r['file']), None)
    callbacks = ', '.join(reg['callbacks'][:4]) if reg else ''
    rows2.append(
        f"| `{r['component']}` | `{r['file']}` | {r['loc']} | {r['stateFieldCount']} | {callbacks} | "
        f"{'✔' if reg and reg['validation'] else '—'} | {'✔' if reg and reg['writesStorage'] else 'عبر callback'} |"
    )
doc02 = f"""# 02 — سجل المكونات المحمية (Protected Component Registry)
> مُولَّد آلياً من الشيفرة — `tools/audit/audit3.py`. عدد المكونات: **{len(a3)}**
> القاعدة: هذه المكونات **محمية وظيفياً**. يُسمح فيها بـ **Visual Refactoring فقط** (§9 من البرومبت).

## القواعد الملزمة
```
Fields = نفسها          Workflow = نفسه
Validation = نفسها      Data = نفسها
Actions = نفسها         Business Logic = نفسها
Callbacks = نفسها       Data Contract = نفسه
```
ممنوع: تغيير أسماء الحقول · ترتيب خطوات الحفظ · حذف/إضافة حقل · تغيير Required/Optional · تغيير شكل الكائن المُرسَل.

## الجدول
| المكوّن | المسار | LOC | حقول الحالة | Callbacks | تحقّق | الكتابة |
|---|---|---:|---:|---|---|---|
{os.linesep.join(rows2)}

## بطاقة تحقّق لكل مكوّن (§52)
تُنسخ لكل مكوّن قبل/بعد أي تعديل بصري:
```
[ ] نفس الحقول          [ ] نفس Required      [ ] نفس Defaults
[ ] نفس Validation      [ ] نفس Save          [ ] نفس Update
[ ] نفس Cancel          [ ] نفس Delete        [ ] نفس Callbacks
[ ] نفس State behavior  [ ] نفس Data Contract [ ] نفس Workflow
```
وتُوثَّق النتيجة في `docs/تدقيق/07-تدقيق-المكونات-المحمية.md` (يُنشأ عند أول تعديل بصري).

## حقول الحالة الفعلية (مرجع التحقق)
{os.linesep.join(f"- **{r['component']}** ({r['stateFieldCount']}): `{'` `'.join(r['stateFields'])}`" if r['stateFields'] else f"- **{r['component']}**: (بلا حقول حالة — مكوّن عرض فقط)" for r in a3[:24])}
"""
with open(os.path.join(D, '02-سجل-المكونات-المحمية.md'), 'w', encoding='utf-8') as f:
    f.write(doc02)

# ============================================================ 03 — Data contracts & storage
rows3 = []
for k, v in sorted(a2['storageMap'].items()):
    rows3.append(f"| `{k}` | `{v['constName']}` | `{v['loadFn'] or '—'}` | `{v['saveFn'] or '—'}` | {len(v['readers'])} | {len(v['writers'])} |")
rows_contracts = []
for ent, c in sorted(a1['contracts'].items()):
    rows_contracts.append(f"| `{ent}` | `{c['definedIn']}` | {c['count']} | `{'` `'.join(c['fields'])}` |")
doc03 = f"""# 03 — عقود البيانات وطبقة التخزين (Data Contracts & Storage)
> مُولَّد آلياً — `tools/audit/audit.py` + `audit2.py`
> **§8:** لا يُغيَّر أي Data Contract إلا بـ Migration موثّق. **§19:** لا فقدان بيانات إطلاقاً.

## 1) مفاتيح التخزين ({len(a2['storageMap'])} مفتاحاً)
كلها تُقرأ/تُكتب عبر `dbStorage` → `IndexedDBAdapter` (IndexedDB + ذاكرة + مرآة localStorage).

| المفتاح | الثابت | دالة القراءة | دالة الحفظ | قارئون | كاتبون |
|---|---|---|---|---:|---:|
{os.linesep.join(rows3)}

## 2) عقود الكيانات الأساسية (استُخرجت من الأنواع الفعلية)
| الكيان | معرَّف في | عدد الحقول | الحقول |
|---|---|---:|---|
{os.linesep.join(rows_contracts)}

## 3) إصدارات البيانات القائمة
- `suite_db_schema_version` — في `src/database/migrations/MigrationRunner.ts` (التزامن غير مُستدعى حالياً — راجع doc 05).
- مفاتيح النسخ الموحّد تحمل لاحقة إصدار في الاسم نفسه: `_v1` / `_v2` (مثال: `suite_fin_transactions_v2` مقابل `suite_stock_products_v2`).
- حقول احتياطية قديمة تُقرأ كبدائل: `stock_ledger_products_v1` وغيرها داخل دوال `load*` (توافق خلفي — لا تُحذف).

## 4) قواعد إلزامية لأي Migration
```
1. Backup قبل أي تحويل (BackupService.createBackup → UnifiedBackupState)
2. قراءة القديم + كتابة الجديد (لا استبدال في المكان)
3. تحقق بعدّ السجلات: Before Count = After Count
4. الإبقاء على المفتاح القديم كـ fallback للقراءة
5. Rollback: استرجاع النسخة الموحّدة restoreUnifiedBackup
```
**ممنوع:** `localStorage.clear()` إلا داخل `resetAllModuleData()` (زر إعادة الضبط الصريح مع تأكيد المستخدم) — وهذا هو السلوك الحالي، ويجب الحفاظ عليه.

## 5) مسارا الوصول للبيانات (سبب جذري لخطر فقدان البيانات)
```
المسار الحديث:  Component → service → repository → indexedDBStorage.getItemSync
المسار القديم:  Component/App.tsx → utils/storage.ts load*/save* → dbStorage → indexedDBStorage
```
كلاهما يستدعي **الدوال المتزامنة** و**لا ينتظر `initPromise`** → قراءة أولى `null` لبيانات > 500KB.
التفصيل والدليل التجريبي في `تقرير-الفحص.md` §3.1 — وهو **أول بند في خطة التنفيذ**.
"""
with open(os.path.join(D, '03-عقود-البيانات-والتخزين.md'), 'w', encoding='utf-8') as f:
    f.write(doc03)

# ============================================================ 04 — CRUD matrix
handlers = a2['crud']['handlers']
rows_crud = [f"| `{h['name']}` | `{h['args']}` |" for h in handlers]
rows_state = [f"| `{s['state']}` | `{s['setter']}` |" for s in a2['crud']['state']]
rows_rel = [f"| `{k}` | {v} |" for k, v in a1['relationFields'].items()]
rows_svc = []
for path, fns in sorted(a2['services'].items()):
    rows_svc.append(f"| `{path}` | {len(fns)} | `{'` `'.join(fns[:8])}` |")
doc04 = f"""# 04 — مصفوفة CRUD والعلاقات والحالة
> مُولَّد آلياً — `tools/audit/audit2.py`

## 1) معالجات CRUD المركزية في `src/app/App.tsx` ({len(handlers)} معالجاً)
| المعالج | الوسائط |
|---|---|
{os.linesep.join(rows_crud)}

## 2) حالة التطبيق (useState) — {len(a2['crud']['state'])} حالة
| الحالة | المُحدِّث |
|---|---|
{os.linesep.join(rows_state)}

📌 **ملاحظة معمارية:** لا يوجد Store مركزي (Redux/Zustand). الحالة كلها في `MainApp` وتُمرَّر عبر props إلى `AppRouter` (تسليم ~150 prop). هذا هو أكبر مصدر لإعادة الرسم وللتعقيد — يُعالج في Phase 3 بلا تغيير السلوك.

## 3) حمولة دوال التحميل/الحفظ المستوردة في App.tsx
- دوال التحميل: **{len(a2['crud']['importedLoaders'])}** · دوال الحفظ: **{len(a2['crud']['importedSavers'])}**
- لكن أجزاءً من الحالة تُحمَّل عبر الخدمات بدلاً منها (`inventoryService.getAllProducts()` · `financialService.getAll()` · `taskService.getAllTasks()` · `customerService.getAll()` · `doctorService.getAll()`) → **مساران متوازيان لنفس البيانات** (doc 03 §5).

## 4) طبقة الخدمات والمستودعات
| الملف | عدد الدوال | أمثلة |
|---|---:|---|
{os.linesep.join(rows_svc)}

## 5) حقول العلاقات بين الكيانات (مرجع التكامل)
| الحقل | مرات الاستخدام |
|---|---:|
{os.linesep.join(rows_rel)}

## 6) الاستيراد/التصدير (Excel) — يجب الحفاظ عليه (§20)
- `src/utils/excel.ts` · `excelExport.ts` · `universalImporters.ts` · `universalDataTemplates.ts`
- نوافذ الاستيراد: `ImportCustomersModal` · `ImportDoctorsModal` · `ImportFinancialModal` · `TaskFlowImportExportModal` · `UniversalDataExchangeModal`
- التصدير متاح في الشاشات الجدولية + التقارير + `custodyExport.ts` · `linksExport.ts`
"""
with open(os.path.join(D, '04-مصفوفة-CRUD-والعلاقات.md'), 'w', encoding='utf-8') as f:
    f.write(doc04)

print("generated:")
for f in sorted(os.listdir(D)):
    print("  ", f, os.path.getsize(os.path.join(D, f)), "bytes")
