import React, { useState } from 'react';
import { WorkNote, WorkMeeting, WorkProject, TeamMember } from '../../types/workos';
import {
  BookOpen,
  Users,
  Plus,
  Pin,
  CheckSquare,
  ArrowRight,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Trash2,
  Edit3,
} from 'lucide-react';

interface WorkOSNotesMeetingsViewProps {
  notes: WorkNote[];
  meetings: WorkMeeting[];
  projects?: WorkProject[];
  team?: TeamMember[];
  onOpenQuickAdd?: (type?: string) => void;
  onConvertActionItemToTask?: (actionItem: any, meeting: WorkMeeting) => void;
  onSaveNote?: (note: WorkNote) => void;
  onDeleteNote?: (id: string) => void;
  onSaveMeeting?: (meeting: WorkMeeting) => void;
  onConvertMeetingActionToTask?: (action: any) => void;
}

export const WorkOSNotesMeetingsView: React.FC<WorkOSNotesMeetingsViewProps> = ({
  notes = [],
  meetings = [],
  projects = [],
  team = [],
  onOpenQuickAdd = (..._args: any[]) => {},
  onConvertActionItemToTask = (..._args: any[]) => {},
  onSaveNote,
  onDeleteNote,
  onSaveMeeting,
  onConvertMeetingActionToTask,
}) => {
  const [tab, setTab] = useState<'notes' | 'meetings'>('notes');
  const [noteFilter, setNoteFilter] = useState('all');

  const filteredNotes = (notes || []).filter((n) => {
    if (!n) return false;
    if (noteFilter !== 'all' && n.type !== noteFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Tab Switcher & Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'notes'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>الملاحظات والقرارات ({notes.length})</span>
          </button>
          <button
            onClick={() => setTab('meetings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'meetings'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>محاضر الاجتماعات ({meetings.length})</span>
          </button>
        </div>

        <button
          onClick={() => onOpenQuickAdd(tab === 'notes' ? 'note' : 'meeting')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs text-white flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto ${
            tab === 'notes' ? 'bg-purple-700 hover:bg-purple-800' : 'bg-indigo-700 hover:bg-indigo-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{tab === 'notes' ? 'ملاحظة جديدة' : 'محضر اجتماع جديد'}</span>
        </button>
      </div>

      {/* Notes View */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold">تصنيف الملاحظات:</span>
            {['all', 'instruction', 'project', 'idea', 'decision', 'customer'].map((t) => (
              <button
                key={t}
                onClick={() => setNoteFilter(t)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  noteFilter === t ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t === 'all'
                  ? 'الكل'
                  : t === 'instruction'
                  ? 'توجيهات وسياسات'
                  : t === 'project'
                  ? 'ملاحظات مشاريع'
                  : t === 'idea'
                  ? 'أفكار'
                  : t === 'decision'
                  ? 'قرارات'
                  : 'عملاء'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-3 hover:border-purple-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400 rotate-45" />}
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{note.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 border border-purple-200 dark:border-purple-800">
                    {note.type}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-slate-50/70 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {note.content}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {note.tags.map((tag, i) => (
                      <span key={i} className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                    {note.linkedProjectId && (
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded font-mono">
                        {projects.find((p) => p.id === note.linkedProjectId)?.code || 'مشروع'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px]">{note.createdAt.split('T')[0]}</span>
                    {onSaveNote && (
                      <button
                        onClick={() => onSaveNote({ ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() })}
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                          note.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={note.isPinned ? 'إلغاء التثبيت' : 'تثبيت الملاحظة'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteNote && (
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الملاحظة: "${note.title}"؟`)) {
                            onDeleteNote(note.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="حذف الملاحظة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meetings View */}
      {tab === 'meetings' && (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-5 space-y-4 hover:border-indigo-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{meeting.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {meeting.date} • {meeting.time}
                    </span>
                    <span>المشاركون: {meeting.attendees.join('، ')}</span>
                  </div>
                </div>
              </div>

              {/* Agenda & Decisions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">جدول الأعمال (Agenda):</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    {meeting.agenda.map((ag, i) => (
                      <li key={i}>{ag}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-emerald-50/40 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <span className="font-bold text-emerald-900 block">القرارات والتوصيات المعتمدة:</span>
                  <ul className="list-disc list-inside space-y-1 text-emerald-800 dark:text-emerald-200">
                    {meeting.decisions.map((dec, i) => (
                      <li key={i}>{dec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action items with 1-click conversion to Task */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">بنود الإجراءات التنفيذية الناتجة (Action Items):</div>
                <div className="space-y-1.5">
                  {meeting.actionItems.map((act) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{act.title}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">المسؤول: {act.assignee}</span>
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">التسليم: {act.dueDate}</span>
                      </div>

                      <button
                        onClick={() => {
                          if (onConvertMeetingActionToTask) {
                            onConvertMeetingActionToTask({
                              title: act.title,
                              assigneeId: team.find((tm) => tm.name === act.assignee)?.id,
                              dueDate: act.dueDate,
                            });
                          } else {
                            onConvertActionItemToTask(act, meeting);
                          }
                        }}
                        className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 rounded text-xs font-bold shrink-0 cursor-pointer"
                      >
                        تحويل لمهمة في النظام ⬅️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
