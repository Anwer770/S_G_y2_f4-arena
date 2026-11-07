import React from 'react';
import { LinkRecord, LinksKPIs } from '../../types/linksLibrary';
import { Printer, ArrowRight, Globe } from 'lucide-react';

interface LinksPrintReportProps {
  links: LinkRecord[];
  kpis: LinksKPIs;
  onBack: () => void;
}

export const LinksPrintReport: React.FC<LinksPrintReportProps> = ({
  links,
  kpis,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 md:p-10 my-4 shadow-sm print:m-0 print:p-0 print:border-none print:shadow-none">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700 mb-6 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى المكتبة</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            عدد الروابط المشمولة في التقرير: {links.length}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير / تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Header */}
      <div className="text-center pb-6 border-b-2 border-slate-800">
        <div className="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-800 rounded-xl mb-3 print:border print:border-purple-300">
          <Globe className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
          تقرير الفهرس الشامل لمكتبة الروابط والأدوات الرقمية
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')} - المنظومة الموحدة الشاملة
        </p>
      </div>

      {/* KPI Summary Block */}
      <div className="grid grid-cols-4 gap-3 my-6 text-center">
        <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <span className="block text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي الروابط</span>
          <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">{kpis.total}</span>
        </div>
        <div className="p-3 border border-purple-200 dark:border-purple-800 rounded-xl bg-purple-50/50 dark:bg-purple-950/40">
          <span className="block text-xs text-purple-700 font-bold">أدوات الذكاء الاصطناعي</span>
          <span className="text-lg font-black text-purple-900 font-mono">{kpis.aiCount}</span>
        </div>
        <div className="p-3 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/40">
          <span className="block text-xs text-emerald-700 dark:text-emerald-300 font-bold">الأوفيس والجداول</span>
          <span className="text-lg font-black text-emerald-900 font-mono">{kpis.officeCount}</span>
        </div>
        <div className="p-3 border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50/50 dark:bg-amber-950/40">
          <span className="block text-xs text-amber-700 dark:text-amber-300 font-bold">الروابط المفضلة</span>
          <span className="text-lg font-black text-amber-900 font-mono">{kpis.favoritesCount}</span>
        </div>
      </div>

      {/* Links Detailed Table */}
      <div className="w-full overflow-x-auto print:overflow-visible">
      <table className="w-full text-right border-collapse text-xs mt-4 min-w-[600px] print:min-w-0">
        <thead>
          <tr className="border-b-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
            <th className="py-2.5 px-3 w-10 text-center">#</th>
            <th className="py-2.5 px-3">اسم الموقع / الأداة</th>
            <th className="py-2.5 px-3">الرابط URL</th>
            <th className="py-2.5 px-3">التصنيف والفئة</th>
            <th className="py-2.5 px-3 text-center w-20">الأهمية</th>
            <th className="py-2.5 px-3">الوصف والملاحظات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {links.map((link, idx) => (
            <tr key={link.id} className="break-inside-avoid">
              <td className="py-2 px-3 text-center font-mono text-slate-400 dark:text-slate-500">{idx + 1}</td>
              <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{link.siteName}</td>
              <td className="py-2 px-3 font-mono text-xs text-slate-600 dark:text-slate-300 dir-ltr text-right max-w-xs truncate">
                {link.url}
              </td>
              <td className="py-2 px-3 text-xs">
                <span className="font-bold text-purple-800">{link.classification}</span>
                <span className="text-slate-400 dark:text-slate-500 mx-1">/</span>
                <span className="text-slate-600 dark:text-slate-300">{link.category}</span>
              </td>
              <td className="py-2 px-3 text-center font-black">
                <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {link.importance}
                </span>
              </td>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-xs leading-snug">
                {link.desc}
                {link.notes && <span className="block text-slate-400 dark:text-slate-500 text-xs mt-0.5">({link.notes})</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Footer Signatures */}
      <div className="mt-12 pt-6 border-t border-slate-300 dark:border-slate-600 grid grid-cols-2 text-center text-xs text-slate-600 dark:text-slate-300">
        <div>
          <span className="block font-bold mb-8">إعداد وتوثيق مسؤول النظام</span>
          <span>....................................</span>
        </div>
        <div>
          <span className="block font-bold mb-8">اعتماد الإدارة العامة</span>
          <span>....................................</span>
        </div>
      </div>
    </div>
  );
};
