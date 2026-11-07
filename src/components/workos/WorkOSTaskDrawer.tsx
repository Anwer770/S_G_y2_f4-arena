import React, { useState, useEffect } from 'react';
import {
  X,
  CheckSquare,
  Clock,
  Calendar,
  User,
  Users,
  FolderKanban,
  Tag,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Play,
  Pause,
  Save,
  Trash2,
  Share2,
  ExternalLink,
  Target,
  ArrowRight,
  ListTodo,
  Plus,
} from 'lucide-react';
import {
  WorkTask,
  WorkProject,
  TeamMember,
  TaskStatus,
  TaskPriority,
  WorkSubtask,
  TaskComment,
} from '../../types/workos';

interface WorkOSTaskDrawerProps {
  isOpen: boolean;
  task: WorkTask | null;
  projects: WorkProject[];
  team: TeamMember[];
  onClose: () => void;
  onSaveTask: (updatedTask: WorkTask) => void;
  onDeleteTask: (taskId: string) => void;
  onConvertToProject?: (task: WorkTask) => void;
  onStartTimer?: (task: WorkTask) => void;
}

export const WorkOSTaskDrawer: React.FC<WorkOSTaskDrawerProps> = ({
  isOpen,
  task,
  projects,
  team,
  onClose,
  onSaveTask,
  onDeleteTask,
  onConvertToProject,
  onStartTimer,
}) => {
  // Local state for real-time edits - hooks called unconditionally
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'planned');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [projectId, setProjectId] = useState(task?.projectId || '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [participants, setParticipants] = useState<string[]>(task?.participants || []);
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [progress, setProgress] = useState(task?.progress || 0);

  // Subtasks
  const [subtasks, setSubtasks] = useState<WorkSubtask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Comments
  const [comments, setComments] = useState<TaskComment[]>(task?.comments || []);
  const [newCommentText, setNewCommentText] = useState('');

  // Active sub-tab
  const [drawerTab, setDrawerTab] = useState<'details' | 'subtasks' | 'comments' | 'attachments' | 'activity'>('details');

  // Sync state if task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'planned');
      setPriority(task.priority || 'medium');
      setProjectId(task.projectId || '');
      setAssigneeId(task.assigneeId || '');
      setParticipants(task.participants || []);
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setProgress(task.progress || 0);
      setSubtasks(task.subtasks || []);
      setComments(task.comments || []);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    const updated: WorkTask = {
      ...task,
      title: title.trim() || task.title,
      description,
      status,
      priority,
      projectId: projectId || undefined,
      assigneeId,
      participants,
      startDate: startDate || undefined,
      dueDate,
      progress: status === 'completed' ? 100 : progress,
      subtasks,
      comments,
      updatedAt: new Date().toISOString(),
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    };
    onSaveTask(updated);
    onClose();
  };

  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st));
    setSubtasks(updated);
    // Auto adjust progress
    if (updated.length > 0) {
      const completedCount = updated.filter((s) => s.completed).length;
      setProgress(Math.round((completedCount / updated.length) * 100));
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub: WorkSubtask = {
      id: `sub_${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newCom: TaskComment = {
      id: `com_${Date.now()}`,
      author: 'محمد العولقي',
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments([newCom, ...comments]);
    setNewCommentText('');
  };

  const linkedProject = projects.find((p) => p.id === projectId);
  const assigneeMember = team.find((m) => m.id === assigneeId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 max-w-2xl w-full sm:w-[90%] md:w-full bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
              {task.taskNumber || 'TASK'}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">لوحة تفاصيل المهمة</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onStartTimer && (
              <button
                onClick={() => onStartTimer(task)}
                className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200/80 dark:border-emerald-800/80 transition cursor-pointer"
                title="بدء تتبع الوقت لهذه المهمة"
              >
                <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>تشغيل المؤقت</span>
              </button>
            )}

            {onConvertToProject && (
              <button
                onClick={() => {
                  onConvertToProject(task);
                  onClose();
                }}
                className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-800 rounded-xl text-xs font-bold flex items-center gap-1 border border-indigo-200/80 dark:border-indigo-800/80 transition cursor-pointer"
                title="تحويل هذه المهمة إلى مشروع مستقل مع كافة تفاصيلها"
              >
                <FolderKanban className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>تحويل إلى مشروع</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Tabs Navigation */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setDrawerTab('details')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              drawerTab === 'details'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            التفاصيل الأساسية
          </button>

          <button
            onClick={() => setDrawerTab('subtasks')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              drawerTab === 'subtasks'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>المهام الفرعية</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {subtasks.length}
            </span>
          </button>

          <button
            onClick={() => setDrawerTab('comments')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              drawerTab === 'comments'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>التعليقات</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {comments.length}
            </span>
          </button>

          <button
            onClick={() => setDrawerTab('attachments')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              drawerTab === 'attachments'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            المرفقات والملفات
          </button>

          <button
            onClick={() => setDrawerTab('activity')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              drawerTab === 'activity'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            سجل النشاط
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: DETAILS */}
          {drawerTab === 'details' && (
            <div className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">اسم المهمة:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-hidden"
                  placeholder="عنوان المهمة..."
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">وصف المهمة وملاحظات التنفيذ:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:border-teal-600 focus:outline-hidden"
                  placeholder="تفاصيل وإرشادات المهمة..."
                />
              </div>

              {/* Two columns grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Linked Project */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المشروع المرتبط:</label>
                    {!projectId && (
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        مهمة مستقلة (بدون مشروع)
                      </span>
                    )}
                  </div>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer font-medium"
                  >
                    <option value="">ربط بمشروع... (اختر مشروعاً)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {!projectId && onConvertToProject && task && (
                    <button
                      type="button"
                      onClick={() => onConvertToProject(task)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                      title="إنشاء مشروع تنفيذي جديد وربط هذه المهمة به دون فقدان أي بيانات"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إنشاء مشروع جديد ثم ربط المهمة به</span>
                    </button>
                  )}
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">المسؤول عن التنفيذ:</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {team.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">الحالة:</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const newSt = e.target.value as TaskStatus;
                      setStatus(newSt);
                      if (newSt === 'completed') setProgress(100);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="planned">لم تبدأ (مخططة)</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="review">قيد المراجعة</option>
                    <option value="completed">مكتملة</option>
                    <option value="delayed">متأخرة</option>
                    <option value="blocked">معلقة / متوقفة</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">مستوى الأولوية:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="urgent">حرجة وعاجلة (Q1)</option>
                    <option value="high">عالية (Q2)</option>
                    <option value="medium">متوسطة (Q3)</option>
                    <option value="low">منخفضة (Q4)</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">تاريخ البداية:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">تاريخ الاستحقاق:</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Progress Slider */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>نسبة الإنجاز:</span>
                  <span className="font-mono text-teal-800 dark:text-teal-200">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-700"
                />
              </div>

              {/* Participants & Goal */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>المشاركون في المهمة:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {team.map((m) => {
                    const isSelected = participants.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          setParticipants((prev) =>
                            isSelected ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBTASKS */}
          {drawerTab === 'subtasks' && (
            <div className="space-y-3">
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="إضافة مهمة فرعية جديدة..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-1.5">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleToggleSubtask(st.id)}
                    className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      st.completed
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => {}}
                        className="rounded text-teal-600 dark:text-teal-400 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-medium">{st.title}</span>
                    </div>
                  </div>
                ))}

                {subtasks.length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                    لا توجد مهام فرعية بعد. أضف خطوات العمل لتسهيل المتابعة.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMMENTS */}
          {drawerTab === 'comments' && (
            <div className="space-y-3">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="اكتب تعليقاً أو استفساراً..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إرسال
                </button>
              </form>

              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.author}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        {c.createdAt ? c.createdAt.split('T')[0] : ''}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                    لا توجد تعليقات بعد. شارك تحديثات التنفيذ مع الفريق.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTACHMENTS */}
          {drawerTab === 'attachments' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-teal-400 transition cursor-pointer bg-slate-50 dark:bg-slate-800/60">
                <Paperclip className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">اسحب وأفلت الملفات هنا أو انقر للإرفاق</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">يدعم مستندات PDF، ملفات Excel، والصور</p>
              </div>
              <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs">
                لا توجد مرفقات مرتبطة بهذه المهمة حتى الآن.
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVITY LOG */}
          {drawerTab === 'activity' && (
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">تم إنشاء المهمة</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">بواسطة النظام أو المستخدم</span>
                </div>
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                  {task.createdAt ? task.createdAt.split('T')[0] : 'سابقاً'}
                </span>
              </div>
              {task.completedAt && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-200 block">تم اكتمال المهمة</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">تم تسجيل إنجاز 100%</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    {task.completedAt.split('T')[0]}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة نهائياً؟')) {
                onDeleteTask(task.id);
                onClose();
              }
            }}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف المهمة</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
