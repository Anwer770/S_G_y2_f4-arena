import React, { useState } from 'react';
import {
  TaskFlowTask,
  TaskFlowProject,
  TaskFlowMember,
  TaskFlowPriority,
  TaskFlowStatus,
} from '../../types/taskflow';
import { isTaskOverdue } from '../../utils/taskflowStorage';
import {
  X,
  Calendar,
  AlertTriangle,
  FolderKanban,
  User,
  Clock,
  Flag,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface TaskFlowTaskModalProps {
  isOpen: boolean;
  task?: TaskFlowTask | null; // null for new task
  initialStatus?: TaskFlowStatus;
  projects: TaskFlowProject[];
  members: TaskFlowMember[];
  onClose: () => void;
  onSave: (taskData: Omit<TaskFlowTask, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  onDelete?: (id: string) => void;
}

export const TaskFlowTaskModal: React.FC<TaskFlowTaskModalProps> = ({
  isOpen,
  task,
  initialStatus = 'todo',
  projects,
  members,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [projectId, setProjectId] = useState(task?.projectId || projects[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || members[0]?.id || '');
  const [status, setStatus] = useState<TaskFlowStatus>(task?.status || initialStatus);
  const [priority, setPriority] = useState<TaskFlowPriority>(task?.priority || 'medium');
  const [startDate, setStartDate] = useState(task?.startDate || todayStr);
  const [dueDate, setDueDate] = useState(task?.dueDate || todayStr);
  const [error, setError] = useState('');

  const isOverdueNow = status !== 'completed' && dueDate && dueDate < todayStr;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى كتابة عنوان المهمة');
      return;
    }
    if (!projectId) {
      setError('يرجى اختيار المشروع');
      return;
    }

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        projectId,
        assigneeId: assigneeId || undefined,
        status,
        priority,
        startDate: startDate || todayStr,
        dueDate: dueDate || todayStr,
      },
      task?.id
    );
    onClose();
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedMember = members.find((m) => m.id === assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold"
              style={{ backgroundColor: selectedProject?.color || '#6366f1' }}
            >
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {task ? 'تعديل المهمة' : 'إنشاء مهمة جديدة'}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedProject ? selectedProject.name : 'TaskFlow Project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Overdue Warning Alert */}
          {isOverdueNow && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                تنبيه: تاريخ الاستحقاق ({dueDate}) أقدم من تاريخ اليوم، ستُصنف المهمة تلقائياً كـ{' '}
                <strong className="text-rose-600 font-black">متأخرة (Overdue)</strong>.
              </span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              عنوان المهمة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="مثال: فحص جودة عبوات السيروم الجديدة ومطابقة الباركود"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Project & Assignee Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                المشروع <span className="text-rose-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-800 bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الشخص المسؤول (Assignee)
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="">بدون مسؤول محدد</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role === 'admin' ? 'مدير' : 'عضو'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">حالة المهمة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskFlowStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="todo">قيد الانتظار (To Do)</option>
                <option value="in_progress">قيد التنفيذ (In Progress)</option>
                <option value="completed">مكتملة (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskFlowPriority)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="low">منخفضة (Low)</option>
                <option value="medium">متوسطة (Medium)</option>
                <option value="high">مرتفعة (High)</option>
                <option value="urgent">عاجلة جداً (Urgent)</option>
              </select>
            </div>
          </div>

          {/* Dates: Start Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تاريخ البداية (Start Date)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تاريخ الاستحقاق (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الوصف والتفاصيل (اختياري)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب أي متطلبات أو ملاحظات إضافية للمهمة..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            {task && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف المهمة</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{task ? 'حفظ التعديلات' : 'إضافة المهمة'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
