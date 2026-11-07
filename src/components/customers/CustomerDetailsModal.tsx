import React, { useState } from 'react';
import { Customer, CustomerVisitRecord } from '../../types';
import {
  X,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  Phone,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Plus,
  Share2,
  Printer,
  Edit,
  Trash2,
  TrendingUp,
  Smartphone,
  Receipt,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  visits: CustomerVisitRecord[];
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onAddVisit: (customer: Customer) => void;
  onOpenStatement: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customer,
  visits,
  onEditCustomer,
  onDeleteCustomer,
  onAddVisit,
  onOpenStatement,
}) => {
  if (!isOpen || !customer) return null;

  const customerVisits = visits.filter((v) => v.customerId === customer.id);

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'القيصر الذهبي':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'توب مكياجي':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'عفيف':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'الأطباء':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'مكتمل':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'قيد تنفيذ':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'مخطط':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'متابعة':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ملغي':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'مصفر':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white px-6 py-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-black text-lg">
              {customer.subId || customer.id.slice(-4)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight">{customer.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSourceBadgeColor(
                    customer.source
                  )}`}
                >
                  {customer.source}
                </span>
                {customer.isInternalAccount && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-bold">
                    حساب داخلي / عهدة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                <span>المعرف: {customer.id}</span>
                <span>•</span>
                <span>المنطقة: {customer.region}</span>
                <span>•</span>
                <span>مسار الزيارة: {customer.route}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Action Quick Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {customer.phone && (
                <>
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    اتصال {customer.phone}
                  </a>
                  <a
                    href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 text-green-700 rounded-xl font-bold border border-green-200 dark:border-green-800 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    مراسلة واتساب
                  </a>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenStatement(customer)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#0c7042] dark:text-emerald-300 rounded-xl font-bold border border-[#25D366]/30 transition-colors cursor-pointer"
                title="إرسال كشف الحساب عبر تطبيق واتساب بنقرة واحدة"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
                إرسال بالواتساب
              </button>
              <button
                onClick={() => onOpenStatement(customer)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-xl font-bold border border-amber-300 transition-colors cursor-pointer"
                title="معاينة وطباعة كشف الحساب (A4 رسمي أو إيصال حراري 80mm)"
              >
                <Printer className="w-3.5 h-3.5" />
                كشف حساب (A4 / 80mm)
              </button>
              <button
                onClick={() => onAddVisit(customer)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                تسجيل زيارة
              </button>
              <button
                onClick={() => onEditCustomer(customer)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                تعديل
              </button>
            </div>
          </div>

          {/* Financial Balances KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-4 rounded-xl border ${
                customer.balanceYER < 0
                  ? 'bg-rose-50/70 border-rose-200'
                  : customer.balanceYER > 0
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold mb-1">
                <span>الرصيد بالريال اليمني</span>
                <span className="text-xs">YER</span>
              </div>
              <div
                className={`text-xl font-black font-mono ${
                  (customer.balanceYER || 0) < 0
                    ? 'text-rose-600'
                    : (customer.balanceYER || 0) > 0
                    ? 'text-emerald-700'
                    : 'text-slate-700'
                }`}
              >
                {(customer.balanceYER || 0).toLocaleString('ar-YE')} ريال
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {(customer.balanceYER || 0) < 0 ? '⚠️ مديونية مستحقة التحصيل' : 'رصيد دائن / تسوية'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold mb-1">
                <span>الرصيد بالريال السعودي</span>
                <span className="text-xs">SAR</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-200">
                {(customer.balanceSAR || 0).toLocaleString('ar-SA')} ر.س
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">حساب العملة الأجنبية</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold mb-1">
                <span>الرصيد بالدولار الأمريكي</span>
                <span className="text-xs">USD</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-200">
                ${(customer.balanceUSD || 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">حساب العملة الأجنبية</p>
            </div>
          </div>

          {/* Grid Information Profile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Right Column: Customer Details */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h3 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                معلومات الحساب والمسار
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">المعرف الرئيسي:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{customer.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">المعرف الفرعي (الرمز):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{customer.subId || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">المصدر التجاري:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">{customer.source}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">المنطقة الجغرافية:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{customer.region}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">مسار الزيارة:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">{customer.route}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">مستوى الأهمية:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {customer.significance === 'A'
                      ? '⭐ A - عالي الأهمية'
                      : customer.significance === 'B'
                      ? 'B - متوسط'
                      : customer.significance === 'C'
                      ? 'C - عادي'
                      : '√ - مؤكد'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">العنوان:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{customer.address || 'غير محدد'}</span>
                </div>
              </div>
            </div>

            {/* Left Column: Visit & Task Status */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h3 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                المهمة وحالة المتابعة الميدانية
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">المندوب المسؤول:</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">{customer.responsible}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">حالة الزيارة:</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${getStatusBadgeColor(customer.status)}`}>
                    {customer.status}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">تاريخ البدء:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{customer.dateBegin || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">تاريخ الانتهاء / الاستحقاق:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{customer.dateEnd || '—'}</span>
                </div>
                {customer.taskDesc && (
                  <div className="pt-2">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">وصف المهمة:</span>
                    <p className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      {customer.taskDesc}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {customer.notes && (
            <div className="bg-amber-50/50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-black text-amber-900 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                ملاحظات وتفاصيل إضافية
              </h4>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{customer.notes}</p>
            </div>
          )}

          {/* Visit History Log Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                سجل الزيارات الميدانية المنفذة ({customerVisits.length})
              </h3>
              <button
                onClick={() => onAddVisit(customer)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                إضافة تقرير زيارة
              </button>
            </div>

            {customerVisits.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                لا توجد سجلات زيارات سابقة مسجلة لهذا العميل حتى الآن
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                <div className="w-full overflow-x-auto print:overflow-visible">
                <table className="w-full text-right border-collapse min-w-[600px] print:min-w-0">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs">
                    <tr>
                      <th className="p-2.5">التاريخ / اليوم</th>
                      <th className="p-2.5">المندوب</th>
                      <th className="p-2.5">الحالة</th>
                      <th className="p-2.5">المبلغ المحصل</th>
                      <th className="p-2.5">النتائج والملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {customerVisits.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {v.date} ({v.dayOfWeek})
                        </td>
                        <td className="p-2.5 font-bold text-indigo-700 dark:text-indigo-300">{v.responsible}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-xs border ${getStatusBadgeColor(
                              v.status
                            )}`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {v.amountCollectedYER ? `${v.amountCollectedYER.toLocaleString()} ريال` : '—'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300 font-medium">{v.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={() => onDeleteCustomer(customer.id)}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف العميل نهائياً
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
