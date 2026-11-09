#!/usr/bin/env node
/**
 * بوابة أمنية: تخزين المصادقة والإعدادات (R38).
 *
 * لماذا بوابة مستقلة؟ لأن `settings.ts` و`system.ts` يحملان أخطر مفتاحين في التطبيق:
 * **جلسة الدخول** و**قفل المحاولات الفاشلة**. نقلهما إلى المستودعات لا يجوز أن يمرّ
 * بثقة: كل ضمان هنا مقيس على الكود الإنتاجي داخل DOM وهمي.
 *
 *   A1 الوحدتان لا تلمسان dbStorage مباشرةً (كل شيء عبر المستودع)
 *   A2 الإعدادات: افتراضي عند الغياب · دمج المحفوظ · تالف ⇒ افتراضي · حفظ/قراءة
 *   A3 الجلسة: غياب/تلف/بلا userId ⇒ null · الصحيحة تُقرأ بحقولها كما هي
 *   A4 المسح يحذف المفتاح فعلياً (لا يكتب '{}' — جلسة فارغة لا تُقرأ كجلسة)
 *   A5 قفل المحاولات: يُحفظ ويُقرأ كما هو · التالف ⇒ {} (لا قفل زائف) · لا دمج
 *   A6 سجل النظام: بذرة عند الغياب · الفراغ مقبول · سقف 1000 سطر
 *
 * التشغيل: node tools/regression/auth-storage.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { read } from './_source.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const OUT_DIR = path.join(ROOT, 'docs', 'تدقيق');
const BUNDLE = path.join(OUT_DIR, '.auth-storage-bundle.js');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

// المفاتيح تُقرأ من الوحدة نفسها بعد التحميل — لا نسخ نصي يتقادم بصمت
let KEYS = {};

fs.mkdirSync(OUT_DIR, { recursive: true });
execFileSync(
  path.join(ROOT, 'node_modules', '.bin', 'esbuild'),
  [
    path.join(ROOT, 'tools', 'regression', '_auth_storage_entry.ts'),
    '--bundle',
    '--format=iife',
    '--global-name=AUTH_STORAGE',
    '--outfile=' + BUNDLE,
    '--define:process.env.NODE_ENV="production"',
    '--log-level=error',
  ],
  { cwd: ROOT, stdio: 'inherit' }
);

const { JSDOM, VirtualConsole } = require('jsdom');
const errors = [];
const vc = new VirtualConsole();
vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 200)));
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + String(e?.message).slice(0, 200)));

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://auth-storage.local/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const w = dom.window;
w.eval(fs.readFileSync(BUNDLE, 'utf8'));
const S = w.AUTH_STORAGE;
KEYS = {
  settings: S.STORAGE_KEYS.SETTINGS,
  audit: S.STORAGE_KEYS.SYSTEM_AUDIT,
  guard: S.STORAGE_KEYS.AUTH_GUARD,
  session: S.STORAGE_KEYS.AUTH_SESSION,
};

const seed = (key, raw) => S.dbStorage.setItem(key, raw);
const raw = (key) => S.dbStorage.getItem(key);

// ── A1: لا وصول مباشر للتخزين
const files = ['src/utils/storage/settings.ts', 'src/utils/storage/system.ts'];
const direct = files.filter((f) => /dbStorage\.(getItem|setItem|removeItem)/.test(read(f)));
check(
  'A1 · الوحدتان تستخدمان المستودع ولا تلمسان التخزين مباشرةً',
  direct.length === 0,
  direct.join(' · ') || '0 تجاوز'
);

// ── A2: الإعدادات
S.dbStorage.removeItem(KEYS.settings);
const settingsDefault = S.loadSettings();
seed(KEYS.settings, JSON.stringify({ defaultYear: 2025, حقلLegacy: 'x' }));
const settingsMerged = S.loadSettings();
seed(KEYS.settings, JSON.stringify({ defaultCurrency: 'دولار' }));
const settingsInvalid = S.loadSettings();
S.saveSettings({ defaultYear: 2026, skipCancelled: false, defaultCurrency: 'ريال', enableNotifications: false });
const settingsSaved = S.loadSettings();
check(
  'A2 · الإعدادات: افتراضي عند الغياب · دمج المحفوظ · بلا defaultYear رقمي ⇒ الافتراضي كاملاً · حفظ/قراءة',
  settingsDefault.defaultYear === S.DEFAULT_APP_SETTINGS.defaultYear &&
    settingsMerged.defaultYear === 2025 &&
    settingsMerged.skipCancelled === S.DEFAULT_APP_SETTINGS.skipCancelled &&
    settingsMerged.حقلLegacy === 'x' &&
    settingsInvalid.defaultYear === S.DEFAULT_APP_SETTINGS.defaultYear &&
    settingsSaved.defaultYear === 2026 &&
    settingsSaved.skipCancelled === false,
  `افتراضي=${settingsDefault.defaultYear} · مدموج=${settingsMerged.defaultYear} · تالف=${settingsInvalid.defaultYear}`
);

// ── A3: الجلسة
S.dbStorage.removeItem(KEYS.session);
const sessionMissing = S.loadAuthSession();
seed(KEYS.session, '{تالف');
const sessionCorrupt = S.loadAuthSession();
seed(KEYS.session, JSON.stringify({ loginTime: '2026-11-07', expiresAt: 1 }));
const sessionNoUser = S.loadAuthSession();
seed(
  KEYS.session,
  JSON.stringify({ userId: 'usr-1', loginTime: '2026-11-07T10:00:00Z', expiresAt: 1000, remember: true })
);
const sessionValid = S.loadAuthSession();
check(
  'A3 · الجلسة: غياب/تلف/بلا userId ⇒ null · الصحيحة تُقرأ بحقولها كما هي',
  sessionMissing === null &&
    sessionCorrupt === null &&
    sessionNoUser === null &&
    sessionValid?.userId === 'usr-1' &&
    sessionValid?.expiresAt === 1000 &&
    sessionValid?.remember === true,
  `غياب=${sessionMissing} · تلف=${sessionCorrupt} · بلا معرّف=${sessionNoUser} · صحيحة=${sessionValid?.userId}`
);

// ── A4: المسح يحذف المفتاح
S.saveAuthSession({ userId: 'usr-2', loginTime: '2026-11-07T11:00:00Z', expiresAt: 2000, remember: false });
const beforeClear = S.loadAuthSession()?.userId;
S.clearAuthSession();
const afterClearRaw = raw(KEYS.session);
check(
  'A4 · المسح يحذف المفتاح فعلياً (لا يكتب كائناً فارغاً)',
  beforeClear === 'usr-2' && afterClearRaw === null && S.loadAuthSession() === null,
  `قبل=${beforeClear} · بعد=${afterClearRaw === null ? 'محذوف' : afterClearRaw}`
);

// ── A5: قفل المحاولات
S.dbStorage.removeItem(KEYS.guard);
const guardDefault = S.loadAuthGuardState();
seed(KEYS.guard, JSON.stringify({ 'usr-1': { failures: 5, lockedUntil: 999999, lastFailureAt: 111 } }));
const guardLocked = S.loadAuthGuardState();
seed(KEYS.guard, '[1,2,3]');
const guardArray = S.loadAuthGuardState();
seed(KEYS.guard, '{تالف');
const guardCorrupt = S.loadAuthGuardState();
S.saveAuthGuardState({ 'usr-3': { failures: 2, lockedUntil: 0, lastFailureAt: 5 } });
const guardSaved = S.loadAuthGuardState();
check(
  'A5 · قفل المحاولات: افتراضي {} · المحفوظ يُقرأ كما هو (لا دمج) · مصفوفة/تالف ⇒ {}',
  Object.keys(guardDefault).length === 0 &&
    guardLocked['usr-1'].failures === 5 &&
    guardLocked['usr-1'].lockedUntil === 999999 &&
    Object.keys(guardArray).length === 0 &&
    Object.keys(guardCorrupt).length === 0 &&
    guardSaved['usr-3'].failures === 2 &&
    guardSaved['usr-1'] === undefined,
  `افتراضي=${Object.keys(guardDefault).length} · مقفل=${guardLocked['usr-1'].failures} · تالف=${Object.keys(guardCorrupt).length}`
);

// ── A6: سجل النظام
S.dbStorage.removeItem(KEYS.audit);
const auditSeed = S.loadSystemAuditLogs();
seed(KEYS.audit, '[]');
const auditEmpty = S.loadSystemAuditLogs();
const many = Array.from({ length: 1200 }, (_, i) => ({
  id: `L-${i}`,
  timestamp: 'x',
  module: 'نظام',
  action: 'إضافة',
  details: 'd',
}));
S.saveSystemAuditLogs(many);
const auditCapped = S.loadSystemAuditLogs();
S.logSystemAudit('نظام', 'اختبار', 'تفصيل');
const auditAfterLog = S.loadAuditLogs();
check(
  'A6 · سجل النظام: بذرة عند الغياب · الفراغ مقبول · سقف 1000 · الأحدث يُضاف في المقدمة',
  auditSeed.length === 1 &&
    auditEmpty.length === 0 &&
    auditCapped.length === 1000 &&
    auditAfterLog.length === 1000 &&
    auditAfterLog[0].details === 'تفصيل',
  `بذرة=${auditSeed.length} · فراغ=${auditEmpty.length} · سقف=${auditCapped.length} · الأحدث=${auditAfterLog[0]?.details}`
);

check('A7 · لا أخطاء JS أثناء التشغيل', errors.length === 0, errors[0] || '');

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة بوابة تخزين المصادقة (R38) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
fs.writeFileSync(
  path.join(OUT_DIR, 'auth-storage-runtime.json'),
  JSON.stringify({ at: new Date().toISOString(), passed, total: results.length, results }, null, 1),
  'utf8'
);
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
