/**
 * سجل المخططات الفعلي (R33).
 *
 * كل مفتاح مسجَّل هنا له **إصدار** و**ترحيلات مرتّبة**. الإصدار 0 يعني «بيانات قبل
 * الترقيم» (كل بيانات المستخدمين الحالية)، والترحيل 0⇒1 هو التكوين الأول:
 * يضمن أن ما تقرأه الواجهة دائماً **مصفوفة كائنات بأنواع صحيحة**، فلا ينهار
 * `.map`/`.filter` على سجل مستورد ناقص الحقول.
 *
 * قاعدة إضافة ترحيل جديد: لا تُعدّل ترحيلاً موجوداً — أضف `version + 1` وترحيلاً جديداً.
 */
import type { Migration, SchemaEntry, SchemaValue } from './types';

/** يضمن أن القيمة مصفوفة (وإلا فمصفوفة فارغة). */
const asArray = (value: SchemaValue): unknown[] => (Array.isArray(value) ? value : []);

/** يحتفظ بالكائنات غير الفارغة فقط (يرفض null والسلاسل والأرقام داخل المصفوفة). */
const objectItems = (value: SchemaValue): Record<string, unknown>[] =>
  asArray(value).filter(
    (item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)
  );

/** يضمن حقل مصفوفة داخل كائن. */
const ensureArrayField = (item: Record<string, unknown>, field: string): void => {
  if (!Array.isArray(item[field])) item[field] = [];
};

/** يضمن نصاً غير فارغ في حقل (يُنشئ بديلاً من `seed` عند الغياب). */
const ensureString = (item: Record<string, unknown>, field: string, seed: string): void => {
  if (typeof item[field] !== 'string' || (item[field] as string).trim() === '') item[field] = seed;
};

/** يضمن معرّفاً فريداً: يُنشئ `prefix-<index>` عند الغياب. */
const ensureIds = (items: Record<string, unknown>[], prefix: string, ctx: { now: string }): void => {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const current = typeof item.id === 'string' ? item.id.trim() : '';
    const unique = current && !seen.has(current) ? current : `${prefix}-${index + 1}-${Date.parse(ctx.now) || 0}`;
    item.id = unique;
    seen.add(unique);
  });
};

/** ترحيل 0⇒1 للبيانات المالية/السجلات: مصفوفة كائنات بمعرّفات. */
const normalizeRecords: Migration = (value, ctx) => {
  const items = objectItems(value);
  ensureIds(items, 'rec', ctx);
  return items;
};

/** ترحيل 0⇒1 للمهام (Work OS والكلاسيكية): مصفوفة كائنات + المصفوفات الفرعية موجودة. */
const normalizeTasks: Migration = (value, ctx) => {
  const items = objectItems(value);
  ensureIds(items, 'tsk', ctx);
  for (const item of items) {
    ensureString(item, 'title', 'مهمة بلا عنوان');
    for (const field of ['subtasks', 'checklist', 'comments', 'tags', 'dependencies', 'attachments']) {
      ensureArrayField(item, field);
    }
    if (typeof item.progress !== 'number' || Number.isNaN(item.progress)) item.progress = 0;
  }
  return items;
};

/** ترحيل 0⇒1 للمشاريع: معرّفات + تقدم رقمي داخل [0,100]. */
const normalizeProjects: Migration = (value, ctx) => {
  const items = objectItems(value);
  ensureIds(items, 'prj', ctx);
  for (const item of items) {
    ensureString(item, 'name', 'مشروع بلا اسم');
    const progress = typeof item.progress === 'number' ? item.progress : 0;
    item.progress = Math.min(100, Math.max(0, progress));
  }
  return items;
};

/** ترحيل 0⇒1 للطلبيات: معرّفات + رقم طلبية + مبلغ رقمي. */
const normalizeOrders: Migration = (value, ctx) => {
  const items = objectItems(value);
  ensureIds(items, 'ord', ctx);
  items.forEach((item, index) => {
    ensureString(item, 'title', 'طلبية بلا عنوان');
    ensureString(item, 'orderNumber', `ORD-${index + 1}`);
    if (typeof item.totalAmount !== 'number' || Number.isNaN(item.totalAmount)) item.totalAmount = 0;
  });
  return items;
};

