import React, { useState, useEffect } from 'react';
import { DebtBookId, DebtRecord } from '../../types';
import { DEBT_BOOKS_META, DEBT_ICONS } from '../../utils/debts';
import { X, Save, DollarSign } from 'lucide-react';

interface DebtRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DebtRecord) => void;
  initialRecord?: DebtRecord | null;
  defaultBook?: DebtBookId;
}

export const DebtRecordModal: React.FC<DebtRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  defaultBook = 'anwar',
}) => {
  const [book, setBook] = useState<DebtBookId>(defaultBook);
  const [date, setDate] = useState('');
  const [icon, setIcon] = useState('⚑');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('YER');
  const [debit, setDebit] = useState<number | ''>('');
  const [credit, setCredit] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialRecord) {
      setBook(initialRecord.book);
      setDate(initialRecord.date || '');
      setIcon(initialRecord.icon || '⚑');
      setName(initialRecord.name || '');
      setCurrency(initialRecord.currency || 'YER');
      setDebit(initialRecord.debit || '');
      setCredit(initialRecord.credit || '');
      setNote(initialRecord.note || '');
      setIsCompleted(!!initialRecord.isCompleted);
    } else {
      setBook(defaultBook);
      setDate(new Date().toISOString().split('T')[0]);
      setIcon('⚑');
      setName('');
      setCurrency(defaultBook === 'previous' ? 'YER' : defaultBook === 'zaha' ? 'YER' : 'YER');
      setDebit('');
      setCredit('');
      setNote('');
      setIsCompleted(false);
    }
    setError('');
  }, [initialRecord, defaultBook, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم أو بيان العملية');
      return;
    }

    const numDebit = typeof debit === 'number' ? debit : parseFloat(debit || '0') || 0;
    const numCredit = typeof credit === 'number' ? credit : parseFloat(credit || '0') || 0;

    if (numDebit === 0 && numCredit === 0) {
      setError('يرجى إدخال مبلغ مدين أو دائن');
      return;
    }

    const record: DebtRecord = {
      id: initialRecord ? initialRecord.id : `DEBT-${Date.now().toString().slice(-6)}`,
      book,
      date,
      icon,
      name: name.trim(),
      currency,
      debit: numDebit,
      credit: numCredit,
      note: note.trim(),
      isCompleted,
      createdAt: initialRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(record);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">
                {initialRecord ? 'تعديل قيد في دفتر الدين' : 'إضافة قيد جديد لدفتر الدين'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {DEBT_BOOKS_META[book]?.title || 'دفاتر الدين والالتزامات'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Book Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الدفتر المستهدف</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(DEBT_BOOKS_META) as DebtBookId[]).map((bkId) => {
                const meta = DEBT_BOOKS_META[bkId];
                const isSelected = book === bkId;
                return (
                  <button
                    type="button"
                    key={bkId}
                    onClick={() => setBook(bkId)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {meta.badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">التاريخ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الرمز / الدليل</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {DEBT_ICONS.map((ic) => (
                  <option key={ic.symbol} value={ic.symbol}>
                    {ic.symbol} - {ic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              البيان / الاسم / الوصف <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: سداد دفعة حساب محروقات، شراء بضاعة..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Currency & Amounts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">العملة</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="YER">ريال يمني (YER)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">
                مدين (عليه)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={debit}
                onChange={(e) => setDebit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-rose-50/50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-sm font-bold text-rose-800 dark:text-rose-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                دائن (له)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={credit}
                onChange={(e) => setCredit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-bold text-emerald-800 dark:text-emerald-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الملاحظات والتفاصيل</label>
            <textarea
              rows={2}
              placeholder="أي تفاصيل أو مراجع أو سندات..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Completed Checkbox */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="isCompletedDebt"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="w-4 h-4 text-emerald-600 dark:text-emerald-400 rounded-md border-slate-300 dark:border-slate-600 focus:ring-emerald-500"
            />
            <label htmlFor="isCompletedDebt" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
              وسم السجل مكتملاً ✔ (تظليل رمادي وخط شطب)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{initialRecord ? 'حفظ التعديلات' : 'إضافة القيد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
