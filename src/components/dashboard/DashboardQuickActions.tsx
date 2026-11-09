/**
 * شريط الإجراءات السريعة الفورية (8 إجراءات).
 *
 * قسم من لوحة التحكم — مستخرج من UnifiedDashboard.tsx (R30) بلا تغيير في البنية أو السلوك.
 */
import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckSquare,
  Package,
  ShoppingCart,
  Users,
  Zap,
} from 'lucide-react';
import type { DashboardModel } from './useDashboardModel';

type Props = Pick<
  DashboardModel,
  | 'handleOpenPaymentVoucher'
  | 'handleOpenReceiptVoucher'
  | 'handleOpenRecordVisit'
  | 'setIsCommitmentModalOpen'
  | 'setIsMovementModalOpen'
  | 'setIsNoteModalOpen'
  | 'setIsTaskModalOpen'
  | 'setIsWorkOSQuickAddOpen'
  | 'setWorkOSQuickAddType'
>;

export const DashboardQuickActions: React.FC<Props> = ({
  handleOpenPaymentVoucher,
  handleOpenReceiptVoucher,
  handleOpenRecordVisit,
  setIsCommitmentModalOpen,
  setIsMovementModalOpen,
  setIsNoteModalOpen,
  setIsTaskModalOpen,
  setIsWorkOSQuickAddOpen,
  setWorkOSQuickAddType,
}) => (
  <>
    {/* 2.5 PROMINENT QUICK ACTIONS BAR (الأزرار السريعة الفورية) */}
    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#0D9488]" />
          <span className="text-xs font-black text-slate-900 dark:text-slate-100">الإجراءات السريعة الفورية</span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            (إدخال مباشر منظم عبر النماذج المحاسبية دون مغادرة الشاشة)
          </span>
        </div>
        <span className="text-xs text-[#0D9488] dark:text-teal-400 font-bold">
          8 إجراءات فورية (الطلبيات، المهام، السندات، والمخزون)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {/* + طلبية / توريد (أزرق ملكي #3B82F6) */}
        <button
          onClick={() => {
            setWorkOSQuickAddType('order');
            setIsWorkOSQuickAddOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-950 dark:text-blue-200 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <ShoppingCart className="w-4 h-4 text-[#3B82F6] shrink-0" />
          <span>+ طلبية / توريد</span>
        </button>

        {/* + مهمة (أخضر زمردي) */}
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#0F3935] dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <CheckSquare className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span>+ مهمة</span>
        </button>

        {/* + زيارة (أزرق ملكي) */}
        <button
          onClick={() => handleOpenRecordVisit()}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Users className="w-4 h-4 text-[#3B82F6] shrink-0" />
          <span>+ زيارة عميل</span>
        </button>

        {/* + سند قبض (أخضر زمردي #0D9488) */}
        <button
          onClick={handleOpenReceiptVoucher}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-950 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <ArrowDownLeft className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span>+ سند قبض</span>
        </button>

        {/* + سند صرف (أحمر مرجاني #EF4444) */}
        <button
          onClick={handleOpenPaymentVoucher}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-950 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <ArrowUpRight className="w-4 h-4 text-[#EF4444] shrink-0" />
          <span>+ سند صرف</span>
        </button>

        {/* + حركة مخزون (أخضر زيتي / نيلي) */}
        <button
          onClick={() => setIsMovementModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-950 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Package className="w-4 h-4 text-[#4338CA] shrink-0" />
          <span>+ إذن مخزني</span>
        </button>

        {/* + ملاحظة (ذهبي برونزي) */}
        <button
          onClick={() => setIsNoteModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <BookOpen className="w-4 h-4 text-[#D97706] shrink-0" />
          <span>+ ملاحظة</span>
        </button>

        {/* + موعد (برونزي #B45309) */}
        <button
          onClick={() => setIsCommitmentModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-950 dark:text-orange-200 border border-orange-200/80 dark:border-orange-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Calendar className="w-4 h-4 text-[#B45309] shrink-0" />
          <span>+ موعد / التزام</span>
        </button>
      </div>
    </div>
  </>
);
