import React, { useState, useEffect } from 'react';
import { DebtCommitment } from '../../types';
import { DEBT_CATEGORIES, DEBT_ICONS, DEBT_OWNERS, generateNextCommitmentId } from '../../utils/debts';
import { X, Save, Clock, Calendar, ShieldAlert } from 'lucide-react';

interface CommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (commitment: DebtCommitment) => void;
  initialCommitment?: DebtCommitment | null;
  existingCommitments: DebtCommitment[];
  categories: string[];
  owners: string[];
}

export const CommitmentModal: React.FC<CommitmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCommitment,
  existingCommitments,
  categories = DEBT_CATEGORIES,
  owners = DEBT_OWNERS,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<'A' | 'B' | 'C'>('B');
  const [status, setStatus] = useState('جارية');
  const [icon, setIcon] = useState('⚑');
  const [owner, setOwner] = useState(owners[0] || 'أنور');
  const [category, setCategory] = useState(categories[0] || 'أعمال الالتزامات');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('YER');
  const [dir, setDir] = useState<'debit' | 'credit'>('debit');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCommitment) {
      setId(initialCommitment.id);
      setName(initialCommitment.name || '');
      setDesc(initialCommitment.desc || '');
      setDate(initialCommitment.date || '');
      setEndDate(initialCommitment.endDate || '');
      setPriority(initialCommitment.priority || 'B');
      setStatus(initialCommitment.status || 'جارية');
      setIcon(initialCommitment.icon || '⚑');
      setOwner(initialCommitment.owner || owners[0] || 'أنور');
      setCategory(initialCommitment.category || categories[0] || 'أعمال الالتزامات');
      setAmount(initialCommitment.amount || '');
      setCurrency(initialCommitment.currency || 'YER');
      setDir(initialCommitment.dir || 'debit');
      setNote(initialCommitment.note || '');
    } else {
      setId(generateNextCommitmentId(existingCommitments));
      setName('');
      setDesc('');
      setDate(new Date().toISOString().split('T')[0]);
      // Default due date: 30 days from now
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setEndDate(d.toISOString().split('T')[0]);
      setPriority('B');
      setStatus('جارية');
      setIcon('⚑');
      setOwner(owners[0] || 'أنور');
      setCategory(categories[0] || 'أعمال الالتزامات');
      setAmount('');
      setCurrency('YER');
      setDir('debit');
      setNote('');
    }
    setError('');
  }, [initialCommitment, existingCommitments, isOpen, categories, owners]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم الالتزام المالي');
      return;
    }

    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount || '0') || 0;
    if (numAmount <= 0) {
      setError('يرجى إدخال مبلغ الالتزام');
      return;
    }

    // Check duplicate ID if new
    if (!initialCommitment && existingCommitments.some((c) => c.id === id.trim())) {
      setError(`المعرف ${id} مستخدم مسبقاً، تم اختيار معرف جديد`);
      setId(generateNextCommitmentId(existingCommitments));
      return;
    }

    const commitment: DebtCommitment = {
      id: id.trim() || generateNextCommitmentId(existingCommitments),
      name: name.trim(),
      desc: desc.trim(),
      date: date || new Date().toISOString().split('T')[0],
      endDate: endDate || '',
      priority,
      status,
      icon,
      owner,
      category,
      amount: numAmount,
      currency,
      dir,
      note: note.trim(),
      payments: initialCommitment?.payments || [],
      createdAt: initialCommitment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(commitment);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">
                {initialCommitment ? 'تعديل التزام مالي' : 'إضافة التزام مالي جديد'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                إدارة الالتزامات والأقساط ومواعيد السداد
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Row 1: ID & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                المعرف التلقائي <span className="text-slate-400 dark:text-slate-500">(FR-09)</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="التزامات-001"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 font-mono font-bold border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-indigo-700 dark:text-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">درجة الأهمية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'A' | 'B' | 'C')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="A">A - عالية (حرجة)</option>
                <option value="B">B - متوسطة</option>
                <option value="C">C - منخفضة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الرمز / الدليل</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {DEBT_ICONS.map((ic) => (
                  <option key={ic.symbol} value={ic.symbol}>
                    {ic.symbol} - {ic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              اسم الالتزام / الجهة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: إيجار المقر، فاتورة الهاتف، مورد العبوات، قسط سيارة..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الوصف والتفاصيل</label>
            <input
              type="text"
              placeholder="تفاصيل إضافية عن الالتزام أو العقد..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Amount, Currency & Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                المبلغ <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">العملة</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="YER">ريال يمني (YER)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">نوع الالتزام</label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => setDir('debit')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    dir === 'debit'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  مدين (عليه)
                </button>
                <button
                  type="button"
                  onClick={() => setDir('credit')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    dir === 'credit'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  دائن (له)
                </button>
              </div>
            </div>
          </div>

          {/* Dates: Start & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">تاريخ القيد</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                تاريخ الاستحقاق (تاريخ الانتهاء) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-rose-800 dark:text-rose-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Category & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الفئة</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">المسؤول</label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {owners.map((ow) => (
                  <option key={ow} value={ow}>
                    {ow}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الحالة</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['جارية', 'قادمة', 'متأخرة', 'منجز ✔', 'خاص ★', 'يحتاج تأكيد ⚐'].map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all ${
                    status === st
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">ملاحظات إضافية</label>
            <textarea
              rows={2}
              placeholder="شروط السداد، رقم الحساب البنكي، أرقام السندات..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
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
              <span>{initialCommitment ? 'حفظ التعديلات' : 'إنشاء الالتزام'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
