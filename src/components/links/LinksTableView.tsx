import React, { useState } from 'react';
import { LinkRecord } from '../../types/linksLibrary';
import {
  ExternalLink,
  Copy,
  Check,
  Star,
  Edit2,
  Trash2,
  CopyPlus,
  ArrowUpDown,
  SearchX,
} from 'lucide-react';
import { formatValidUrl } from '../../utils/linksExport';

interface LinksTableViewProps {
  links: LinkRecord[];
  onToggleFavorite: (id: string) => void;
  onVisit: (id: string, url: string) => void;
  onEdit: (link: LinkRecord) => void;
  onDelete: (id: string) => void;
  onClone: (link: LinkRecord) => void;
}

type SortField = 'siteName' | 'classification' | 'category' | 'importance' | 'visitCount';

export const LinksTableView: React.FC<LinksTableViewProps> = ({
  links,
  onToggleFavorite,
  onVisit,
  onEdit,
  onDelete,
  onClone,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('importance');
  const [sortAsc, setSortAsc] = useState(true);

  const handleCopy = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formatValidUrl(url));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedLinks = [...links].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    return sortAsc ? strA.localeCompare(strB, 'ar') : strB.localeCompare(strA, 'ar');
  });

  const getImportanceBadgeClass = (imp: string) => {
    const i = (imp || '').toUpperCase();
    if (i === 'A') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (i === 'B') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (i === 'C') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (i === 'D') return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (links.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-12 text-center my-6">
        <SearchX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">لا توجد روابط لعرضها في الجدول</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700/90 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-xs min-w-[820px] print:min-w-0">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold select-none">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th
                onClick={() => handleSort('siteName')}
                className="py-3 px-4 cursor-pointer hover:text-purple-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>اسم الموقع والوصف</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('classification')}
                className="py-3 px-4 cursor-pointer hover:text-purple-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>التصنيف</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="py-3 px-4 cursor-pointer hover:text-purple-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>الفئة والنوع</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('importance')}
                className="py-3 px-4 text-center cursor-pointer hover:text-purple-700 transition-colors w-24"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>الأهمية</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center w-28">الرابط السريع</th>
              <th className="py-3 px-4 text-center w-28">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedLinks.map((link, idx) => {
              const impClass = getImportanceBadgeClass(link.importance);
              const isCopied = copiedId === link.id;

              return (
                <tr
                  key={link.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  {/* Row number & favorite */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onToggleFavorite(link.id)}
                        className={`p-1 rounded-md transition-colors ${
                          link.isFavorite
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-slate-300 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                        }`}
                        title={link.isFavorite ? 'إزالة من المفضلة' : 'تفضيل'}
                      >
                        <Star className={`w-3.5 h-3.5 ${link.isFavorite ? 'fill-amber-500' : ''}`} />
                      </button>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{idx + 1}</span>
                    </div>
                  </td>

                  {/* Name & Desc */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-black text-slate-900 dark:text-slate-100 group-hover:text-purple-700 transition-colors">
                      {link.siteName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {link.desc || 'لا يوجد وصف'}
                    </div>
                    {link.notes && (
                      <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 px-1.5 py-0.5 rounded mt-1 inline-block">
                        ملاحظة: {link.notes}
                      </div>
                    )}
                  </td>

                  {/* Classification */}
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 font-bold rounded-md border border-purple-100">
                      {link.classification || 'عام'}
                    </span>
                  </td>

                  {/* Category & Type */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{link.category || 'غير محدد'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                        {link.type || 'موقع'}
                      </span>
                    </div>
                  </td>

                  {/* Importance */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${impClass}`}
                    >
                      {link.importance || 'C'}
                    </span>
                  </td>

                  {/* Quick Link & Copy */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={(e) => handleCopy(link.id, link.url, e)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                        title="نسخ الرابط"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          onVisit(link.id, link.url);
                          window.open(formatValidUrl(link.url), '_blank', 'noopener,noreferrer');
                        }}
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                        title="زيارة الموقع"
                      >
                        <span>زيارة</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Actions (Edit, Clone, Delete) */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(link)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onClone(link)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                        title="استنساخ"
                      >
                        <CopyPlus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDelete(link.id)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="حذف"
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
  );
};
