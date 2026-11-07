import React, { useState } from 'react';
import { DebtCommitment } from '../../types';
import { calculateCommitmentRemaining, formatDebtAmount } from '../../utils/debts';
import {
  AlertTriangle,
  Clock,
  Bell,
  BellRing,
  CheckCircle2,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface DueAlertsPanelProps {
  commitments: DebtCommitment[];
  onOpenPaymentModal: (commitment: DebtCommitment) => void;
  onEditCommitment: (commitment: DebtCommitment) => void;
}

export const DueAlertsPanel: React.FC<DueAlertsPanelProps> = ({
  commitments,
  onOpenPaymentModal,
  onEditCommitment,
}) => {
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [testSent, setTestSent] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Overdue commitments
  const overdueList = commitments
    .filter((c) => {
      const { remaining, isCompleted } = calculateCommitmentRemaining(c);
      return !isCompleted && remaining > 0 && c.endDate && c.endDate < todayStr;
    })
    .sort((a, b) => (a.endDate || '').localeCompare(b.endDate || ''));

  // Due in <= 30 days
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30DaysStr = in30Days.toISOString().split('T')[0];

  const dueSoonList = commitments
    .filter((c) => {
      const { remaining, isCompleted } = calculateCommitmentRemaining(c);
      return (
        !isCompleted &&
        remaining > 0 &&
        c.endDate &&
        c.endDate >= todayStr &&
        c.endDate <= in30DaysStr
      );
    })
    .sort((a, b) => (a.endDate || '').localeCompare(b.endDate || ''));

  // Calculate days difference
  const getDaysDiff = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date(todayStr);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Browser notification handler (FR-27)
  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('المتصفح لا يدعم إشعارات سطح المكتب');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        new Notification('تطبيق إدارة الديون والالتزامات', {
          body: `تم تفعيل التنبيهات بنجاح. لديك حالياً ${overdueList.length} التزام متأخر و ${dueSoonList.length} التزام قريب الاستحقاق.`,
          icon: '/favicon.ico',
        });
        setTestSent(true);
        setTimeout(() => setTestSent(false), 5000);
      }
    } catch (e) {
      console.error('Error requesting notification permission:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Center Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-xl shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black">مركز التنبيهات والمواعيد الاستحقاقية</h3>
              <p className="text-xs text-slate-300">
                متابعة دورية للالتزامات المالية المتأخرة والواجب سدادها خلال الشهر الجاري (≤ 30 يوم)
              </p>
            </div>
          </div>
        </div>

        {/* Browser notification trigger (FR-27) */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleEnableNotifications}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>
              {notificationStatus === 'granted'
                ? 'فحص وإرسال إشعار فوري'
                : 'تفعيل إشعارات المتصفح (FR-27)'}
            </span>
          </button>
        </div>
      </div>

      {testSent && (
        <div className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>تم إرسال إشعار تنبيه تجريبي عبر المتصفح بنجاح!</span>
        </div>
      )}

      {/* 2 Main Columns: Overdue vs Due Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Overdue Commitments */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs overflow-hidden">
          <div className="bg-rose-50 dark:bg-rose-950/40 px-6 py-4 border-b border-rose-100 dark:border-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-rose-900 text-sm">الالتزامات المتأخرة</h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">تجاوزت تاريخ الاستحقاق المحدد</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-rose-200 text-rose-900">
              {overdueList.length} التزام
            </span>
          </div>

          <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {overdueList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-sm text-slate-600 dark:text-slate-300">رائع! لا توجد أي التزامات متأخرة</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">جميع الالتزامات مسددة أو ضمن فترات السماح</p>
              </div>
            ) : (
              overdueList.map((c) => {
                const { paid, remaining, progressPercent } = calculateCommitmentRemaining(c);
                const daysOverdue = Math.abs(getDaysDiff(c.endDate));

                return (
                  <div key={c.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300">{c.id}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${
                              c.priority === 'A'
                                ? 'bg-rose-100 text-rose-800'
                                : c.priority === 'B'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            درجة {c.priority}
                          </span>
                        </div>
                        {c.desc && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.desc}</p>}
                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-1">
                          <span>المسؤول: {c.owner}</span>
                          <span>•</span>
                          <span>الفئة: {c.category}</span>
                          <span>•</span>
                          <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                            تاريخ الاستحقاق: {c.endDate}
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="inline-block px-2.5 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-xs font-black rounded-lg border border-rose-200 dark:border-rose-800">
                          متأخر {daysOverdue} يوم
                        </span>
                        <div className="font-black text-rose-700 dark:text-rose-300 text-sm mt-1">
                          {formatDebtAmount(remaining, c.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar and Quick action */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-rose-500 h-1.5 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenPaymentModal(c)}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>تسجيل دفعة</span>
                        </button>
                        <button
                          onClick={() => onEditCommitment(c)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          تعديل
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Due Soon (Within 30 Days) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs overflow-hidden">
          <div className="bg-amber-50 dark:bg-amber-950/40 px-6 py-4 border-b border-amber-100 dark:border-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-amber-900 text-sm">مستحق قريباً (خلال 30 يوم)</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">الاستحقاقات القادمة للشهر الحالي</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-200 text-amber-900">
              {dueSoonList.length} التزام
            </span>
          </div>

          <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {dueSoonList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-600 dark:text-slate-300">لا توجد التزامات مستحقة خلال 30 يوم القادمة</p>
              </div>
            ) : (
              dueSoonList.map((c) => {
                const { remaining, progressPercent } = calculateCommitmentRemaining(c);
                const daysRemaining = getDaysDiff(c.endDate);

                return (
                  <div key={c.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300">{c.id}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${
                              c.priority === 'A'
                                ? 'bg-rose-100 text-rose-800'
                                : c.priority === 'B'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            درجة {c.priority}
                          </span>
                        </div>
                        {c.desc && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.desc}</p>}
                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-1">
                          <span>المسؤول: {c.owner}</span>
                          <span>•</span>
                          <span>الفئة: {c.category}</span>
                          <span>•</span>
                          <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">
                            تاريخ الاستحقاق: {c.endDate}
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="inline-block px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-black rounded-lg border border-amber-200 dark:border-amber-800">
                          {daysRemaining === 0 ? 'مستحق اليوم' : `متبقي ${daysRemaining} يوم`}
                        </span>
                        <div className="font-black text-amber-900 text-sm mt-1">
                          {formatDebtAmount(remaining, c.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar and Quick action */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-amber-500 h-1.5 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenPaymentModal(c)}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>تسجيل دفعة</span>
                        </button>
                        <button
                          onClick={() => onEditCommitment(c)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          تعديل
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
