import React from 'react';
import {
  WorkOSData,
  WorkTask,
  WorkProject,
  InboxItem,
  DailyRoutineBlock,
  HabitItem,
  GoalItem,
  AutomationRule,
  TaskStatus,
  TaskPriority,
} from '../../types/workos';
import {
  exportWorkOSToJSON,
  exportWorkOSToCSV,
  parseNaturalLanguageTask,
  triggerConfetti,
  ActiveTimerState,
} from '../../utils/workosStorage';
import type { Commitment, Task, TaskAuditLog } from '../../types';
import { WorkOSInbox } from './WorkOSInbox';
import { WorkOSVisitsView } from './WorkOSVisitsView';
import { WorkOSDailyPlannerView } from './WorkOSDailyPlannerView';
import { WorkOSRoutineView } from './WorkOSRoutineView';
import { WorkOSHabitsView } from './WorkOSHabitsView';
import { WorkOSGoalsView } from './WorkOSGoalsView';
import { WorkOSAppointmentsCommitmentsView } from './WorkOSAppointmentsCommitmentsView';
import { WorkOSNotesMeetingsView } from './WorkOSNotesMeetingsView';
import { WorkOSAutomationView } from './WorkOSAutomationView';
import { WorkOSReportsView } from './WorkOSReportsView';
import { TasksModule } from '../tasks/TasksModule';

export interface WorkOSSecondaryViewsProps {
  secondaryView: string | null;
  data: WorkOSData;
  setData: React.Dispatch<React.SetStateAction<WorkOSData>>;
  setSecondaryView: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
  todayStr: string;
  activeTimer: ActiveTimerState | null;
  setActiveTimerTask: React.Dispatch<React.SetStateAction<WorkTask | null>>;
  setTimerSeconds: React.Dispatch<React.SetStateAction<number>>;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedTaskForDrawer: React.Dispatch<React.SetStateAction<WorkTask | null>>;
  setQuickAddInitialType: React.Dispatch<React.SetStateAction<string>>;
  setIsQuickAddOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPrintReportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddTask: (newTask: Partial<WorkTask>) => void;
  handleUpdateTaskDueDate: (taskId: string, dueDate: string) => void;
  handleUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  handleUpdateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  handleUpdateTaskAssignee: (taskId: string, assigneeId: string) => void;
  handleDeleteTask: (taskId: string) => void;
  handleDuplicateTask: (task: WorkTask) => void;
  classicTasks?: Task[];
  commitments?: Commitment[];
  categories?: string[];
  operations?: string[];
  assignees?: string[];
  auditLogs?: TaskAuditLog[];
  onSaveClassicTask?: (task: Task) => void;
  onDeleteClassicTask?: (task: Task) => void;
  onToggleCompleteClassicTask?: (task: Task) => void;
  onSaveCommitment?: (commitment: Commitment) => void;
  onDeleteCommitment?: (commitment: Commitment) => void;
  onToggleCompleteCommitment?: (commitment: Commitment) => void;
  onClearCompletedTasks?: () => void;
  onClearAuditLogs?: () => void;
}

/**
 * طبقة العروض الثانوية في «إدارة العمل» (R29) — مُستخرجة من WorkOSModule.tsx
 * بلا أي تغيير في الشجرة أو الأصناف؛ كل الحالات تبقى في الوحدة الأم وتُمرَّر هنا.
 */
