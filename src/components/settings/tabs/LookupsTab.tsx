import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ListFilter,
  AlertCircle,
  CheckCircle2,
  Palette,
} from 'lucide-react';
import {
  GRADE_TONE_CLASSES,
  LOOKUP_META,
  type GradeTone,
  type LookupKind,
  type LookupsState,
} from '../../../constants/lookups';
import { useLookups } from '../../../utils/lookupsStore';
import { LookupError } from '../../../utils/lookupsLogic';

const SIMPLE_KINDS: LookupKind[] = ['categories', 'owners', 'beneficiaries', 'statuses'];

export const LookupsTab: React.FC = () => {
  const { lookups, actions } = useLookups();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [tone, setTone] = useState<GradeTone>('slate');

  const flash = (kind: 'ok' | 'err', text: string) => {
    setStatus({ kind, text });
    window.setTimeout(() => setStatus(null), 3500);
  };

  const guard = (fn: () => void) => {
    try {
      fn();
      flash('ok', 'تم الحفظ ونُشر التغيير في كل الشاشات فوراً');
    } catch (err) {
      flash('err', err instanceof LookupError ? err.message : 'تعذّر تنفيذ العملية');
    }
  };

  const add = (kind: LookupKind) => {
    const value = drafts[kind] || '';
    guard(() => {
      actions.add(kind, value, kind === 'grades' ? { tone } : undefined);
      setDrafts((d) => ({ ...d, [kind]: '' }));
    });
  };

  const renderList = (kind: LookupKind) => {
    const meta = LOOKUP_META[kind];
    const items = kind === 'grades' ? lookups.grades : lookups[kind];
    const isGrades = kind === 'grades';
    return (
      <section key={kind} className="surface-card p-4 sm:p-5 space-y-4" data-lookup-section={kind}>
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              {meta.title}
              <span className="version-chip rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 text-xs font-bold">
                {items.filter((i) => i.active).length} نشط
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {meta.description} · تُستخدم في: {meta.usedBy}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isGrades && (
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as GradeTone)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                title="لون الدرجة الجديدة"
              >
                {(Object.keys(GRADE_TONE_CLASSES) as GradeTone[]).map((t) => (
                  <option key={t} value={t}>
                    {GRADE_TONE_CLASSES[t].label}
                  </option>
                ))}
              </select>
            )}
            <input
              value={drafts[kind] || ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [kind]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add(kind);
              }}
              placeholder={meta.addPlaceholder}
              className="w-40 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
            <button
              type="button"
              onClick={() => add(kind)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة
            </button>
          </div>
        </header>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((entry) => {
            const grade = isGrades ? lookups.grades.find((g) => g.id === entry.id) : undefined;
            return (
              <li key={entry.id} className="py-2 flex items-center gap-2 flex-wrap">
                {grade && (
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${GRADE_TONE_CLASSES[grade.tone].dot}`} />
                )}
                <input
                  defaultValue={entry.label}
                  onBlur={(e) => {
                    const next = e.target.value.trim();
                    if (next && next !== entry.label) guard(() => actions.rename(kind, entry.id, next));
                  }}
                  className={`flex-1 min-w-32 px-2 py-1 rounded-md bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-xs font-bold ${
                    entry.active ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 line-through'
                  }`}
                  aria-label={`تسمية ${entry.label}`}
                />
                {grade && (
                  <select
                    value={grade.tone}
                    onChange={(e) => guard(() => actions.patch(kind, entry.id, { tone: e.target.value as GradeTone }))}
                    className="px-1.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    title="لون المؤشر البصري"
                  >
                    {(Object.keys(GRADE_TONE_CLASSES) as GradeTone[]).map((t) => (
                      <option key={t} value={t}>
                        {GRADE_TONE_CLASSES[t].label}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => guard(() => actions.patch(kind, entry.id, { active: !entry.active }))}
                  className="px-2 py-1 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {entry.active ? 'تعطيل' : 'تفعيل'}
                </button>
                <button
                  type="button"
                  onClick={() => guard(() => actions.move(kind, entry.id, -1))}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 cursor-pointer"
                  title="أعلى"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => guard(() => actions.move(kind, entry.id, 1))}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 cursor-pointer"
                  title="أسفل"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`حذف «${entry.label}» من القائمة؟`)) guard(() => actions.remove(kind, entry.id));
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="space-y-4" data-settings-tab="lookups">
      <div className="surface-card p-4 sm:p-5 flex items-start gap-3">
        <Palette className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
        <div className="text-xs leading-6 text-slate-600 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white">مصدر واحد موثوق للبيانات.</strong> أي إضافة أو تعديل هنا
          يظهر فوراً في كل القوائم المنسدلة (المخزون · الديون · المهام · الزيارات) بلا إعادة تشغيل، ويُسجَّل في سجل
          التدقيق، ويُدرَج في النسخة الاحتياطية الموحدة.
        </div>
      </div>

      {status && (
        <div
          role="status"
          className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            status.kind === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          {status.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {SIMPLE_KINDS.map((kind) => renderList(kind))}
        {renderList('grades')}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('إعادة كل القوائم إلى القيم الافتراضية؟')) guard(() => actions.reset());
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> إعادة الضبط الافتراضي
        </button>
      </div>
    </div>
  );
};

export type { LookupsState };
