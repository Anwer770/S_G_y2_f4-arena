/**
 * مخزن وحدة «doctors» — مُستخرج من storage.ts (R26).
 */
import {
  DEFAULT_DOCTORS,
  DEFAULT_DOCTOR_VISITS,
  DOCTOR_REGIONS,
  DOCTOR_RESPONSIBLES,
  DOCTOR_ROUTES,
  DOCTOR_SPECIALTIES,
} from '../../data/defaultDoctors';
import {
  dbStorage,
} from '../../database/dbStorage';
import {
  DoctorAuditLog,
  DoctorRecord,
  DoctorVisitLog,
} from '../../types';
import {
  STORAGE_KEYS,
} from './keys';

export function loadDoctors(): DoctorRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctors:', e);
  }
  return DEFAULT_DOCTORS;
}

export function saveDoctors(doctors: DoctorRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_ITEMS, JSON.stringify(doctors));
  } catch (e) {
    console.error('Error saving doctors:', e);
  }
}

export function loadDoctorVisits(): DoctorVisitLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_VISITS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor visits:', e);
  }
  return DEFAULT_DOCTOR_VISITS;
}

export function saveDoctorVisits(visits: DoctorVisitLog[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_VISITS, JSON.stringify(visits));
  } catch (e) {
    console.error('Error saving doctor visits:', e);
  }
}

export function loadDoctorRegions(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_REGIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor regions:', e);
  }
  return DOCTOR_REGIONS;
}

export function saveDoctorRegions(regions: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_REGIONS, JSON.stringify(regions));
  } catch (e) {
    console.error('Error saving doctor regions:', e);
  }
}

export function loadDoctorRoutes(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_ROUTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor routes:', e);
  }
  return DOCTOR_ROUTES;
}

export function saveDoctorRoutes(routes: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_ROUTES, JSON.stringify(routes));
  } catch (e) {
    console.error('Error saving doctor routes:', e);
  }
}

export function loadDoctorResponsibles(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_RESPONSIBLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor responsibles:', e);
  }
  return DOCTOR_RESPONSIBLES;
}

export function saveDoctorResponsibles(responsibles: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_RESPONSIBLES, JSON.stringify(responsibles));
  } catch (e) {
    console.error('Error saving doctor responsibles:', e);
  }
}

export function loadDoctorSpecialties(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_SPECIALTIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor specialties:', e);
  }
  return DOCTOR_SPECIALTIES;
}

export function saveDoctorSpecialties(specialties: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_SPECIALTIES, JSON.stringify(specialties));
  } catch (e) {
    console.error('Error saving doctor specialties:', e);
  }
}

export function loadDoctorAuditLogs(): DoctorAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.DOCTORS_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading doctor audit logs:', e);
  }
  return [
    {
      id: 'LOG-DOC-1',
      time: new Date().toLocaleString('ar-YE'),
      action: 'استيراد',
      doctorName: 'قاعدة بيانات الأطباء',
      details: 'تم تهيئة دفتر إدارة زيارات الأطباء ومسارات الزيارات بنجاح',
    },
  ];
}

export function saveDoctorAuditLogs(logs: DoctorAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving doctor audit logs:', e);
  }
}

export function logDoctorAudit(
  action: DoctorAuditLog['action'],
  doctorName: string,
  details: string
): void {
  const current = loadDoctorAuditLogs();
  const newLog: DoctorAuditLog = {
    id: `LOG-D-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    time: new Date().toLocaleString('ar-YE'),
    action,
    doctorName,
    details,
  };
  saveDoctorAuditLogs([newLog, ...current]);
}
