import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { generateNextTaskId } from '../../utils/tasks';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../data/defaultTasks';
import { X, Save, Calendar, CheckSquare, User, Tag, Activity, DollarSign, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  editingTask?: Task | null;
  existingTasks: Task[];
  categories: string[];
  operations: string[];
  assignees: string[];
  initialDate?: string;
}

export const TaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  existingTasks,
  categories,
  operations,
  assignees,
  initialDate,
}) => {
  const [id, setId] = useState('');
  const [sub, setSub] = useState('');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
  const [end, setEnd] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState(categories[0] || 'العملاء');
  const [op, setOp] = useState(operations[0] || 'مهمة');
  const [pri, setPri] = useState<TaskPriority>('B');
  const [status, setStatus] = useState<TaskStatus>('قيد التنفيذ');
  const [resp, setResp] = useState(assignees[0] || 'أنا');
  const [amount, setAmount] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setId(editingTask.id);
      setSub(editingTask.sub || '');
      setTitle(editingTask.title);
      setStart(editingTask.start);
      setEnd(editingTask.end || '');
      setDesc(editingTask.desc || '');
      setCat(editingTask.cat);
      setOp(editingTask.op);
      setPri(editingTask.pri);
      setStatus(editingTask.status);
      setResp(editingTask.resp);
      setAmount(editingTask.amount !== undefined ? editingTask.amount : '');
    } else {
      const nextId = generateNextTaskId(existingTasks);
      setId(nextId);
      setSub(`${categories[0] || 'عام'}-${nextId.replace('T-', '')}`);
      setTitle('');
      const defaultDate = initialDate || new Date().toISOString().split('T')[0];
      setStart(defaultDate);
      setEnd(defaultDate);
      setDesc('');
      setCat(categories[0] || 'العملاء');
      setOp(operations[0] || 'مهمة');
      setPri('B');
      setStatus('قيد التنفيذ');
      setResp(assignees[0] || 'أنا');
      setAmount('');
    }
    setError(null);
  }, [editingTask, isOpen, existingTasks, categories, operations, assignees, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى إدخال عنوان المهمة');
      return;
    }
    if (!start) {
      setError('يرجى تحديد تاريخ البداية');
      return;
    }

    const payload: Task = {
      id: id || generateNextTaskId(existingTasks),
      sub: sub.trim() || undefined,
      title: title.trim(),
      start,
      end: end || undefined,
      desc: desc.trim() || undefined,
      cat,
      op,
      pri,
      status,
      resp,
      amount: amount !== '' && Number(amount) > 0 ? Number(amount) : undefined,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="task-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {editingTask ? 'تعديل مهمة عمل' : 'إضافة مهمة جديدة'}
              </h3>
              <p className="text-xs text-slate-300">دفتر المهام والأعمال والخطط والأهداف (المها v2.0)</p>
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

          {/* Row 1: ID & Sub ID & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المعرف الرئيسي</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800/60"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المعرف الفرعي</label>
              <input
                type="text"
                value={sub}
                onChange={(e) => setSub(e.target.value)}
                placeholder="عملاء-0012"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">عنوان المهمة</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: زيارة الدكتور سامي في العيادة"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Row 2: Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تاريخ البداية (إلزامي)</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تاريخ الانتهاء / الاستحقاق</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 3: Category & Operation & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الفئة (18 فئة)</label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">العملية (8 عمليات)</label>
              <select
                value={op}
                onChange={(e) => setOp(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {operations.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المسؤول (12 مسؤول)</label>
              <select
                value={resp}
                onChange={(e) => setResp(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Priority & Status & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الأولوية</label>
              <select
                value={pri}
                onChange={(e) => setPri(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المبلغ المالي (إن وجد)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الوصف والتفاصيل</label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="تفاصيل إضافية أو مخرجات متوقعة للمهمة..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{editingTask ? 'حفظ التعديلات' : 'إضافة المهمة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
