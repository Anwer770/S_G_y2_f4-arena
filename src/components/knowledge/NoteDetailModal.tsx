import React, { useState } from 'react';
import { NoteRecord, NoteTaskItem } from '../../types';
import {
  X,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Pin,
  Star,
  Download,
  Printer,
  Share2,
  Calendar,
  Tag,
  Folder,
  Link,
  CheckSquare,
  Paperclip,
  Clock,
  User,
  Stethoscope,
  Briefcase,
  History,
  FileText,
  Copy,
  Check,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface NoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteRecord | null;
  onEdit: (note: NoteRecord) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleTaskItem: (noteId: string, taskId: string) => void;
  onUnlockNote?: (id: string) => void;
  onOpenVersionHistory?: (note: NoteRecord) => void;
  onScheduleReview?: (noteId: string, nextDate: string) => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  isOpen,
  onClose,
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleFavorite,
  onToggleTaskItem,
  onOpenVersionHistory,
  onScheduleReview,
}) => {
  // Pin state for locked notes
  const [pinInput, setPinInput] = useState('');
  const [isUnlockedLocally, setIsUnlockedLocally] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Review reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [newReviewDate, setNewReviewDate] = useState('');

  React.useEffect(() => {
    if (note) {
      setIsUnlockedLocally(!note.isLocked);
      setNewReviewDate(note.nextReviewDate || '');
      setPinInput('');
      setPinError(false);
      setShowReschedule(false);
    }
  }, [note, isOpen]);

  if (!isOpen || !note) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.pinCode && pinInput === note.pinCode) {
      setIsUnlockedLocally(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleCopyContent = () => {
    const textToCopy = `${note.title}\n\n${note.content}\n\n${note.summary ? `الملخص: ${note.summary}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportText = () => {
    const text = `عنوان الملاحظة: ${note.title}\nالكود: ${note.id}\nالتاريخ: ${note.date}\nالنوع: ${note.type}\nالتصنيف: ${note.category}\n\nالمحتوى:\n${note.content}\n\n${note.summary ? `الملخص:\n${note.summary}\n` : ''}${note.tags && note.tags.length > 0 ? `الوسوم: ${note.tags.join(', ')}\n` : ''}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Note-${note.id}.txt`;
    a.click();
  };

  const handleSaveReviewDate = () => {
    if (onScheduleReview && newReviewDate) {
      onScheduleReview(note.id, newReviewDate);
      setShowReschedule(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {note.title}
                </h2>
                {note.isPinned && (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold rounded">
                    📌 مثبتة
                  </span>
                )}
                {note.isFavorite && (
                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 text-xs font-bold rounded">
                    ⭐ مفضلة
                  </span>
                )}
                {note.isLocked && (
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>مقفلة</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                الكود: {note.id} | تاريخ الإنشاء: {note.date} | آخر تعديل: {note.updatedAt || note.date}
              </p>
            </div>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onTogglePin(note.id)}
              title={note.isPinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
              className={`p-2 rounded-lg transition-colors ${
                note.isPinned
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Pin className="w-4 h-4" />
            </button>

            <button
              onClick={() => onToggleFavorite(note.id)}
              title={note.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              className={`p-2 rounded-lg transition-colors ${
                note.isFavorite
                  ? 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-600'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyContent}
              title="نسخ المحتوى"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handlePrint}
              title="طباعة الملاحظة"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportText}
              title="تحميل كملف نصي"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            {onOpenVersionHistory && note.versions && note.versions.length > 0 && (
              <button
                onClick={() => onOpenVersionHistory(note)}
                title="سجل التعديلات والنسخ السابقة"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <History className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body or Lock Screen */}
        {note.isLocked && !isUnlockedLocally ? (
          <div className="flex-1 p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Lock className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                هذه الملاحظة محمية برمز PIN سري
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                الرجاء إدخال رمز الأمان المخصص لهذه الملاحظة لعرض وقراءة المحتوى.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="flex items-center gap-2 max-w-xs w-full">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="أدخل رمز PIN..."
                maxLength={8}
                autoFocus
                className="flex-1 px-4 py-2 text-center text-sm tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1"
              >
                <Unlock className="w-4 h-4" />
                <span>فتح</span>
              </button>
            </form>

            {pinError && (
              <p className="text-xs text-rose-500 font-semibold animate-shake">
                رمز PIN غير صحيح! الرجاء المحاولة مجدداً.
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Meta badges row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg">
                نوع: {note.type}
              </span>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg">
                تصنيف: {note.category} {note.subCategory ? `/ ${note.subCategory}` : ''}
              </span>
              <span
                className={`px-3 py-1 font-semibold rounded-lg ${
                  note.priority === 'عالية'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : note.priority === 'متوسطة'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                أولوية: {note.priority}
              </span>
              <span
                className={`px-3 py-1 font-semibold rounded-lg ${
                  note.status === 'نشطة'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : note.status === 'قيد المراجعة'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : note.status === 'مكتملة'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                حالة: {note.status}
              </span>

              {note.folderName && (
                <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                  <Folder className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{note.folderName}</span>
                </span>
              )}
            </div>

            {/* Summary if exists */}
            {note.summary && (
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>الملخص التنفيذي:</span>
                </div>
                <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  {note.summary}
                </p>
              </div>
            )}

            {/* Main Note Content */}
            <div className="p-5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 leading-relaxed font-sans whitespace-pre-wrap">
                {note.content}
              </div>
            </div>

            {/* Connected Entities Banner */}
            {(note.linkedCustomerName || note.linkedDoctorName || note.linkedProject || note.source) && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Link className="w-3.5 h-3.5 text-indigo-500" />
                  <span>الارتباطات والشبكة المعرفية:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {note.linkedCustomerName && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs text-slate-400 dark:text-slate-500 block">العميل</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{note.linkedCustomerName}</span>
                      </div>
                    </div>
                  )}
                  {note.linkedDoctorName && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs text-slate-400 dark:text-slate-500 block">الطبيب</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{note.linkedDoctorName}</span>
                      </div>
                    </div>
                  )}
                  {note.linkedProject && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Briefcase className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs text-slate-400 dark:text-slate-500 block">المشروع</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{note.linkedProject}</span>
                      </div>
                    </div>
                  )}
                  {note.source && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs text-slate-400 dark:text-slate-500 block">المصدر</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{note.source}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Checklist / Tasks inside Note */}
            {note.tasks && note.tasks.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span>المهام والتكليفات ({note.tasks.length})</span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {note.tasks.filter((t) => t.completed).length} منجز من {note.tasks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {note.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onToggleTaskItem(note.id, task.id)}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer hover:border-emerald-400 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span
                          className={`${
                            task.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200 font-medium'
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Date & Schedule */}
            <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    تاريخ المراجعة القادمة:
                  </span>{' '}
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {note.nextReviewDate || 'غير محدد'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {showReschedule ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={newReviewDate}
                      onChange={(e) => setNewReviewDate(e.target.value)}
                      className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                    />
                    <button
                      onClick={handleSaveReviewDate}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                    >
                      تحديث
                    </button>
                    <button
                      onClick={() => setShowReschedule(false)}
                      className="px-2 py-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                  >
                    + تعيين / تعديل موعد المراجعة
                  </button>
                )}
              </div>
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                  الوسوم:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments list */}
            {note.attachments && note.attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                  المرفقات ({note.attachments.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {note.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                          {att.name}
                        </span>
                      </div>
                      {att.dataUrl && (
                        <a
                          href={att.dataUrl}
                          download={att.name}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 text-xs"
                        >
                          تحميل
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه الملاحظة ونقلها لسلة المحذوفات؟')) {
                onDelete(note.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف الملاحظة</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              إغلاق
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>تعديل الملاحظة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
