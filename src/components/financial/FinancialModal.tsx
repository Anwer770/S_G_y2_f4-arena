import React, { useState, useEffect, useMemo } from 'react';
import { FinancialTransaction } from '../../types';
import { generateNextTransactionId } from '../../utils/financial';
import { calculateArabicDay } from '../../utils/formatters';
import {
  X,
  Save,
  Calendar,
  DollarSign,
  FileText,
  Hash,
  Layers,
  CreditCard,
  Building,
  User,
  Check,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { getMovementBadgeStyle, getImportanceBadgeStyle } from '../../data/defaultFinancial';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txn: FinancialTransaction) => void;
  editingTransaction?: FinancialTransaction | null;
  existingTransactions: FinancialTransaction[];
  movements: string[];
  restrictions: string[];
  movementTypes: string[];
  importanceList: string[];
  categoryAccounts: string[];
  restrictionAccounts: string[];
  accountNames: string[];
  onAddOption?: (type: 'category' | 'account' | 'restriction' | 'movementType' | 'restrictionAccount' | 'accountName', value: string) => void;
}

export const FinancialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  existingTransactions,
  movements,
  restrictions,
  movementTypes,
  importanceList,
  categoryAccounts,
  restrictionAccounts,
  accountNames,
  onAddOption,
}) => {
  const [id, setId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [day, setDay] = useState('');
  const [importance, setImportance] = useState('√');
  const [movement, setMovement] = useState('ايرادات');
  const [restriction, setRestriction] = useState('سند قبض');
  const [movementType, setMovementType] = useState('نقدا');
  const [categoryAccount, setCategoryAccount] = useState('تحصيل');
  const [restrictionAccount, setRestrictionAccount] = useState('انور مصروفات');
  const [accountName, setAccountName] = useState('');
  const [description, setDescription] = useState('');
  const [number, setNumber] = useState('');
  const [amountYER, setAmountYER] = useState<number | ''>('');
  const [amountSAR, setAmountSAR] = useState<number | ''>('');
  const [amountUSD, setAmountUSD] = useState<number | ''>('');
  const [isDraft, setIsDraft] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Search/Filter helper states for long lists
  const [accountSearch, setAccountSearch] = useState('');
  const [restAccountSearch, setRestAccountSearch] = useState('');

  // New item quick adds
  const [showAddAccountName, setShowAddAccountName] = useState(false);
  const [newAccountNameInput, setNewAccountNameInput] = useState('');
  const [showAddRestAccount, setShowAddRestAccount] = useState(false);
  const [newRestAccountInput, setNewRestAccountInput] = useState('');

  // Update day automatically whenever date changes
  useEffect(() => {
    if (date) {
      setDay(calculateArabicDay(date));
    } else {
      setDay('');
    }
  }, [date]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setId(editingTransaction.id);
      setDate(editingTransaction.date);
      setDay(editingTransaction.day || calculateArabicDay(editingTransaction.date));
      setImportance(editingTransaction.importance || '√');
      setMovement(editingTransaction.movement || 'ايرادات');
      setRestriction(editingTransaction.restriction || 'سند قبض');
      setMovementType(editingTransaction.movementType || 'نقدا');
      setCategoryAccount(editingTransaction.categoryAccount || 'تحصيل');
      setRestrictionAccount(editingTransaction.restrictionAccount || 'انور مصروفات');
      setAccountName(editingTransaction.accountName || '');
      setDescription(editingTransaction.description || '');
      setNumber(editingTransaction.number || '');
      setAmountYER(editingTransaction.amountYER || '');
      setAmountSAR(editingTransaction.amountSAR || '');
      setAmountUSD(editingTransaction.amountUSD || '');
      setIsDraft(!!editingTransaction.isDraft);
      setAttachmentUrl(editingTransaction.attachmentUrl || '');
    } else {
      const nextId = generateNextTransactionId(existingTransactions);
      const today = new Date().toISOString().split('T')[0];
      setId(nextId);
      setDate(today);
      setDay(calculateArabicDay(today));
      setImportance(importanceList[0] || '√');
      setMovement(movements[1] || 'ايرادات');
      setRestriction(restrictions[3] || 'سند قبض');
      setMovementType(movementTypes[1] || 'نقدا');
      setCategoryAccount(categoryAccounts[3] || 'تحصيل');
      setRestrictionAccount(restrictionAccounts[0] || 'انور مصروفات');
      setAccountName(accountNames[0] || '');
      setDescription('');
      // Suggest next number
      const nextNum = (existingTransactions.length + 851).toString();
      setNumber(nextNum);
      setAmountYER('');
      setAmountSAR(0);
      setAmountUSD(0);
      setIsDraft(false);
      setAttachmentUrl('');
    }
    setError(null);
    setShowAddAccountName(false);
    setShowAddRestAccount(false);
    setAccountSearch('');
    setRestAccountSearch('');
  }, [isOpen, editingTransaction, existingTransactions, movements, restrictions, movementTypes, importanceList, categoryAccounts, restrictionAccounts, accountNames]);

  const filteredAccountNames = useMemo(() => {
    if (!accountSearch.trim()) return accountNames;
    return accountNames.filter((a) => a.toLowerCase().includes(accountSearch.toLowerCase()));
  }, [accountNames, accountSearch]);

  const filteredRestrictionAccounts = useMemo(() => {
    if (!restAccountSearch.trim()) return restrictionAccounts;
    return restrictionAccounts.filter((a) => a.toLowerCase().includes(restAccountSearch.toLowerCase()));
  }, [restrictionAccounts, restAccountSearch]);

  const handleAddNewAccountName = () => {
    const trimmed = newAccountNameInput.trim();
    if (!trimmed) return;
    if (onAddOption) {
      onAddOption('accountName', trimmed);
    }
    setAccountName(trimmed);
    setNewAccountNameInput('');
    setShowAddAccountName(false);
  };

  const handleAddNewRestAccount = () => {
    const trimmed = newRestAccountInput.trim();
    if (!trimmed) return;
    if (onAddOption) {
      onAddOption('restrictionAccount', trimmed);
    }
    setRestrictionAccount(trimmed);
    setNewRestAccountInput('');
    setShowAddRestAccount(false);
  };

  const handleSubmit = (e?: React.FormEvent, asDraft = false) => {
    if (e) e.preventDefault();

    const yer = Number(amountYER) || 0;
    const sar = Number(amountSAR) || 0;
    const usd = Number(amountUSD) || 0;

    if (!asDraft && yer <= 0 && sar <= 0 && usd <= 0) {
      setError('يجب إدخال مبلغ واحد على الأقل بقيمة موجبة (ريال يمني، سعودي، أو دولار).');
      return;
    }

    if (yer < 0 || sar < 0 || usd < 0) {
      setError('لا يُسمح بالمبالغ السالبة في الإدخال المباشر.');
      return;
    }

    if (!accountName.trim()) {
      setError('يرجى اختيار أو تحديد اسم الحساب.');
      return;
    }

    if (!number.trim()) {
      setError('يرجى إدخال رقم السند أو المرجع.');
      return;
    }

    const payload: FinancialTransaction = {
      id: id || generateNextTransactionId(existingTransactions),
      day: day || calculateArabicDay(date),
      date,
      importance,
      movement,
      restriction,
      movementType,
      categoryAccount,
      restrictionAccount,
      accountName: accountName.trim(),
      description: description.trim(),
      number: number.trim(),
      amountYER: yer,
      amountSAR: sar,
      amountUSD: usd,
      isDraft: typeof asDraft === 'boolean' ? asDraft : isDraft,
      attachmentUrl: attachmentUrl.trim() || undefined,
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  const movementBadge = getMovementBadgeStyle(movement);
  const importanceBadge = getImportanceBadgeStyle(importance);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 dark:bg-slate-900/10 text-emerald-400 font-mono font-bold text-sm">
              {id}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {editingTransaction ? 'تعديل قيد في السجل المالي' : 'إضافة قيد / عملية مالية جديدة'}
              </h2>
              <p className="text-xs text-slate-300">
                تسجيل الحركات المالية متعددة العملات والربط المحاسبي الدقيق
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-white rounded-full hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Top Indicators & Auto Calculated Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* ID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                المعرف الفريد (ID)
              </label>
              <div className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-black text-indigo-700 dark:text-indigo-300">
                {id}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                التاريخ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Day (Auto-calculated) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                اليوم (محسوب تلقائياً)
              </label>
              <div className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>{day || 'غير محدد'}</span>
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                الرقم (رقم السند / المرجع) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="مثال: 851"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Core Movement & Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Movement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                الحركة <span className="text-rose-500">*</span>
              </label>
              <select
                value={movement}
                onChange={(e) => setMovement(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {movements.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${movementBadge.bg} ${movementBadge.text} ${movementBadge.border}`}>
                  المعاينة: {movement}
                </span>
              </div>
            </div>

            {/* Importance */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                درجة الأهمية / الحالة <span className="text-rose-500">*</span>
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {importanceList.map((imp) => (
                  <option key={imp} value={imp}>
                    {imp}
                  </option>
                ))}
              </select>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${importanceBadge.bg} ${importanceBadge.text} ${importanceBadge.border}`}>
                  الحالة: {importance}
                </span>
              </div>
            </div>

            {/* Restriction (القيد) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                القيد / نوع السند <span className="text-rose-500">*</span>
              </label>
              <select
                value={restriction}
                onChange={(e) => setRestriction(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {restrictions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Movement Type (طريقة الدفع) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                طريقة الدفع (Movement Type) <span className="text-rose-500">*</span>
              </label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {movementTypes.map((mt) => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Account (فئة الحساب) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                فئة الحساب (Category Account) <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryAccount}
                onChange={(e) => setCategoryAccount(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {categoryAccounts.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Restriction Account (حساب التقييد) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  حساب التقييد <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddRestAccount(!showAddRestAccount)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ إضافة خيار</span>
                </button>
              </div>

              {showAddRestAccount ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRestAccountInput}
                    onChange={(e) => setNewRestAccountInput(e.target.value)}
                    placeholder="اسم حساب التقييد الجديد..."
                    className="w-full px-2.5 py-1.5 border border-indigo-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewRestAccount}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                  >
                    حفظ
                  </button>
                </div>
              ) : (
                <select
                  value={restrictionAccount}
                  onChange={(e) => setRestrictionAccount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {restrictionAccounts.map((ra) => (
                    <option key={ra} value={ra}>
                      {ra}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Section 3: Account Name (اسم الحساب - 110+ items) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>اسم الحساب / العميل / الصيدلية / الجهة</span>
                <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddAccountName(!showAddAccountName)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ إضافة اسم حساب جديد</span>
              </button>
            </div>

            {showAddAccountName && (
              <div className="flex gap-2 p-2 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl">
                <input
                  type="text"
                  value={newAccountNameInput}
                  onChange={(e) => setNewAccountNameInput(e.target.value)}
                  placeholder="أدخل اسم الحساب أو الصيدلية الجديد..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddNewAccountName}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  إضافة للقائمة
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quick Search inside list */}
              <div className="sm:col-span-1">
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="فلترة الأسماء (مثال: عصام، صيدلية...)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Selection */}
              <div className="sm:col-span-2">
                <select
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- اختر اسم الحساب ({filteredAccountNames.length} خيار) --</option>
                  {filteredAccountNames.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Multi-Currency Amounts (YER, SAR, USD) */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black tracking-wide">المبالغ متعددة العملات (موجبة فقط)</h3>
              </div>
              <span className="text-xs text-slate-300">
                (يجب إدخال مبلغ واحد على الأقل)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Amount YER */}
              <div className="bg-white/5 dark:bg-slate-900/5 p-3.5 rounded-xl border border-white/10 space-y-1.5">
                <label className="block text-xs font-bold text-emerald-300">
                  المبلغ (ريال يمني - YER)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountYER}
                    onChange={(e) => setAmountYER(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/10 dark:bg-slate-900/10 border border-white/20 rounded-xl text-lg font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 dark:text-slate-500 font-bold">YER</span>
                </div>
              </div>

              {/* Amount SAR */}
              <div className="bg-white/5 dark:bg-slate-900/5 p-3.5 rounded-xl border border-white/10 space-y-1.5">
                <label className="block text-xs font-bold text-amber-300">
                  المبلغ (ريال سعودي - SAR)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountSAR}
                    onChange={(e) => setAmountSAR(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/10 dark:bg-slate-900/10 border border-white/20 rounded-xl text-lg font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 dark:text-slate-500 font-bold">SAR</span>
                </div>
              </div>

              {/* Amount USD */}
              <div className="bg-white/5 dark:bg-slate-900/5 p-3.5 rounded-xl border border-white/10 space-y-1.5">
                <label className="block text-xs font-bold text-blue-300">
                  المبلغ (دولار أمريكي - USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/10 dark:bg-slate-900/10 border border-white/20 rounded-xl text-lg font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 dark:text-slate-500 font-bold">USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Attachment & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                رقم المستند / السند الورقي أو رابط المرفق (اختياري)
              </label>
              <input
                type="text"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="مثال: سند استلام ورقي رقم #4192 أو رابط المستند..."
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                الوصف / البيان والشرح التفصيلي (اختياري)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب تفاصيل القيد أو الحركة وملاحظات السداد..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="حفظ القيد كمسودة مؤقتة لمراجعتها واعتمادها لاحقاً"
            >
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>حفظ كمسودة</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingTransaction ? 'حفظ التعديلات' : 'تسجيل القيد في السجل'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
