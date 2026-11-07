import React from 'react';
import { TeamMember, WorkTask } from '../../types/workos';
import { Users, Briefcase, Clock, AlertTriangle, CheckCircle, Mail, Phone } from 'lucide-react';

interface WorkOSTeamWorkloadViewProps {
  team: TeamMember[];
  tasks: WorkTask[];
  onOpenQuickAdd: (type?: string) => void;
}

export const WorkOSTeamWorkloadView: React.FC<WorkOSTeamWorkloadViewProps> = ({
  team = [],
  tasks = [],
  onOpenQuickAdd = (..._args: any[]) => {},
}) => {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">إدارة الفريق وتوازن أعباء العمل (Team & Workload)</h2>
            <p className="text-xs text-slate-500">مراقبة المهام الموزعة لكل موظف وتجنب إرهاق الكادر وضمان التوزيع العادل</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => {
          const memberTasks = tasks.filter((t) => t.assigneeId === member.id && t.status !== 'completed' && t.status !== 'archived');
          const totalEstimatedHours = memberTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
          const overdueTasksCount = memberTasks.filter((t) => t.dueDate < new Date().toISOString().split('T')[0]).length;
          const loadPercentage = Math.min(100, Math.round((totalEstimatedHours / member.capacityHoursPerWeek) * 100));

          return (
            <div
              key={member.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4 hover:border-teal-400 transition"
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl ${member.avatarColor} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs`}>
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                  <div className="text-xs text-teal-700 font-medium">{member.role}</div>
                  <div className="text-xs text-slate-400">{member.department}</div>
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">عبء العمل الأسبوعي:</span>
                  <span className={loadPercentage > 85 ? 'text-rose-700 font-mono' : 'text-teal-700 font-mono'}>
                    {loadPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loadPercentage > 85 ? 'bg-rose-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${loadPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>ساعات المهام: {totalEstimatedHours} س</span>
                  <span>السعة: {member.capacityHoursPerWeek} س/أسبوع</span>
                </div>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-teal-50/50 border border-teal-100">
                  <span className="text-xs text-slate-500 block">المهام الجارية</span>
                  <span className="text-base font-black text-teal-800 font-mono">{memberTasks.length}</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-100">
                  <span className="text-xs text-slate-500 block">مهام متأخرة</span>
                  <span className="text-base font-black text-rose-700 font-mono">{overdueTasksCount}</span>
                </div>
              </div>

              {/* Contact info */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> {member.email}
                </span>
                {member.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {member.phone}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
