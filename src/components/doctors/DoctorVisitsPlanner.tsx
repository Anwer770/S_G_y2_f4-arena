import React, { useState, useMemo } from 'react';
import { DoctorRecord, DoctorVisitStatus } from '../../types';
import { DOCTOR_ROUTES } from '../../data/defaultDoctors';
import { getTodayArabicDay, isDoctorVisitDueToday } from '../../utils/doctors';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Phone,
  MessageCircle,
  Building2,
  Stethoscope,
  Plus,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Package,
} from 'lucide-react';

interface Props {
  doctors: DoctorRecord[];
  onRecordVisit: (doctor: DoctorRecord) => void;
  onViewDoctor: (doctor: DoctorRecord) => void;
  onUpdateStatus: (id: string, newStatus: DoctorVisitStatus) => void;
  onAddDoctor: () => void;
  customResponsibles: string[];
}

export const DoctorVisitsPlanner: React.FC<Props> = ({
  doctors,
  onRecordVisit,
  onViewDoctor,
  onUpdateStatus,
  onAddDoctor,
  customResponsibles,
}) => {
  const todayArabic = getTodayArabicDay();
  const [selectedRoute, setSelectedRoute] = useState<string>(todayArabic);
  const [selectedResponsible, setSelectedResponsible] = useState<string>('all');

  // Filtered by representative
  const repFilteredDoctors = useMemo(() => {
    if (selectedResponsible === 'all') return doctors;
    return doctors.filter((d) => d.responsible === selectedResponsible);
  }, [doctors, selectedResponsible]);

  // Grouped by route
  const routeGroups = useMemo(() => {
    const map: Record<string, DoctorRecord[]> = {};
    DOCTOR_ROUTES.forEach((r) => {
      map[r] = [];
    });

    repFilteredDoctors.forEach((d) => {
      const rt = d.route || 'السبت';
      if (!map[rt]) map[rt] = [];
      map[rt].push(d);
    });

    return map;
  }, [repFilteredDoctors]);

  // Today's due visits
  const todayDoctors = useMemo(() => {
    return repFilteredDoctors.filter((d) => isDoctorVisitDueToday(d.route));
  }, [repFilteredDoctors]);

  const activeRouteDoctors = routeGroups[selectedRoute] || [];

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
    <div className="space-y-6">
      {/* Today's Spotlight Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-xl p-6 shadow-lg border border-teal-700/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30 text-xs font-bold">
                اليوم: {todayArabic}
              </span>
              <h2 className="text-lg sm:text-xl font-black">
                خطة الزيارات الميدانية لليوم ({todayDoctors.length} أطباء)
              </h2>
            </div>
            <p className="text-xs text-teal-200">
              تابع تنفيذ المسار الميداني، وثّق الزيارات فور إتمامها، وحدث حالة الأطباء مباشرة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left bg-white/10 dark:bg-slate-900/10 px-4 py-2 rounded-xl border border-white/10">
              <span className="text-xs text-teal-200 block">نسبة الإنجاز اليوم:</span>
              <span className="text-base font-black">
                {todayDoctors.length > 0
                  ? Math.round(
                      (todayDoctors.filter((d) => d.status === 'مكتمل').length / todayDoctors.length) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Today's Doctor Horizontal Carousel / Grid */}
        {todayDoctors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-teal-700/40">
            {todayDoctors.slice(0, 6).map((doc) => (
              <div
                key={doc.id}
                className="bg-white/10 dark:bg-slate-900/10 hover:bg-white/15 dark:hover:bg-slate-900/15 p-3.5 rounded-xl border border-white/10 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${getSignificanceBadge(
                        doc.significance
                      )}`}
                    >
                      {doc.significance}
                    </span>
                    <button
                      onClick={() => onViewDoctor(doc)}
                      className="font-bold text-white hover:text-teal-200 transition-colors truncate text-right cursor-pointer"
                    >
                      {doc.name}
                    </button>
                  </div>
                  <p className="text-xs text-teal-200 truncate">
                    {doc.specialty} • {doc.clinicName || doc.region}
                  </p>
                  <p className="text-xs text-teal-300 font-medium">المندوب: {doc.responsible}</p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                      doc.status === 'مكتمل'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-teal-700 text-teal-100'
                    }`}
                  >
                    {doc.status}
                  </span>
                  <button
                    onClick={() => onRecordVisit(doc)}
                    className="px-2 py-1 bg-white dark:bg-slate-900 text-teal-900 rounded-lg text-xs font-bold hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-all cursor-pointer shadow-xs"
                  >
                    توثيق الزيارة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter by Representative & Route Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        {/* Rep Selector */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">تصفية حسب المندوب:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedResponsible('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedResponsible === 'all'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              كافة المناديب ({doctors.length})
            </button>
            {customResponsibles.map((resp) => {
              const count = doctors.filter((d) => d.responsible === resp).length;
              return (
                <button
                  key={resp}
                  onClick={() => setSelectedResponsible(resp)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedResponsible === resp
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {resp} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Route Day Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {DOCTOR_ROUTES.map((route) => {
            const list = routeGroups[route] || [];
            const completed = list.filter((d) => d.status === 'مكتمل').length;
            const isToday = route === todayArabic;
            const isSelected = selectedRoute === route;

            return (
              <button
                key={route}
                onClick={() => setSelectedRoute(route)}
                className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : isToday
                    ? 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{route}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                )}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected
                      ? 'bg-slate-800 text-teal-300'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {completed}/{list.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Route Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-bold px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            <span>
              أطباء مسار "{selectedRoute}" ({activeRouteDoctors.length} طبيب)
            </span>
          </div>
          <button
            onClick={onAddDoctor}
            className="text-teal-700 dark:text-teal-300 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة طبيب لهذا المسار</span>
          </button>
        </div>

        {activeRouteDoctors.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 dark:text-slate-500">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40 text-teal-700 dark:text-teal-300" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">لا يوجد أطباء مسجلين في مسار {selectedRoute}</p>
            <button
              onClick={onAddDoctor}
              className="mt-3 px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طبيب الآن</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRouteDoctors.map((doc) => {
              return (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 p-4 shadow-xs transition-all space-y-3 flex flex-col justify-between"
                >
                  {/* Top Row: Doctor Info & Significance */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xs shrink-0 ${getSignificanceBadge(
                            doc.significance
                          )}`}
                        >
                          {doc.significance}
                        </div>
                        <div>
                          <button
                            onClick={() => onViewDoctor(doc)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-teal-700 dark:hover:text-teal-300 transition-colors text-right text-xs leading-snug"
                          >
                            {doc.name}
                          </button>
                          <p className="text-xs text-teal-800 dark:text-teal-200 font-bold mt-0.5">
                            {doc.specialty || 'طبيب عام'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${getStatusBadge(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    {/* Clinic & Location */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {doc.clinicName && (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{doc.clinicName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{doc.region}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                        <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>المندوب: {doc.responsible}</span>
                      </div>
                    </div>

                    {/* Task Description */}
                    {doc.taskDesc && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {doc.taskDesc}
                      </p>
                    )}

                    {doc.samplesGiven && (
                      <div className="bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 text-xs text-teal-900 font-medium flex items-center gap-1">
                        <Package className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="truncate">العينات: {doc.samplesGiven}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {doc.phone && (
                        <>
                          <a
                            href={`tel:${doc.phone}`}
                            title="اتصال هاتف"
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${doc.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            title="محادثة واتساب"
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={doc.status}
                        onChange={(e) =>
                          onUpdateStatus(doc.id, e.target.value as DoctorVisitStatus)
                        }
                        className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="مخطط">مخطط</option>
                        <option value="قيد تنفيذ">قيد تنفيذ</option>
                        <option value="مكتمل">مكتمل</option>
                        <option value="متابعة">متابعة</option>
                        <option value="مرحل">مرحل</option>
                        <option value="ملغي">ملغي</option>
                      </select>

                      <button
                        onClick={() => onRecordVisit(doc)}
                        className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>توثيق</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
