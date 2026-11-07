import React, { useState, useEffect } from 'react';
import { WorkProject, TeamMember, TaskPriority } from '../../types/workos';
import {
  X,
  CheckSquare,
  FolderKanban,
  BookOpen,
  Calendar,
  ShieldAlert,
  Flame,
  Target,
  Plus,
} from 'lucide-react';

interface WorkOSQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string;
  initialProjectId?: string;
  initialPriority?: TaskPriority;
  projects: WorkProject[];
  team: TeamMember[];
  onAddTask: (task: any) => void;
  onAddProject: (project: any) => void;
  onAddNote: (note: any) => void;
  onAddAppointment: (appointment: any) => void;
  onAddCommitment: (commitment: any) => void;
  onAddHabit: (habit: any) => void;
  onAddGoal: (goal: any) => void;
}

export const WorkOSQuickAddModal: React.FC<WorkOSQuickAddModalProps> = ({
  isOpen,
  onClose,
  initialType = 'task',
  initialProjectId,
  initialPriority,
  projects,
  team,
  onAddTask,
  onAddProject,
  onAddNote,
  onAddAppointment,
  onAddCommitment,
  onAddHabit,
  onAddGoal,
}) => {
  // Generic form fields - hooks called unconditionally at top of component
  const [activeType, setActiveType] = useState(initialType || 'task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(initialPriority || 'high');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState(initialProjectId || projects[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState(team[0]?.id || '');
  const [customerRef, setCustomerRef] = useState('');

  // Specific fields
  const [person, setPerson] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('10:00');
  const [entity, setEntity] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekdays'>('daily');
  const [targetDays, setTargetDays] = useState(5);

  // Sync state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      if (initialType) setActiveType(initialType);
      if (initialPriority) setPriority(initialPriority);
      if (initialProjectId) setProjectId(initialProjectId);
      setTitle('');
      setDescription('');
      setCustomerRef('');
      setPerson('');
      setLocation('');
      setEntity('');
      setAmount('');
    }
  }, [isOpen, initialType, initialPriority, initialProjectId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (activeType === 'task') {
      onAddTask({
        title: title.trim(),
        description,
        priority,
        dueDate,
        projectId: projectId || undefined,
        assigneeId,
        customerRef: customerRef || undefined,
        category: 'عام',
        status: 'ready',
      });
    } else if (activeType === 'project') {
      onAddProject({
        name: title.trim(),
        description,
        priority,
        startDate: new Date().toISOString().split('T')[0],
        dueDate,
        manager: team.find((m) => m.id === assigneeId)?.name || 'م. يحيى الشامي',
        category: 'تطوير',
        budget: amount ? Number(amount) : undefined,
      });
    } else if (activeType === 'note') {
      onAddNote({
        title: title.trim(),
        content: description,
        type: 'idea',
        tags: ['سريع'],
        linkedProjectId: projectId || undefined,
      });
    } else if (activeType === 'appointment') {
      onAddAppointment({
        title: title.trim(),
        person: person || 'العميل',
        location,
        date: dueDate,
        time,
        durationMinutes: 45,
        notes: description,
        status: 'scheduled',
      });
    } else if (activeType === 'commitment') {
      onAddCommitment({
        title: title.trim(),
        entity: entity || 'الجهة المعنية',
        person: person || 'المسؤول',
        description,
        commitmentDate: new Date().toISOString().split('T')[0],
        dueDate,
        status: 'in_progress',
        importance: 'A',
        amount: amount ? Number(amount) : undefined,
      });
    } else if (activeType === 'habit') {
      onAddHabit({
        name: title.trim(),
        category: 'انضباط',
        frequency: habitFrequency,
        targetDaysPerWeek: targetDays,
        streak: 0,
        bestStreak: 0,
        completedDates: [],
        notes: description,
      });
    } else if (activeType === 'goal') {
      onAddGoal({
        title: title.trim(),
        category: 'نمو',
        targetDate: dueDate,
        progress: 0,
        status: 'on_track',
        visionDescription: description,
        objectives: [],
      });
    }

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
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-700 text-white rounded-lg">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">إضافة سريعة موحدة (+ Quick Add)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 flex gap-1 border-b border-slate-200 dark:border-slate-700 text-xs overflow-x-auto">
          {[
            { id: 'task', label: 'مهمة', icon: CheckSquare },
            { id: 'project', label: 'مشروع', icon: FolderKanban },
            { id: 'note', label: 'ملاحظة', icon: BookOpen },
            { id: 'appointment', label: 'موعد', icon: Calendar },
            { id: 'commitment', label: 'التزام', icon: ShieldAlert },
            { id: 'habit', label: 'عادة', icon: Flame },
            { id: 'goal', label: 'هدف', icon: Target },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveType(item.id)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  activeType === item.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              العنوان الرئيسي {activeType === 'project' ? 'للمشروع' : activeType === 'habit' ? 'للعادة' : 'للمهمة'} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="اكتب العنوان هنا..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Conditional Fields based on Type */}
          {(activeType === 'task' || activeType === 'project' || activeType === 'commitment') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الأولوية</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 cursor-pointer"
                >
                  <option value="urgent">عاجلة جداً</option>
                  <option value="high">عالية</option>
                  <option value="medium">متوسطة</option>
                  <option value="low">منخفضة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">تاريخ الاستحقاق / التسليم</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs"
                />
              </div>
            </div>
          )}

          {activeType === 'task' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">المشروع</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 cursor-pointer"
                >
                  <option value="">بدون مشروع</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">المسؤول</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 cursor-pointer"
                >
                  {team.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeType === 'appointment' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الشخص المعني</label>
                <input
                  type="text"
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder="اسم الطبيب أو العميل"
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">المكان</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="العيادة أو المكتب"
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الوقت</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs"
                />
              </div>
            </div>
          )}

          {activeType === 'commitment' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الجهة المتعهد لها</label>
                <input
                  type="text"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  placeholder="اسم المنشأة أو التاجر..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">المبلغ المالي (إن وجد)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="المبلغ بالريال..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">الوصف والملاحظات</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب أي تفاصيل إضافية..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وحفظ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
