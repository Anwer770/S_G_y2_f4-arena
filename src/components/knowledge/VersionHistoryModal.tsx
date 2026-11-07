import React, { useState } from 'react';
import { NoteRecord, NoteVersion } from '../../types';
import { X, History, RotateCcw, FileText, Check, Clock, User } from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteRecord | null;
  onRestoreVersion: (noteId: string, version: NoteVersion) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  note,
  onRestoreVersion,
}) => {
  const versions = note?.versions || [];
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);

  React.useEffect(() => {
    if (note && note.versions && note.versions.length > 0) {
      setSelectedVersion(note.versions[note.versions.length - 1]);
    } else {
      setSelectedVersion(null);
    }
  }, [note, isOpen]);

  if (!isOpen || !note) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                سجل النسخ السابقة والتعديلات (Version History)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                الملاحظة: {note.title} ({versions.length} نسخة محفوظة)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (2 columns: left timeline, right version preview) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800">
          {/* Versions List (Col 4) */}
          <div className="md:col-span-4 p-4 overflow-y-auto space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              النسخ المحفوظة:
            </h4>

            {versions.map((ver, idx) => (
              <div
                key={ver.id}
                onClick={() => setSelectedVersion(ver)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1 ${
                  selectedVersion?.id === ver.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">نسخة #{idx + 1}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{ver.date}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {ver.changeSummary || 'تعديل وحفظ تلقائي'}
                </p>
              </div>
            ))}

            {versions.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                لا توجد نسخ أقدم محفوظة لهذه الملاحظة حتى الآن.
              </p>
            )}
          </div>

          {/* Version Preview (Col 8) */}
          <div className="md:col-span-8 p-6 overflow-y-auto space-y-4 flex flex-col justify-between">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedVersion.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      تاريخ النسخة: {selectedVersion.date}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'هل أنت متأكد من استعادة هذه النسخة واستبدال المحتوى الحالي بها؟'
                        )
                      ) {
                        onRestoreVersion(note.id, selectedVersion);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة هذه النسخة</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                  {selectedVersion.content}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                اختر نسخة من القائمة لعرض تفاصيلها واستعادتها
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
