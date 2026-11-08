/**
 * الديون والالتزامات — واجهة عامة (R30).
 *
 * فُكِّك الملف (1504 سطراً) إلى أربع وحدات موضوعية:
 *   - `debts/debtCatalogs`  التصنيفات والمسؤولون ورموز الدفاتر
 *   - `debts/debtSeeds`     البيانات البذرية للدفاتر
 *   - `debts/debtCommitmentSeeds` البيانات البذرية للالتزامات
 *   - `debts/debtAnalytics` الإحصاءات والأرصدة التراكمية وتوليد المعرفات
 *   - `debts/debtExporters` التصدير إلى CSV و Excel
 *
 * كل المستوردين القدامى (`from '../utils/debts'`) يعملون بلا تغيير.
 */
export * from './debts/debtCatalogs';
export * from './debts/debtSeeds';
export * from './debts/debtCommitmentSeeds';
export * from './debts/debtAnalytics';
export * from './debts/debtExporters';
