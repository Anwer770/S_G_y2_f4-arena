import React from 'react';
import { WorkOSData, WorkTask, TaskStatus, TaskPriority } from '../../types/workos';
import { exportWorkOSToJSON, exportWorkOSToCSV, triggerConfetti } from '../../utils/workosStorage';
import type { Commitment, Task, TaskAuditLog } from '../../types';
import { TasksModule } from '../tasks/TasksModule';
import { WorkOSGoalsView } from './WorkOSGoalsView';
import { WorkOSAppointmentsCommitmentsView } from './WorkOSAppointmentsCommitmentsView';
import { WorkOSOverviewTab } from './WorkOSOverviewTab';
import { WorkOSProjectsTab } from './WorkOSProjectsTab';
import { WorkOSTasksTab } from './WorkOSTasksTab';
import { WorkOSKanbanTab } from './WorkOSKanbanTab';
import { WorkOSTimelineTab } from './WorkOSTimelineTab';
import { WorkOSPrioritiesTab } from './WorkOSPrioritiesTab';
import { WorkOSTeamWorkloadTab } from './WorkOSTeamWorkloadTab';
import { WorkOSReportsView } from './WorkOSReportsView';
import { CentralUnifiedLedger } from './CentralUnifiedLedger';

export interface WorkOSPrimaryTabsProps {
  secondaryView: string | null;
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
  setSecondaryView: React.Dispatch<React.SetStateAction<string | null>>;
  data: WorkOSData;
  setData: React.Dispatch<React.SetStateAction<WorkOSData>>;
  filteredTasks: WorkTask[];
  density: 'comfortable' | 'compact';
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTaskForDrawer: React.Dispatch<React.SetStateAction<WorkTask | null>>;
  setQuickAddInitialType: React.Dispatch<React.SetStateAction<string>>;
  setIsQuickAddOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  handleUpdateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  handleUpdateTaskAssignee: (taskId: string, assigneeId: string) => void;
  handleUpdateTaskDueDate: (taskId: string, dueDate: string) => void;
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
 * التبويبات السبع الأساسية في «إدارة العمل» (R29) — مُستخرجة من WorkOSModule.tsx.
 * نفس الشجرة ونفس الترتيب؛ الحالة تبقى في الوحدة الأم.
 */
export const WorkOSPrimaryTabs: React.FC<WorkOSPrimaryTabsProps> = ({
  secondaryView,
  currentTab,
  setCurrentTab,
  data,
  setData,
  filteredTasks,
  density,
  setSelectedProjectId,
  setSelectedTaskForDrawer,
  setQuickAddInitialType,
  setIsQuickAddOpen,
  handleUpdateTaskStatus,
  handleUpdateTaskPriority,
  handleUpdateTaskAssignee,
  handleUpdateTaskDueDate,
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
    {!secondaryView && (
      <>
        {currentTab === 'overview' && (
          <WorkOSOverviewTab
            tasks={data.tasks}
            projects={data.projects}
            team={data.team}
            appointments={data.appointments}
            activities={data.activities}
            goals={data.goals}
            meetings={data.meetings}
            commitments={data.commitments}
            onOpenTaskDetail={setSelectedTaskForDrawer}
            onNavigateToTab={setCurrentTab}
            onSelectProject={(pId) => {
              setSelectedProjectId(pId);
              setCurrentTab('tasks');
            }}
          />
        )}

        {currentTab === 'projects' && (
          <WorkOSProjectsTab
            projects={data.projects}
            tasks={data.tasks}
            team={data.team}
            onOpenTaskDetail={setSelectedTaskForDrawer}
            onNavigateToTasksWithProject={(pId) => {
              setSelectedProjectId(pId);
              setCurrentTab('tasks');
            }}
            onUpdateProject={(upProj) => {
              setData((prev) => ({
                ...prev,
                projects: prev.projects.map((p) => (p.id === upProj.id ? upProj : p)),
              }));
            }}
          />
        )}

        {currentTab === 'tasks' && (
          <WorkOSTasksTab
            tasks={filteredTasks}
            projects={data.projects}
            team={data.team}
            onOpenTaskDetail={setSelectedTaskForDrawer}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onUpdateTaskPriority={handleUpdateTaskPriority}
            onUpdateTaskAssignee={handleUpdateTaskAssignee}
            onUpdateTaskDueDate={handleUpdateTaskDueDate}
            onDeleteTask={handleDeleteTask}
            onDuplicateTask={handleDuplicateTask}
            density={density}
          />
        )}

        {currentTab === 'orders' && (
          <CentralUnifiedLedger
            orders={data.orders || []}
            tasks={data.tasks}
            commitments={data.commitments}
            team={data.team}
            onOpenQuickAdd={(type) => {
              setQuickAddInitialType(type || 'order');
              setIsQuickAddOpen(true);
            }}
            onUpdateOrders={(updatedOrders) => {
              setData((prev) => ({ ...prev, orders: updatedOrders }));
            }}
            onUpdateTasks={(updatedTasks) => {
              setData((prev) => ({ ...prev, tasks: updatedTasks }));
            }}
            onUpdateCommitments={(updatedCommitments) => {
              setData((prev) => ({ ...prev, commitments: updatedCommitments }));
            }}
          />
        )}

        {currentTab === 'kanban' && (
          <WorkOSKanbanTab
            tasks={filteredTasks}
            projects={data.projects}
            team={data.team}
            onOpenTaskDetail={setSelectedTaskForDrawer}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
        )}

        {currentTab === 'timeline' && (
          <WorkOSTimelineTab
            tasks={filteredTasks}
            projects={data.projects}
            team={data.team}
            onOpenTaskDetail={setSelectedTaskForDrawer}
          />
        )}

        {currentTab === 'priorities' && (
          <WorkOSPrioritiesTab
            tasks={filteredTasks}
            projects={data.projects}
            team={data.team}
            onOpenTaskDetail={setSelectedTaskForDrawer}
            onUpdateTaskPriority={handleUpdateTaskPriority}
          />
        )}

        {currentTab === 'workload' && (
          <WorkOSTeamWorkloadTab
            team={data.team}
            tasks={data.tasks}
            projects={data.projects}
            onOpenTaskDetail={setSelectedTaskForDrawer}
          />
        )}

        {currentTab === 'works' && (
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

        {currentTab === 'goals' && (
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
                    uKrs.reduce(
                      (acc, c) =>
                        acc +
                        Math.min(
                          100,
                          Math.round(
                            ((c.currentValue - c.startValue) / Math.max(1, c.targetValue - c.startValue)) * 100
                          )
                        ),
                      0
                    ) / Math.max(1, uKrs.length)
                  );
                  return { ...g, keyResults: uKrs, progress: avg };
                }),
              }));
            }}
            onAddGoal={(ng) => {
              setData((prev) => ({ ...prev, goals: [...prev.goals, ng] }));
              triggerConfetti();
            }}
          />
        )}

        {currentTab === 'calendar' && (
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

        {currentTab === 'reports' && (
          <WorkOSReportsView
            tasks={data.tasks}
            projects={data.projects}
            team={data.team}
            onExportJSON={() => exportWorkOSToJSON(data)}
            onExportCSV={() => exportWorkOSToCSV(data.tasks)}
          />
        )}
      </>
    )}
  </>
);