export const WorkOSSecondaryViews: React.FC<WorkOSSecondaryViewsProps> = ({
  secondaryView,
  data,
  setData,
  setSecondaryView,
  setCurrentTab,
  todayStr,
  activeTimer,
  setActiveTimerTask,
  setTimerSeconds,
  setIsTimerRunning,
  setSelectedTaskForDrawer,
  setQuickAddInitialType,
  setIsQuickAddOpen,
  setIsPrintReportOpen,
  handleAddTask,
  handleUpdateTaskDueDate,
  handleUpdateTaskStatus,
  handleUpdateTaskPriority,
  handleUpdateTaskAssignee,
  handleDeleteTask,
  handleDuplicateTask,
  classicTasks,
  commitments,
  categories,
  operations,
  assignees,
  auditLogs,
  onSaveClassicTask,
  onDeleteClassicTask,
  onToggleCompleteClassicTask,
  onSaveCommitment,
  onDeleteCommitment,
  onToggleCompleteCommitment,
  onClearCompletedTasks,
  onClearAuditLogs,
}) => (
  <>
    {secondaryView === 'inbox' && (
      <WorkOSInbox
        inbox={data.inbox}
        onAddItem={(c, t) => {
          const newItem: InboxItem = {
            id: `inbox_${Date.now()}`,
            content: c,
            type: t,
            createdAt: new Date().toISOString(),
            status: 'unprocessed',
          };
          setData((prev) => ({ ...prev, inbox: [newItem, ...prev.inbox] }));
        }}
        onConvertToTask={(item) => {
          const parsed = parseNaturalLanguageTask(item.content);
          handleAddTask({ ...parsed, category: 'صندوق الوارد' });
          setData((prev) => ({
            ...prev,
            inbox: prev.inbox.filter((i) => i.id !== item.id),
          }));
        }}
        onConvertToProject={(item) => {
          const newProject: WorkProject = {
            id: `prj_${Date.now()}`,
            code: `PRJ-${String(data.projects.length + 1).padStart(3, '0')}`,
            name: item.content.slice(0, 50),
            description: item.content,
            status: 'active',
            priority: 'medium',
            category: 'عام',
            progress: 0,
            startDate: todayStr,
            dueDate: todayStr,
            manager: 'محمد العولقي',
          };
          setData((prev) => ({
            ...prev,
            projects: [...prev.projects, newProject],
            inbox: prev.inbox.filter((i) => i.id !== item.id),
          }));
          setSecondaryView(null);
          setCurrentTab('projects');
        }}
        onArchiveItem={(id) => {
          setData((prev) => ({
            ...prev,
            inbox: prev.inbox.map((i) => (i.id === id ? { ...i, status: 'archived' } : i)),
          }));
        }}
        onDeleteItem={(id) => {
          setData((prev) => ({
            ...prev,
            inbox: prev.inbox.filter((i) => i.id !== id),
          }));
        }}
      />
    )}

    {secondaryView === 'visits' && <WorkOSVisitsView />}

    {secondaryView === 'planner' && (
      <WorkOSDailyPlannerView
        tasks={data.tasks}
        appointments={data.appointments}
        routine={data.dailyRoutine}
        activeTimer={activeTimer}
        onOpenTaskDetail={setSelectedTaskForDrawer}
        onUpdateTaskDueDate={handleUpdateTaskDueDate}
        onOpenQuickAdd={(type) => {
          setQuickAddInitialType(type);
          setIsQuickAddOpen(true);
        }}
      />
    )}

    {secondaryView === 'routine' && (
      <WorkOSRoutineView
        routine={data.dailyRoutine}
        reviews={data.dailyReviews}
        activeTimer={activeTimer}
        onStartRoutineBlock={(block) => {
          setActiveTimerTask({
            id: block.id,
            taskNumber: 'BLOCK',
            title: block.title,
            status: 'in_progress',
            priority: 'medium',
            creator: 'المستخدم',
            startDate: todayStr,
            dueDate: todayStr,
            progress: 0,
          });
          setTimerSeconds(0);
          setIsTimerRunning(true);
        }}
        onAddRoutineBlock={(b) => {
          const nb: DailyRoutineBlock = { ...b, id: `rt_${Date.now()}` };
          setData((prev) => ({ ...prev, dailyRoutine: [...prev.dailyRoutine, nb] }));
        }}
        onSaveReview={(rev) => {
          setData((prev) => ({ ...prev, dailyReviews: [rev, ...prev.dailyReviews] }));
          triggerConfetti();
        }}
      />
    )}

    {secondaryView === 'habits' && (
      <WorkOSHabitsView
        habits={data.habits}
        onToggleHabitDay={(hId, dStr) => {
          setData((prev) => ({
            ...prev,
            habits: prev.habits.map((h) => {
              if (h.id !== hId) return h;
              const exists = h.completedDates.includes(dStr);
              const newDates = exists ? h.completedDates.filter((d) => d !== dStr) : [...h.completedDates, dStr];
              const newStreak = exists ? Math.max(0, h.streak - 1) : h.streak + 1;
              return {
                ...h,
                completedDates: newDates,
                streak: newStreak,
                bestStreak: Math.max(h.bestStreak, newStreak),
              };
            }),
          }));
        }}
        onAddHabit={(nh) => {
          const h: HabitItem = {
            ...nh,
            id: `h_${Date.now()}`,
            streak: 0,
            bestStreak: 0,
            completedDates: [],
          };
          setData((prev) => ({ ...prev, habits: [...prev.habits, h] }));
        }}
        onDeleteHabit={(id) => {
          setData((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
        }}
      />
    )}

    {secondaryView === 'goals' && (
      <WorkOSGoalsView
        goals={data.goals}
        projects={data.projects}
        onUpdateKeyResultProgress={(gId, krId, val) => {
          setData((prev) => ({
            ...prev,
            goals: prev.goals.map((g) => {
              if (g.id !== gId) return g;
              const uKrs = g.keyResults.map((kr) => (kr.id === krId ? { ...kr, currentValue: val } : kr));
              const avg = Math.round(
                uKrs.reduce((acc, k) => acc + Math.min(100, (k.currentValue / k.targetValue) * 100), 0) /
                  (uKrs.length || 1)
              );
              return { ...g, keyResults: uKrs, progress: avg };
            }),
          }));
        }}
        onAddGoal={(g) => {
          const ng: GoalItem = { ...g, id: `g_${Date.now()}`, progress: 0 };
          setData((prev) => ({ ...prev, goals: [...prev.goals, ng] }));
        }}
      />
    )}

    {secondaryView === 'calendar' && (
      <WorkOSAppointmentsCommitmentsView
        appointments={data.appointments}
        commitments={data.commitments}
        onOpenQuickAdd={(type) => {
          setQuickAddInitialType(type || 'appointment');
          setIsQuickAddOpen(true);
        }}
        onUpdateAppointmentStatus={(id, status) => {
          setData((prev) => ({
            ...prev,
            appointments: prev.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
          }));
        }}
        onUpdateCommitmentStatus={(id, status) => {
          setData((prev) => ({
            ...prev,
            commitments: prev.commitments.map((c) => (c.id === id ? { ...c, status } : c)),
          }));
        }}
      />
    )}

    {secondaryView === 'notes' && (
      <WorkOSNotesMeetingsView
        notes={data.notes}
        meetings={data.meetings}
        projects={data.projects}
        team={data.team}
        onSaveNote={(n) => {
          const exists = data.notes.some((x) => x.id === n.id);
          setData((prev) => ({
            ...prev,
            notes: exists ? prev.notes.map((x) => (x.id === n.id ? n : x)) : [n, ...prev.notes],
          }));
        }}
        onDeleteNote={(id) => {
          setData((prev) => ({ ...prev, notes: prev.notes.filter((x) => x.id !== id) }));
        }}
        onSaveMeeting={(m) => {
          const exists = data.meetings.some((x) => x.id === m.id);
          setData((prev) => ({
            ...prev,
            meetings: exists ? prev.meetings.map((x) => (x.id === m.id ? m : x)) : [m, ...prev.meetings],
          }));
        }}
        onConvertMeetingActionToTask={(action) => {
          handleAddTask({
            title: action.title,
            assigneeId: action.assigneeId,
            dueDate: action.dueDate,
          });
        }}
      />
    )}

    {secondaryView === 'automation' && (
      <WorkOSAutomationView
        automations={data.automations}
        onToggleAutomation={(id) => {
          setData((prev) => ({
            ...prev,
            automations: prev.automations.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
          }));
        }}
        onExecuteAutomationManually={(rule) => {
          setData((prev) => {
            let updatedTasks = [...prev.tasks];
            const updatedProjects = [...prev.projects];

            // Execute rule action
            if (rule.actionType === 'tag_priority_urgent') {
              updatedTasks = updatedTasks.map((t) => (t.status !== 'completed' ? { ...t, priority: 'urgent' } : t));
            } else if (rule.actionType === 'create_followup_task') {
              const followupTask: WorkTask = {
                id: `tsk_${Date.now()}`,
                taskNumber: `TSK-${String(updatedTasks.length + 1).padStart(3, '0')}`,
                title: `متابعة تنفيذية: ${rule.name}`,
                description: `مهمة متابعة تم توليدها تلقائياً بواسطة محرك الأتمتة (${rule.name})`,
                status: 'planned',
                priority: 'high',
                projectId: updatedProjects[0]?.id || 'prj_1',
                category: 'تشغيلي',
                tags: ['أتمتة', 'متابعة'],
                creator: 'محرك الأتمتة',
                assigneeId: prev.team[0]?.id || 'mem_1',
                startDate: todayStr,
                dueDate: todayStr,
                estimatedHours: 2,
                actualHours: 0,
                progress: 0,
                subtasks: [],
                checklist: [],
                comments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              updatedTasks = [followupTask, ...updatedTasks];
            }

            const updatedAutomations = prev.automations.map((a) =>
              a.id === rule.id
                ? {
                    ...a,
                    executionsCount: a.executionsCount + 1,
                    lastExecutedAt: new Date().toISOString(),
                  }
                : a
            );

            return {
              ...prev,
              tasks: updatedTasks,
              projects: updatedProjects,
              automations: updatedAutomations,
            };
          });
        }}
        onAddAutomation={(newRule) => {
          setData((prev) => ({
            ...prev,
            automations: [newRule, ...prev.automations],
          }));
        }}
        onDeleteAutomation={(ruleId) => {
          setData((prev) => ({
            ...prev,
            automations: prev.automations.filter((a) => a.id !== ruleId),
          }));
        }}
      />
    )}

    {secondaryView === 'reports' && (
      <WorkOSReportsView
        tasks={data.tasks}
        projects={data.projects}
        team={data.team}
        onExportJSON={() => exportWorkOSToJSON(data)}
        onExportCSV={() => exportWorkOSToCSV(data.tasks)}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
      />
    )}

    {(secondaryView === 'works' || secondaryView === 'classic_tasks') && (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <TasksModule
          tasks={classicTasks || []}
          commitments={commitments || []}
          categories={categories || []}
          operations={operations || []}
          assignees={assignees || []}
          auditLogs={auditLogs || []}
          onSaveTask={onSaveClassicTask || (() => {})}
          onDeleteTask={onDeleteClassicTask || (() => {})}
          onToggleCompleteTask={onToggleCompleteClassicTask || (() => {})}
          onSaveCommitment={onSaveCommitment || (() => {})}
          onDeleteCommitment={onDeleteCommitment || (() => {})}
          onToggleCompleteCommitment={onToggleCompleteCommitment || (() => {})}
          onClearCompletedTasks={onClearCompletedTasks || (() => {})}
          onClearAuditLogs={onClearAuditLogs || (() => {})}
        />
      </div>
    )}
  </>
);
