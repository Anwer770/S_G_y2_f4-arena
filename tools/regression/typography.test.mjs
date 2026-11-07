#!/usr/bin/env node
/**
 * اختبار انحدار: أحجام النصوص (Phase 4 · البند: النص 8–11px)
 *
 * يثبت ثلاث طبقات:
 *   1) مصدري : لا يوجد في src أي صنف حجم أصغر من 11px، ولا أصغر من 12px خارج صناديق < 20px.
 *   2) مخرَج : ملف CSS المبني لا يحوي أي font-size أصغر من 11px (والمسموح 11px هو الاستثناء الموثّق).
 *   3) وقت تشغيل: يستخرج كل سلاسل الأصناف التي وصلت فعلاً إلى DOM بعد التنقّل وفتح النوافذ،
 *      ويتأكّد أن لا نص أصغر من 11px، ويقيس انتشار الحجم المعياري (12px).
 *
 * التشغيل: node tools/regression/typography.test.mjs
 *          TYPO_EXPECT=0 APP_ROOT=/tmp/pre-typo node tools/regression/typography.test.mjs   (قياس فقط)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const APP_ROOT = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : ROOT;
const EXPECT = process.env.TYPO_EXPECT !== '0';
const TAG = process.env.TYPO_TAG || (EXPECT ? 'after' : 'before');
const require = createRequire(path.join(ROOT, 'package.json'));

const SETTINGS_KEY = 'qeema_accounting_system_settings_v1';
const MIN_PX = 11;      // أرضية مطلقة
const FLOOR_PX = 12;    // الحد المعياري (= سلّم التطبيق text-xs)

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

const SIZE_TOKEN = /text-\[(\d+(?:\.\d+)?)px\]/g;
const SMALL_BOX = /\b(?:w|h|size)-(?:0\.5|1|1\.5|2|2\.5|3|3\.5|4|4\.5)\b|min-w-\[1[0-9]px\]|\bh-4\b/;

/** يستخرج سلاسل الأصناف من نص HTML أو JSX ويعيد إحصاءات الأحجام */
function scanClassStrings(text) {
  const stats = { byPx: {}, below: [], belowFloorOutsideSmallBox: [], arbitrary: 0 };
  const push = (body) => {
    const small = SMALL_BOX.test(body);
    for (const m of body.matchAll(SIZE_TOKEN)) {
      const px = parseFloat(m[1]);
      stats.byPx[px] = (stats.byPx[px] || 0) + 1;
      stats.arbitrary++;
      if (px < MIN_PX) stats.below.push({ px, excerpt: m[0], body: body.slice(0, 100) });
      else if (px < FLOOR_PX && !small) stats.belowFloorOutsideSmallBox.push({ px, body: body.slice(0, 100) });
    }
  };
  // class="..." (HTML/JSX المُصيَّر) و className="..." و className={`...`}
  for (const m of text.matchAll(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)) {
    push(m[1] ?? m[2] ?? m[3] ?? '');
  }
  return stats;
}

function walkSrc(exts) {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
    }
  };
  walk(path.join(APP_ROOT, 'src'));
  return out;
}

// ================================================================ 1) مصدري
const srcFiles = walkSrc(['.tsx', '.jsx']);
let srcStats = { byPx: {}, below: [], belowFloorOutsideSmallBox: [], arbitrary: 0 };
for (const f of srcFiles) {
  const s = scanClassStrings(fs.readFileSync(f, 'utf8'));
  for (const [k, v] of Object.entries(s.byPx)) srcStats.byPx[k] = (srcStats.byPx[k] || 0) + v;
  srcStats.arbitrary += s.arbitrary;
  srcStats.below.push(...s.below.map((b) => ({ ...b, file: path.relative(APP_ROOT, f) })));
  srcStats.belowFloorOutsideSmallBox.push(...s.belowFloorOutsideSmallBox.map((b) => ({ ...b, file: path.relative(APP_ROOT, f) })));
}
const sizesSrc = Object.keys(srcStats.byPx).map(Number).sort((a, b) => a - b);
console.log(`▸ المصدر: ${srcFiles.length} ملفاً · ${srcStats.arbitrary} حجماً مطلقاً`);
console.log(`   الأحجام المستخدمة: ${sizesSrc.map((s) => s + 'px').join(' · ')}`);