/** ترحيل 0⇒1 للالتزامات (Work OS): معرّفات + عنوان + مبلغ. */
const normalizeCommitments: Migration = (value, ctx) => {
  const items = objectItems(value);
  ensureIds(items, 'cmt', ctx);
  for (const item of items) {
    ensureString(item, 'title', 'التزام بلا عنوان');
    if (typeof item.amount !== 'number' || Number.isNaN(item.amount)) item.amount = 0;
  }
  return items;
};

/** ترحيل 0⇒1 للملاحظات: معرّفات + مصفوفات (مرفقات/وسوم) + نوع المحتوى. */
const normalizeNotes: Migration = (value, ctx) => {
  const items = objectItems(value);
  ensureIds(items, 'note', ctx);
  for (const item of items) {
    ensureString(item, 'title', 'ملاحظة بلا عنوان');
    for (const field of ['attachments', 'tags', 'checklist']) ensureArrayField(item, field);
    const attachments = item.attachments as Record<string, unknown>[];
    attachments.forEach((attachment, index) => {
      if (typeof attachment !== 'object' || attachment === null) return;
      ensureString(attachment, 'id', `att-${index + 1}`);
      ensureString(attachment, 'name', `مرفق-${index + 1}`);
      ensureString(attachment, 'type', 'application/octet-stream');
    });
  }
  return items;
};

/** ترحيل 0⇒1 للروابط: معرّفات + عنوان + رابط نصي (التنظيف الأمني يحدث عند العرض). */
const normalizeLinks: Migration = (value, ctx) => {
  const items = objectItems(value);
  ensureIds(items, 'lnk', ctx);
  for (const item of items) {
    ensureString(item, 'title', 'رابط بلا عنوان');
    ensureString(item, 'url', '');
    for (const field of ['tags']) ensureArrayField(item, field);
  }
  return items;
};

/** ترحيل 0⇒1 للعهد: معرّفات + عنوان + حقول أساسية نصية. */
const normalizeCustody: Migration = (value, ctx) => {
  const items = objectItems(value);
  ensureIds(items, 'cus', ctx);
  for (const item of items) {
    ensureString(item, 'title', 'عهدة بلا عنوان');
    ensureString(item, 'status', 'قيد الاستخدام');
  }
  return items;
};

/** ترحيل 0⇒1 لدفتر المهام الكلاسيكي: معرّفات + عنوان + حالة + أولوية. */
const normalizeClassicTasks: Migration = (value, ctx) => {
  const items = objectItems(value);
  ensureIds(items, 'T', ctx);
  for (const item of items) {
    ensureString(item, 'title', 'مهمة بلا عنوان');
    ensureString(item, 'status', 'قيد الانتظار');
    ensureString(item, 'pri', 'C');
  }
  return items;
};

const entry = (key: string, migration: Migration, version = 1): SchemaEntry => ({
  key,
  version,
  migrations: { 0: migration },
});

/**
 * سجل المخططات — المفاتيح التي تخضع للترحيل المُرقَّم.
 * ترتيب القائمة لا يهم منطقياً، لكنه يُقرأ في التقرير بهذا الترتيب.
 */
export const SCHEMA_ENTRIES: SchemaEntry[] = [
  // Work OS (المصدر الأكبر للبيانات المركّبة)
  entry('workos_v1_tasks', normalizeTasks),
  entry('workos_v1_projects', normalizeProjects),
  entry('workos_v1_orders', normalizeOrders),
  entry('workos_v1_commitments', normalizeCommitments),
  entry('workos_v1_notes', normalizeNotes),

  // الدفاتر الكلاسيكية
  entry('suite_tasks_items_v2', normalizeClassicTasks),
  entry('suite_debts_records_v1', normalizeRecords),
  entry('suite_custody_records_v1', normalizeCustody),
  entry('suite_knowledge_notes_v1', normalizeNotes),
  entry('suite_links_records_v1', normalizeLinks),
];

/** مفتاح ⇒ إصدار (للتشخيص والعرض في الإعدادات). */
export const SCHEMA_VERSIONS: Record<string, number> = Object.fromEntries(
  SCHEMA_ENTRIES.map((item) => [item.key, item.version])
);
