# PROJECT_INVENTORY.md
# جرد شامل للمشروع — الوضع القائم الفعلي (Phase 0 Discovery)

> **تاريخ التوليد والتحقق:** 2026-09-28  
> **مرجع القياس:** الشيفرة المصدرية الفعلية (`src/**/*.ts{,x}`) عبر أدوات التدقيق الآلية (`tools/audit/*.py`)  
> **حالة التحقق:** Verified 100% ضد الكود الفعلي

---

## 1. نظرة عامة وبيانات المشروع الأساسية

| الخاصية | القيمة الفعلية | الملاحظات والضوابط |
|---|---|---|
| **اسم التطبيق (Package Name)** | `caesar-erp-unified` | معرّف في `package.json` |
| **اسم التطبيق للواجهة (Metadata)** | `المنظومة-الإدارية-المتكاملة` | معرّف في `metadata.json` و `index.html` |
| **إطار العمل الأساسي (Framework)** | **React 19.0.1** | مع React DOM 19.0.1 (`strict-mode` مفعّل) |
| **لغة البرمجة (Language)** | **TypeScript 5.8.2** | نمط `ES2022` / `bundler` مع `noEmit: true` |
| **أداة البناء والتطوير (Build Tool)** | **Vite 6.2.3** | منفذ 3000، استضافة 0.0.0.0 |
| **محرك التنسيق (Styling)** | **Tailwind CSS 4.1.14** | `@tailwindcss/vite` 4.1.14، خط `Cairo`، اتجاه `dir="rtl"` |
| **إجمالي ملفات المصدر (`src`)** | **227 ملفاً** | تتوزع على 14 وحدة وظيفية وطبقات بنية تحتية |
| **إجمالي أسطر الشيفرة** | **77,624 سطراً** | 190 ملفاً موصولاً، 37 ملفاً غير موصول (أكواد موروثة) |
| **المكونات المحمية (Protected)** | **46 مكوّناً** | نماذج إدخال، نوافذ منبثقة، ولوحات تعديل بيانات |
| **مفاتيح التخزين (Storage Keys)** | **66 مفتاحاً** | تدار عبر محوّل IndexedDB الموحد |

---

## 2. التبعيات والحزم البرمجية (Dependencies)

### التبعيات التشغيلية (`dependencies`):
* `@google/genai: ^2.4.0` (موجودة في package.json، يتم عزلها خلف مزود AI مجرد)
* `@tailwindcss/vite: ^4.1.14`
* `@vitejs/plugin-react: ^5.0.4`
* `canvas-confetti: ^1.9.4`
* `dotenv: ^17.2.3`
* `express: ^4.21.2`
* `lucide-react: ^0.546.0` (أيقونات النظام الموحدة)
* `motion: ^12.23.24` (حركات وانتقالات الواجهة)
* `qrcode: ^1.5.4` (توليد رموز QR للمستندات والعملاء والسندات)
* `react: ^19.0.1`
* `react-dom: ^19.0.1`
* `recharts: ^3.10.1` (مخططات لوحات التحكم والتقارير)
* `vite: ^6.2.3`
* `xlsx: ^0.18.5` (تصدير واستيراد ملفات الإكسل)

### تبعيات التطوير (`devDependencies`):
* `fake-indexeddb: ^6.2.5` (بيئة محاكاة IndexedDB لاختبارات الانحدار Node.js)
* `jsdom: ^25.0.1` (بيئة اختبار وتدقيق شجرة DOM بدون متصفح)
* `tsx: ^4.21.0` (تشغيل نصوص TypeScript وأدوات التدقيق)
* `typescript: ~5.8.2`
* `vite-plugin-pwa: ^1.3.0` (تكوين تطبيقات الويب التقدمية PWA)
* `@types/*`: node, express, qrcode, canvas-confetti

---

## 3. نقاط الدخول وسلسلة الإقلاع (Entry Points)

1. **`index.html`**:
   * الحاوية الجذرية `<div id="root"></div>`
   * اتجاه اللغة العربية `dir="rtl"` ولغة `lang="ar"`
   * استدعاء خط `Cairo` واستدعاء `src/main.tsx`
   * تسجيل PWA Dev Service Worker معطل بالافتراضي لضمان التوافق مع iframes
2. **`src/main.tsx`**:
   * تفعيل `StrictMode`
   * تغليف التطبيق بـ `ThemeProvider`
   * استدعاء `indexedDBStorage.initPromise` قبل استقرار القراءة الباردة
   * تصيير `<App />` داخل جذر DOM
3. **`src/App.tsx`**:
   * تهيئة موفري السياق العام `<AppProviders>`
   * تصيير المكون الرئيسي `<MainApp>`
4. **`src/app/App.tsx` (MainApp)**:
   * مركز الحالة التشغيلية الرئيسي: يحتوي على 34 حالة `useState` ومعالجة 25 عملية CRUD
   * تغليف الهيكل الأساسي بـ `<MainLayout>` وتمرير الخصائص إلى `<AppRouter>`

---

## 4. المسارات والوحدات الوظيفية (Routes & Modules)

يتم التحكم بالمسارات عبر `src/app/router/AppRouter.tsx` مع تحميل كسول (`lazy loading`) وحارس صلاحيات مركزي (`canAccessModule`):

