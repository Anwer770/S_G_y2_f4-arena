/**
 * مخزن وحدة «customers» — مُستخرج من storage.ts (R26).
 */
import {
  CUSTOMER_REGIONS,
  CUSTOMER_RESPONSIBLES,
  CUSTOMER_ROUTES,
  CUSTOMER_SOURCES,
  DEFAULT_CUSTOMERS,
  DEFAULT_CUSTOMER_VISITS,
} from '../../data/defaultCustomers';
import {
  dbStorage,
} from '../../database/dbStorage';
import {
  Customer,
  CustomerAuditLog,
  CustomerVisitRecord,
} from '../../types';
import {
  STORAGE_KEYS,
} from './keys';

export function loadCustomers(): Customer[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customers:', e);
  }
  return DEFAULT_CUSTOMERS;
}

export function saveCustomers(customers: Customer[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_ITEMS, JSON.stringify(customers));
  } catch (e) {
    console.error('Error saving customers:', e);
  }
}

export function loadCustomerVisits(): CustomerVisitRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_VISITS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer visits:', e);
  }
  return DEFAULT_CUSTOMER_VISITS;
}

export function saveCustomerVisits(visits: CustomerVisitRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_VISITS, JSON.stringify(visits));
  } catch (e) {
    console.error('Error saving customer visits:', e);
  }
}

export function loadCustomerSources(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_SOURCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer sources:', e);
  }
  return CUSTOMER_SOURCES;
}

export function saveCustomerSources(sources: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_SOURCES, JSON.stringify(sources));
  } catch (e) {
    console.error('Error saving customer sources:', e);
  }
}

export function loadCustomerRegions(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_REGIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer regions:', e);
  }
  return CUSTOMER_REGIONS;
}

export function saveCustomerRegions(regions: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_REGIONS, JSON.stringify(regions));
  } catch (e) {
    console.error('Error saving customer regions:', e);
  }
}

export function loadCustomerRoutes(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_ROUTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer routes:', e);
  }
  return CUSTOMER_ROUTES;
}

export function saveCustomerRoutes(routes: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_ROUTES, JSON.stringify(routes));
  } catch (e) {
    console.error('Error saving customer routes:', e);
  }
}

export function loadCustomerResponsibles(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_RESPONSIBLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer responsibles:', e);
  }
  return CUSTOMER_RESPONSIBLES;
}

export function saveCustomerResponsibles(responsibles: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_RESPONSIBLES, JSON.stringify(responsibles));
  } catch (e) {
    console.error('Error saving customer responsibles:', e);
  }
}

export function loadCustomerAuditLogs(): CustomerAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.CUSTOMERS_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading customer audit logs:', e);
  }
  return [
    {
      id: 'LOG-CUST-1',
      time: new Date().toLocaleString('ar-YE'),
      action: 'استيراد',
      customerName: 'قاعدة بيانات العملاء',
      details: 'تم استيراد قاعدة بيانات 623 عميل ومسارات الزيارات بنجاح',
    },
  ];
}

export function saveCustomerAuditLogs(logs: CustomerAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.CUSTOMERS_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving customer audit logs:', e);
  }
}

export function logCustomerAudit(
  action: CustomerAuditLog['action'],
  customerName: string,
  details: string
): void {
  const current = loadCustomerAuditLogs();
  const newLog: CustomerAuditLog = {
    id: `LOG-C-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    time: new Date().toLocaleString('ar-YE'),
    action,
    customerName,
    details,
  };
  saveCustomerAuditLogs([newLog, ...current]);
}
