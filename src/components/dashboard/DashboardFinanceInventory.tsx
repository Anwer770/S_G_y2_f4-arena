/**
 * كتل القيادة المالية والمخزنية (آخر الحركات).
 *
 * قسم من لوحة التحكم — مستخرج من UnifiedDashboard.tsx (R30) بلا تغيير في البنية أو السلوك.
 */
import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Package, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { DashboardModel } from './useDashboardModel';

type Props = Pick<
  DashboardModel,
  | 'finSummary'
  | 'handleOpenPaymentVoucher'
  | 'handleOpenReceiptVoucher'
  | 'onNavigateTab'
  | 'recentFinancial'
  | 'recentMovements'
  | 'setIsMovementModalOpen'
  | 'stockStats'
>;

export const DashboardFinanceInventory: React.FC<Props> = ({
  finSummary,
  handleOpenPaymentVoucher,
  handleOpenReceiptVoucher,
  onNavigateTab,
  recentFinancial,
  recentMovements,
  setIsMovementModalOpen,
  stockStats,
}) => (
  <>
    {/* 5. FINANCIAL & INVENTORY COMMAND BLOCKS (حركة مالية + حركة مخزون) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* حركة مالية */}
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">الحركة المالية واليومية</h3>
              <span className="text-xs text-slate-400">
                إيرادات: {formatCurrency(finSummary.totalIncome)} YER • مصروفات:{' '}
                {formatCurrency(finSummary.totalExpense)} YER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenReceiptVoucher}
              className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold hover:bg-emerald-200 transition cursor-pointer"
            >
              + قبض
            </button>
            <button
              onClick={handleOpenPaymentVoucher}
              className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-xs font-bold hover:bg-rose-200 transition cursor-pointer"
            >
              + صرف
            </button>
            <button
              onClick={() => onNavigateTab('financial')}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              السجل الكامل
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {recentFinancial.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">لا توجد حركات مالية مسجلة بعد.</p>
          ) : (
            recentFinancial.map((txn) => {
              const isIncome = txn.movement === 'ايرادات' || txn.movement === 'الصندوق' || txn.movement === 'حساب له';
              return (
                <div
                  key={txn.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${isIncome ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'}`}
                    >
                      {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {txn.accountName || txn.id}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {txn.movement} • {txn.restriction} • {txn.date}
                      </span>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <span
                      className={`font-bold block ${isIncome ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600 dark:text-rose-400'}`}
                    >
                      {formatCurrency(txn.amountYER)} YER
                    </span>
                    {(txn.amountSAR > 0 || txn.amountUSD > 0) && (
                      <span className="text-xs text-slate-400 block">
                        {txn.amountSAR > 0 ? `${formatCurrency(txn.amountSAR)} SAR ` : ''}
                        {txn.amountUSD > 0 ? `$${formatCurrency(txn.amountUSD)} USD` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* حركة مخزون */}
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">حركة المخزون والمستودع</h3>
              <span className="text-xs text-slate-400">
                الأصناف: {stockStats.totalItems} • إجمالي الكمية: {stockStats.totalQty} • حرجة:{' '}
                {stockStats.lowStockCount + stockStats.outOfStockCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMovementModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 text-xs font-bold hover:bg-sky-200 transition cursor-pointer"
            >
              + إذن مخزني
            </button>
            <button
              onClick={() => onNavigateTab('stock')}
              className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
            >
              دفتر الأصناف
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {recentMovements.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">لا توجد حركات مخزون مسجلة بعد.</p>
          ) : (
            recentMovements.map((mov) => (
              <div
                key={mov.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${mov.movementType === 'توريد' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800' : 'bg-rose-100 dark:bg-rose-950 text-rose-800'}`}
                  >
                    {mov.movementType === 'توريد' ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      إذن {mov.movementType} #{mov.subId} — {mov.beneficiary}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {mov.category} • {mov.date} • {mov.items?.length || 0} صنف
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    mov.status === 'معتمد'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {mov.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </>
);
