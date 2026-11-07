import React from 'react';
import { DoctorRecord, DoctorVisitLog, DoctorVisitStatus } from '../../types';
import {
  X,
  Stethoscope,
  Building2,
  MapPin,
  Calendar,
  User,
  Phone,
  Package,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  History,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorRecord | null;
  visits: DoctorVisitLog[];
  onEdit: (doctor: DoctorRecord) => void;
  onDelete: (id: string) => void;
  onRecordVisit: (doctor: DoctorRecord) => void;
  onUpdateStatus: (id: string, newStatus: DoctorVisitStatus) => void;
}

export const DoctorDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  doctor,
  visits,
  onEdit,
  onDelete,
  onRecordVisit,
  onUpdateStatus,
}) => {
  if (!isOpen || !doctor) return null;

  const doctorVisits = visits.filter((v) => v.doctorId === doctor.id);

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

  const getSignificanceBadge = (sig: string) => {
    switch (sig) {
      case 'A':
        return 'bg-purple-600 text-white';
      case 'B':
        return 'bg-blue-600 text-white';
      case 'C':
        return 'bg-amber-600 text-white';
      case '√':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-md ${getSignificanceBadge(
                doctor.significance
              )}`}
            >
              {doctor.significance}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">{doctor.name}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                    doctor.status
                  )}`}
                >
                  {doctor.status}
                </span>
              </div>
              <p className="text-xs text-teal-200">
                {doctor.specialty || 'طبيب عام'} • {doctor.clinicName || 'عيادة'} • {doctor.id}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRecordVisit(doctor)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>توثيق زيارة جديدة</span>
              </button>
              <button
                onClick={() => onEdit(doctor)}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>تعديل البيانات</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">تغيير الحالة:</span>
              <select
                value={doctor.status}
                onChange={(e) => onUpdateStatus(doctor.id, e.target.value as DoctorVisitStatus)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
              >
                <option value="مخطط">🟣 مخطط</option>
                <option value="قيد تنفيذ">🔵 قيد تنفيذ</option>
                <option value="مكتمل">🟢 مكتمل</option>
                <option value="متابعة">🟠 متابعة</option>
                <option value="مرحل">⚪ مرحل</option>
                <option value="ملغي">🔴 ملغي</option>
              </select>
            </div>
          </div>

          {/* Core Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                البيانات الطبية والمهنية
              </h4>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">التخصص:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{doctor.specialty || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">العيادة/المركز:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{doctor.clinicName || 'عيادة خاصة'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">المصدر:</span>
                  <span className="font-bold text-teal-700 dark:text-teal-300">{doctor.source || 'الأطباء'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">درجة الأهمية:</span>
                  <span className="font-black text-purple-700">الفئة {doctor.significance}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                الموقع والمسار الميداني
              </h4>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">المنطقة:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{doctor.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">مسار الزيارة:</span>
                  <span className="font-bold text-teal-900 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-md">
                    {doctor.route}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">المندوب المسؤول:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">{doctor.responsible}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">العنوان:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-xs truncate max-w-[150px]">
                    {doctor.address || 'غير محدد'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                توقيت الخطة والمهمة
              </h4>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">بدء المهمة:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{doctor.dateBegin || '2026-08-01'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">انتهاء المهمة:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{doctor.dateEnd || '2026-08-07'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">آخر زيارة مسجلة:</span>
                  <span className="font-bold text-teal-800 dark:text-teal-200">
                    {doctor.lastVisitDate || 'لم تنفذ بعد'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">إجمالي الزيارات:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{doctorVisits.length} زيارة</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Actions */}
          {doctor.phone && (
            <div className="flex items-center gap-3 bg-teal-50/60 dark:bg-teal-950/40 p-3.5 rounded-xl border border-teal-200 dark:border-teal-800">
              <Phone className="w-4 h-4 text-teal-700 dark:text-teal-300 shrink-0" />
              <div className="text-xs flex-1">
                <span className="text-slate-600 dark:text-slate-300">رقم الهاتف والتواصل: </span>
                <span className="font-mono font-bold text-teal-950">{doctor.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${doctor.phone}`}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>اتصال</span>
                </a>
                <a
                  href={`https://wa.me/${doctor.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>واتساب</span>
                </a>
              </div>
            </div>
          )}

          {/* Task Description & Samples Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctor.taskDesc && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">وصف المهمة والغرض:</span>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {doctor.taskDesc}
                </p>
              </div>
            )}

            {doctor.samplesGiven && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-teal-200 dark:border-teal-800 space-y-1">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  العينات والمواد المسلمة:
                </span>
                <p className="text-xs text-teal-950 font-bold leading-relaxed">
                  {doctor.samplesGiven}
                </p>
              </div>
            )}
          </div>

          {doctor.visitResult && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                نتيجة الزيارة الأخيرة ورد فعل الطبيب:
              </span>
              <p className="text-xs text-emerald-950 font-bold leading-relaxed">
                {doctor.visitResult}
              </p>
            </div>
          )}

          {doctor.notes && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ملاحظات إضافية:</span>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{doctor.notes}</p>
            </div>
          )}

          {/* Historical Log of Medical Visits */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-700 dark:text-teal-300" />
              <span>سجل الزيارات الميدانية المنفذة ({doctorVisits.length})</span>
            </h4>

            {doctorVisits.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  لا توجد زيارات مسجلة لهذا الطبيب حتى الآن
                </p>
                <button
                  onClick={() => onRecordVisit(doctor)}
                  className="mt-3 px-4 py-1.5 bg-teal-700 text-white text-xs font-bold rounded-lg hover:bg-teal-800 transition-colors"
                >
                  توثيق الزيارة الأولى
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {doctorVisits.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-300 transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-900">{v.date}</span>
                        <span className="text-slate-400 dark:text-slate-500">({v.dayOfWeek})</span>
                        <span className="text-slate-600 dark:text-slate-300">• المندوب: {v.responsible}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold border ${getStatusBadge(
                          v.status
                        )}`}
                      >
                        {v.status}
                      </span>
                    </div>

                    {v.samplesGiven && (
                      <p className="text-teal-800 dark:text-teal-200 font-medium">
                        <span className="font-bold">العينات:</span> {v.samplesGiven}
                      </p>
                    )}

                    {v.visitResult && (
                      <p className="text-emerald-800 dark:text-emerald-200 font-medium">
                        <span className="font-bold">النتيجة:</span> {v.visitResult}
                      </p>
                    )}

                    {v.notes && <p className="text-slate-600 dark:text-slate-300">{v.notes}</p>}

                    {v.nextFollowUpDate && (
                      <p className="text-amber-800 dark:text-amber-200 text-xs font-bold">
                        موعد المتابعة القادمة: {v.nextFollowUpDate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => onDelete(doctor.id)}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-rose-200 dark:border-rose-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف الطبيب</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
