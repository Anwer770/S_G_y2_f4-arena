import React, { useState, useEffect } from 'react';
import { Customer, CustomerVisitRecord, VisitStatus } from '../../types';
import { CUSTOMER_RESPONSIBLES, CUSTOMER_STATUSES } from '../../data/defaultCustomers';
import { getTodayArabicDay } from '../../utils/customers';
import { X, Calendar, DollarSign, FileText, CheckCircle2, User, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSaveVisit: (visit: CustomerVisitRecord, updatedCustomerStatus?: VisitStatus, collectedAmountYER?: number) => void;
}

export const RecordVisitModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customer,
  onSaveVisit,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState(getTodayArabicDay());
  const [responsible, setResponsible] = useState(customer?.responsible || 'انور');
  const [status, setStatus] = useState<VisitStatus>('مكتمل');
  const [amountCollectedYER, setAmountCollectedYER] = useState<number | ''>('');
  const [amountCollectedSAR, setAmountCollectedSAR] = useState<number | ''>('');
  const [amountCollectedUSD, setAmountCollectedUSD] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [updateCustomerBalance, setUpdateCustomerBalance] = useState(true);

  useEffect(() => {
    if (customer) {
      setResponsible(customer.responsible || 'انور');
      setStatus('مكتمل');
      setDate(new Date().toISOString().split('T')[0]);
      setDayOfWeek(getTodayArabicDay());
      setAmountCollectedYER('');
      setAmountCollectedSAR('');
      setAmountCollectedUSD('');
      setNotes('');
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newVisit: CustomerVisitRecord = {
      id: `VISIT-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      date,
      dayOfWeek,
      responsible,
      status,
      amountCollectedYER: amountCollectedYER ? Number(amountCollectedYER) : undefined,
      amountCollectedSAR: amountCollectedSAR ? Number(amountCollectedSAR) : undefined,
      amountCollectedUSD: amountCollectedUSD ? Number(amountCollectedUSD) : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveVisit(
      newVisit,
      status,
      updateCustomerBalance && amountCollectedYER ? Number(amountCollectedYER) : undefined
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 my-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 dark:bg-slate-900/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <CheckCircle2 className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h2 className="text-base font-black">تسجيل وتوثيق زيارة ميدانية</h2>
              <p className="text-xs text-blue-100/90 font-medium truncate max-w-[280px]">
                {customer.name} • {customer.source}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Customer Summary Pill */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">الرصيد الحالي للعميل:</span>
              <span
                className={`font-black font-mono text-sm ${
                  (customer.balanceYER || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {(customer.balanceYER || 0).toLocaleString()} ريال
              </span>
            </div>
            <div className="text-left">
              <span className="text-slate-500 dark:text-slate-400 block">المسار والمنطقة:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {customer.route} - {customer.region}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">تاريخ الزيارة</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-medium text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            {/* Day of week */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">اليوم</label>
              <input
                type="text"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Responsible */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">المندوب المنفذ</label>
              <select
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100"
              >
                {CUSTOMER_RESPONSIBLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Visit Status */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">حالة الزيارة والنتيجة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VisitStatus)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100"
              >
                {CUSTOMER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Collection */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                المبلغ المحصل أثناء الزيارة (إن وجد)
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-emerald-800 dark:text-emerald-200 font-bold mb-1">ريال يمني (YER)</label>
                <input
                  type="number"
                  value={amountCollectedYER}
                  onChange={(e) => setAmountCollectedYER(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 font-mono font-bold text-emerald-900"
                />
              </div>
              <div>
                <label className="block text-xs text-emerald-800 dark:text-emerald-200 font-bold mb-1">سعودي (SAR)</label>
                <input
                  type="number"
                  value={amountCollectedSAR}
                  onChange={(e) => setAmountCollectedSAR(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 font-mono font-bold text-emerald-900"
                />
              </div>
              <div>
                <label className="block text-xs text-emerald-800 dark:text-emerald-200 font-bold mb-1">دولار (USD)</label>
                <input
                  type="number"
                  value={amountCollectedUSD}
                  onChange={(e) => setAmountCollectedUSD(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 font-mono font-bold text-emerald-900"
                />
              </div>
            </div>

            {amountCollectedYER && Number(amountCollectedYER) > 0 && (
              <label className="flex items-center gap-2 pt-1 text-xs font-bold text-emerald-800 dark:text-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateCustomerBalance}
                  onChange={(e) => setUpdateCustomerBalance(e.target.checked)}
                  className="rounded text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                خصم المبلغ المحصل تلقائيًا من مديونية العميل
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              تقرير الزيارة وملاحظات المندوب
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم تسليم الطلبية وعرض الكاتالوج الجديد، واستلام سند قبض، ووعد بالسداد..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-medium text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              حفظ تقرير الزيارة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
