/**
 * منطق قوائم الثوابت — دوال نقية (بلا DOM ولا تخزين) ليمكن اختبارها مباشرة.
 * يستهلكها `lookupsStore.ts` (الطبقة التي تحفظ وتبثّ التغييرات).
 */
import {
  DEFAULT_LOOKUPS,
  type GradeItem,
  type GradeTone,
  type LookupItem,
  type LookupKind,
  type LookupsState,
} from '../constants/lookups';

const SLUG: Record<LookupKind, string> = {
  categories: 'cat',
  owners: 'own',
  beneficiaries: 'ben',
  statuses: 'st',
  grades: 'gr',
};

export class LookupError extends Error {}

const listOf = (state: LookupsState, kind: LookupKind): LookupItem[] =>
  kind === 'grades' ? state.grades : state[kind];

const sortAll = (items: LookupItem[]): LookupItem[] =>
  [...items].sort((a, b) => a.order - b.order).map((it, i) => ({ ...it, order: i + 1 }));

/** نسخة عميقة آمنة من الحالة الافتراضية. */
export const cloneDefaults = (): LookupsState => JSON.parse(JSON.stringify(DEFAULT_LOOKUPS)) as LookupsState;

/** يتحقّق من صحّة القيمة القادمة من التخزين ويعيد الافتراضي عند التلف. */
export function normalizeLookups(raw: unknown): LookupsState {
  const fallback = cloneDefaults();
  if (!raw || typeof raw !== 'object') return fallback;
  const candidate = raw as Partial<LookupsState>;
  const pick = (kind: LookupKind): LookupItem[] => {
    const value = (candidate as unknown as Record<string, unknown>)[kind];
    if (!Array.isArray(value) || value.length === 0) return fallback[kind];
    return value
      .filter((i) => i && typeof i === 'object' && typeof (i as LookupItem).label === 'string')
      .map((i, idx) => {
        const entry = i as LookupItem & { tone?: GradeTone };
        return {
          id: String(entry.id || `${SLUG[kind]}-${idx + 1}`),
          label: String(entry.label).trim(),
          order: Number.isFinite(entry.order) ? Number(entry.order) : idx + 1,
          active: entry.active !== false,
          ...(kind === 'grades' ? { tone: (entry.tone || 'slate') as GradeTone, hint: (entry as GradeItem).hint } : {}),
        };
      })
      .filter((i) => i.label !== '');
  };
  return {
    version: 1,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
    categories: pick('categories'),
    owners: pick('owners'),
    beneficiaries: pick('beneficiaries'),
    statuses: pick('statuses'),
    grades: pick('grades') as GradeItem[],
  };
}

const nextId = (state: LookupsState, kind: LookupKind): string => {
  const prefix = SLUG[kind];
  const existing = new Set(listOf(state, kind).map((i) => i.id));
  let n = listOf(state, kind).length + 1;
  while (existing.has(`${prefix}-${n}`)) n += 1;
  return `${prefix}-${n}`;
};

/** إضافة عنصر — ترفض الفراغ والتكرار (بلا حساسية لحالة الأحرف والمسافات). */
export function addLookup(
  state: LookupsState,
  kind: LookupKind,
  label: string,
  extra?: { tone?: GradeTone; hint?: string }
): { state: LookupsState; item: LookupItem } {
  const clean = String(label || '').trim();
  if (clean === '') throw new LookupError('الاسم مطلوب');
  if (listOf(state, kind).some((i) => i.label.trim().toLowerCase() === clean.toLowerCase())) {
    throw new LookupError(`«${clean}» موجود بالفعل في هذه القائمة`);
  }
  const base: LookupItem = {
    id: nextId(state, kind),
    label: clean,
    order: listOf(state, kind).length + 1,
    active: true,
  };
  const created: LookupItem =
    kind === 'grades' ? ({ ...base, tone: extra?.tone || 'slate', hint: extra?.hint } as GradeItem) : base;
  const next: LookupsState = {
    ...state,
    [kind]: sortAll([...listOf(state, kind), created]),
    updatedAt: new Date().toISOString(),
  } as LookupsState;
  return { state: next, item: created };
}

/** إعادة تسمية — ترفض الاسم الفارغ أو المكرر على عنصر آخر. */
export function renameLookup(state: LookupsState, kind: LookupKind, id: string, label: string): LookupsState {
  const clean = String(label || '').trim();
  if (clean === '') throw new LookupError('الاسم مطلوب');
  if (listOf(state, kind).some((i) => i.id !== id && i.label.trim().toLowerCase() === clean.toLowerCase())) {
    throw new LookupError(`«${clean}» موجود بالفعل في هذه القائمة`);
  }
  return {
    ...state,
    [kind]: listOf(state, kind).map((i) => (i.id === id ? { ...i, label: clean } : i)),
    updatedAt: new Date().toISOString(),
  } as LookupsState;
}

/** تعديل الصفات الإضافية (لون/تلميح للدرجات). */
export function patchLookup(
  state: LookupsState,
  kind: LookupKind,
  id: string,
  patch: Partial<Pick<GradeItem, 'tone' | 'hint' | 'active'>>
): LookupsState {
  return {
    ...state,
    [kind]: listOf(state, kind).map((i) => (i.id === id ? { ...i, ...patch } : i)),
    updatedAt: new Date().toISOString(),
  } as LookupsState;
}

/** حذف — يُمنع حذف آخر عنصر نشط حتى لا تفرغ القوائم في الواجهات. */
export function removeLookup(state: LookupsState, kind: LookupKind, id: string): LookupsState {
  const list = listOf(state, kind);
  const target = list.find((i) => i.id === id);
  if (!target) return state;
  const remaining = list.filter((i) => i.id !== id);
  if (remaining.filter((i) => i.active).length === 0) {
    throw new LookupError('لا يمكن حذف آخر عنصر نشط في القائمة');
  }
  return { ...state, [kind]: sortAll(remaining), updatedAt: new Date().toISOString() } as LookupsState;
}

/** ترتيب العناصر (أعلى/أسفل) — يُعيد ترقيماً متسلسلاً. */
export function moveLookup(state: LookupsState, kind: LookupKind, id: string, direction: -1 | 1): LookupsState {
  const list = [...listOf(state, kind)].sort((a, b) => a.order - b.order);
  const index = list.findIndex((i) => i.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return state;
  [list[index], list[target]] = [list[target], list[index]];
  return { ...state, [kind]: sortAll(list), updatedAt: new Date().toISOString() } as LookupsState;
}

/** استبدال قائمة كاملة (يُستخدم عند الاستيراد من نسخة احتياطية). */
export function replaceLookupList(state: LookupsState, kind: LookupKind, labels: string[]): LookupsState {
  const items = labels
    .map((l) => String(l).trim())
    .filter(Boolean)
    .map((label, idx) => ({ id: `${SLUG[kind]}-import-${idx + 1}`, label, order: idx + 1, active: true }));
  if (items.length === 0) return state;
  return { ...state, [kind]: items, updatedAt: new Date().toISOString() } as LookupsState;
}
