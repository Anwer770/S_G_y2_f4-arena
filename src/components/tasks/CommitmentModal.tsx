import React, { useState, useEffect } from 'react';
import { Commitment, TaskPriority } from '../../types';
import { generateNextCommitmentId } from '../../utils/tasks';
import { TASK_PRIORITIES } from '../../data/defaultTasks';
import { X, Save, DollarSign, Calendar, Tag, FileText, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (commitment: Commitment) => void;
  editingCommitment?: Commitment | null;
  existingCommitments: Commitment[];
  initialDate?: string;
}

export const CommitmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingCommitment,
  existingCommitments,
  initialDate,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [pri, setPri] = useState<TaskPriority>('A');
  const [due, setDue] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'قيد التنفيذ' | 'تم الانجاز' | 'مؤجل' | 'ملغي' | 'متأخر'>('قيد التنفيذ');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingCommitment) {
      setId(editingCommitment.id);
      setName(editingCommitment.name);
      setAmount(editingCommitment.amount);
      setPri(editingCommitment.pri);
      setDue(editingCommitment.due || '');
      setStatus(editingCommitment.status);
      setDesc(editingCommitment.desc || '');
    } else {
      setId(generateNextCommitmentId(existingCommitments));
      setName('');
      setAmount('');
      setPri('A');
      setDue(initialDate || new Date().toISOString().split('T')[0]);
      setStatus('قيد التنفيذ');
      setDesc('');
    }
    setError(null);
  }, [editingCommitment, isOpen, existingCommitments, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم الالتزام / الجهة المستحقة');
      return;
    }
    if (amount === '' || Number(amount) <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    const payload: Commitment = {
      id: id || generateNextCommitmentId(existingCommitments),
      name: name.trim(),
      amount: Number(amount),
      pri,
      due: due || undefined,
      status,
      desc: desc.trim() || undefined,
      createdAt: editingCommitment ? editingCommitment.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="commitment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-900 dark:text-slate-100">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {editingCommitment ? 'تعديل التزام مالي' : 'إضافة التزام مالي جديد'}
              </h3>
              <p className="text-xs text-slate-300">دفتر الالتزامات والمستحقات (المها v2.0)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Row 1: ID & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المعرف</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800/60"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الالتزام / الجهة المستحقة</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: سداد إيجار المستودع / مستحقات المورد"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* Row 2: Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المبلغ المطلوب (ريال)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Row 3: Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الأهمية / الأولوية</label>
              <select
                value={pri}
                onChange={(e) => setPri(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="قيد التنفيذ">قيد التنفيذ (مستحق/قائم)</option>
                <option value="تم الانجاز">تم الانجاز (مسدد بالكامل)</option>
                <option value="مؤجل">مؤجل</option>
                <option value="ملغي">ملغي</option>
                <option value="متأخر">متأخر</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الوصف والملاحظات</label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="تفاصيل طريقة السداد، رقم الحساب، أو أرقام الفواتير المتعلقة..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold shadow-md shadow-amber-200 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{editingCommitment ? 'حفظ التعديلات' : 'إضافة الالتزام'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
