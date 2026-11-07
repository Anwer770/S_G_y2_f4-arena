import React, { useState, useMemo } from 'react';
import { Product, ProductStock } from '../types';
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Eye,
  Power,
  X,
  RotateCcw,
} from 'lucide-react';
import { formatNumberLatin } from '../utils/formatters';

interface InventoryViewProps {
  products: Product[];
  stocks: ProductStock[];
  onAddProduct: (product: Product) => void;
  onEditProduct: (oldName: string, updatedProduct: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onToggleActive: (product: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  stocks,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleActive,
}) => {
  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive' | 'negative'>('all');
  const [sortColumn, setSortColumn] = useState<'name' | 'currentStock' | 'totalIn' | 'totalOut' | 'openingStock'>('currentStock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formOpening, setFormOpening] = useState('0');
  const [formUnit, setFormUnit] = useState('حبة');
  const [formDesc, setFormDesc] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormOpening('0');
    setFormUnit('حبة');
    setFormDesc('');
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormOpening(String(prod.openingStock || 0));
    setFormUnit(prod.unit || 'حبة');
    setFormDesc(prod.description || '');
    setFormIsActive(prod.isActive ?? true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const trimmedName = formName.trim();

    if (!trimmedName) {
      setFormError('يرجى إدخال اسم الصنف.');
      return;
    }

    // Check duplicate name
    const existing = products.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing && (!editingProduct || existing.id !== editingProduct.id)) {
      setFormError('يوجد صنف مسجل بالفعل بهذا الاسم، يرجى اختيار اسم فريد.');
      return;
    }

    const opening = parseFloat(formOpening) || 0;

    if (editingProduct) {
      // Edit existing product (with automatic cascade rename if name changed)
      const updated: Product = {
        ...editingProduct,
        name: trimmedName,
        openingStock: opening,
        unit: formUnit.trim() || 'حبة',
        description: formDesc.trim() || undefined,
        isActive: formIsActive,
      };
      onEditProduct(editingProduct.name, updated);
    } else {
      // Add new product
      const newProd: Product = {
        id: `PROD-${String(products.length + 1).padStart(3, '0')}`,
        name: trimmedName,
        openingStock: opening,
        unit: formUnit.trim() || 'حبة',
        description: formDesc.trim() || undefined,
        isActive: formIsActive,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddProduct(newProd);
    }

    setIsModalOpen(false);
  };

  // Stock Map for quick lookup
  const stockMap = useMemo(() => {
    const map: Record<string, ProductStock> = {};
    for (const s of stocks) {
      map[s.name] = s;
    }
    return map;
  }, [stocks]);

  // Filtered & Sorted Stocks List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        if (!p.name.toLowerCase().includes(query)) return false;
      }

      const st = stockMap[p.name] || { currentStock: p.openingStock, totalIn: 0, totalOut: 0 };

      if (filterType === 'active' && !p.isActive) return false;
      if (filterType === 'inactive' && p.isActive) return false;
      if (filterType === 'negative' && st.currentStock >= 0) return false;

      return true;
    });
  }, [products, stockMap, search, filterType]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const stA = stockMap[a.name] || { currentStock: a.openingStock, totalIn: 0, totalOut: 0, openingStock: a.openingStock };
      const stB = stockMap[b.name] || { currentStock: b.openingStock, totalIn: 0, totalOut: 0, openingStock: b.openingStock };

      let valA: any = a.name;
      let valB: any = b.name;

      if (sortColumn === 'currentStock') {
        valA = stA.currentStock;
        valB = stB.currentStock;
      } else if (sortColumn === 'totalIn') {
        valA = stA.totalIn;
        valB = stB.totalIn;
      } else if (sortColumn === 'totalOut') {
        valA = stA.totalOut;
        valB = stB.totalOut;
      } else if (sortColumn === 'openingStock') {
        valA = a.openingStock || 0;
        valB = b.openingStock || 0;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredProducts, stockMap, sortColumn, sortOrder]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    let totalItems = products.length;
    let activeItems = products.filter((p) => p.isActive).length;
    let negativeItems = 0;
    let totalStockUnits = 0;

    for (const s of stocks) {
      totalStockUnits += s.currentStock;
      if (s.currentStock < 0) negativeItems += 1;
    }

    return { totalItems, activeItems, negativeItems, totalStockUnits };
  }, [products, stocks]);

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Inventory Summary Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">إجمالي الأصناف</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">{stats.totalItems} صنف</div>
          <span className="text-xs text-slate-400 dark:text-slate-500">مسجلة في قاعدة البيانات</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">الأصناف النشطة</span>
          <div className="text-xl font-black text-[#0D9488] dark:text-emerald-400 font-mono">{stats.activeItems} نشط</div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400">متاحة في حركات التوريد والصرف</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${
          stats.negativeItems > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">أصناف برصيد سالب</span>
          <div className={`text-xl font-black font-mono ${stats.negativeItems > 0 ? 'text-amber-800' : 'text-slate-700'}`}>
            {stats.negativeItems} صنف
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">تجاوز الصرف كميات التوريد</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">صافي الرصيد المخزني</span>
          <div className="text-xl font-black text-[#3B82F6] dark:text-blue-400 font-mono">
            {formatNumberLatin(stats.totalStockUnits)}
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400">إجمالي الوحدات المتوفرة</span>
        </div>
      </div>

      {/* 2. Search & Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#0D9488]" />
              <span>إدارة الأصناف والمخزون الحي</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تتبع الرصيد الافتتاحي والتوريد والصرف والرصيد الحالي لحظياً لكل صنف
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0D9488] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف جديد</span>
          </button>
        </div>

        {/* Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الأصناف (62 صنفاً)..."
              className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكل ({products.length})
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              النشطة ({stats.activeItems})
            </button>
            <button
              onClick={() => setFilterType('negative')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'negative' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              سالب الرصيد ({stats.negativeItems})
            </button>
            <button
              onClick={() => setFilterType('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'inactive' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الموقوفة ({products.length - stats.activeItems})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Products Stock Table (FR-04, FR-05, FR-10) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-right text-xs border-collapse min-w-[820px] print:min-w-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold select-none shadow-2xs">
                <th className="py-2.5 px-3 w-10 text-center sticky right-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">#</th>
                <th
                  onClick={() => {
                    setSortColumn('name');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  اسم الصنف {sortColumn === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-2.5">الوحدة</th>
                <th
                  onClick={() => {
                    setSortColumn('openingStock');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-2.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors text-left"
                >
                  الرصيد الافتتاحي {sortColumn === 'openingStock' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => {
                    setSortColumn('totalIn');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-2.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors text-left text-emerald-800 dark:text-emerald-200"
                >
                  إجمالي التوريد (IN) {sortColumn === 'totalIn' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => {
                    setSortColumn('totalOut');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-2.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors text-left text-rose-800 dark:text-rose-200"
                >
                  إجمالي الصرف (OUT) {sortColumn === 'totalOut' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => {
                    setSortColumn('currentStock');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-2.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors text-left"
                >
                  الرصيد الحالي {sortColumn === 'currentStock' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-2.5 text-center">الحالة</th>
                <th className="py-2.5 px-3 text-center sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] w-24">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {sortedProducts.map((p, idx) => {
                const st = stockMap[p.name] || {
                  currentStock: p.openingStock,
                  totalIn: 0,
                  totalOut: 0,
                  movementCount: 0,
                };

                const isNegative = st.currentStock < 0;
                const isZero = st.currentStock === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-[12px] group">
                    <td className="py-2 px-3 text-center text-slate-400 dark:text-slate-500 font-mono font-bold sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                      {idx + 1}
                    </td>

                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">{p.description}</div>
                      )}
                    </td>

                    <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 text-xs">
                      {p.unit || 'حبة'}
                    </td>

                    <td className="py-2 px-2.5 text-left font-mono text-slate-700 dark:text-slate-200">
                      {formatNumberLatin(p.openingStock)}
                    </td>

                    <td className="py-2 px-2.5 text-left font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      +{formatNumberLatin(st.totalIn)}
                    </td>

                    <td className="py-2 px-2.5 text-left font-mono font-bold text-rose-700 dark:text-rose-300">
                      −{formatNumberLatin(st.totalOut)}
                    </td>

                    {/* FR-10: Color coded balance */}
                    <td className="py-2 px-2.5 text-left font-mono font-black">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${
                          isNegative
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : isZero
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {formatNumberLatin(st.currentStock)} {p.unit || 'حبة'}
                      </span>
                    </td>

                    {/* Active / Inactive status */}
                    <td className="py-2 px-2.5 text-center">
                      <button
                        onClick={() => onToggleActive(p)}
                        className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-colors border ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="انقر لتفعيل أو إيقاف الصنف"
                      >
                        {p.isActive ? 'نشط' : 'موقوف'}
                      </button>
                    </td>

                    {/* Actions: Edit / Delete */}
                    <td className="py-2 px-3 text-center sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors cursor-pointer"
                          title="تعديل بيانات الصنف / إعادة التسمية"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteProduct(p)}
                          disabled={st.movementCount > 0}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title={
                            st.movementCount > 0
                              ? 'لا يمكن حذف صنف مرتبط بحركات سابقة (يمكنك إيقافه بدلاً من ذلك)'
                              : 'حذف الصنف'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add / Edit Product Modal (FR-06, FR-07, FR-09) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>{editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف مخزني جديد'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  اسم الصنف <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: شامبو القمح أو سيروم فيتامين سي..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                {editingProduct && formName !== editingProduct.name && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    ملاحظة: إعادة التسمية ستحدّث الاسم تلقائياً في كافة الحركات التاريخية المسجلة.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">الرصيد الافتتاحي</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formOpening}
                    onChange={(e) => setFormOpening(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">وحدة القياس</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="حبة، كرتون، باكت..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">الوصف أو الملاحظات</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="تفاصيل اختيارية حول الصنف..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prodActiveToggle"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
                <label htmlFor="prodActiveToggle" className="text-slate-700 dark:text-slate-200 font-semibold cursor-pointer">
                  صنف نشط (يظهر في القوائم المنسدلة لإضافة حركات جديدة)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D9488] hover:bg-[#059669] text-white font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة الصنف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
