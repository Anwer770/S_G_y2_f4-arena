import { financialRepository } from '../../database/repositories/FinancialRepository';
import { productRepository, stockMovementRepository } from '../../database/repositories/ProductRepository';
import { customerRepository } from '../../database/repositories/CustomerRepository';
import { debtRepository } from '../../database/repositories/DebtRepository';
import { suiteTaskRepository, commitmentRepository } from '../../database/repositories/WorkTaskRepository';
import { calculateStock } from '../../utils/stock';
import { getDueAlerts } from '../../utils/dueAlerts';
import { loadSettings } from '../../utils/storage';

export interface DashboardRealKPIs {
  totalCustomers: number;
  totalProducts: number;
  totalStockUnits: number;
  totalStockMovements: number;
  criticalStockItemsCount: number;
  totalReceiptsYER: number;
  totalPaymentsYER: number;
  netFinancialBalanceYER: number;
  totalDebtsReceivableYER: number;
  totalDebtsPayableYER: number;
  totalActiveTasks: number;
  completedTasksCount: number;
  totalActiveCommitments: number;
  alertsOverdueCount: number;
  alertsTodayCount: number;
  alertsSoonCount: number;
}

export class DashboardService {
  public static getRealtimeKPIs(): DashboardRealKPIs {
    const customers = customerRepository.getAll();
    const products = productRepository.getAll();
    const movements = stockMovementRepository.getAll();
    const transactions = financialRepository.getAll();
    const debts = debtRepository.getAll();
    const tasks = suiteTaskRepository.getAll();
    const commitments = commitmentRepository.getAll();

    // 1. Stock calculations
    const settings = loadSettings();
    const stocks = calculateStock(products, movements, settings);
    const totalStockUnits = stocks.reduce((sum, s) => sum + (s.currentStock || 0), 0);
    const criticalStockItemsCount = stocks.filter(
      (s) => s.currentStock <= 5
    ).length;

    // 2. Financial calculations
    let totalReceiptsYER = 0;
    let totalPaymentsYER = 0;
    for (const t of transactions) {
      const yer = Number(t.amountYER) || 0;
      if (t.restriction?.includes('قبض') || t.movement === 'ايرادات') {
        totalReceiptsYER += yer;
      } else {
        totalPaymentsYER += yer;
      }
    }

    // 3. Debts calculations
    let totalDebtsReceivableYER = 0;
    let totalDebtsPayableYER = 0;
    for (const d of debts) {
      if (d.currency === 'YER' || !d.currency) {
        totalDebtsReceivableYER += Number(d.debit) || 0;
        totalDebtsPayableYER += Number(d.credit) || 0;
      }
    }

    // 4. Tasks and commitments
    const totalActiveTasks = tasks.filter((t) => t.status !== 'تم الانجاز' && t.status !== 'ملغي').length;
    const completedTasksCount = tasks.filter((t) => t.status === 'تم الانجاز').length;
    const totalActiveCommitments = commitments.filter(
      (c) => c.status !== 'تم الانجاز' && c.status !== 'ملغي'
    ).length;

    // 5. Intelligent Due Alerts
    const alerts = getDueAlerts(tasks, commitments, 3);

    return {
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalStockUnits,
      totalStockMovements: movements.length,
      criticalStockItemsCount,
      totalReceiptsYER,
      totalPaymentsYER,
      netFinancialBalanceYER: totalReceiptsYER - totalPaymentsYER,
      totalDebtsReceivableYER,
      totalDebtsPayableYER,
      totalActiveTasks,
      completedTasksCount,
      totalActiveCommitments,
      alertsOverdueCount: alerts.overdueCount,
      alertsTodayCount: alerts.todayCount,
      alertsSoonCount: alerts.soonCount,
    };
  }
}
