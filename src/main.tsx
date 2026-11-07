import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { indexedDBStorage } from './database/adapters/IndexedDBAdapter';

const container = document.getElementById('root')!;

function renderApp() {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
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
  renderApp();
})();
