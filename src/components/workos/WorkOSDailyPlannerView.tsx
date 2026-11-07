import React, { useMemo, useState } from 'react';
import { Calendar, Clock, Plus, AlertTriangle, Sun, ChevronLeft, Timer, Coffee, Filter } from 'lucide-react';
import { WorkTask, AppointmentItem, DailyRoutineBlock, ActiveTimerState } from '../../types/workos';
import { customerService } from '../../services/crm/CustomerService';
import { doctorService } from '../../services/crm/DoctorService';
import { CustomerVisitRecord, DoctorVisitLog } from '../../types';

/**
 * «التخطيط اليومي» (§18) — واجهة عرضية فقط على بيانات قائمة.
 *
 * قيود الدستور المطبَّقة هنا:
 * - لا كيان جديد: لا `PlannerTask` ولا حقل جديد — المصدر `data.tasks` و`data.appointments` و`data.dailyRoutine`.
 * - لا تخزين جديد ولا حالة محلية للبيانات: الحالة المحلية حصراً للعرض (المرشّح · السحب الجاري).
 * - لا منطق تكرار جديد: التكرار يبقى في محرّك `recurrence` — هذا العرض لا يُنشئ مهامّ متكرّرة.
 * - لا نموذج إدخال جديد: «إضافة» ⟶ `WorkOSQuickAddModal` القائم.
 * - تغيير التاريخ ⟶ `onUpdateTaskDueDate` القائم (تعديل `dueDate` فقط، بلا مسار حفظ جديد).
 */
interface WorkOSDailyPlannerViewProps {
  tasks: WorkTask[];
  appointments?: AppointmentItem[];
  routine?: DailyRoutineBlock[];
  activeTimer?: ActiveTimerState | null;
  onOpenTaskDetail?: (task: WorkTask) => void;
  onUpdateTaskDueDate?: (taskId: string, dueDate: string) => void;
  onOpenQuickAdd?: (type?: string) => void;
}

type Bucket = 'today' | 'upcoming' | 'overdue';

const CLOSED_STATUSES = ['completed', 'cancelled'];

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'عاجلة',
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
};

const PRIORITY_TONE: Record<string, string> = {
  urgent: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border-rose-300 dark:border-rose-800',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200 border-amber-300 dark:border-amber-800',
  medium: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200 border-sky-300 dark:border-sky-800',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
};

const formatTimer = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** ترتيب زمني موحّد: الوقت أولاً ثم الأولوية */
const byTimeThenPriority = (a: WorkTask, b: WorkTask) => {
  const at = a.dueTime || a.startTime || '99:99';
  const bt = b.dueTime || b.startTime || '99:99';
  if (at !== bt) return at.localeCompare(bt);
  const rank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
};

