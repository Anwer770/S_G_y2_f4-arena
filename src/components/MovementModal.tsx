import React, { useState, useEffect, useMemo } from 'react';
import { MovementRecord, MovementType, Product } from '../types';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { calculateArabicDay } from '../utils/formatters';
import { getNextSubId, normalizeArabicDigits } from '../utils/stock';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: MovementRecord) => void;
  editingRecord: MovementRecord | null;
  products: Product[];
  records: MovementRecord[];
  categories: string[];
  statuses: string[];
  seq: { IN: number; OUT: number };
}

interface ItemLine {
  id: string;
  productName: string;
  quantity: string;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRecord,
  products,
  records,
  categories,
  statuses,
  seq,
}) => {
  // Form Fields
  const [movementType, setMovementType] = useState<MovementType>(
    editingRecord ? editingRecord.movementType : 'صرف'
  );
  const [subId, setSubId] = useState(editingRecord ? editingRecord.subId : '');
  const [mainId, setMainId] = useState(editingRecord ? editingRecord.mainId : '');
  const [date, setDate] = useState(
    editingRecord ? editingRecord.date : new Date().toISOString().split('T')[0]
  );
  const [beneficiary, setBeneficiary] = useState(
    editingRecord ? editingRecord.beneficiary : ''
  );
  const [description, setDescription] = useState(
    editingRecord ? editingRecord.description : ''
  );
  const [category, setCategory] = useState(
    editingRecord ? editingRecord.category : categories[0] || 'مبيعات'
  );
  const [status, setStatus] = useState(
    editingRecord ? editingRecord.status : statuses[0] || 'تم التنفيذ'
  );
  const [note, setNote] = useState(editingRecord?.note || '');

  // Item Lines
  const [itemLines, setItemLines] = useState<ItemLine[]>([]);
  const [formError, setFormError] = useState('');
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  // Active products for select dropdown
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.isActive);
  }, [products]);

  // Initial populate or auto-generate subId
  useEffect(() => {
    if (editingRecord) {
      setMovementType(editingRecord.movementType);
      setSubId(editingRecord.subId);
      setMainId(editingRecord.mainId);
      setDate(editingRecord.date);
      setBeneficiary(editingRecord.beneficiary);
      setDescription(editingRecord.description);
      setCategory(editingRecord.category);
      setStatus(editingRecord.status);
      setNote(editingRecord.note || '');

      const lines: ItemLine[] = Object.entries(editingRecord.items || {}).map(
        ([name, qty], idx) => ({
          id: `line-${idx}-${Date.now()}`,
          productName: name,
          quantity: String(qty),
        })
      );
      setItemLines(lines.length > 0 ? lines : []);
    } else {
      // New Movement: auto sequence ID
      const { subId: generatedSubId } = getNextSubId(movementType, records, seq);
      setSubId(generatedSubId);
      setMainId(`Categ-${1000 + records.length + 1}`);
      setDate(new Date().toISOString().split('T')[0]);
      setBeneficiary('');
      setDescription('');
      setCategory(categories[0] || 'مبيعات');
      setStatus(statuses[0] || 'تم التنفيذ');
      setNote('');

      // Start with 1 empty item line
      if (activeProducts.length > 0) {
        setItemLines([
          {
            id: `line-0-${Date.now()}`,
            productName: activeProducts[0].name,
            quantity: '1',
          },
        ]);
      }
    }
  }, [editingRecord, movementType, isOpen]);

  // Beneficiary Autocomplete suggestions
  const beneficiarySuggestions = useMemo(() => {
    if (!beneficiary.trim()) return [];
    const query = beneficiary.toLowerCase().trim();
    const set = new Set<string>();
    for (const r of records) {
      if (r.beneficiary && r.beneficiary.toLowerCase().includes(query)) {
        set.add(r.beneficiary.trim());
      }
    }
    return Array.from(set).slice(0, 5);
  }, [beneficiary, records]);

  // Handle Movement Type toggle
  const handleTypeChange = (newType: MovementType) => {
    setMovementType(newType);
    if (!editingRecord) {
      const { subId: nextId } = getNextSubId(newType, records, seq);
      setSubId(nextId);
    }
  };

  // Add Item Line
  const handleAddItemLine = () => {
    const nextProduct =
      activeProducts.find((p) => !itemLines.some((l) => l.productName === p.name)) ||
      activeProducts[0];

    setItemLines([
      ...itemLines,
      {
        id: `line-${Date.now()}-${Math.random()}`,
        productName: nextProduct ? nextProduct.name : '',
        quantity: '1',
      },
    ]);
  };

  // Remove Item Line
  const handleRemoveItemLine = (id: string) => {
    setItemLines(itemLines.filter((l) => l.id !== id));
  };

  // Update Item Line
  const handleUpdateItemLine = (
    id: string,
    field: 'productName' | 'quantity',
    value: string
  ) => {
    setItemLines(
      itemLines.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  // Total Units in Modal
  const totalUnits = useMemo(() => {
    return itemLines.reduce((sum, l) => {
      const q = parseFloat(normalizeArabicDigits(l.quantity)) || 0;
      return sum + q;
    }, 0);
  }, [itemLines]);

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanSubId = subId.trim();
    if (!cleanSubId) {
      setFormError('يرجى تحديد الرقم الفرعي للسند (Sub_ID).');
      return;
    }

    // Check duplicate SubId if new or renamed
    if (!editingRecord || cleanSubId !== editingRecord.subId) {
      const exists = records.some((r) => r.subId === cleanSubId);
      if (exists) {
        setFormError(`الرقم الفرعي "${cleanSubId}" مستخدم بالفعل في حركة أخرى.`);
        return;
      }
    }

    const cleanBeneficiary = beneficiary.trim();
    if (!cleanBeneficiary) {
      setFormError('يرجى إدخال اسم المستفيد أو العميل.');
      return;
    }

    // Process item quantities
    const itemsMap: Record<string, number> = {};
    for (const l of itemLines) {
      if (!l.productName) continue;
      const numStr = normalizeArabicDigits(l.quantity.trim());
      const qty = parseFloat(numStr);
      if (isNaN(qty) || qty <= 0) {
        setFormError(`يرجى إدخال كمية صحيحة أكبر من الصفر للصنف "${l.productName}".`);
        return;
      }
      itemsMap[l.productName] = (itemsMap[l.productName] || 0) + qty;
    }

    // If no items are entered, trigger confirmation (for historical records without numerical quantities)
    if (Object.keys(itemsMap).length === 0 && !showEmptyWarning) {
      setShowEmptyWarning(true);
      return;
    }

    const newRecord: MovementRecord = {
      id: cleanSubId,
      mainId: mainId.trim() || `Categ-${1000 + records.length + 1}`,
      subId: cleanSubId,
      date: date || new Date().toISOString().split('T')[0],
      beneficiary: cleanBeneficiary,
      description: description.trim() || `حركة ${movementType} - ${cleanBeneficiary}`,
      movementType,
      status: status.trim() || 'تم التنفيذ',
      category: category.trim() || 'مبيعات',
      items: itemsMap,
      note: note.trim() || undefined,
      createdAt: editingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newRecord);
    onClose();
  };

  if (!isOpen) return null;

  const dayName = calculateArabicDay(date);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                movementType === 'توريد' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {movementType === 'توريد' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {editingRecord ? 'تعديل حركة مسجلة' : 'تسجيل حركة صرف أو توريد جديدة'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {movementType === 'توريد' ? 'إدخال شحنة / بضاعة واردة للمستودع' : 'صرف بضاعة / عينات / مبيعات لعميل'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {showEmptyWarning && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 rounded-xl text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
                <span>تنبيه: لم يتم إضافة أي أصناف أو كميات لهذه الحركة!</span>
              </div>
              <p className="text-xs text-amber-900">
                هل تريد حفظ الحركة بدون كميات عددية (مثل الحركات الوصفية التاريخية)؟
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  نعم، حفظ بدون كميات
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmptyWarning(false)}
                  className="px-3 py-1 bg-white dark:bg-slate-900 border border-amber-300 text-amber-900 rounded-lg font-bold cursor-pointer"
                >
                  الرجوع لإضافة أصناف
                </button>
              </div>
            </div>
          )}

          {/* 1. Movement Type Switcher */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              نوع الحركة <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('صرف')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                  movementType === 'صرف'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>صرف (OUT - خروج من المستودع)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('توريد')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                  movementType === 'توريد'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>توريد (IN - دخول للمستودع)</span>
              </button>
            </div>
          </div>

          {/* 2. Sub_ID, Main_ID, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                الرقم الفرعي (Sub_ID) <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={subId}
                onChange={(e) => setSubId(e.target.value)}
                placeholder="IN-0004 أو OUT-0299"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">الرقم الرئيسي (Main_ID)</label>
              <input
                type="text"
                value={mainId}
                onChange={(e) => setMainId(e.target.value)}
                placeholder="Categ-1001"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                التاريخ <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                  required
                />
              </div>
              {dayName && (
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block font-semibold">
                  اليوم: {dayName}
                </span>
              )}
            </div>
          </div>

          {/* 3. Beneficiary with Autocomplete */}
          <div className="relative">
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
              اسم المستفيد / العميل / المورد <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="اسم الصيدلية، المركز، المورد، أو الشخص..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:bg-white dark:focus:bg-slate-900"
                required
              />
            </div>

            {/* Suggestions list */}
            {beneficiarySuggestions.length > 0 && beneficiary !== beneficiarySuggestions[0] && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1 space-y-0.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 px-2 py-0.5 block">اقتراحات سابقة:</span>
                {beneficiarySuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBeneficiary(s)}
                    className="w-full text-right px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">الفئة</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Description & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">البيان / الوصف</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف تفصيلي للعملية..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">ملاحظة إضافية (اختياري)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="رقم سند يدوي، اسم المندوب..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          {/* 6. Dynamic Multi-Product Items Lines Builder */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  الأصناف والكميات المدرجة بالسند ({itemLines.length})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">
                  إجمالي الوحدات: <strong className="text-blue-700 dark:text-blue-300">{totalUnits}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleAddItemLine}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صنف</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto p-1 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {itemLines.length === 0 ? (
                <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                  لم يتم إضافة أصناف بعد. انقر "إضافة صنف" لتحديد الأصناف والكميات.
                </div>
              ) : (
                itemLines.map((line, idx) => (
                  <div
                    key={line.id}
                    className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <span className="w-5 text-center font-mono font-bold text-slate-400 dark:text-slate-500 text-xs">
                      {idx + 1}
                    </span>

                    {/* Product select */}
                    <div className="flex-1">
                      <select
                        value={line.productName}
                        onChange={(e) =>
                          handleUpdateItemLine(line.id, 'productName', e.target.value)
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 truncate"
                        required
                      >
                        <option value="">-- اختر الصنف --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} {!p.isActive ? '(موقوف)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity input */}
                    <div className="w-24">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={line.quantity}
                        onChange={(e) =>
                          handleUpdateItemLine(line.id, 'quantity', e.target.value)
                        }
                        placeholder="الكمية"
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 text-center"
                        required
                      />
                    </div>

                    {/* Delete Line */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItemLine(line.id)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="حذف هذا السطر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0D9488] hover:bg-[#059669] text-white font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              {editingRecord ? 'حفظ التعديلات' : 'تسجيل الحركة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