// ================================================================ 2) مخرَج البناء
let cssStats = null;
const distDir = path.join(APP_ROOT, 'dist', 'assets');
if (fs.existsSync(distDir)) {
  const cssFiles = fs.readdirSync(distDir).filter((f) => f.endsWith('.css'));
  if (cssFiles.length) {
    const css = cssFiles.map((f) => fs.readFileSync(path.join(distDir, f), 'utf8')).join('');
    const px = [...css.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => parseFloat(m[1]));
    const uniq = [...new Set(px)].sort((a, b) => a - b);
    cssStats = { min: Math.min(...uniq), sizes: uniq };
    console.log(`▸ CSS المبني: أصغر font-size = ${cssStats.min}px · الأحجام: ${uniq.map((s) => s + 'px').join(' · ')}`);
  }
}

// ================================================================ 3) وقت التشغيل
const bundlePath = path.join(ROOT, 'docs', 'تدقيق', '.typo-bundle.js');
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [
  path.join(APP_ROOT, 'src', 'main.tsx'),
  '--bundle', '--format=iife', '--jsx=automatic', '--outfile=' + bundlePath,
  '--define:process.env.NODE_ENV="production"',
  '--loader:.css=empty', '--loader:.png=dataurl', '--loader:.svg=dataurl', '--log-level=error',
], { stdio: 'inherit' });
const code = fs.readFileSync(bundlePath, 'utf8');
const { JSDOM, VirtualConsole } = require('jsdom');

const settingsJson = JSON.stringify({
  users: [{ id: 'usr-1', name: 'مدير النظام', email: 'admin@system.local', role: 'admin', status: 'active', avatarInitial: 'م', lastLogin: 'الآن', createdAt: '2025-01-10' }],
  general: { currentUserName: 'مدير النظام', currentUserTitle: 'مدير عام المنظومة والعمليات' },
});

async function boot() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('error', (...a) => errors.push(a.map(String).join(' ').slice(0, 200)));
  vc.on('jsdomError', (e) => errors.push('jsdomError: ' + String(e?.message).slice(0, 200)));
  const dom = new JSDOM(`<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>`,
    { url: 'https://typo.local/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window, doc = w.document;
  w.localStorage.setItem(SETTINGS_KEY, settingsJson);
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
  await new Promise((r) => setTimeout(r, 2500));
  return { w, doc, errors, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) };
}

const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
const waitFor = async (fn, timeoutMs = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { try { if (fn()) return true; } catch {} await new Promise((r) => setTimeout(r, 150)); }
  return false;
};

const { w, doc, errors, sleep } = await boot();
const quickBtn = () => [...doc.querySelectorAll('button')].find((b) => /دخول سريع/.test(b.textContent || ''));
await waitFor(() => !!quickBtn());
const qb = quickBtn();
if (qb) click(w, qb);
const loggedIn = await waitFor(() => /اللوحة التحكم|لوحة التحكم/.test(doc.body.textContent || ''));
check('T1 · التطبيق أقلع وسُجّل الدخول', loggedIn);

