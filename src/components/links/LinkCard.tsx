import React, { useState } from 'react';
import { LinkRecord } from '../../types/linksLibrary';
import {
  ExternalLink,
  Copy,
  Check,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  CopyPlus,
  Globe,
  Sparkles,
  Shield,
  FileSpreadsheet,
  Download,
  Share2,
  Send,
  MessageCircle,
} from 'lucide-react';
import { formatValidUrl } from '../../utils/linksExport';

interface LinkCardProps {
  link: LinkRecord;
  onToggleFavorite: (id: string) => void;
  onVisit: (id: string, url: string) => void;
  onEdit: (link: LinkRecord) => void;
  onDelete: (id: string) => void;
  onClone: (link: LinkRecord) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  onToggleFavorite,
  onVisit,
  onEdit,
  onDelete,
  onClone,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formatValidUrl(link.url));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVisit(link.id, link.url);
    window.open(formatValidUrl(link.url), '_blank', 'noopener,noreferrer');
  };

  // Importance badge style based on PRD 8.2
  const getImportanceBadge = (imp: string) => {
    const i = (imp || '').toUpperCase();
    if (i === 'A') {
      return {
        bg: 'bg-purple-100 text-purple-800 border-purple-300 ring-1 ring-purple-500/20',
        label: 'A - فائق الأهمية',
        dot: 'bg-purple-600',
      };
    }
    if (i === 'B') {
      return {
        bg: 'bg-cyan-100 text-cyan-800 border-cyan-300 ring-1 ring-cyan-500/20',
        label: 'B - مهم',
        dot: 'bg-cyan-600',
      };
    }
    if (i === 'C') {
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
        label: 'C - متوسط',
        dot: 'bg-amber-500',
      };
    }
    if (i === 'D') {
      return {
        bg: 'bg-rose-100 text-rose-800 border-rose-300',
        label: 'D - منخفض',
        dot: 'bg-rose-500',
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      label: imp || 'عادي',
      dot: 'bg-slate-400',
    };
  };

  // Type icon & styling
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'فيسبوك':
        return { icon: <MessageCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />, label: 'فيسبوك', bg: 'bg-blue-50 text-blue-700' };
      case 'تلجرام':
        return { icon: <Send className="w-3 h-3 text-sky-500" />, label: 'تلجرام', bg: 'bg-sky-50 text-sky-700' };
      case 'الانستجرام':
        return { icon: <Share2 className="w-3 h-3 text-pink-600 dark:text-pink-400" />, label: 'انستجرام', bg: 'bg-pink-50 text-pink-700' };
      case 'تحميل':
        return { icon: <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />, label: 'تحميل', bg: 'bg-emerald-50 text-emerald-700' };
      case 'موقع دفع':
        return { icon: <Globe className="w-3 h-3 text-amber-600 dark:text-amber-400" />, label: 'موقع دفع', bg: 'bg-amber-50 text-amber-700' };
      default:
        return { icon: <Globe className="w-3 h-3 text-slate-600 dark:text-slate-300" />, label: type || 'موقع رسمي', bg: 'bg-slate-100 text-slate-700' };
    }
  };

  // Classification icon
  const getClassificationIcon = (cls: string) => {
    if (cls.includes('ذكاء') || cls.includes('كلود') || cls.includes('جيمنايل') || cls.includes('ديب سيك') || cls.includes('جي بي تي')) {
      return <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
    }
    if (cls.includes('حماية') || cls.includes('سيبراني') || cls.includes('امان')) {
      return <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
    }
    if (cls.includes('اوفس') || cls.includes('شيت') || cls.includes('اكسل') || cls.includes('ورد')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
    return <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
  };

  const impStyle = getImportanceBadge(link.importance);
  const typeStyle = getTypeBadge(link.type);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700/90 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/5 transition-all flex flex-col justify-between p-4 relative group">
      {/* Top Bar: Badges + Favorite & Menu */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Importance badge */}
            <span
              className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full border ${impStyle.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${impStyle.dot}`} />
              {impStyle.label}
            </span>

            {/* Type badge */}
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${typeStyle.bg}`}>
              {typeStyle.icon}
              {typeStyle.label}
            </span>
          </div>

          {/* Top Actions: Favorite & Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFavorite(link.id)}
              title={link.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              className={`p-1.5 rounded-lg transition-colors ${
                link.isFavorite
                  ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                  : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
              }`}
            >
              <Star className={`w-4 h-4 ${link.isFavorite ? 'fill-amber-500' : ''}`} />
            </button>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 text-xs">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(link);
                      }}
                      className="w-full text-right px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>تعديل الرابط</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onClone(link);
                      }}
                      className="w-full text-right px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <CopyPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>استنساخ الرابط</span>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(link.id);
                      }}
                      className="w-full text-right px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Site Name & Icon */}
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors shrink-0 mt-0.5">
            {getClassificationIcon(link.classification)}
          </div>
          <div>
            <h3
              onClick={handleVisit}
              className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-purple-700 transition-colors cursor-pointer hover:underline line-clamp-1"
            >
              {link.siteName}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate max-w-[210px] dir-ltr text-right">
              {link.url.replace(/^https?:\/\//i, '')}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed line-clamp-2 min-h-[36px]">
          {link.desc || 'لا يوجد وصف مفصل لهذا الرابط'}
        </p>

        {/* Categories & Classification Tag Pills */}
        <div className="mt-3 flex flex-wrap gap-1">
          {link.classification && (
            <span className="text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
              {link.classification}
            </span>
          )}
          {link.category && (
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
              {link.category}
            </span>
          )}
        </div>

        {/* Notes (if any) */}
        {link.notes && (
          <div className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-snug">
            <span className="font-bold text-slate-700 dark:text-slate-200">ملاحظة: </span>
            {link.notes}
          </div>
        )}
      </div>

      {/* Footer: Copy Button & Direct Visit Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="نسخ الرابط للحافظة"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>نسخ الرابط</span>
            </>
          )}
        </button>

        {/* Direct Open Button */}
        <button
          onClick={handleVisit}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:shadow-md hover:shadow-purple-500/20 active:scale-95"
        >
          <span>زيارة الموقع</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