| # | معرف الوحدة (Tab ID) | العنوان الظاهر | المكون الرئيسي | المسار المصدري |
|---|---|---|---|---|
| 1 | `dashboard` | اللوحة التحكم | `UnifiedDashboard` | `src/components/dashboard/UnifiedDashboard.tsx` |
| 2 | `workos` | إدارة العمل | `WorkOSModule` | `src/components/workos/WorkOSModule.tsx` |
| 3 | `tasks` | إدارة المهام والأعمال | `TasksModule` | `src/components/tasks/TasksModule.tsx` |
| 4 | `taskflow` | إدارة مشاريع ومهام TaskFlow | `TaskFlowModule` | `src/components/taskflow/TaskFlowModule.tsx` (تُعرض كعرض داخل إدارة العمل) |
| 5 | `financial` | إدارة السجل اليومي | `FinancialModule` | `src/components/financial/FinancialModule.tsx` |
| 6 | `stock` | إدارة صرف وتوريد | `RecordsView` | `src/components/stock/RecordsView.tsx` |
| 7 | `customers` | إدارة العملاء وزيارات | `CustomersModule` | `src/components/customers/CustomersModule.tsx` |
| 8 | `doctors` | إدارة الأطباء وزيارات | `DoctorsModule` | `src/components/doctors/DoctorsModule.tsx` |
| 9 | `debts` | إدارة الديون والالتزامات | `DebtsModule` | `src/components/debts/DebtsModule.tsx` |
| 10 | `custody` | إدارة العهد والإشكاليات | `CustodyModule` | `src/components/custody/CustodyModule.tsx` |
| 11 | `knowledge` | إدارة الملاحظات والمعرفة | `KnowledgeModule` | `src/components/knowledge/KnowledgeModule.tsx` |
| 12 | `routines` | إدارة الروتين والعادات | `RoutinesModule` | `src/components/routines/RoutinesModule.tsx` |
| 13 | `links` | مكتبة الروابط والأدوات | `LinksLibraryModule` | `src/components/links/LinksLibraryModule.tsx` |
| 14 | `settings` | إعدادات النظام | `SettingsView` | `src/components/settings/SettingsView.tsx` |

---

## 5. هيكل الطبقات البرمجية القائم (Architecture Layers)

1. **طبقة العرض والواجهة (`src/components`)**:
   * تضم 137 ملفاً للمكونات والوحدات وجداول العرض ونوافذ الإدخال.
2. **طبقة السياق والصلاحيات (`src/context`)**:
   * `AuthContext.tsx`: إدارة جلسة المستخدم الحالية وقائمة المستخدمين والصلاحيات (`ROLE_MODULE_ACCESS`).
   * `ThemeContext.tsx`: تبديل النمط الليلي والنهاري وحفظ الخيار في localStorage.
3. **طبقة الخدمات (`src/services`)**:
   * `FinancialService.ts`: العمليات المالية والمطابقات المحاسبية.
   * `InventoryService.ts`: حركات المخزون والموازين.
   * `CustomerService.ts`: إدارة العملاء والزيارات وتحديث الأرصدة.
   * `DoctorService.ts`: إدارة الأطباء والعينات والمتابعات الميدانية.
   * `DebtService.ts`: الديون والالتزامات والدفعات الجزئية.
   * `CustodyService.ts`: العهد المالية والإشكاليات الإدارية.
   * `TaskService.ts`: مهام العمل والالتزامات الميدانية.
   * `BackupService.ts`: النسخ الاحتياطي الكامل والاستعادة وإعادة ضبط المصنع.
   * `DashboardService.ts`: تجميع المؤشرات والبيانات اللحظية.
4. **طبقة المستودعات (`src/database/repositories`)**:
   * `BaseRepository.ts`: واجهة تجريد عمليات التخزين مع تسجيل التغييرات في `sync_outbox`.
   * مستودعات متخصصة: `CustomerRepository`, `DebtRepository`, `FinancialRepository`, `ProductRepository`, `WorkTaskRepository`, `OtherRepositories`.
5. **طبقة التخزين الفعلي (`src/database/adapters`)**:
   * `IndexedDBAdapter.ts` (`indexedDBStorage`): محرك التخزين الأساسي العامل عبر واجهات غير متزامنة مع دعم دوال `getItemSync` و `setItemSync` عبر ذاكرة مؤقتة `memoryCache` ومرآة متزامنة لـ localStorage للحزم الصغيرة.
   * `src/utils/storage.ts`: دوال التخزين الموروثة التي تستند إلى `dbStorage`.
6. **طبقة المزامنة والطابور (`src/sync`)**:
   * `Outbox.ts`: تسجيل كل عملية تعديل أو إضافة (`suite_sync_outbox_v1`) مع سقف آمن يمنع التضخم (2000 سجل FIFO).
   * ملفات جاهزة للتوسيع السحابي المستقبلي: `SyncEngine.ts`, `Inbox.ts`, `ConflictResolver.ts`, `SyncState.ts`.
7. **طبقة الأدوات المساعدة (`src/utils`)**:
   * دوال معالجة وتصدير واستيراد الإكسل، وتنسيق العملات (YER, SAR, USD)، وحسابات الأرصدة، وسجلات التدقيق.
8. **طبقة النماذج والأنواع (`src/types`)**:
   * العقود البيانية الموحدة (`src/types/index.ts` بالإضافة إلى أنواع Work OS المتخصصة).

---

## 6. فحوصات النظام والأمان والـ PWA

* **Offline-First & PWA**: التطبيق يعمل محلياً بنسبة 100% دون حاجة لأي خادم خلفي. إعدادات PWA ومحتويات الأيقونات وشفرات العمل دون اتصال مدعومة عبر `vite-plugin-pwa`.
* **الأمان والمصادقة**: جلسة العمل تعتمد على نظام مستخدمين محلي ورموز سرية (PIN)، مع تشديد التحقق من الرمز المخصص ومنع الدخول العام الافتراضي.
* **النسخ الاحتياطي**: يدعم النظام تصدير واستيراد ملفات `JSON` لكامل بيانات النظام والتحقق من التوافقية قبل الاسترجاع.
