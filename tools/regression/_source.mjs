/**
 * مساعد قراءة المصدر للبوابات (R30).
 *
 * بعد تفكيك الملفات الضخمة صار الملف الأصلي «برميل re-export» والنص الفعلي
 * موزَّعاً على مجلد شقيق يحمل اسم الوحدة. البوابات التي كانت تقرأ ملفاً واحداً
 * يجب أن تقرأ **عائلة الوحدة** كاملة، وإلا صارت تمرّ على نصٍّ فارغ فتنجح زوراً.
 *
 * قاعدة العائلة:
 *   `src/utils/excel.ts`        ⇒  `src/utils/excel.ts` + كل ملفات `src/utils/excel/`
 *   `src/utils/workosStorage.ts` ⇒  `src/utils/workosStorage.ts` + كل ملفات `src/utils/workos/`
 *   (اللاحقة `Storage` تُسقَط عند البحث عن المجلد الشقيق)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

export const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');

/** يقرأ ملفاً واحداً (مسار نسبي من جذر المستودع). */
export const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const walkTs = (absDir, out) => {
  if (!fs.existsSync(absDir)) return out;
  for (const e of fs.readdirSync(absDir, { withFileTypes: true })) {
    const p = path.join(absDir, e.name);
    if (e.isDirectory()) walkTs(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
};

/** يقرأ الملف + كل ملفات مجلده الشقيق (وحدة مفكَّكة)، مجمَّعةً بنص واحد. */
export const readFamily = (rel) => {
  const dir = path.dirname(rel);
  const base = path.basename(rel).replace(/\.tsx?$/, '');
  const parts = [read(rel)];
  const candidates = [base, base.replace(/Storage$/, '')];
  for (const name of candidates) {
    const famDir = path.join(ROOT, dir, name);
    if (fs.existsSync(famDir) && fs.statSync(famDir).isDirectory()) {
      for (const f of walkTs(famDir, [])) parts.push(fs.readFileSync(f, 'utf8'));
    }
  }
  return parts.join('\n');
};

/**
 * يستخرج جسم دالة تصدير معيّنة من نصّ (قد يكون عائلة وحدة مجمَّعة).
 * النهاية = أول سطر يحتوي `}` وحده (تنسيق Prettier يضع قوس الإغلاق العلوي في العمود 0)،
 * وإلا فأول `export ` تالٍ. هذا يمنع تسرّب جسم الدالة إلى الملف التالي في العائلة.
 */
export const fnBody = (src, signature) => {
  const start = src.indexOf(signature);
  if (start < 0) return '';
  const after = src.slice(start + signature.length);
  const lines = after.split('\n');
  const out = [];
  for (const line of lines) {
    if (out.length && (line === '}' || line.startsWith('export '))) break;
    out.push(line);
  }
  return out.join('\n');
};
