import React, { useState } from 'react';
import { DebtCommitment, DebtCommitmentPayment } from '../../types';
import { formatDebtAmount } from '../../utils/debts';
import { X, Plus, Trash2, CheckCircle2, DollarSign, Calendar } from 'lucide-react';

interface PartialPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitment: DebtCommitment | null;
  onAddPayment: (commitmentId: string, payment: DebtCommitmentPayment) => void;
  onDeletePayment: (commitmentId: string, paymentId: string) => void;
}

export const PartialPaymentModal: React.FC<PartialPaymentModalProps> = ({
  isOpen,
  onClose,
  commitment,
  onAddPayment,
  onDeletePayment,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen || !commitment) return null;

  const totalAmount = commitment.amount || 0;
  const payments = commitment.payments || [];
  const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const progressPercent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount || '0') || 0;
    if (numAmount <= 0) {
      setError('يرجى إدخال مبلغ دفعة سداد صحيح أكبر من الصفر');
      return;
    }

    if (numAmount > remainingAmount + 0.0001) {
      setError(`المبلغ المدخل (${numAmount}) يتجاوز المبلغ المتبقي (${remainingAmount})`);
      return;
    }

    const newPayment: DebtCommitmentPayment = {
      pid: `PAY-${Date.now().toString().slice(-6)}`,
      date: date || new Date().toISOString().split('T')[0],
      amount: numAmount,
      note: note.trim() || undefined,
    };

    onAddPayment(commitment.id, newPayment);
    setAmount('');
    setNote('');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">سجل الدفعات وسداد الالتزام</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {commitment.id}: {commitment.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Commitment Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">إجمالي قيمة الالتزام:</span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                {formatDebtAmount(totalAmount, commitment.currency)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-300">إجمالي المدفوع:</span>
                <span className="text-sm font-black text-emerald-900">
                  {formatDebtAmount(paidAmount, commitment.currency)}
                </span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900">
                <span className="block text-xs font-bold text-rose-700 dark:text-rose-300">المتبقي للسداد:</span>
                <span className="text-sm font-black text-rose-900">
                  {formatDebtAmount(remainingAmount, commitment.currency)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                <span>نسبة الإنجاز والسداد:</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    progressPercent === 100
                      ? 'bg-emerald-500'
                      : progressPercent > 50
                      ? 'bg-indigo-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Add New Payment Form */}
          {remainingAmount > 0 ? (
            <form onSubmit={handleAddPaymentSubmit} className="p-4 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
              <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                <span>تسجيل دفعة سداد جديدة</span>
              </h4>

              {error && (
                <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    مبلغ الدفعة ({commitment.currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder={`أقصى مبلغ: ${remainingAmount}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">تاريخ السداد</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  ملاحظات وسند الصرف / الحوالة
                </label>
                <input
                  type="text"
                  placeholder="مثال: نقداً، تحويل عبر الكريمي، سند رقم 902..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد تسجيل الدفعة</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <p className="text-xs font-black text-emerald-900">
                تم سداد هذا الالتزام بالكامل بنسبة 100%
              </p>
            </div>
          )}

          {/* Payments History List */}
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
              سجل الدفعات السابقة ({payments.length})
            </h4>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center">
                لم يتم تسجيل أي دفعات سداد لهذا الالتزام حتى الآن
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {payments.map((p, idx) => (
                  <div
                    key={p.pid || idx}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-slate-100">
                            {formatDebtAmount(p.amount, commitment.currency)}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            {p.date}
                          </span>
                        </div>
                        {p.note && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{p.note}</p>
                        )}
                      </div>
                    </div>

                    {confirmDeleteId === p.pid ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeletePayment(commitment.id, p.pid);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(p.pid)}
                        title="حذف هذه الدفعة"
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
