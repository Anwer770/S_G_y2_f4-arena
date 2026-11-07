import React, { useState } from 'react';
import { WorkProject, WorkTask, TeamMember, ProjectStatus } from '../../types/workos';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Filter,
  CheckSquare,
  Kanban,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface WorkOSProjectsViewProps {
  projects: WorkProject[];
  tasks: WorkTask[];
  team: TeamMember[];
  onOpenQuickAdd: (type?: string, projectId?: string) => void;
  onSelectProject?: (projectId: string) => void;
  onNavigateToTasks?: (projectId?: string) => void;
  onNavigateToGantt?: () => void;
}

export const WorkOSProjectsView: React.FC<WorkOSProjectsViewProps> = ({
  projects = [],
  tasks = [],
  team = [],
  onOpenQuickAdd = (..._args: any[]) => {},
  onSelectProject = (..._args: any[]) => {},
  onNavigateToTasks = (..._args: any[]) => {},
  onNavigateToGantt = () => {},
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProjects = (projects || []).filter((p) => {
    if (!p) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (st: ProjectStatus) => {
    switch (st) {
      case 'active':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">نشط قيد التنفيذ</span>;
      case 'planned':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">مخطط</span>;
      case 'delayed':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">متأخر</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">مكتمل ومغلق</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">{st}</span>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">المشاريع والمبادرات المؤسسية</h2>
            <p className="text-xs text-slate-500">متابعة سير العمل، الميزانيات، ونسب إنجاز المشاريع الاستراتيجية</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المشاريع..."
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشطة</option>
            <option value="planned">مخططة</option>
            <option value="delayed">متأخرة</option>
            <option value="completed">مكتملة</option>
          </select>
          <button
            onClick={() => onOpenQuickAdd('project')}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مشروع جديد</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((project) => {
          const projectTasks = (tasks || []).filter((t) => t && t.projectId === project.id);
          const completedProjectTasks = projectTasks.filter((t) => t && t.status === 'completed');
          const calculatedProgress =
            projectTasks.length > 0
              ? Math.round((completedProjectTasks.length / projectTasks.length) * 100)
              : project.progress;

          return (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 hover:border-indigo-300 transition space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-slate-400 font-bold block">{project.code}</span>
                  <h3 className="font-bold text-slate-900 text-sm">{project.name}</h3>
                </div>
                {getStatusBadge(project.status)}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {project.description}
              </p>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>نسبة الإنجاز الفعلية</span>
                  <span className="text-indigo-700 font-mono">{calculatedProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${calculatedProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{completedProjectTasks.length} من {projectTasks.length} مهام منجزة</span>
                  {project.budget && (
                    <span className="font-mono text-slate-600 font-bold">
                      الميزانية: {project.budget.toLocaleString()} YER
                    </span>
                  )}
                </div>
              </div>

              {/* Project Meta info */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>المدير: <strong className="text-slate-800">{project.manager}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{project.startDate} ⬅️ {project.dueDate}</span>
                </div>
              </div>

              {/* Linked Operations Bar: Tasks & Kanban Direct Actions */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToTasks(project.id)}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-teal-200/80"
                  title="عرض مهام هذا المشروع في لوحة المهام"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                  <span>عرض المهام ({projectTasks.length})</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenQuickAdd('task', project.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="إضافة مهمة جديدة مباشرة لهذا المشروع"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>مهمة</span>
                  </button>

                  <button
                    type="button"
                    onClick={onNavigateToGantt}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-indigo-200/60"
                    title="عرض في لوحة كانبان ومخطط غانت"
                  >
                    <Kanban className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">كانبان/غانت</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
