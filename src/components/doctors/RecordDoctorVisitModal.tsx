import React, { useState, useEffect } from 'react';
import { DoctorRecord, DoctorVisitLog, DoctorVisitStatus } from '../../types';
import { DOCTOR_RESPONSIBLES } from '../../data/defaultDoctors';
import { getTodayArabicDay } from '../../utils/doctors';
import {
  X,
  Stethoscope,
  Calendar,
  User,
  Package,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Building2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorRecord | null;
  onSaveVisit: (
    visit: DoctorVisitLog,
    updatedDoctorStatus?: DoctorVisitStatus,
    samplesGiven?: string,
    visitResult?: string
  ) => void;
  customResponsibles?: string[];
}

export const RecordDoctorVisitModal: React.FC<Props> = ({
  isOpen,
  onClose,
  doctor,
  onSaveVisit,
  customResponsibles = DOCTOR_RESPONSIBLES,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState(getTodayArabicDay());
  const [responsible, setResponsible] = useState(customResponsibles[0] || 'انور');
  const [status, setStatus] = useState<DoctorVisitStatus>('مكتمل');
  const [samplesGiven, setSamplesGiven] = useState('');
  const [visitResult, setVisitResult] = useState('');
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  useEffect(() => {
    if (doctor) {
      setResponsible(doctor.responsible || customResponsibles[0] || 'انور');
      setDayOfWeek(getTodayArabicDay());
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('مكتمل');
      setSamplesGiven(doctor.samplesGiven || '');
      setVisitResult(doctor.visitResult || '');
      setNotes('');
      setNextFollowUpDate('');
    }
  }, [doctor, isOpen, customResponsibles]);

  if (!isOpen || !doctor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newVisit: DoctorVisitLog = {
      id: `DVL-${Date.now().toString().slice(-6)}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date,
      dayOfWeek,
      responsible,
      status,
      notes: notes.trim() || 'زيارة ميدانية موثقة',
      visitResult: visitResult.trim(),
      samplesGiven: samplesGiven.trim(),
      nextFollowUpDate: nextFollowUpDate || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveVisit(newVisit, status, samplesGiven, visitResult);
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
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[96vh] sm:max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 my-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/50 flex items-center justify-center border border-teal-400/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">توثيق زيارة طبية ميدانية</h2>
              <p className="text-xs text-teal-200">
                تسجيل نتائج الزيارة وتحديث حالة الطبيب في الدفتر
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

        {/* Doctor Summary Card */}
        <div className="bg-teal-50/70 dark:bg-teal-950/40 border-b border-teal-100 dark:border-teal-900 p-4 shrink-0 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0">
              {doctor.significance}
            </div>
            <div>
              <h3 className="text-sm font-black text-teal-950">{doctor.name}</h3>
              <p className="text-xs text-teal-800 dark:text-teal-200 font-medium">
                {doctor.specialty} • {doctor.clinicName || 'عيادة خاصة'} • {doctor.region}
              </p>
            </div>
          </div>
          <span className="text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 font-bold text-teal-900">
            مسار: {doctor.route}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                تاريخ الزيارة <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                اليوم
              </label>
              <input
                type="text"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-slate-50 dark:bg-slate-800/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                المندوب المنفذ <span className="text-rose-500">*</span>
              </label>
              <select
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold bg-white dark:bg-slate-900"
              >
                {customResponsibles.map((resp) => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                حالة الزيارة المنفذة <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DoctorVisitStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold bg-white dark:bg-slate-900"
              >
                <option value="مكتمل">🟢 مكتمل (تمت الزيارة بنجاح)</option>
                <option value="قيد تنفيذ">🔵 قيد تنفيذ (جارية حالياً)</option>
                <option value="متابعة">🟠 متابعة (تتطلب زيارة تكميلية)</option>
                <option value="مرحل">⚪ مرحل (تم تأجيلها لظرف)</option>
                <option value="ملغي">🔴 ملغي (تعذرت المقابلة)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                موعد المتابعة القادمة (اختياري)
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Samples Given */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              العينات والمواد الترويجية المقدمة
            </label>
            <input
              type="text"
              placeholder="مثال: 5 عبوات سيروم فيتامين C + 3 عينات كريم واقي شمس"
              value={samplesGiven}
              onChange={(e) => setSamplesGiven(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Visit Result */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              نتيجة الزيارة ورد فعل الطبيب
            </label>
            <input
              type="text"
              placeholder="مثال: أبدى إعجابه بالمنتج ووافق على إدراجه في الوصفات لمرضى العيادة"
              value={visitResult}
              onChange={(e) => setVisitResult(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Detailed Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              ملاحظات وتفاصيل تفاعل المقابلة
            </label>
            <textarea
              rows={3}
              required
              placeholder="أدخل ملخص الزيارة، الملاحظات السريرية أو استفسارات الطبيب حول التركيبة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            <Send className="w-4 h-4" />
            <span>حفظ وتوثيق الزيارة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