export const WorkOSDailyPlannerView: React.FC<WorkOSDailyPlannerViewProps> = ({
  tasks = [],
  appointments = [],
  routine = [],
  activeTimer = null,
  onOpenTaskDetail = (..._args: any[]) => {},
  onUpdateTaskDueDate = (..._args: any[]) => {},
  onOpenQuickAdd = (..._args: any[]) => {},
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverBucket, setDragOverBucket] = useState<Bucket | null>(null);
  const [hideCompleted, setHideCompleted] = useState(true);

  /** التصنيف مشتق من `dueDate` وحده — نفس منطق «متأخرة/مستحقة اليوم» القائم، بلا منطق موازٍ */
  const buckets = useMemo(() => {
    const open = tasks.filter(
      (t) => !(hideCompleted && t.status === 'completed') && !CLOSED_STATUSES.includes(t.status)
    );
    const noDate = (t: WorkTask) => !t.dueDate;
    return {
      overdue: open.filter((t) => !!t.dueDate && t.dueDate < todayStr).sort(byTimeThenPriority),
      today: open
        .filter((t) => noDate(t) || t.dueDate === todayStr)
        .sort((a, b) => (noDate(a) === noDate(b) ? byTimeThenPriority(a, b) : noDate(a) ? 1 : -1)),
      upcoming: open
        .filter((t) => !!t.dueDate && t.dueDate > todayStr)
        .sort((a, b) => (a.dueDate === b.dueDate ? byTimeThenPriority(a, b) : a.dueDate.localeCompare(b.dueDate))),
    };
  }, [tasks, todayStr, hideCompleted]);

  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'scheduled' && a.date === todayStr)
        .sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [appointments, todayStr]
  );

  /** الشريط الزمني: كتل الروتين + المهام/المواعيد ذات وقت محدّد — ترتيب عرض فقط */
  const timeline = useMemo(() => {
    type Row = { key: string; time: string; title: string; kind: string; tone: string; task?: WorkTask };
    const rows: Row[] = [];

    routine.forEach((b) => {
      if (!b.timeSlot) return;
      rows.push({
        key: 'rt_' + b.id,
        time: b.timeSlot.split('-')[0].trim(),
        title: b.title || b.plannedActivity,
        kind: 'روتين',
        tone: b.status === 'completed' ? 'emerald' : b.status === 'postponed' || b.status === 'delayed' ? 'amber' : 'teal',
      });
    });

    todayAppointments.forEach((a) => {
      rows.push({
        key: 'ap_' + a.id,
        time: a.time || '—',
        title: a.title,
        kind: 'موعد',
        tone: 'sky',
      });
    });

    // إضافة زيارات اليوم الميدانية (عملاء وأطباء) كعرض لحظي قراءة فقط
    try {
      const custVisits = customerService.getVisits();
      custVisits
        .filter((v: CustomerVisitRecord) => v.date === todayStr && v.status !== 'ملغي')
        .forEach((v: CustomerVisitRecord) => {
          rows.push({
            key: 'cv_' + v.id,
            time: '09:00',
            title: `زيارة عميل: ${v.customerName || 'عميل'} (${v.responsible || 'المندوب'})`,
            kind: 'زيارة عميل',
            tone: v.status === 'مكتمل' ? 'emerald' : 'sky',
          });
        });

      const docVisits = doctorService.getVisits();
      docVisits
        .filter((v: DoctorVisitLog) => v.date === todayStr && v.status !== 'ملغي')
        .forEach((v: DoctorVisitLog) => {
          rows.push({
            key: 'dv_' + v.id,
            time: '11:00',
            title: `زيارة طبيب: د. ${v.doctorName || 'طبيب'} (${v.responsible || 'المندوب'})`,
            kind: 'زيارة طبيب',
            tone: v.status === 'مكتمل' ? 'emerald' : 'indigo',
          });
        });
    } catch {
      // قراءة غير مانعة
    }

    buckets.today
      .filter((t) => !!t.dueTime || !!t.startTime)
      .forEach((t) => {
        rows.push({
          key: 'tk_' + t.id,
          time: t.startTime || t.dueTime || '—',
          title: t.title,
          kind: 'مهمة',
          tone: t.priority === 'urgent' ? 'rose' : 'indigo',
          task: t,
        });
      });

    return rows.sort((a, b) => a.time.localeCompare(b.time));
  }, [routine, todayAppointments, buckets.today, todayStr]);

  const dropOn = (bucket: Bucket) => {
    if (!draggingId) return;
    const target = bucket === 'overdue' ? null : bucket === 'today' ? todayStr : null;
    setDragOverBucket(null);
    setDraggingId(null);
    if (!target) return; // «متأخر» و«قادم» بلا تاريخ محسوب ⇒ لا إعادة جدولة (لا اختيار تاريخ نيابةً عن المستخدم)
    onUpdateTaskDueDate(draggingId, target);
  };

  const columns: { id: Bucket; title: string; hint: string; rows: WorkTask[]; tone: string }[] = [
    { id: 'overdue', title: 'متأخر', hint: 'تجاوزت تاريخ الاستحقاق', rows: buckets.overdue, tone: 'rose' },
    { id: 'today', title: 'اليوم', hint: todayStr, rows: buckets.today, tone: 'teal' },
    { id: 'upcoming', title: 'قادم', hint: 'مرتّب بتاريخ الاستحقاق', rows: buckets.upcoming, tone: 'indigo' },
  ];

  const totalOpen = buckets.overdue.length + buckets.today.length + buckets.upcoming.length;

  const toneRing: Record<string, string> = {
    rose: 'border-rose-300 dark:border-rose-800',
    teal: 'border-teal-300 dark:border-teal-800',
    indigo: 'border-indigo-300 dark:border-indigo-800',
  };

  const toneBadge: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* 1. شريط اليوم: التاريخ + الملخّص + إضافة + المؤقّت النشط */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
            <Sun className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>خطة اليوم</span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {todayStr}
              </span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {buckets.today.length} مهمة اليوم · {buckets.overdue.length} متأخرة · {buckets.upcoming.length} قادمة ·{' '}
              {todayAppointments.length} موعد · {routine.length} كتلة روتين
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTimer && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 text-xs font-bold">
              <Timer className="w-3.5 h-3.5" />
              <span className="font-mono">{formatTimer(activeTimer.elapsedSeconds)}</span>
              <span className="truncate max-w-40">{activeTimer.taskTitle}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setHideCompleted((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              hideCompleted
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                : 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{hideCompleted ? 'إظهار المكتملة' : 'إخفاء المكتملة'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickAdd('task')}
            className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مهمة جديدة</span>
          </button>
        </div>
      </div>

      {/* 2. الأعمدة الثلاثة + الشريط الزمني */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => {
              if (!draggingId) return;
              e.preventDefault();
              setDragOverBucket(col.id);
            }}
            onDragLeave={() => setDragOverBucket((b) => (b === col.id ? null : b))}
            onDrop={(e) => {
              e.preventDefault();
              dropOn(col.id);
            }}
            className={`bg-white dark:bg-slate-900 rounded-xl border shadow-2xs p-4 space-y-3 transition ${
              dragOverBucket === col.id ? toneRing[col.tone] : 'border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {col.id === 'overdue' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                  {col.id === 'today' && <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                  {col.id === 'upcoming' && <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  <span>{col.title}</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{col.hint}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${toneBadge[col.tone]}`}>
                {col.rows.length}
              </span>
            </div>

            {col.rows.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-3">لا عناصر في هذا العمود.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {col.rows.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggingId(t.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', t.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverBucket(null);
                    }}
                    onClick={() => onOpenTaskDetail(t)}
                    className={`rounded-xl border p-2.5 space-y-1.5 cursor-pointer bg-slate-50/70 dark:bg-slate-800/40 hover:border-teal-300 transition ${
                      draggingId === t.id ? 'opacity-50' : ''
                    } border-slate-200/80 dark:border-slate-700/80`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-5">{t.title}</h4>
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${PRIORITY_TONE[t.priority] || PRIORITY_TONE.low}`}
                      >
                        {PRIORITY_LABEL[t.priority] || t.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {(t.dueTime || t.startTime) && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.startTime ? `${t.startTime}${t.dueTime ? ' - ' + t.dueTime : ''}` : t.dueTime}
                        </span>
                      )}
                      {t.dueDate && <span>{t.dueDate}</span>}
                      {t.estimatedHours ? <span>· {t.estimatedHours} س</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* الشريط الزمني لليوم */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>الشريط الزمني لليوم</span>
            </h3>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{timeline.length} بنداً</span>
          </div>

          {timeline.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-3">
              لا بنود موقّتة اليوم — أضف وقتاً للمهمة أو موعداً ليظهرا هنا.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
              {timeline.map((row) => (
                <div
                  key={row.key}
                  onClick={() => row.task && onOpenTaskDetail(row.task)}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-xl transition ${
                    row.task ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60' : ''
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 w-14 shrink-0">
                    {row.time}
                  </span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0 ${toneBadge[row.tone] || toneBadge.sky}`}>
                    {row.kind}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{row.title}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>
              إجمالي المهام المفتوحة: <strong className="font-mono text-slate-600 dark:text-slate-300">{totalOpen}</strong>
            </span>
            <button
              type="button"
              onClick={() => onOpenQuickAdd('appointment')}
              className="font-bold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 flex items-center gap-1 cursor-pointer"
            >
              <span>إضافة موعد</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOSDailyPlannerView;
