import React, { useState } from 'react';
import { AppointmentItem, WorkCommitment } from '../../types/workos';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  Plus,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface WorkOSAppointmentsCommitmentsViewProps {
  appointments: AppointmentItem[];
  commitments: WorkCommitment[];
  onOpenQuickAdd: (type?: string) => void;
  onUpdateAppointmentStatus: (id: string, status: any) => void;
  onUpdateCommitmentStatus: (id: string, status: any) => void;
}

export const WorkOSAppointmentsCommitmentsView: React.FC<WorkOSAppointmentsCommitmentsViewProps> = ({
  appointments = [],
  commitments = [],
  onOpenQuickAdd = (..._args: any[]) => {},
  onUpdateAppointmentStatus = (..._args: any[]) => {},
  onUpdateCommitmentStatus = (..._args: any[]) => {},
}) => {
  const [tab, setTab] = useState<'appointments' | 'commitments'>('appointments');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Tab Switcher & Quick Add */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'appointments'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>المواعيد واللقاءات ({appointments.length})</span>
          </button>
          <button
            onClick={() => setTab('commitments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'commitments'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>الالتزامات والتعهدات الرسمية ({commitments.length})</span>
          </button>
        </div>

        <button
          onClick={() => onOpenQuickAdd(tab === 'appointments' ? 'appointment' : 'commitment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs text-white flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto ${
            tab === 'appointments' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-700 hover:bg-rose-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{tab === 'appointments' ? 'موعد جديد' : 'التزام جديد'}</span>
        </button>
      </div>

      {/* Appointments List */}
      {tab === 'appointments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-3 hover:border-amber-400 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{apt.title}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    apt.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {apt.status === 'completed' ? 'تم اللقاء' : 'مجدول'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{apt.date} • {apt.time}</span>
                  <span className="text-slate-400 dark:text-slate-500">({apt.durationMinutes} دقيقة)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>الشخص المعني: <strong className="text-slate-800 dark:text-slate-200">{apt.person}</strong></span>
                </div>
                {apt.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>المكان: {apt.location}</span>
                  </div>
                )}
              </div>

              {apt.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {apt.notes}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 dark:text-slate-500">المشاركون: {apt.attendees?.join('، ') || '—'}</span>
                <button
                  onClick={() => onUpdateAppointmentStatus(apt.id, apt.status === 'completed' ? 'scheduled' : 'completed')}
                  className="text-amber-700 dark:text-amber-300 font-bold hover:underline cursor-pointer"
                >
                  {apt.status === 'completed' ? 'إلغاء التمام' : 'تأكيد التمام ✓'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commitments List */}
      {tab === 'commitments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commitments.map((cmt) => (
            <div
              key={cmt.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-3 hover:border-rose-300 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200">
                    أهمية فئة {cmt.importance}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">{cmt.title}</h3>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    cmt.status === 'fulfilled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {cmt.status === 'fulfilled' ? 'تم الوفاء بالالتزام' : 'ساري / قيد الوفاء'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div>الجهة المتعهد لها: <strong className="text-slate-800 dark:text-slate-200">{cmt.entity}</strong></div>
                <div>الشخص المسؤول: <strong>{cmt.person}</strong></div>
                <div className="flex items-center justify-between font-mono pt-1 text-rose-800 dark:text-rose-200 font-bold">
                  <span>تاريخ الاستحقاق: {cmt.dueDate}</span>
                  {cmt.amount && (
                    <span>المبلغ: {cmt.amount.toLocaleString()} {cmt.currency || 'YER'}</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                {cmt.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 dark:text-slate-500">تاريخ الالتزام: {cmt.commitmentDate}</span>
                <button
                  onClick={() => onUpdateCommitmentStatus(cmt.id, cmt.status === 'fulfilled' ? 'in_progress' : 'fulfilled')}
                  className="text-rose-700 dark:text-rose-300 font-bold hover:underline cursor-pointer"
                >
                  {cmt.status === 'fulfilled' ? 'إعادة فتح' : 'تحديد كمكتمل وموفى ✓'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
