import React, { useState, useMemo } from 'react';
import {
  DoctorFilterState,
  DoctorRecord,
  DoctorSignificance,
  DoctorVisitStatus,
} from '../../types';
import { filterDoctors, isDoctorVisitDueToday } from '../../utils/doctors';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Download,
  Stethoscope,
  Building2,
  MapPin,
  Calendar,
  User,
  Phone,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  CheckSquare,
  Square,
  Sparkles,
  Table,
  LayoutGrid,
} from 'lucide-react';

interface Props {
  doctors: DoctorRecord[];
  onAddDoctor: () => void;
  onEditDoctor: (doctor: DoctorRecord) => void;
  onDeleteDoctor: (id: string) => void;
  onViewDoctor: (doctor: DoctorRecord) => void;
  onRecordVisit: (doctor: DoctorRecord) => void;
  onUpdateStatus: (id: string, newStatus: DoctorVisitStatus) => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onOpenImport: () => void;
  customRegions: string[];
  customRoutes: string[];
  customResponsibles: string[];
  customSpecialties: string[];
}

export const DoctorDirectory: React.FC<Props> = ({
  doctors,
  onAddDoctor,
  onEditDoctor,
  onDeleteDoctor,
  onViewDoctor,
  onRecordVisit,
  onUpdateStatus,
  onExportExcel,
  onExportCSV,
  onOpenImport,
  customRegions,
  customRoutes,
  customResponsibles,
  customSpecialties,
}) => {
  const [filter, setFilter] = useState<DoctorFilterState>({
    search: '',
    region: '',
    route: '',
    status: '',
    responsible: '',
    significance: '',
    specialty: '',
    todayVisitsOnly: false,
    activePeriodOnly: false,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredDoctors = useMemo(() => {
    return filterDoctors(doctors, filter);
  }, [doctors, filter]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredDoctors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDoctors.map((d) => d.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (newStatus: DoctorVisitStatus) => {
    selectedIds.forEach((id) => onUpdateStatus(id, newStatus));
    setSelectedIds([]);
  };

  const resetFilters = () => {
    setFilter({
      search: '',
      region: '',
      route: '',
      status: '',
      responsible: '',
      significance: '',
      specialty: '',
      todayVisitsOnly: false,
      activePeriodOnly: false,
    });
  };

  const getSignificanceBadge = (sig: DoctorSignificance) => {
    switch (sig) {
      case 'A':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-black';
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
      case 'C':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case '√':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusBadge = (status: DoctorVisitStatus) => {
    switch (status) {
      case 'مكتمل':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'قيد تنفيذ':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'مخطط':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'متابعة':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'مرحل':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'ملغي':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="بحث باسم الطبيب، المركز، التخصص، الهاتف، المندوب، أو الملاحظات..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-right"
              dir="rtl"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-3" />
            {filter.search && (
              <button
                onClick={() => setFilter({ ...filter, search: '' })}
                className="absolute left-3 top-2.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                مسح
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showAdvancedFilters ||
                filter.region ||
                filter.route ||
                filter.status ||
                filter.responsible ||
                filter.specialty ||
                filter.significance ||
                filter.todayVisitsOnly
                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>تصفية متقدمة</span>
            </button>

            <button
              onClick={onOpenImport}
              className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="hidden sm:inline">استيراد</span>
            </button>

            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-900">
              <button
                onClick={onExportExcel}
                title="تصدير إلى ملف Excel"
                className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Excel</span>
              </button>
              <button
                onClick={onExportCSV}
                title="تصدير إلى CSV"
                className="px-2.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                CSV
              </button>
            </div>

            <button
              onClick={onAddDoctor}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طبيب جديد</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المنطقة</label>
              <select
                value={filter.region}
                onChange={(e) => setFilter({ ...filter, region: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-xs"
              >
                <option value="">كافة المناطق</option>
                {customRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المسار / اليوم</label>
              <select
                value={filter.route}
                onChange={(e) => setFilter({ ...filter, route: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-xs"
              >
                <option value="">كافة المسارات</option>
                {customRoutes.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">حالة الزيارة</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-xs"
              >
                <option value="">كافة الحالات</option>
                <option value="مخطط">🟣 مخطط</option>
                <option value="قيد تنفيذ">🔵 قيد تنفيذ</option>
                <option value="مكتمل">🟢 مكتمل</option>
                <option value="متابعة">🟠 متابعة</option>
                <option value="مرحل">⚪ مرحل</option>
                <option value="ملغي">🔴 ملغي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المندوب المسؤول</label>
              <select
                value={filter.responsible}
                onChange={(e) => setFilter({ ...filter, responsible: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-xs"
              >
                <option value="">كافة المناديب</option>
                {customResponsibles.map((resp) => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الأهمية</label>
              <select
                value={filter.significance}
                onChange={(e) => setFilter({ ...filter, significance: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-xs"
              >
                <option value="">كافة الدرجات</option>
                <option value="A">درجة A</option>
                <option value="B">درجة B</option>
                <option value="C">درجة C</option>
                <option value="√">درجة √</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">التخصص</label>
              <select
                value={filter.specialty}
                onChange={(e) => setFilter({ ...filter, specialty: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-xs"
              >
                <option value="">كافة التخصصات</option>
                {customSpecialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-3 lg:col-span-6 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-teal-900">
                  <input
                    type="checkbox"
                    checked={filter.todayVisitsOnly}
                    onChange={(e) => setFilter({ ...filter, todayVisitsOnly: e.target.checked })}
                    className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500"
                  />
                  <span>زيارات اليوم فقط ({customRoutes[0] || 'السبت'})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={filter.activePeriodOnly}
                    onChange={(e) => setFilter({ ...filter, activePeriodOnly: e.target.checked })}
                    className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500"
                  />
                  <span>ضمن الفترة النشطة (01-07 أغسطس)</span>
                </label>
              </div>

              <button
                onClick={resetFilters}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Operations Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-teal-900 text-white p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 shadow-md animate-fade-in text-xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckSquare className="w-4 h-4 text-teal-300" />
            <span>تم تحديد {selectedIds.length} طبيب</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-teal-200">تحديث الحالة جماعياً:</span>
            <button
              onClick={() => handleBulkStatusChange('مكتمل')}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold transition-colors cursor-pointer"
            >
              مكتمل
            </button>
            <button
              onClick={() => handleBulkStatusChange('قيد تنفيذ')}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors cursor-pointer"
            >
              قيد تنفيذ
            </button>
            <button
              onClick={() => handleBulkStatusChange('متابعة')}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 rounded-lg font-bold transition-colors cursor-pointer"
            >
              متابعة
            </button>
            <button
              onClick={() => handleBulkStatusChange('مرحل')}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-colors cursor-pointer"
            >
              مرحل
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded-lg text-teal-200 font-bold transition-colors cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Main Doctors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-bold">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            <span>سجل أطباء وزيارات المنظومة ({filteredDoctors.length} من {doctors.length})</span>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Table vs Mobile Cards */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-600">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="عرض الجدول الكامل"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">جدول</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="عرض بطاقات تفاعلية مناسبة للهواتف والميدان"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">بطاقات</span>
              </button>
            </div>

            <span className="text-xs text-teal-900 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-md font-bold hidden sm:inline">
              النسبة المستهدفة للإنجاز: ≥ 80%
            </span>
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div className="p-3">
            {filteredDoctors.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                لا يوجد أطباء أو مراكز مطابقة للفلاتر المحددة
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredDoctors.map((d) => {
                  const isSelected = selectedIds.includes(d.id);
                  const isDueToday = isDoctorVisitDueToday(d.route);
                  const isCompleted = d.status === 'مكتمل';

                  return (
                    <div
                      key={d.id}
                      className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between space-y-2.5 shadow-2xs ${
                        isSelected
                          ? 'bg-teal-50/60 border-teal-400 ring-2 ring-teal-500/20'
                          : 'bg-white border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(d.id)}
                            className="rounded text-teal-700 dark:text-teal-300 focus:ring-teal-700 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{d.name}</h4>
                              {isDueToday && (
                                <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300">
                                  مستحق اليوم
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{d.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-xs">
                            {d.significance}
                          </span>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 dark:text-slate-500 text-xs">التخصص / العيادة:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[190px]">
                            {d.specialty} • {d.clinicName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span>{d.region} ({d.route})</span>
                          </div>
                          <span className="font-bold text-teal-800 dark:text-teal-200">{d.responsible}</span>
                        </div>
                      </div>

                      {/* Task / Objective */}
                      {d.taskDesc && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-100 dark:border-amber-900 line-clamp-2">
                          {d.taskDesc}
                        </p>
                      )}

                      {/* Phone & Status Buttons */}
                      <div className="pt-1 flex items-center justify-between gap-1 text-xs">
                        {d.phone ? (
                          <a
                            href={`tel:${d.phone}`}
                            className="text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 font-mono text-xs"
                          >
                            <Phone className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span>{d.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">لا يوجد هاتف</span>
                        )}

                        {/* Quick Status Toggles */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onUpdateStatus(d.id, 'مكتمل')}
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            ✓ تم
                          </button>
                          <button
                            onClick={() => onUpdateStatus(d.id, 'قيد تنفيذ')}
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              d.status === 'قيد تنفيذ'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-50'
                            }`}
                          >
                            تنفيذ
                          </button>
                          <button
                            onClick={() => onUpdateStatus(d.id, 'متابعة')}
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              d.status === 'متابعة'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50'
                            }`}
                          >
                            متابعة
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                        <button
                          onClick={() => onRecordVisit(d)}
                          className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>توثيق زيارة</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onViewDoctor(d)}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg cursor-pointer"
                            title="عرض الملف"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditDoctor(d)}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer"
                            title="تعديل الطبيب"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteDoctor(d.id)}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-270px)] min-h-[380px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-right text-xs border-collapse min-w-[820px] print:min-w-0" dir="rtl">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 shadow-2xs select-none">
                <th className="py-2.5 px-3 text-center w-10 sticky right-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  <button onClick={handleSelectAll} className="cursor-pointer">
                    {selectedIds.length === filteredDoctors.length && filteredDoctors.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-teal-700 dark:text-teal-300" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-2 text-center w-14">الأهمية</th>
                <th className="py-2.5 px-2.5 min-w-[170px]">اسم الطبيب / المركز</th>
                <th className="py-2.5 px-2.5 w-36">التخصص والعيادة</th>
                <th className="py-2.5 px-2.5 w-32">المنطقة والمسار</th>
                <th className="py-2.5 px-2.5 w-24">المندوب</th>
                <th className="py-2.5 px-2.5 min-w-[150px]">وصف المهمة</th>
                <th className="py-2.5 px-2 text-center w-28">حالة الزيارة</th>
                <th className="py-2.5 px-3 text-center sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] w-32">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-40 text-teal-700 dark:text-teal-300" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">لا توجد سجلات أطباء مطابقة لشروط البحث</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      جرب تغيير خيارات التصفية أو إضافة طبيب جديد
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  const isSelected = selectedIds.includes(doc.id);
                  const isDueToday = isDoctorVisitDueToday(doc.route);

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-teal-50/40 dark:hover:bg-teal-950/40 transition-colors text-[12px] group ${
                        isSelected ? 'bg-teal-50/70' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3 text-center sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <button
                          onClick={() => handleToggleSelect(doc.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-700 dark:text-teal-300" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-400 dark:hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* Significance */}
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold border ${getSignificanceBadge(
                            doc.significance
                          )}`}
                        >
                          {doc.significance}
                        </span>
                      </td>

                      {/* Doctor Name */}
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onViewDoctor(doc)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-teal-700 dark:hover:text-teal-300 transition-colors text-right cursor-pointer"
                          >
                            {doc.name}
                          </button>
                          {isDueToday && (
                            <span
                              title="موعد الزيارة اليوم"
                              className="w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          <span>{doc.id}</span>
                          {doc.phone && (
                            <a
                              href={`tel:${doc.phone}`}
                              className="text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{doc.phone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Specialty & Clinic */}
                      <td className="py-2 px-2.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                          {doc.specialty || 'عام'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block truncate max-w-[140px]">
                          {doc.clinicName || 'عيادة خاصة'}
                        </span>
                      </td>

                      {/* Region & Route */}
                      <td className="py-2 px-2.5">
                        <span className="text-slate-700 dark:text-slate-200 block truncate max-w-[130px] text-xs">
                          {doc.region}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-bold inline-block mt-0.5 ${
                            isDueToday
                              ? 'bg-teal-100 text-teal-900 border border-teal-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          مسار: {doc.route}
                        </span>
                      </td>

                      {/* Responsible */}
                      <td className="py-2 px-2.5 font-bold text-slate-800 dark:text-slate-200">
                        <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded text-xs border border-slate-200 dark:border-slate-700">
                          <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          {doc.responsible}
                        </span>
                      </td>

                      {/* Task Description */}
                      <td className="py-2 px-2.5 max-w-[180px]">
                        <p className="text-xs text-slate-700 dark:text-slate-200 truncate" title={doc.taskDesc}>
                          {doc.taskDesc || '—'}
                        </p>
                        {doc.samplesGiven && (
                          <p className="text-xs text-teal-800 dark:text-teal-200 truncate" title={doc.samplesGiven}>
                            🎁 {doc.samplesGiven}
                          </p>
                        )}
                      </td>

                      {/* Status Selector */}
                      <td className="py-2 px-2 text-center">
                        <select
                          value={doc.status}
                          onChange={(e) =>
                            onUpdateStatus(doc.id, e.target.value as DoctorVisitStatus)
                          }
                          className={`text-xs px-1.5 py-0.5 rounded border font-bold focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer ${getStatusBadge(
                            doc.status
                          )}`}
                        >
                          <option value="مخطط">🟣 مخطط</option>
                          <option value="قيد تنفيذ">🔵 قيد تنفيذ</option>
                          <option value="مكتمل">🟢 مكتمل</option>
                          <option value="متابعة">🟠 متابعة</option>
                          <option value="مرحل">⚪ مرحل</option>
                          <option value="ملغي">🔴 ملغي</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onRecordVisit(doc)}
                            title="توثيق زيارة"
                            className="p-1 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 rounded transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onViewDoctor(doc)}
                            title="عرض التفاصيل"
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditDoctor(doc)}
                            title="تعديل"
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteDoctor(doc.id)}
                            title="حذف"
                            className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        )}
      </div>
    </div>
  );
};
