import React, { useState, useEffect } from 'react';
import {
  WorkTask,
  WorkProject,
  TeamMember,
  TaskStatus,
  TaskPriority,
  WorkSubtask,
  ChecklistItem,
  TaskComment,
} from '../../types/workos';
import {
  X,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Clock,
  Calendar,
  User,
  FolderKanban,
  Tag,
  MessageSquare,
  Paperclip,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Save,
} from 'lucide-react';

interface WorkOSTaskDetailModalProps {
  isOpen: boolean;
  task: WorkTask | null;
  projects: WorkProject[];
  team: TeamMember[];
  onClose: () => void;
  onSaveTask: (updatedTask: WorkTask) => void;
  onDeleteTask: (taskId: string) => void;
  onStartTimer?: (task: WorkTask) => void;
}

export const WorkOSTaskDetailModal: React.FC<WorkOSTaskDetailModalProps> = ({
  isOpen,
  task,
  projects,
  team,
  onClose,
  onSaveTask,
  onDeleteTask,
  onStartTimer,
}) => {
  // Local copy of editable state - hooks called unconditionally
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'planned');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [projectId, setProjectId] = useState(task?.projectId || '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours || 0);
  const [actualHours, setActualHours] = useState(task?.actualHours || 0);
  const [customerRef, setCustomerRef] = useState(task?.customerRef || '');
  const [category, setCategory] = useState(task?.category || 'عام');

  // Subtasks & Checklist
  const [subtasks, setSubtasks] = useState<WorkSubtask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [checklist, setChecklist] = useState<ChecklistItem[]>(task?.checklist || []);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Comments
  const [comments, setComments] = useState<TaskComment[]>(task?.comments || []);
  const [newCommentText, setNewCommentText] = useState('');

  // Tab inside modal
  const [modalTab, setModalTab] = useState<'details' | 'subtasks' | 'checklist' | 'time' | 'comments'>('details');

  // Sync state if task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'planned');
      setPriority(task.priority || 'medium');
      setProjectId(task.projectId || '');
      setAssigneeId(task.assigneeId || '');
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setEstimatedHours(task.estimatedHours || 0);
      setActualHours(task.actualHours || 0);
      setCustomerRef(task.customerRef || '');
      setCategory(task.category || 'عام');
      setSubtasks(task.subtasks || []);
      setChecklist(task.checklist || []);
      setComments(task.comments || []);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  // Subtask handlers
  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub: WorkSubtask = {
      id: `sub_${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };
  const handleDeleteSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  // Checklist handlers
  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };
  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newChk: ChecklistItem = {
      id: `chk_${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    setChecklist([...checklist, newChk]);
    setNewChecklistText('');
  };
  const handleDeleteChecklist = (id: string) => {
    setChecklist((prev) => prev.filter((c) => c.id !== id));
  };

  // Comment handlers
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newCom: TaskComment = {
      id: `com_${Date.now()}`,
      author: 'م. يحيى الشامي',
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments([...comments, newCom]);
    setNewCommentText('');
  };

  // Save handler
  const handleSave = () => {
    const totalSubCount = subtasks.length;
    const completedSubCount = subtasks.filter((s) => s.completed).length;
    const calcProgress =
      totalSubCount > 0
        ? Math.round((completedSubCount / totalSubCount) * 100)
        : status === 'completed'
        ? 100
        : task.progress || 0;

    const updated: WorkTask = {
      ...task,
      title,
      description,
      status,
      priority,
      projectId: projectId || undefined,
      assigneeId,
      startDate,
      dueDate,
      estimatedHours: Number(estimatedHours),
      actualHours: Number(actualHours),
      customerRef: customerRef || undefined,
      category,
      subtasks,
      checklist,
      comments,
      progress: calcProgress,
      updatedAt: new Date().toISOString(),
      completedAt: status === 'completed' ? new Date().toISOString() : task.completedAt,
    };

    onSaveTask(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {task.taskNumber}
            </span>
            <span className="text-xs font-bold text-slate-600">بطاقة المهمة التشغيلية</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Title Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent border-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1.5"
            placeholder="عنوان المهمة..."
          />
        </div>

        {/* Sub Navigation inside Modal */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-1.5 flex gap-1 border-b border-slate-200 dark:border-slate-700 text-xs overflow-x-auto">
          <button
            onClick={() => setModalTab('details')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              modalTab === 'details' ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-200 shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            البيانات والخصائص
          </button>
          <button
            onClick={() => setModalTab('subtasks')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              modalTab === 'subtasks' ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-200 shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            المهام الفرعية ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
          </button>
          <button
            onClick={() => setModalTab('checklist')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              modalTab === 'checklist' ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-200 shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            قائمة الفحص Checklist ({checklist.filter((c) => c.completed).length}/{checklist.length})
          </button>
          <button
            onClick={() => setModalTab('time')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              modalTab === 'time' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            تتبع الوقت ({actualHours} / {estimatedHours} س)
          </button>
          <button
            onClick={() => setModalTab('comments')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              modalTab === 'comments' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            التعليقات والملاحظات ({comments.length})
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* TAB 1: Details & Properties */}
          {modalTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الحالة</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white cursor-pointer"
                  >
                    <option value="new">جديدة</option>
                    <option value="planned">مخطط لها</option>
                    <option value="ready">جاهزة للبدء</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="blocked">متوقفة / معلقة</option>
                    <option value="review">تحتاج مراجعة</option>
                    <option value="completed">مكتملة</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الأولوية</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white cursor-pointer"
                  >
                    <option value="urgent">عاجلة جداً</option>
                    <option value="high">عالية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>

                {/* Project */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">المشروع</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white cursor-pointer"
                  >
                    <option value="">بدون مشروع (عام)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">المسؤول المكلف</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white cursor-pointer"
                  >
                    <option value="">غير معين</option>
                    {team.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-rose-700"
                  />
                </div>

                {/* Customer Ref */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">العميل / الصيدلية المرتبطة</label>
                  <input
                    type="text"
                    value={customerRef}
                    onChange={(e) => setCustomerRef(e.target.value)}
                    placeholder="اسم الصيدلية أو العميل..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الوصف التفصيلي والتعليمات</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب هنا كافة تفاصيل تنفيذ المهمة..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Subtasks */}
          {modalTab === 'subtasks' && (
            <div className="space-y-4">
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="إضافة مهمة فرعية جديدة (Subtask)..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </form>

              <div className="space-y-2">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleSubtask(st.id)} className="cursor-pointer">
                        {st.completed ? (
                          <CheckSquare className="w-4 h-4 text-teal-700" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-800'}>
                        {st.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {subtasks.length === 0 && (
                  <div className="text-center py-6 text-slate-400">لا توجد مهام فرعية مضافة</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Checklist */}
          {modalTab === 'checklist' && (
            <div className="space-y-4">
              <form onSubmit={handleAddChecklist} className="flex gap-2">
                <input
                  type="text"
                  placeholder="إضافة بند فحص (Checklist item)..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </form>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleChecklist(item.id)} className="cursor-pointer">
                        {item.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-800'}>
                        {item.text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteChecklist(item.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {checklist.length === 0 && (
                  <div className="text-center py-6 text-slate-400">لا توجد بنود فحص مضافة</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Time Tracking */}
          {modalTab === 'time' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 mb-1">الساعات المقدرة للمهمة</label>
                  <input
                    type="number"
                    step="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div className="p-4 bg-teal-50/40 rounded-xl border border-teal-200">
                  <label className="block text-xs font-bold text-teal-800 mb-1">ساعات العمل الفعلية المسجلة</label>
                  <input
                    type="number"
                    step="0.5"
                    value={actualHours}
                    onChange={(e) => setActualHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-teal-300 text-xs font-mono font-bold text-teal-900"
                  />
                </div>
              </div>

              {onStartTimer && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900 block">بدء مؤقت العمل الفوري على هذه المهمة</span>
                    <span className="text-xs text-emerald-700">سيتم حساب الساعات وتوثيقها تلقائياً</span>
                  </div>
                  <button
                    onClick={() => {
                      onStartTimer(task);
                      onClose();
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>تشغيل المؤقت</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Comments */}
          {modalTab === 'comments' && (
            <div className="space-y-4">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="اكتب تعليقاً أو ملاحظة عمل..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  إرسال
                </button>
              </form>

              <div className="space-y-2">
                {comments.map((com) => (
                  <div key={com.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{com.author}</span>
                      <span className="text-slate-400 font-mono">{com.createdAt.split('T')[0]}</span>
                    </div>
                    <p className="text-slate-600 text-xs">{com.text}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-6 text-slate-400">لا توجد تعليقات حتى الآن</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) {
                onDeleteTask(task.id);
                onClose();
              }
            }}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف المهمة</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer transition-colors"
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
