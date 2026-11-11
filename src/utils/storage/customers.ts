/**
 * مخزن وحدة «customers» — مُستخرج من storage.ts (R26).
 * R36: كل قراءة/كتابة عبر مستودع المجموعات. السلوك محفوظ: القوائم الأساسية
 * تُرجع البذرة عند الفراغ، والزيارات تقبل الفراغ، وسجل التدقيق بسقف 500.
 */
import {
  CUSTOMER_REGIONS,
  CUSTOMER_RESPONSIBLES,
  CUSTOMER_ROUTES,
  CUSTOMER_SOURCES,
  DEFAULT_CUSTOMERS,
  DEFAULT_CUSTOMER_VISITS,
} from '../../data/defaultCustomers';
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import { Customer, CustomerAuditLog, CustomerVisitRecord } from '../../types';
import { STORAGE_KEYS } from './keys';

const customersRepo = createCollectionRepository<Customer>({
  key: STORAGE_KEYS.CUSTOMERS_ITEMS,
  fallback: DEFAULT_CUSTOMERS,
  fallbackOnEmpty: true,
});

/** الزيارات: مصفوفة فارغة **مقبولة** (عميل بلا زيارات بعد) مع بذرة عند الغياب. */
const visitsRepo = createCollectionRepository<CustomerVisitRecord>({
  key: STORAGE_KEYS.CUSTOMERS_VISITS,
  fallback: DEFAULT_CUSTOMER_VISITS,
});

const sourcesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.CUSTOMERS_SOURCES,
  fallback: CUSTOMER_SOURCES,
  fallbackOnEmpty: true,
});

const regionsRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.CUSTOMERS_REGIONS,
  fallback: CUSTOMER_REGIONS,
  fallbackOnEmpty: true,
});

const routesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.CUSTOMERS_ROUTES,
  fallback: CUSTOMER_ROUTES,
  fallbackOnEmpty: true,
});

const responsiblesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.CUSTOMERS_RESPONSIBLES,
  fallback: CUSTOMER_RESPONSIBLES,
  fallbackOnEmpty: true,
});

const DEFAULT_CUSTOMER_AUDIT: CustomerAuditLog[] = [
  {
    id: 'LOG-CUST-1',
    time: new Date().toLocaleString('ar-YE'),
    action: 'استيراد',
    customerName: 'قاعدة بيانات العملاء',
    details: 'تم استيراد قاعدة بيانات 623 عميل ومسارات الزيارات بنجاح',
  },
];

const auditRepo = createCollectionRepository<CustomerAuditLog>({
  key: STORAGE_KEYS.CUSTOMERS_AUDIT,
  fallback: DEFAULT_CUSTOMER_AUDIT,
  limit: 500,
});

export function loadCustomers(): Customer[] {
  return customersRepo.read();
}

export function saveCustomers(customers: Customer[]): void {
  customersRepo.write(customers);
}

export function loadCustomerVisits(): CustomerVisitRecord[] {
  return visitsRepo.read();
}

export function saveCustomerVisits(visits: CustomerVisitRecord[]): void {
  visitsRepo.write(visits);
}

export function loadCustomerSources(): string[] {
  return sourcesRepo.read();
}

export function saveCustomerSources(sources: string[]): void {
  sourcesRepo.write(sources);
}

export function loadCustomerRegions(): string[] {
  return regionsRepo.read();
}

export function saveCustomerRegions(regions: string[]): void {
  regionsRepo.write(regions);
}

export function loadCustomerRoutes(): string[] {
  return routesRepo.read();
}

export function saveCustomerRoutes(routes: string[]): void {
  routesRepo.write(routes);
}

export function loadCustomerResponsibles(): string[] {
  return responsiblesRepo.read();
}

export function saveCustomerResponsibles(responsibles: string[]): void {
  responsiblesRepo.write(responsibles);
}

export function loadCustomerAuditLogs(): CustomerAuditLog[] {
  return auditRepo.read();
}

export function saveCustomerAuditLogs(logs: CustomerAuditLog[]): void {
  auditRepo.write(logs);
}

const createCustomerAuditId = (current: CustomerAuditLog[]): string => {
  const baseId = `LOG-C-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  if (!current.some((entry) => entry.id === baseId)) return baseId;

  let collision = 1;
  while (current.some((entry) => entry.id === `${baseId}-${collision}`)) collision++;
  return `${baseId}-${collision}`;
};

export function logCustomerAudit(action: CustomerAuditLog['action'], customerName: string, details: string): void {
  const current = loadCustomerAuditLogs();
  const newLog: CustomerAuditLog = {
    id: createCustomerAuditId(current),
    time: new Date().toLocaleString('ar-YE'),
    action,
    customerName,
    details,
  };
  saveCustomerAuditLogs([newLog, ...current]);
}