// زيارة الوحدات + فتح النوافذ
const navSel = 'aside button, aside a, nav button, nav a';
const label = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
const labels = [...new Set([...doc.querySelectorAll(navSel)].map(label).filter(Boolean))];
let domHtml = doc.getElementById('root').innerHTML;
const visited = [];
for (const lb of labels) {
  const el = [...doc.querySelectorAll(navSel)].find((e) => label(e) === lb);
  if (!el) continue;
  click(w, el);
  await sleep(1200);
  visited.push(lb);
  const root = doc.getElementById('root');
  const cands = [...root.querySelectorAll('button')].filter((b) => {
    const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
    if (/حذف|مسح|إعادة ضبط|تصدير|طباعة|خروج/.test(t)) return false;
    return /إضافة|اضافة|جديد|جديدة|تسجيل /.test(t) || /إضافة|جديد/.test(b.getAttribute('title') || '') || /^\+$/.test(t);
  }).slice(0, 3);
  for (const b of cands) {
    click(w, b);
    await sleep(1100);
    const dlg = doc.querySelector('[role="dialog"], [aria-modal="true"], .fixed.inset-0');
    if (dlg) {
      domHtml += dlg.outerHTML;
      const cancel = [...dlg.querySelectorAll('button')].find((x) => /إلغاء|إغلاق|رجوع|تراجع/.test(x.textContent || ''));
      if (cancel) click(w, cancel);
      else doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await sleep(500);
      break;
    }
  }
  domHtml += root.innerHTML;
}
console.log(`▸ وحدات مزارة: ${visited.length} · حجم DOM المفحوص: ${(domHtml.length / 1024).toFixed(0)}KB`);

const dom = scanClassStrings(domHtml);
const sizesDom = Object.keys(dom.byPx).map(Number).sort((a, b) => a - b);
console.log(`   أحجام وصلت إلى DOM: ${sizesDom.map((s) => s + 'px').join(' · ')}`);

const report = {
  tag: TAG, src: { sizes: sizesSrc, arbitrary: srcStats.arbitrary, below: srcStats.below.length, belowFloorOutsideSmallBox: srcStats.belowFloorOutsideSmallBox.length },
  css: cssStats, dom: { sizes: sizesDom, arbitrary: dom.arbitrary, below: dom.below.length }, visited,
};
fs.writeFileSync(path.join(ROOT, 'docs', 'تدقيق', `typography-runtime-${TAG}.json`), JSON.stringify(report, null, 1), 'utf8');

if (EXPECT) {
  check('T2 · المصدر: لا صنف أصغر من 11px', srcStats.below.length === 0,
    srcStats.below.length ? srcStats.below.slice(0, 3).map((b) => `${b.px}px في ${b.file}`).join(' · ') : 'أصغر حجم = ' + sizesSrc[0] + 'px');
  check('T3 · المصدر: لا صنف أصغر من 12px خارج صندوق صغير', srcStats.belowFloorOutsideSmallBox.length === 0,
    srcStats.belowFloorOutsideSmallBox.length ? srcStats.belowFloorOutsideSmallBox.slice(0, 3).map((b) => `${b.px}px · ${b.body}`).join(' · ') : '');
  if (cssStats) {
    check('T4 · CSS المبني: لا font-size أصغر من 11px', cssStats.min >= MIN_PX, `أصغر = ${cssStats.min}px`);
  }
  check('T5 · DOM: لا صنف أصغر من 11px وصل إلى الواجهة', dom.below.length === 0,
    dom.below.length ? dom.below.slice(0, 3).map((b) => `${b.px}px · ${b.body}`).join(' · ') : '');
  check('T6 · DOM: الحجم المعياري 12px منتشر فعلاً', (dom.byPx[12] || 0) >= 50, `${dom.byPx[12] || 0} موضعاً بحجم 12px`);
  check('T7 · لا أخطاء JS أثناء التنقّل', errors.length === 0, errors[0] || '');
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n════════ حصيلة اختبار أحجام النصوص (${TAG}) ════════`);
console.log(`نجح: ${passed} / ${results.length}`);
if (!EXPECT) { console.log('(وضع قياس فقط)'); process.exit(0); }
if (passed < results.length) {
  console.log('✖ فشل الاختبار');
  results.filter((r) => !r.ok).forEach((f) => console.log('   ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
console.log('✔ نجح الاختبار');
process.exit(0);
