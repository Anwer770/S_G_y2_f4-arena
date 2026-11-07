import React from 'react';
import { LinkRecord } from '../../types/linksLibrary';
import { LinkCard } from './LinkCard';
import { SearchX, Plus, Sparkles } from 'lucide-react';

interface LinksGridViewProps {
  links: LinkRecord[];
  onToggleFavorite: (id: string) => void;
  onVisit: (id: string, url: string) => void;
  onEdit: (link: LinkRecord) => void;
  onDelete: (id: string) => void;
  onClone: (link: LinkRecord) => void;
  onAddNew: () => void;
  onResetFilters: () => void;
}

export const LinksGridView: React.FC<LinksGridViewProps> = ({
  links,
  onToggleFavorite,
  onVisit,
  onEdit,
  onDelete,
  onClone,
  onAddNew,
  onResetFilters,
}) => {
  if (links.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-12 text-center my-6">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-200 mb-1">
          لم يتم العثور على أي روابط مطابقة للبحث أو الفلتر المحدد
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          جرب تغيير معايير البحث، أو إلغاء تفعيل الفلاتر النشطة، أو إضافة رابط جديد إلى المكتبة
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            إعادة تعيين الفلاتر
          </button>
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة رابط جديد</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          onToggleFavorite={onToggleFavorite}
          onVisit={onVisit}
          onEdit={onEdit}
          onDelete={onDelete}
          onClone={onClone}
        />
      ))}
    </div>
  );
};
