import React, { useState, useEffect } from 'react';
import { DoctorRecord, DoctorSignificance, DoctorVisitStatus } from '../../types';
import {
  DOCTOR_REGIONS,
  DOCTOR_RESPONSIBLES,
  DOCTOR_ROUTES,
  DOCTOR_SPECIALTIES,
} from '../../data/defaultDoctors';
import { findDoctorDuplicates, generateNextDoctorId } from '../../utils/doctors';
import {
  X,
  UserPlus,
  Edit,
  AlertTriangle,
  Stethoscope,
  Building2,
  MapPin,
  Calendar,
  User,
  Phone,
  FileText,
  Package,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doctor: DoctorRecord) => void;
  doctorToEdit?: DoctorRecord | null;
  existingDoctors: DoctorRecord[];
  customRegions?: string[];
  customRoutes?: string[];
  customResponsibles?: string[];
  customSpecialties?: string[];
}

export const DoctorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  doctorToEdit,
  existingDoctors,
  customRegions = DOCTOR_REGIONS,
  customRoutes = DOCTOR_ROUTES,
  customResponsibles = DOCTOR_RESPONSIBLES,
  customSpecialties = DOCTOR_SPECIALTIES,
}) => {
  const [formData, setFormData] = useState<Partial<DoctorRecord>>({
    name: '',
    source: 'الأطباء',
    specialty: 'جلدية وتجميل',
    clinicName: '',
    region: customRegions[0] || 'صنعاء - السبعين والوحدة',
    route: customRoutes[0] || 'السبت',
    significance: 'B',
    responsible: customResponsibles[0] || 'انور',
    taskDesc: 'زيارة دورية لتعريف بالمنتجات ومتابعة الوصفات',
    dateBegin: '2026-08-01',
    dateEnd: '2026-08-07',
    status: 'مخطط',
    phone: '',
    address: '',
    notes: '',
    samplesGiven: '',
    visitResult: '',
  });

  const [duplicates, setDuplicates] = useState<DoctorRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doctorToEdit) {
      setFormData({ ...doctorToEdit });
    } else {
      setFormData({
        id: generateNextDoctorId(existingDoctors),
        name: '',
        source: 'الأطباء',
        specialty: customSpecialties[0] || 'جلدية وتجميل',
        clinicName: '',
        region: customRegions[0] || 'صنعاء - السبعين والوحدة',
        route: customRoutes[0] || 'السبت',
        significance: 'B',
        responsible: customResponsibles[0] || 'انور',
        taskDesc: 'زيارة دورية لتعريف بالمنتجات ومتابعة الوصفات',
        dateBegin: '2026-08-01',
        dateEnd: '2026-08-07',
        status: 'مخطط',
        phone: '',
        address: '',
        notes: '',
        samplesGiven: '',
        visitResult: '',
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
    setError(null);
  }, [doctorToEdit, isOpen, existingDoctors]);

  // Real-time duplicate check
  useEffect(() => {
    if (formData.name && formData.name.trim().length > 2) {
      const found = findDoctorDuplicates(formData, existingDoctors, doctorToEdit?.id);
      setDuplicates(found);
    } else {
      setDuplicates([]);
    }
  }, [formData.name, formData.phone, existingDoctors, doctorToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('يرجى إدخال اسم الطبيب أو المركز الطبي');
      return;
    }

    const finalDoctor: DoctorRecord = {
      id: formData.id || generateNextDoctorId(existingDoctors),
      name: formData.name.trim(),
      source: formData.source || 'الأطباء',
      specialty: formData.specialty || 'عام',
      clinicName: formData.clinicName?.trim() || '',
      region: formData.region || customRegions[0] || 'صنعاء',
      route: formData.route || customRoutes[0] || 'السبت',
      significance: (formData.significance as DoctorSignificance) || 'B',
      responsible: formData.responsible || customResponsibles[0] || 'انور',
      taskDesc: formData.taskDesc?.trim() || '',
      dateBegin: formData.dateBegin || '2026-08-01',
      dateEnd: formData.dateEnd || '2026-08-07',
      status: (formData.status as DoctorVisitStatus) || 'مخطط',
      phone: formData.phone?.trim() || '',
      address: formData.address?.trim() || '',
      notes: formData.notes?.trim() || '',
      samplesGiven: formData.samplesGiven?.trim() || '',
      visitResult: formData.visitResult?.trim() || '',
      createdAt: formData.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    onSave(finalDoctor);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[96vh] sm:max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700/60 flex items-center justify-center border border-teal-500/30">
              {doctorToEdit ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                {doctorToEdit ? 'تعديل بيانات الطبيب والزيارة' : 'إضافة طبيب جديد لدفتر الزيارات'}
              </h2>
              <p className="text-xs text-teal-200">
                {doctorToEdit ? `المعرف: ${doctorToEdit.id}` : 'تسجيل طبيب / مركز طبي ضمن خطة الزيارات الدورية'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning */}
        {duplicates.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-6 py-3 text-xs text-amber-900 flex items-start gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">تنبيه تكرار محتمل:</span> يوجد طبيب مسجل مسبقاً بنفس الاسم أو الهاتف:
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800 dark:text-amber-200">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    {d.name} ({d.id}) - {d.region} - المسار: {d.route} ({d.responsible})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 px-6 py-2.5 text-xs text-rose-800 dark:text-rose-200 font-bold shrink-0">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Basic Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                اسم الطبيب / المركز الطبي <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: د. خالد عبدالجليل الشرجبي"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
                <Stethoscope className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                التخصص الطبي <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.specialty || ''}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                {customSpecialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                اسم العيادة / المستشفى / المركز
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: عيادة النور التخصصية / مستشفى آزال"
                  value={formData.clinicName || ''}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
                <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                المصدر (Source)
              </label>
              <input
                type="text"
                value={formData.source || 'الأطباء'}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-slate-50 dark:bg-slate-800/60"
              />
            </div>
          </div>

          {/* Region, Route, Responsible, Significance */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                المنطقة الجغرافية
              </label>
              <select
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-900"
              >
                {customRegions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                المسار / اليوم
              </label>
              <select
                value={formData.route || ''}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-900 font-bold text-teal-900"
              >
                {customRoutes.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                الأهمية (Significance)
              </label>
              <select
                value={formData.significance || 'B'}
                onChange={(e) =>
                  setFormData({ ...formData, significance: e.target.value as DoctorSignificance })
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-900 font-bold"
              >
                <option value="A">درجة A (أولوية قصوى)</option>
                <option value="B">درجة B (أولوية متوسطة)</option>
                <option value="C">درجة C (أولوية عادية)</option>
                <option value="√">درجة √ (مميز / معتمد)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                المندوب المسؤول
              </label>
              <select
                value={formData.responsible || ''}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
              >
                {customResponsibles.map((resp) => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task & Date Range Row */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                وصف المهمة / الغرض من الزيارة
              </label>
              <input
                type="text"
                placeholder="مثال: تقديم عينات سيروم جديدة، متابعة إدراج الأصناف في الوصفات الطبية"
                value={formData.taskDesc || ''}
                onChange={(e) => setFormData({ ...formData, taskDesc: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  تاريخ بدء المهمة
                </label>
                <input
                  type="date"
                  value={formData.dateBegin || '2026-08-01'}
                  onChange={(e) => setFormData({ ...formData, dateBegin: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  تاريخ انتهاء المهمة
                </label>
                <input
                  type="date"
                  value={formData.dateEnd || '2026-08-07'}
                  onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  حالة الزيارة
                </label>
                <select
                  value={formData.status || 'مخطط'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as DoctorVisitStatus })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="مخطط">🟣 مخطط (Planned)</option>
                  <option value="قيد تنفيذ">🔵 قيد تنفيذ (In Progress)</option>
                  <option value="مكتمل">🟢 مكتمل (Completed)</option>
                  <option value="متابعة">🟠 متابعة (Follow-up)</option>
                  <option value="مرحل">⚪ مرحل (Postponed)</option>
                  <option value="ملغي">🔴 ملغي (Cancelled)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                رقم الهاتف / الواتساب
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: 777123456"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                العنوان والمقر التفصيلي
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: شارع حدة - برج الأمل الدور الثاني"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Medical Samples & Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-teal-50/50 dark:bg-teal-950/40 p-3.5 rounded-xl border border-teal-100 dark:border-teal-900">
            <div>
              <label className="block text-xs font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                العينات والمواد الترويجية المسلمة
              </label>
              <input
                type="text"
                placeholder="مثال: 4 عبوات سيروم تجريبي + بروشورات"
                value={formData.samplesGiven || ''}
                onChange={(e) => setFormData({ ...formData, samplesGiven: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                نتيجة الزيارة وملاحظات التفاعل
              </label>
              <input
                type="text"
                placeholder="مثال: وافق الطبيب على إدراج الصنف في الوصفات"
                value={formData.visitResult || ''}
                onChange={(e) => setFormData({ ...formData, visitResult: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              ملاحظات وتفاصيل إضافية
            </label>
            <textarea
              rows={2}
              placeholder="أي تفاصيل أخرى تخص الطبيب، أوقات التواجد، أو التوصيات الخاصة..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md shadow-teal-200 transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{doctorToEdit ? 'حفظ التعديلات' : 'إضافة الطبيب'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
