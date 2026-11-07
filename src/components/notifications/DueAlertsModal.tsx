import React, { useState } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  X,
  ExternalLink,
  Filter,
  Check,
  Tag,
  DollarSign,
  User,
  Archive,
  BellRing,
} from 'lucide-react';
import {
  DueAlertItem,
  DueAlertsSummary,
  formatDueText,
  archiveAlertIds,
  clearArchivedAlerts,
} from '../../utils/dueAlerts';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendSystemNotification,
} from '../../utils/webNotifications';

interface DueAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DueAlertsSummary;
  onNavigateToTasks: () => void;
  onToggleCompleteTask: (taskId: string) => void;
  onToggleCompleteCommitment: (commId: string) => void;
}

type FilterType = 'all' | 'overdue' | 'today' | 'soon' | 'task' | 'commitment';

export const DueAlertsModal: React.FC<DueAlertsModalProps> = ({
  isOpen,
  onClose,
  summary,
  onNavigateToTasks,
  onToggleCompleteTask,
  onToggleCompleteCommitment,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter items
  const filteredItems = summary.items.filter((item) => {
    if (activeFilter === 'overdue' && item.urgency !== 'overdue') return false;
    if (activeFilter === 'today' && item.urgency !== 'today') return false;
    if (activeFilter === 'soon' && item.urgency !== 'soon') return false;
    if (activeFilter === 'task' && item.type !== 'task') return false;
    if (activeFilter === 'commitment' && item.type !== 'commitment') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCategory = item.category?.toLowerCase().includes(q);
      const matchResp = item.responsible?.toLowerCase().includes(q);
      return matchTitle || matchCategory || matchResp;
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="due-alerts-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 id="due-alerts-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                تنبيهات المواعيد والاستحقاقات
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                متابعة دقيقة للمهام والالتزامات المستحقة اليوم أو التي يقترب موعد تنفيذها
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-center text-xs">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">الإجمالي</div>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{summary.total}</div>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 shadow-2xs">
            <div className="text-xs text-rose-600 dark:text-rose-400 font-bold">متأخرة</div>
            <div className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5">{summary.overdueCount}</div>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 shadow-2xs">
            <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">اليوم</div>
            <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">{summary.todayCount}</div>
          </div>
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 shadow-2xs">
            <div className="text-xs text-teal-600 dark:text-teal-400 font-bold">خلال 3 أيام</div>
            <div className="text-lg font-black text-teal-700 dark:text-teal-300 mt-0.5">{summary.soonCount}</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              الكل ({summary.total})
            </button>
            <button
              onClick={() => setActiveFilter('overdue')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeFilter === 'overdue'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              المتأخرة ({summary.overdueCount})
            </button>
            <button
              onClick={() => setActiveFilter('today')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              مستحقة اليوم ({summary.todayCount})
            </button>
            <button
              onClick={() => setActiveFilter('soon')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeFilter === 'soon'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              قريباً ({summary.soonCount})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {summary.items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل تريد أرشفة وتصفية التنبيهات المعروضة بنقرة واحدة؟')) {
                    archiveAlertIds(filteredItems.map((i) => i.id));
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="أرشفة وتصفية التنبيهات القديمة والمتراكمة بنقرة واحدة"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>أرشفة التنبيهات ({filteredItems.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                const granted = await requestNotificationPermission();
                if (granted) {
                  sendSystemNotification('المنظومة الإدارية والمالية', {
                    body: `تم تفعيل إشعارات المتصفح بنجاح! لديك ${summary.total} تنبيهات معلقة.`,
                  });
                  alert('تم تفعيل التنبيهات الخارجية بنجاح على هذا المتصفح!');
                } else {
                  alert('تم رفض أو تعطيل إذن الإشعارات في المتصفح.');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-800 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="تفعيل إشعارات المتصفح للمهام والديون المستحقة"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>إشعارات المتصفح</span>
            </button>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="تصفية بالاسم..."
              className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500 w-full sm:w-36"
            />
          </div>
        </div>

        {/* Alert Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-teal-500 opacity-80" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا توجد تنبيهات تطابق المعايير المحددة
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                كافة المهام والالتزامات تسير وفق الجدول المحدد أو تم إنجازها
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const dueInfo = formatDueText(item.diffDays);
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Urgency Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        item.urgency === 'overdue'
                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                          : item.urgency === 'today'
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                          : 'bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400'
                      }`}
                    >
                      {item.urgency === 'overdue' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md border ${
                            item.type === 'task'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {item.type === 'task' ? 'مهمة عمل' : 'التزام مالي'}
                        </span>

                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${dueInfo.badgeColor}`}>
                          {dueInfo.text}
                        </span>

                        {item.priority && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            أولوية: {item.priority}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>تاريخ الاستحقاق: {item.dueDate}</span>
                        </span>

                        {item.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{item.category}</span>
                          </span>
                        )}

                        {item.responsible && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{item.responsible}</span>
                          </span>
                        )}

                        {item.amount != null && item.amount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{item.amount.toLocaleString('en-US')} ر.ي</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        if (item.type === 'task') {
                          onToggleCompleteTask(item.id);
                        } else {
                          onToggleCompleteCommitment(item.id);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                      title="تعليم كمكتمل"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>إنجاز</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateToTasks();
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                      title="فتح في شاشة إدارة العمل"
                    >
                      <span>عرض</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            يتم التنبيه تلقائياً عند اقتراب موعد التنفيذ خلال 3 أيام أو في اليوم المحدد
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNavigateToTasks();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
            >
              الانتقال إلى Work OS
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
            >
              تم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
