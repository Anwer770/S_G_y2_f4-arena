/**
 * أنواع لوحة التحكم (R30) — مفصولة عن المكوّن ليشاركها الخطاف والأقسام.
 */
import type {
  ActiveModuleTab,
  Commitment,
  Customer,
  CustomerVisitRecord,
  DebtCommitment,
  DebtRecord,
  DoctorRecord,
  DoctorVisitLog,
  FinancialOptionType,
  FinancialTransaction,
  Item,
  Movement,
  NoteRecord,
  Task,
} from '../../types';
import type { WorkOSData, WorkOrder } from '../../types/workos';
import type { calculateFinancialSummary } from '../../utils/financial';
import type { calculateDebtStats } from '../../utils/debts';
import type { getCurrentUserProfile } from '../../utils/settingsStorage';

export interface DashboardProps {
  items: Item[];
  movements: Movement[];
  financialTransactions: FinancialTransaction[];
  tasks: Task[];
  commitments: Commitment[];
  customers?: Customer[];
  visits?: CustomerVisitRecord[];
  doctors?: DoctorRecord[];
  doctorVisits?: DoctorVisitLog[];
  debts?: DebtRecord[];
  debtCommitments?: DebtCommitment[];
  onNavigateTab: (tab: ActiveModuleTab) => void;
  // Quick Actions Handlers
  onSaveFinancialTxn?: (txn: FinancialTransaction) => void;
  onSaveMovement?: (record: Movement) => void;
  onSaveTask?: (task: Task) => void;
  onToggleCompleteTask?: (id: string) => void;
  onSaveCommitment?: (comm: Commitment) => void;
  onUpdateCustomers?: (customers: Customer[]) => void;
  onUpdateVisits?: (visits: CustomerVisitRecord[]) => void;
  // Options for Modals
  categories?: string[];
  statuses?: string[];
  seq?: { IN: number; OUT: number };
  financialMovements?: string[];
  restrictions?: string[];
  movementTypes?: string[];
  importanceList?: string[];
  categoryAccounts?: string[];
  restrictionAccounts?: string[];
  accountNames?: string[];
  onAddFinancialOption?: (type: FinancialOptionType, val: string) => void;
  taskCategories?: string[];
  taskOperations?: string[];
  taskAssignees?: string[];
}

/** ملخّص مالي محسوب من السجل المالي. */
export type FinSummary = ReturnType<typeof calculateFinancialSummary>;
/** إحصاءات الديون المحسوبة. */
export type DebtStats = ReturnType<typeof calculateDebtStats>;
/** إحصاءات المخزون المحسوبة داخل اللوحة. */
export interface StockStats {
  totalItems: number;
  totalQty: number;
  lowStockCount: number;
  outOfStockCount: number;
  movementsCount: number;
}
/** صف مهمة موحّد (كلاسيكي + Work OS). */
export interface UnifiedTaskRow {
  id: string;
  title: string;
  end?: string;
  start?: string;
  status: string;
  priority?: string;
  assignee?: string;
  category?: string;
}
/** الملف الشخصي الحالي (للتحية في الرأس). */
export type UserProfile = ReturnType<typeof getCurrentUserProfile>;

/** ما يحتاجه القسم من بيانات — يُشتق من نموذج اللوحة. */
export type {
  ActiveModuleTab,
  Commitment,
  Customer,
  CustomerVisitRecord,
  DebtCommitment,
  DebtRecord,
  DoctorRecord,
  DoctorVisitLog,
  FinancialOptionType,
  FinancialTransaction,
  Item,
  Movement,
  NoteRecord,
  Task,
  WorkOSData,
  WorkOrder,
};
