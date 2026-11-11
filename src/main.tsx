import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { indexedDBStorage } from './database/adapters/IndexedDBAdapter';
import { requestPersistentStorage } from './utils/storagePersistence';
import { bootSchema } from './database/schema';
import { migrateLegacySyncOutbox } from './utils/syncOutbox';
import { APP_NAME, APP_VERSION_LABEL } from './constants/appMeta';

// عنوان الصفحة من المصدر الوحيد للهوية (إصلاح R7)
document.title = `${APP_NAME} · ${APP_VERSION_LABEL}`;

const container = document.getElementById('root')!;

function renderApp() {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>
  );
}

/**
 * بوابة سلامة البيانات (Data Safety Gate)
 *
 * لا تُركَّب الواجهة قبل اكتمال فتح IndexedDB وتحميل بياناته إلى الذاكرة المؤقتة،
 * لأن كل مسارات القراءة (utils/storage.ts ودوال Services/Repositories) متزامنة
 * ولا تنتظر initPromise: فإن لم يكتمل التحميل تُعيد null، فتُبنى حالة الواجهة من
 * البيانات الافتراضية، ويستبدل أول حفظ بيانات المستخدم الحقيقية.
 * (الدليل والسيناريو الكامل: docs/تدقيق/03-عقود-البيانات-والتخزين.md §5)
 *
 * السلوك عند الفشل: نُركّب الواجهة كما كانت تماماً — لا تعطيل للتطبيق أبداً.
 */
(async () => {
  try {
    await indexedDBStorage.ready();
  } catch (err) {
    console.warn('Data safety gate: readiness failed, rendering with current cache', err);
  }
  // R33: ترحيل المخططات المُرقَّم **قبل** تركيب الواجهة — كل القراءات متزامنة،
  // فلو رُكِّبت أولاً لقرأت شكلاً قديماً ثم كتبته فوق الشكل المرحَّل.
  const report = bootSchema();
  if (report.upgraded > 0 || report.failed > 0) {
    console.info(`Schema: رُحِّل ${report.upgraded} مفتاحاً · فشل ${report.failed}`);
  }

  // R62: بعد جاهزية المحول، ننقل سجل واجهة المزامنة السابق قبل أن تبدأ أي خدمة بالكتابة.
  migrateLegacySyncOutbox();

  // طلب تخزين دائم حتى لا يُخلي المتصفح البيانات عند ضغط المساحة (إصلاح R13)
  void requestPersistentStorage();
  renderApp();
})();
