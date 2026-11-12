/**
 * مخزن الديون والالتزامات (Debts) — مُستخرج من storage.ts (R24).
 */
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import type { DebtAuditLog, DebtCommitment, DebtRecord } from '../../types';
import { DEBT_CATEGORIES, DEBT_OWNERS, DEFAULT_DEBT_COMMITMENTS, DEFAULT_DEBT_RECORDS } from '../debts';
import { STORAGE_KEYS } from './keys';

/**
 * مستودعات دفتر الدين والالتزامات (R33) — كل قراءة/كتابة تمرّ من مستودع واحد
 * بدل تكرار `try/JSON.parse/catch` في كل دالة. السلوك محفوظ حرفياً:
 *   - السجلات والالتزامات: المصفوفة الفارغة تُعدّ «لا بيانات» ⇒ تُعرض البذرة.
 *   - التصنيفات والملاك: نفس المنطق (بقائمة نصية).
 *   - سجل التدقيق: مصفوفة فارغة مقبولة، وسقف 500 سطر.
 */
const debtsRepo = createCollectionRepository<DebtRecord>({
  key: STORAGE_KEYS.DEBTS_RECORDS,
  fallback: DEFAULT_DEBT_RECORDS,
  fallbackOnEmpty: true,
});

const commitmentsRepo = createCollectionRepository<DebtCommitment>({
  key: STORAGE_KEYS.DEBTS_COMMITMENTS,
  fallback: DEFAULT_DEBT_COMMITMENTS,
  fallbackOnEmpty: true,
});

const debtCategoriesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.DEBTS_CATEGORIES,
  fallback: DEBT_CATEGORIES,
  fallbackOnEmpty: true,
});

const debtOwnersRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.DEBTS_OWNERS,
  fallback: DEBT_OWNERS,
  fallbackOnEmpty: true,
});

const DEFAULT_DEBT_AUDIT: DebtAuditLog[] = [
  {
    id: 'LOG-DEBT-1',
    time: new Date().toLocaleString('ar-YE'),
    action: 'استيراد',
    entity: 'دفتر',
    title: 'دفتر الدين والالتزامات',
    details: 'تمت تهيئة دفاتر الدين الأربعة وسجل الالتزامات بنجاح وفق وثيقة PRD',
  },
];

const debtAuditRepo = createCollectionRepository<DebtAuditLog>({
  key: STORAGE_KEYS.DEBTS_AUDIT,
  fallback: DEFAULT_DEBT_AUDIT,
  limit: 500,
});

export function loadDebts(): DebtRecord[] {
  return debtsRepo.read();
}

export function saveDebts(records: DebtRecord[]): void {
  debtsRepo.write(records);
}

export function loadDebtCommitments(): DebtCommitment[] {
  return commitmentsRepo.read();
}

export function saveDebtCommitments(commitments: DebtCommitment[]): void {
  commitmentsRepo.write(commitments);
}

export function loadDebtCategories(): string[] {
  return debtCategoriesRepo.read();
}

export function saveDebtCategories(categories: string[]): void {
  debtCategoriesRepo.write(categories);
}

export function loadDebtOwners(): string[] {
  return debtOwnersRepo.read();
}

export function saveDebtOwners(owners: string[]): void {
  debtOwnersRepo.write(owners);
}

export function loadDebtAuditLogs(): DebtAuditLog[] {
  return debtAuditRepo.read();
}

export function saveDebtAuditLogs(logs: DebtAuditLog[]): void {
  debtAuditRepo.write(logs);
}

const createDebtAuditId = (current: DebtAuditLog[]): string => {
  const baseId = `LOG-DBT-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  if (!current.some((entry) => entry.id === baseId)) return baseId;

  let collision = 1;
  while (current.some((entry) => entry.id === `${baseId}-${collision}`)) collision++;
  return `${baseId}-${collision}`;
};

export function logDebtAudit(
  action: DebtAuditLog['action'],
  entity: DebtAuditLog['entity'],
  title: string,
  details: string
): void {
  const current = loadDebtAuditLogs();
  const newLog: DebtAuditLog = {
    id: createDebtAuditId(current),
    time: new Date().toLocaleString('ar-YE'),
    action,
    entity,
    title,
    details,
  };
  saveDebtAuditLogs([newLog, ...current]);
}
