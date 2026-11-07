import React, { useState, useMemo } from 'react';
import { Commitment } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { CommitmentModal } from './CommitmentModal';
import {
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  DollarSign,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';

interface Props {
  commitments: Commitment[];
  onSaveCommitment: (commitment: Commitment) => void;
  onDeleteCommitment: (id: string) => void;
  onToggleComplete: (commitment: Commitment) => void;
}

export const CommitmentsTable: React.FC<Props> = ({
  commitments,
  onSaveCommitment,
  onDeleteCommitment,
  onToggleComplete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priFilter, setPriFilter] = useState('');

  // Calculations
  const stats = useMemo(() => {
    let total = 0;
    let outstanding = 0;
    let paid = 0;
    let completedCount = 0;

    commitments.forEach((c) => {
      total += c.amount || 0;
      if (c.status === 'تم الانجاز') {
        paid += c.amount || 0;
        completedCount++;
      } else if (c.status !== 'ملغي') {
        outstanding += c.amount || 0;
      }
    });

    return {
      total,
      outstanding,
      paid,
      totalCount: commitments.length,
      completedCount,
      pendingCount: commitments.length - completedCount,
    };
  }, [commitments]);

  // Filtered List
  const filteredCommitments = useMemo(() => {
    return commitments.filter((c) => {
      if (search) {
        const q = search.toLowerCase().trim();
        const matchId = c.id.toLowerCase().includes(q);
        const matchName = c.name.toLowerCase().includes(q);
        const matchDesc = c.desc ? c.desc.toLowerCase().includes(q) : false;
        if (!matchId && !matchName && !matchDesc) return false;
      }
      if (statusFilter && c.status !== statusFilter) return false;
      if (priFilter && c.pri !== priFilter) return false;
      return true;
    });
  }, [commitments, search, statusFilter, priFilter]);

  const handleOpenAdd = () => {
    setEditingCommitment(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Commitment) => {
    setEditingCommitment(c);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Outstanding */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المبالغ القائمة (المطلوب سدادها)</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            {formatCurrency(stats.outstanding)} <span className="text-xs font-sans text-slate-500 dark:text-slate-400">ريال</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">الالتزامات المستحقة قيد التنفيذ</p>
        </div>

        {/* Paid */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المبالغ المسددة بالكامل</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.paid)} <span className="text-xs font-sans text-slate-500 dark:text-slate-400">ريال</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">تم سدادها وإنجازها ({stats.completedCount} التزام)</p>
        </div>

        {/* Total Commitments */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الالتزامات الكلية</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {formatCurrency(stats.total)} <span className="text-xs font-sans text-slate-500 dark:text-slate-400">ريال</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">إجمالي {stats.totalCount} التزام مالي مسجل</p>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الالتزامات والمبالغ..."
              className="w-full pl-3 pr-9 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900"
          >
            <option value="">جميع الحالات</option>
            <option value="قيد التنفيذ">قيد التنفيذ</option>
            <option value="تم الانجاز">تم الانجاز</option>
            <option value="مؤجل">مؤجل</option>
            <option value="متأخر">متأخر</option>
          </select>

          <select
            value={priFilter}
            onChange={(e) => setPriFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900"
          >
            <option value="">جميع الأولويات</option>
            <option value="A">أولوية A (حرجة)</option>
            <option value="B">أولوية B (عالية)</option>
            <option value="C">أولوية C (متوسطة)</option>
            <option value="D">أولوية D (منخفضة)</option>
          </select>

          {(search || statusFilter || priFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPriFilter('');
              }}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="مسح الفلاتر"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          id="add-commitment-btn"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold shadow-md shadow-amber-100 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة التزام مالي جديد</span>
        </button>
      </div>

      {/* Commitments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm min-w-[820px] print:min-w-0">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-4 w-12 text-center">إنجاز</th>
                <th className="py-3.5 px-4">المعرف</th>
                <th className="py-3.5 px-4">الالتزام / الجهة</th>
                <th className="py-3.5 px-4">المبلغ المطلوب</th>
                <th className="py-3.5 px-4">الأهمية</th>
                <th className="py-3.5 px-4">تاريخ الاستحقاق</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">الوصف والملاحظات</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredCommitments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    لا توجد التزامات مالية مطابقة.
                  </td>
                </tr>
              ) : (
                filteredCommitments.map((c) => {
                  const isCompleted = c.status === 'تم الانجاز';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleComplete(c)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                          }`}
                          title={isCompleted ? 'تم السداد (انقر للإلغاء)' : 'انقر لتعيين تم السداد'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-amber-700 dark:text-amber-300">
                        {c.id}
                      </td>
                      <td className={`py-3 px-4 font-bold text-slate-900 dark:text-slate-100 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {c.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                        <span className={isCompleted ? 'text-slate-400' : 'text-rose-600'}>
                          {formatCurrency(c.amount)} ريال
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            c.pri === 'A'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : c.pri === 'B'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          أولوية {c.pri}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {c.due || 'غير محدد'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.status === 'متأخر'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" title={c.desc}>
                        {c.desc || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="تعديل الالتزام"
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`هل تريد بالتأكيد حذف الالتزام ${c.name}؟`)) {
                                onDeleteCommitment(c.id);
                              }
                            }}
                            title="حذف الالتزام"
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CommitmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveCommitment}
        editingCommitment={editingCommitment}
        existingCommitments={commitments}
      />
    </div>
  );
};
