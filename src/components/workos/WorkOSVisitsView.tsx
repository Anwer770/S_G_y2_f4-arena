import React, { useMemo, useState } from 'react';
import { Calendar, Users, Stethoscope, Eye, RefreshCw, CheckCircle2, Clock, MapPin, Info } from 'lucide-react';
import { customerService } from '../../services/crm/CustomerService';
import { doctorService } from '../../services/crm/DoctorService';
import { CustomerVisitRecord, DoctorVisitLog } from '../../types';

/**
 * «الزيارات» (§22) — **قراءة فقط**.
 *
 * قيود الدستور المطبَّقة:
 * - لا نقل لمنطق CRM أو الزيارات إلى إدارة العمل: هذا الملف لا يستدعي أي عملية كتابة
 *   (`recordVisit` / `saveCustomer` / `delete…` غير مستخدَمة إطلاقاً).
 * - لا استنساخ للبيانات: لا تُكتب الزيارات في `workosStorage` ولا تُخزَّن محلياً — قراءة لحظية عند العرض.
 * - مصدر الحقيقة يبقى وحدة العملاء/الأطباء (`suite_customers_visits_v2` · `suite_doctors_visits_v1`).
 * - أي تعديل على زيارة يجري في وحدته الأصلية — هنا إحالة صريحة للمستخدم.
 */
type VisitKind = 'customers' | 'doctors';

interface UnifiedVisit {
  key: string;
  kind: VisitKind;
  party: string;
  date: string;
  dayOfWeek: string;
  responsible: string;
  status: string;
  notes: string;
  followUp?: string;
}

const CLOSED_VISIT_STATUSES = ['مكتمل', 'ملغي'];
const CLOSED_DOCTOR_STATUSES = ['مكتمل', 'ملغي'];

const statusTone = (status: string) => {
  if (status === 'مكتمل') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (status === 'قيد تنفيذ') return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
  if (status === 'ملغي') return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  if (status === 'مرحل' || status === 'متابعة') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';
};

export const WorkOSVisitsView: React.FC = () => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [kind, setKind] = useState<VisitKind>('customers');
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  /** قراءة لحظية من وحدة CRM — لا كتابة ولا تخزين (§22) */
  const { rows: visits, error: readError } = useMemo(() => {
    const rows: UnifiedVisit[] = [];
    let error: string | null = null;
    try {
      customerService.getVisits().forEach((v: CustomerVisitRecord) => {
        rows.push({
          key: 'cv_' + v.id,
          kind: 'customers',
          party: v.customerName,
          date: v.date,
          dayOfWeek: v.dayOfWeek,
          responsible: v.responsible,
          status: v.status,
          notes: v.notes,
        });
      });
      doctorService.getVisits().forEach((v: DoctorVisitLog) => {
        rows.push({
          key: 'dv_' + v.id,
          kind: 'doctors',
          party: v.doctorName,
          date: v.date,
          dayOfWeek: v.dayOfWeek,
          responsible: v.responsible,
          status: v.status,
          notes: v.notes,
          followUp: v.nextFollowUpDate,
        });
      });
    } catch {
      // وحدة أخرى تعذّرت قراءتها ⇒ لا تُسقط شاشة إدارة العمل (بلا setState أثناء العرض)
      error = 'تعذّرت قراءة سجل الزيارات من وحدته الأصلية.';
    }
    return { rows: rows.sort((a, b) => a.date.localeCompare(b.date)), error };
  }, [refreshKey]);

  const customerVisits = visits.filter((v) => v.kind === 'customers');
  const doctorVisits = visits.filter((v) => v.kind === 'doctors');

  const isClosed = (v: UnifiedVisit) =>
    (v.kind === 'customers' ? CLOSED_VISIT_STATUSES : CLOSED_DOCTOR_STATUSES).includes(v.status);

  const shown = (kind === 'customers' ? customerVisits : doctorVisits).filter(
    (v) => !onlyUpcoming || (v.date >= todayStr && !isClosed(v))
  );

  const stats = {
    upcomingCustomers: customerVisits.filter((v) => v.date >= todayStr && !isClosed(v)).length,
    upcomingDoctors: doctorVisits.filter((v) => v.date >= todayStr && !isClosed(v)).length,
    overdue: visits.filter((v) => v.date < todayStr && !isClosed(v)).length,
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* تنبيه المصدر: قراءة فقط */}
      <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 p-3.5 flex items-start gap-2.5">
        <Eye className="w-4 h-4 text-sky-700 dark:text-sky-300 mt-0.5 shrink-0" />
        <p className="text-xs text-sky-900 dark:text-sky-200 leading-5">
          <strong>عرض للقراءة فقط.</strong> الزيارات ملكُ وحدة «العملاء والزيارات» و«الأطباء والزيارات» — إدارة العمل تعرضها
          للتنظيم والربط فقط. أي إضافة أو تعديل أو حذف يجري من الوحدة الأصلية، ولا تُنسخ أي زيارة إلى مخزن إدارة العمل.
        </p>
      </div>

      {/* الملخّص + أدوات العرض */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">الزيارات</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            زيارات العملاء: {customerVisits.length} · زيارات الأطباء: {doctorVisits.length} · قادمة:{' '}
            {stats.upcomingCustomers + stats.upcomingDoctors} · متأخرة: {stats.overdue}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setKind('customers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                kind === 'customers'
                  ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>زيارات العملاء</span>
              <span className="font-mono text-xs opacity-70">{customerVisits.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setKind('doctors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                kind === 'doctors'
                  ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>زيارات الأطباء</span>
              <span className="font-mono text-xs opacity-70">{doctorVisits.length}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOnlyUpcoming((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              onlyUpcoming
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{onlyUpcoming ? 'إظهار الكل' : 'القادمة فقط'}</span>
          </button>

          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="تحديث القراءة من الوحدة الأصلية"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {readError && (
        <p className="text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          {readError}
        </p>
      )}

      {/* القائمة */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{kind === 'customers' ? 'سجل زيارات العملاء' : 'سجل زيارات الأطباء'}</span>
          </h3>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{shown.length} زيارة</span>
        </div>

        {shown.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-4 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            لا زيارات مطابقة — تُدار الزيارات في وحدتها الأصلية.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {shown.map((v) => {
              const isPast = v.date < todayStr;
              return (
                <div key={v.key} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{v.party || '—'}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${statusTone(v.status)}`}>{v.status}</span>
                      {v.followUp && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">متابعة: {v.followUp}</span>
                      )}
                    </div>
                    {v.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{v.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {v.responsible || '—'}
                    </span>
                    <span className={`font-mono ${isPast ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                      {v.date}
                      {v.dayOfWeek ? ` · ${v.dayOfWeek}` : ''}
                    </span>
                    {v.date >= todayStr && !isClosed(v) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOSVisitsView;
