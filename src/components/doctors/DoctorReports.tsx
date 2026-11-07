import React, { useMemo } from 'react';
import { DoctorRecord, DoctorVisitLog } from '../../types';
import { calculateDoctorStats } from '../../utils/doctors';
import {
  Stethoscope,
  Calendar,
  User,
  MapPin,
  Award,
  Clock,
  Target,
  Printer,
} from 'lucide-react';

interface Props {
  doctors: DoctorRecord[];
  visits: DoctorVisitLog[];
}

export const DoctorReports: React.FC<Props> = ({ doctors, visits }) => {
  const stats = useMemo(() => calculateDoctorStats(doctors, visits), [doctors, visits]);

  const benchmarkMet = stats.completionRate >= 80;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Trigger Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">التقرير الإحصائي والتحليلي لزيارات الأطباء</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">تحليل التغطية الميدانية، نسب إنجاز المناديب، ومؤشرات الأداء</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-teal-400" />
          <span>طباعة تقرير الإنجاز</span>
        </button>
      </div>
      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Doctors */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs">
            <span>إجمالي شبكة الأطباء والمراكز</span>
            <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
            {stats.totalDoctors}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">طبيب ومركز مسجل في المنظومة</p>
        </div>

        {/* Completion Rate Target Benchmark */}
        <div
          className={`p-4 rounded-xl border shadow-2xs ${
            benchmarkMet
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-amber-50/50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-bold text-xs">
            <span>نسبة إنجاز خطة الزيارات</span>
            <Target
              className={`w-4 h-4 ${benchmarkMet ? 'text-emerald-600' : 'text-amber-600'}`}
            />
          </div>
          <div
            className={`text-2xl font-black font-mono mt-1 ${
              benchmarkMet ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {stats.completionRate}%
          </div>
          <div className="flex items-center justify-between text-xs mt-0.5">
            <span className="text-slate-500 dark:text-slate-400">
              {stats.completedCount} من {stats.totalDoctors} مكتمل
            </span>
            <span
              className={`font-bold px-1.5 py-0.2 rounded-md ${
                benchmarkMet
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              الهدف: ≥ 80%
            </span>
          </div>
        </div>

        {/* Documented Visits Log */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs">
            <span>سجلات الزيارات الموثقة</span>
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-700 dark:text-indigo-300 mt-1">
            {visits.length}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">تقرير زيارة مسجل في قاعدة البيانات</p>
        </div>

        {/* Medical Reps */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs">
            <span>المناديب والفرق الميدانية</span>
            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-700 mt-1">
            {stats.responsibleStats.length}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">مندوب نشط يغطي المسارات</p>
        </div>
      </div>

      {/* Target Progress Gauge */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            <span className="font-black text-slate-900 dark:text-slate-100">مؤشر التقدم العام نحو الهدف (Target Gauge)</span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-bold">
            {stats.completedCount} من أصل {stats.totalDoctors} زيارة مطلوبة ({stats.completionRate}%)
          </span>
        </div>

        <div className="relative w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              benchmarkMet
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
                : 'bg-gradient-to-r from-amber-400 to-teal-600'
            }`}
            style={{ width: `${Math.min(100, stats.completionRate)}%` }}
          />
          {/* 80% Benchmark Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-800 shadow-xs z-10"
            style={{ left: '20%' }} // right-to-left: 80% is at 20% from left
            title="الحد المستهدف 80%"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
          <span>0%</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">المستهدف: 80%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Grid: Geographic Regions & Specialty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Geographic Coverage */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700 dark:text-teal-300" />
              التوزيع الجغرافي للمناطق والعيادات
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">
              {stats.regionBreakdown.length} منطقة
            </span>
          </div>

          <div className="space-y-3">
            {stats.regionBreakdown.map((item) => (
              <div key={item.region} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800 dark:text-slate-200">{item.region}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {item.count} طبيب ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Medical Specialties Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              التوزيع حسب التخصصات الطبية
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">
              {stats.specialtyBreakdown.length} تخصص
            </span>
          </div>

          <div className="space-y-3">
            {stats.specialtyBreakdown.map((item) => (
              <div key={item.specialty} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800 dark:text-slate-200">{item.specialty}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {item.count} طبيب
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalDoctors > 0 ? (item.count / stats.totalDoctors) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Medical Representatives Performance Matrix */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            جدول أداء المناديب الميدانيين ونسب إنجاز الزيارات
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">
            {stats.responsibleStats.length} مندوب
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[600px] print:min-w-0" dir="rtl">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">اسم المندوب المسؤول</th>
                <th className="py-2.5 px-3 text-center">إجمالي الأطباء</th>
                <th className="py-2.5 px-3 text-center">الزيارات المكتملة</th>
                <th className="py-2.5 px-3 text-center">قيد التنفيذ / مخطط</th>
                <th className="py-2.5 px-3 text-center w-40">نسبة الإنجاز</th>
                <th className="py-2.5 px-3 text-center">تقييم الأداء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.responsibleStats.map((rep) => {
                const isHigh = rep.completionRate >= 80;
                const isMed = rep.completionRate >= 50 && rep.completionRate < 80;

                return (
                  <tr key={rep.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{rep.name}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {rep.total}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {rep.completed}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500 dark:text-slate-400">
                      {rep.total - rep.completed}
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono font-bold">
                          <span>{rep.completionRate}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHigh
                                ? 'bg-emerald-600'
                                : isMed
                                ? 'bg-teal-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${rep.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isHigh
                            ? 'bg-emerald-100 text-emerald-800'
                            : isMed
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isHigh ? 'ممتاز (مستهدف)' : isMed ? 'جيد جداً' : 'يحتاج متابعة'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Significance & Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Significance Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            توزيع تصنيف أهمية الأطباء (Significance)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {stats.significanceBreakdown.map((item) => (
              <div
                key={item.key}
                className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-1"
              >
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الفئة {item.key}</span>
                <p className="text-lg font-black font-mono text-purple-800">{item.count}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {stats.totalDoctors > 0
                    ? Math.round((item.count / stats.totalDoctors) * 100)
                    : 0}
                  % من الإجمالي
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Visit Status Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            توزيع حالات الزيارات بالمنظومة
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
            {stats.statusBreakdown.map((st) => (
              <div
                key={st.key}
                className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5 text-center"
              >
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{st.key}</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-slate-100 block">
                  {st.count}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {st.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
