import React, { useState, useMemo } from 'react';
import { MovementRecord, Product, ProductStock } from '../types';
import {
  PieChart,
  User,
  Package,
  Calendar,
  Printer,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  RotateCcw,
  Search,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  calculateArabicDay,
  formatNumberLatin,
  getCategoryBadgeStyle,
  getMovementTypeStyle,
  getStatusStyle,
} from '../utils/formatters';
import { exportRecordsToExcel } from '../utils/excel';

interface ReportsViewProps {
  records: MovementRecord[];
  products: Product[];
  stocks: ProductStock[];
  categories: string[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  products,
  stocks,
  categories,
}) => {
  const [reportType, setReportType] = useState<'beneficiary' | 'product' | 'period'>('beneficiary');

  // --- Beneficiary Report State ---
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('');
  const [benSearch, setBenSearch] = useState('');
  const [benStartDate, setBenStartDate] = useState('');
  const [benEndDate, setBenEndDate] = useState('');
  const [benCategory, setBenCategory] = useState('');
  const [benMovementType, setBenMovementType] = useState('');

  // --- Product Movement Card State ---
  const [selectedProduct, setSelectedProduct] = useState<string>(
    products.length > 0 ? products[0].name : ''
  );
  const [prodStartDate, setProdStartDate] = useState('');
  const [prodEndDate, setProdEndDate] = useState('');

  // Unique beneficiaries list
  const uniqueBeneficiaries = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.beneficiary) set.add(r.beneficiary.trim());
    }
    return Array.from(set).sort();
  }, [records]);

  // Default select first beneficiary if none selected
  const activeBeneficiary = selectedBeneficiary || (uniqueBeneficiaries[0] || '');

  // 1. Filtered records for Beneficiary Report (FR-25, FR-26)
  const beneficiaryRecords = useMemo(() => {
    if (!activeBeneficiary) return [];

    return records.filter((r) => {
      if (r.beneficiary.trim() !== activeBeneficiary.trim()) return false;
      if (benStartDate && r.date < benStartDate) return false;
      if (benEndDate && r.date > benEndDate) return false;
      if (benCategory && r.category !== benCategory) return false;
      if (benMovementType && r.movementType !== benMovementType) return false;
      return true;
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [records, activeBeneficiary, benStartDate, benEndDate, benCategory, benMovementType]);

  // Beneficiary Summary & Product Breakdown (FR-27)
  const beneficiarySummary = useMemo(() => {
    let totalInUnits = 0;
    let totalOutUnits = 0;
    const productBreakdown: Record<string, { inQty: number; outQty: number; net: number }> = {};

    for (const r of beneficiaryRecords) {
      const isInput = r.movementType === 'توريد';
      for (const [pName, qty] of Object.entries(r.items || {})) {
        const q = Number(qty) || 0;
        if (q <= 0) continue;

        if (!productBreakdown[pName]) {
          productBreakdown[pName] = { inQty: 0, outQty: 0, net: 0 };
        }

        if (isInput) {
          productBreakdown[pName].inQty += q;
          totalInUnits += q;
        } else {
          productBreakdown[pName].outQty += q;
          totalOutUnits += q;
        }
        productBreakdown[pName].net = productBreakdown[pName].inQty - productBreakdown[pName].outQty;
      }
    }

    return {
      totalRecords: beneficiaryRecords.length,
      totalInUnits,
      totalOutUnits,
      netUnits: totalInUnits - totalOutUnits,
      productBreakdown: Object.entries(productBreakdown).sort((a, b) => b[1].outQty - a[1].outQty),
    };
  }, [beneficiaryRecords]);

  // 2. Filtered records & Running Balance for Product Statement (FR-24)
  const productStatement = useMemo(() => {
    if (!selectedProduct) return { records: [], opening: 0, totalIn: 0, totalOut: 0, finalBalance: 0 };

    const prodObj = products.find((p) => p.name === selectedProduct);
    const opening = Number(prodObj?.openingStock) || 0;

    const matchedRecords = records.filter((r) => {
      if (!r.items || !(selectedProduct in r.items)) return false;
      if (prodStartDate && r.date < prodStartDate) return false;
      if (prodEndDate && r.date > prodEndDate) return false;
      return true;
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let running = opening;
    let totalIn = 0;
    let totalOut = 0;

    const statementRows = matchedRecords.map((r) => {
      const qty = Number(r.items[selectedProduct]) || 0;
      const isInput = r.movementType === 'توريد';

      if (isInput) {
        running += qty;
        totalIn += qty;
      } else {
        running -= qty;
        totalOut += qty;
      }

      return {
        ...r,
        quantity: qty,
        isInput,
        balanceAfter: running,
      };
    });

    return {
      records: statementRows,
      opening,
      totalIn,
      totalOut,
      finalBalance: running,
    };
  }, [records, products, selectedProduct, prodStartDate, prodEndDate]);

  // 3. Periodical Statement (Year/Month aggregation) (FR-23, FR-28)
  const periodicData = useMemo(() => {
    const monthMap: Record<
      string,
      {
        period: string;
        inCount: number;
        outCount: number;
        inUnits: number;
        outUnits: number;
      }
    > = {};

    let unparsedDatesCount = 0;

    for (const r of records) {
      if (!r.date || !/^\d{4}-\d{2}/.test(r.date)) {
        unparsedDatesCount += 1;
        continue;
      }

      const period = r.date.substring(0, 7); // YYYY-MM
      if (!monthMap[period]) {
        monthMap[period] = {
          period,
          inCount: 0,
          outCount: 0,
          inUnits: 0,
          outUnits: 0,
        };
      }

      const totalItemsUnits = Object.values(r.items || {}).reduce<number>(
        (sum, q) => sum + (Number(q) || 0),
        0
      );

      if (r.movementType === 'توريد') {
        monthMap[period].inCount += 1;
        monthMap[period].inUnits += totalItemsUnits;
      } else {
        monthMap[period].outCount += 1;
        monthMap[period].outUnits += totalItemsUnits;
      }
    }

    const sortedPeriods = Object.values(monthMap).sort((a, b) =>
      b.period.localeCompare(a.period)
    );

    return { periods: sortedPeriods, unparsedDatesCount };
  }, [records]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Report Type Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#0D9488]" />
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">التقارير والكشوفات التفصيلية</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                استخراج كشوفات حساب المستفيدين وبطاقات حركة الأصناف والتقارير الدورية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-bold">
            <button
              onClick={() => setReportType('beneficiary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                reportType === 'beneficiary' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>تقرير المستفيد</span>
            </button>

            <button
              onClick={() => setReportType('product')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                reportType === 'product' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>كشف حركة صنف</span>
            </button>

            <button
              onClick={() => setReportType('period')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                reportType === 'period' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>التقرير الدوري الإجمالي</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BENEFICIARY REPORT VIEW (FR-25, FR-26, FR-27, FR-28) */}
      {/* ========================================================================= */}
      {reportType === 'beneficiary' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">تحديد المستفيد والفترة الزمنية:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الكشف</span>
                </button>
                <button
                  onClick={() => exportRecordsToExcel(beneficiaryRecords, products, `كشف_مستفيد_${activeBeneficiary}.xlsx`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">اسم المستفيد</label>
                <select
                  value={activeBeneficiary}
                  onChange={(e) => setSelectedBeneficiary(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                >
                  {uniqueBeneficiaries.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">الفئة</label>
                <select
                  value={benCategory}
                  onChange={(e) => setBenCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg"
                >
                  <option value="">جميع الفئات</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={benStartDate}
                  onChange={(e) => setBenStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={benEndDate}
                  onChange={(e) => setBenEndDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Beneficiary Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">عدد الحركات</span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {beneficiarySummary.totalRecords} حركة
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">لـ {activeBeneficiary}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">إجمالي التوريد (IN)</span>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                +{formatNumberLatin(beneficiarySummary.totalInUnits)}
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">وحدة مستلمة منه</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">إجمالي الصرف (OUT)</span>
              <div className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono">
                −{formatNumberLatin(beneficiarySummary.totalOutUnits)}
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-400">وحدة مسلمة إليه</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">صافي الحركات</span>
              <div className="text-xl font-black text-blue-900 font-mono">
                {formatNumberLatin(beneficiarySummary.netUnits)}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">فارق التوريد والصرف</span>
            </div>
          </div>

          {/* Products Breakdown Table (FR-27) */}
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#0D9488]" />
              <span>تفصيل الأصناف المسلمة / المستلمة من {activeBeneficiary}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[440px] print:min-w-0">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                    <th className="py-2.5 px-3">اسم الصنف</th>
                    <th className="py-2.5 px-3 text-left text-emerald-800 dark:text-emerald-200">الوارد منه (IN)</th>
                    <th className="py-2.5 px-3 text-left text-rose-800 dark:text-rose-200">المنصرف له (OUT)</th>
                    <th className="py-2.5 px-3 text-left">الصافي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {beneficiarySummary.productBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 dark:text-slate-500">
                        لا توجد أصناف مرتبطة بحركات هذا المستفيد في الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    beneficiarySummary.productBreakdown.map(([pName, stats]) => (
                      <tr key={pName} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{pName}</td>
                        <td className="py-2.5 px-3 text-left font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                          {stats.inQty > 0 ? `+${stats.inQty}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono text-rose-700 dark:text-rose-300 font-bold">
                          {stats.outQty > 0 ? `−${stats.outQty}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-800 dark:text-slate-200">
                          {stats.net}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chronological Movements Table */}
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>كشف الحركات التفصيلي</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[600px] print:min-w-0">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                    <th className="py-2.5 px-3">الرقم الفرعي</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">نوع الحركة</th>
                    <th className="py-2.5 px-3">البيان</th>
                    <th className="py-2.5 px-3">الفئة</th>
                    <th className="py-2.5 px-3">الأصناف والكميات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {beneficiaryRecords.map((r) => {
                    const moveStyle = getMovementTypeStyle(r.movementType);
                    const itemsEntries = Object.entries(r.items || {});
                    return (
                      <tr key={r.subId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="py-2.5 px-3 font-mono font-bold">{r.subId}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">{r.date}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${moveStyle.badge}`}>
                            {r.movementType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 max-w-xs truncate">{r.description}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getCategoryBadgeStyle(r.category)}`}>
                            {r.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {itemsEntries.map(([pName, qty]) => (
                              <span key={pName} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs px-2 py-0.5 rounded-md font-medium">
                                {pName} ×{qty}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PRODUCT MOVEMENT STATEMENT (FR-24) */}
      {/* ========================================================================= */}
      {reportType === 'product' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">تحديد الصنف والفترة:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">اختر الصنف (من 62 صنفاً)</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={prodStartDate}
                  onChange={(e) => setProdStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={prodEndDate}
                  onChange={(e) => setProdEndDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Product Balance Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">الرصيد الافتتاحي</span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {formatNumberLatin(productStatement.opening)}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">رصيد البداية</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">إجمالي الوارد (IN)</span>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                +{formatNumberLatin(productStatement.totalIn)}
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">شحنات وتوريدات</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">إجمالي المنصرف (OUT)</span>
              <div className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono">
                −{formatNumberLatin(productStatement.totalOut)}
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-400">مبيعات وتوزيع</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mb-1">الرصيد الحالي المتوفر</span>
              <div className={`text-xl font-black font-mono ${
                productStatement.finalBalance < 0 ? 'text-rose-700' : 'text-blue-900'
              }`}>
                {formatNumberLatin(productStatement.finalBalance)}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">حبة / وحدة</span>
            </div>
          </div>

          {/* Running Balance Statement Table */}
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>بطاقة حركة الصنف التفصيلية (كشف تراكمي)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[820px] print:min-w-0">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                    <th className="py-2.5 px-3">الرقم الفرعي</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">نوع الحركة</th>
                    <th className="py-2.5 px-3">المستفيد / الجهة</th>
                    <th className="py-2.5 px-3 text-left text-emerald-800 dark:text-emerald-200">وارد (+)</th>
                    <th className="py-2.5 px-3 text-left text-rose-800 dark:text-rose-200">منصرف (−)</th>
                    <th className="py-2.5 px-3 text-left font-bold">الرصيد التراكمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Initial balance row */}
                  <tr className="bg-slate-50/60 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300">
                    <td className="py-2.5 px-3 font-mono">-</td>
                    <td className="py-2.5 px-3 font-mono">-</td>
                    <td className="py-2.5 px-3">افتتاحي</td>
                    <td className="py-2.5 px-3">رصيد أول المدة</td>
                    <td className="py-2.5 px-3 text-left">-</td>
                    <td className="py-2.5 px-3 text-left">-</td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatNumberLatin(productStatement.opening)}
                    </td>
                  </tr>

                  {productStatement.records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 dark:text-slate-500">
                        لا توجد حركات مسجلة لهذا الصنف في الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    productStatement.records.map((r) => {
                      const moveStyle = getMovementTypeStyle(r.movementType);
                      return (
                        <tr key={r.subId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="py-2.5 px-3 font-mono font-bold">{r.subId}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{r.date}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${moveStyle.badge}`}>
                              {r.movementType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{r.beneficiary}</td>
                          <td className="py-2.5 px-3 text-left font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                            {r.isInput ? `+${r.quantity}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono text-rose-700 dark:text-rose-300 font-bold">
                            {!r.isInput ? `−${r.quantity}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-slate-900 dark:text-slate-100">
                            {formatNumberLatin(r.balanceAfter)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PERIODICAL AGGREGATION VIEW (FR-23, FR-28) */}
      {/* ========================================================================= */}
      {reportType === 'period' && (
        <div className="space-y-4">
          {periodicData.unparsedDatesCount > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
              <span>
                تنبيه: تم استثناء <strong>{periodicData.unparsedDatesCount}</strong> حركة من التجميع الشهري نظراً لعدم احتواء تاريخها على سنة وشهر قياسيين.
              </span>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>التوزيع الشهري لحركات وكميات التوريد والصرف</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[600px] print:min-w-0">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                    <th className="py-2.5 px-3">الشهر / السنة</th>
                    <th className="py-2.5 px-3 text-center text-emerald-800 dark:text-emerald-200">حركات التوريد (IN)</th>
                    <th className="py-2.5 px-3 text-left text-emerald-800 dark:text-emerald-200">كميات التوريد (وحدات)</th>
                    <th className="py-2.5 px-3 text-center text-rose-800 dark:text-rose-200">حركات الصرف (OUT)</th>
                    <th className="py-2.5 px-3 text-left text-rose-800 dark:text-rose-200">كميات الصرف (وحدات)</th>
                    <th className="py-2.5 px-3 text-left">صافي حركة الشهر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {periodicData.periods.map((p) => {
                    const net = p.inUnits - p.outUnits;
                    return (
                      <tr key={p.period} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{p.period}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-700 dark:text-emerald-300">{p.inCount}</td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          +{formatNumberLatin(p.inUnits)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-rose-700 dark:text-rose-300">{p.outCount}</td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold text-rose-700 dark:text-rose-300">
                          −{formatNumberLatin(p.outUnits)}
                        </td>
                        <td className={`py-2.5 px-3 text-left font-mono font-black ${
                          net >= 0 ? 'text-blue-900' : 'text-rose-900'
                        }`}>
                          {formatNumberLatin(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
