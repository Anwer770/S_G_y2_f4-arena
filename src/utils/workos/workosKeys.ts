/**
 * مفاتيح تخزين «إدارة العمل» — مصدر واحد (R30).
 * أي تغيير في هذه القيم يفقد بيانات المستخدم، لذلك تبقى ثابتة ومجمّعة هنا.
 */
export const STORAGE_PREFIX = 'workos_v1_';

export const KEYS = {
  WORKSPACES: `${STORAGE_PREFIX}workspaces`,
  CURRENT_WORKSPACE: `${STORAGE_PREFIX}current_workspace`,
  PROJECTS: `${STORAGE_PREFIX}projects`,
  TASKS: `${STORAGE_PREFIX}tasks`,
  ORDERS: `${STORAGE_PREFIX}orders`,
  INBOX: `${STORAGE_PREFIX}inbox`,
  ROUTINES: `${STORAGE_PREFIX}routines`,
  REVIEWS: `${STORAGE_PREFIX}reviews`,
  HABITS: `${STORAGE_PREFIX}habits`,
  GOALS: `${STORAGE_PREFIX}goals`,
  APPOINTMENTS: `${STORAGE_PREFIX}appointments`,
  COMMITMENTS: `${STORAGE_PREFIX}commitments`,
  MEETINGS: `${STORAGE_PREFIX}meetings`,
  NOTES: `${STORAGE_PREFIX}notes`,
  TEAM: `${STORAGE_PREFIX}team`,
  AUTOMATIONS: `${STORAGE_PREFIX}automations`,
  ACTIVITY: `${STORAGE_PREFIX}activity`,
  ACTIVE_TIMER: `${STORAGE_PREFIX}active_timer`,
  AUTOMATION_RUNS: `${STORAGE_PREFIX}automation_runs`,
};
