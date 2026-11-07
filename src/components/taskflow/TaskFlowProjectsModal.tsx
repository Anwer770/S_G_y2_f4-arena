import React, { useState } from 'react';
import { TaskFlowProject, TaskFlowTask } from '../../types/taskflow';
import {
  X,
  Plus,
  FolderKanban,
  Edit2,
  Trash2,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Palette,
} from 'lucide-react';

interface TaskFlowProjectsModalProps {
  isOpen: boolean;
  projects: TaskFlowProject[];
  tasks: TaskFlowTask[];
  isAdmin: boolean;
  onClose: () => void;
  onSaveProject: (project: TaskFlowProject) => void;
  onDeleteProject: (projectId: string) => void;
}

const PRESET_COLORS = [
  '#8b5cf6', // Violet
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const TaskFlowProjectsModal: React.FC<TaskFlowProjectsModalProps> = ({
  isOpen,
  projects,
  tasks,
  isAdmin,
  onClose,
  onSaveProject,
  onDeleteProject,
}) => {
  if (!isOpen) return null;

  const [editingProject, setEditingProject] = useState<TaskFlowProject | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  const startCreate = () => {
    setIsCreating(true);
    setEditingProject(null);
    setName('');
    setDescription('');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setError('');
  };

  const startEdit = (p: TaskFlowProject) => {
    setEditingProject(p);
    setIsCreating(false);
    setName(p.name);
    setDescription(p.description || '');
    setColor(p.color);
    setError('');
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingProject(null);
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى كتابة اسم المشروع');
      return;
    }

    if (editingProject) {
      onSaveProject({
        ...editingProject,
        name: name.trim(),
        description: description.trim(),
        color,
      });
    } else {
      const newProj: TaskFlowProject = {
        id: `proj-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        color,
        isArchived: false,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onSaveProject(newProj);
    }
    cancelForm();
  };

  const toggleArchive = (p: TaskFlowProject) => {
    onSaveProject({
      ...p,
      isArchived: !p.isArchived,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">إدارة المشاريع (Projects)</h3>
              <p className="text-xs text-slate-500">
                {isAdmin ? 'صلاحية الأدمن: إنشاء وتعديل وأرشفة المشاريع وتخصيص الألوان' : 'عرض مشاريع المنظومة'}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ملاحظة: تعديل وإنشاء المشاريع متاح فقط للمستخدمين برتبة مدير (Admin).</span>
            </div>
          )}

          {/* Form when Creating or Editing */}
          {(isCreating || editingProject) && isAdmin && (
            <form onSubmit={handleSave} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <span>{editingProject ? 'تعديل بيانات المشروع' : 'إضافة مشروع جديد'}</span>
                </h4>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  إلغاء
                </button>
              </div>

              {error && <div className="text-xs font-bold text-rose-600">{error}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المشروع</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: إطلاق منتج جديد 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف أهداف المشروع ونطاق العمل..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">لون المشروع المميز</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-indigo-600 ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded-xl cursor-pointer border-0 p-0"
                    title="اختر لوناً مخصصاً"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-xs hover:bg-indigo-700"
                >
                  حفظ المشروع
                </button>
              </div>
            </form>
          )}

          {/* List Projects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">المشاريع الحالية ({projects.length})</span>
              {isAdmin && !isCreating && !editingProject && (
                <button
                  onClick={startCreate}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>مشروع جديد</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {projects.map((p) => {
                const projectTasks = tasks.filter((t) => t.projectId === p.id);
                const completedTasks = projectTasks.filter((t) => t.status === 'completed');
                const percent =
                  projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

                return (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-2 ring-white"
                        style={{ backgroundColor: p.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-black ${p.isArchived ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {p.name}
                          </h4>
                          {p.isArchived && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-500">
                              مؤرشف
                            </span>
                          )}
                        </div>
                        {p.description && (
                          <p className="text-xs text-slate-500 truncate max-w-md">{p.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                          <span>
                            إجمالي المهام: <strong className="text-slate-800 font-mono">{projectTasks.length}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            المكتملة: <strong className="text-emerald-600 font-mono">{completedTasks.length}</strong> ({percent}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleArchive(p)}
                          title={p.isArchived ? 'إلغاء الأرشفة' : 'أرشفة المشروع'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(p)}
                          title="تعديل"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (projectTasks.length > 0) {
                              if (
                                !confirm(
                                  `هذا المشروع يحتوي على ${projectTasks.length} مهمة. هل تريد حذفه بالكامل مع مهامه؟`
                                )
                              ) {
                                return;
                              }
                            } else if (!confirm('هل تريد حذف هذا المشروع؟')) {
                              return;
                            }
                            onDeleteProject(p.id);
                          }}
                          title="حذف"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
