/**
 * مخزن وحدة «doctors» — مُستخرج من storage.ts (R26).
 * R36: كل قراءة/كتابة عبر مستودع المجموعات. السلوك محفوظ: الأطباء والقوائم
 * تُرجع البذرة عند الفراغ، والزيارات تقبل الفراغ، وسجل التدقيق بسقف 500.
 */
import {
  DEFAULT_DOCTORS,
  DEFAULT_DOCTOR_VISITS,
  DOCTOR_REGIONS,
  DOCTOR_RESPONSIBLES,
  DOCTOR_ROUTES,
  DOCTOR_SPECIALTIES,
} from '../../data/defaultDoctors';
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import { DoctorAuditLog, DoctorRecord, DoctorVisitLog } from '../../types';
import { STORAGE_KEYS } from './keys';

const doctorsRepo = createCollectionRepository<DoctorRecord>({
  key: STORAGE_KEYS.DOCTORS_ITEMS,
  fallback: DEFAULT_DOCTORS,
  fallbackOnEmpty: true,
});

/** الزيارات: مصفوفة فارغة **مقبولة** (طبيب بلا زيارات بعد) مع بذرة عند الغياب. */
const visitsRepo = createCollectionRepository<DoctorVisitLog>({
  key: STORAGE_KEYS.DOCTORS_VISITS,
  fallback: DEFAULT_DOCTOR_VISITS,
});

const regionsRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.DOCTORS_REGIONS,
  fallback: DOCTOR_REGIONS,
  fallbackOnEmpty: true,
});

const routesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.DOCTORS_ROUTES,
  fallback: DOCTOR_ROUTES,
  fallbackOnEmpty: true,
});

const responsiblesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.DOCTORS_RESPONSIBLES,
  fallback: DOCTOR_RESPONSIBLES,
  fallbackOnEmpty: true,
});

const specialtiesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.DOCTORS_SPECIALTIES,
  fallback: DOCTOR_SPECIALTIES,
  fallbackOnEmpty: true,
});

const DEFAULT_DOCTOR_AUDIT: DoctorAuditLog[] = [
  {
    id: 'LOG-DOC-1',
    time: new Date().toLocaleString('ar-YE'),
    action: 'استيراد',
    doctorName: 'قاعدة بيانات الأطباء',
    details: 'تم تهيئة دفتر إدارة زيارات الأطباء ومسارات الزيارات بنجاح',
  },
];

const auditRepo = createCollectionRepository<DoctorAuditLog>({
  key: STORAGE_KEYS.DOCTORS_AUDIT,
  fallback: DEFAULT_DOCTOR_AUDIT,
  limit: 500,
});

export function loadDoctors(): DoctorRecord[] {
  return doctorsRepo.read();
}

export function saveDoctors(doctors: DoctorRecord[]): void {
  doctorsRepo.write(doctors);
}

export function loadDoctorVisits(): DoctorVisitLog[] {
  return visitsRepo.read();
}

export function saveDoctorVisits(visits: DoctorVisitLog[]): void {
  visitsRepo.write(visits);
}

export function loadDoctorRegions(): string[] {
  return regionsRepo.read();
}

export function saveDoctorRegions(regions: string[]): void {
  regionsRepo.write(regions);
}

export function loadDoctorRoutes(): string[] {
  return routesRepo.read();
}

export function saveDoctorRoutes(routes: string[]): void {
  routesRepo.write(routes);
}

export function loadDoctorResponsibles(): string[] {
  return responsiblesRepo.read();
}

export function saveDoctorResponsibles(responsibles: string[]): void {
  responsiblesRepo.write(responsibles);
}

export function loadDoctorSpecialties(): string[] {
  return specialtiesRepo.read();
}

export function saveDoctorSpecialties(specialties: string[]): void {
  specialtiesRepo.write(specialties);
}

export function loadDoctorAuditLogs(): DoctorAuditLog[] {
  return auditRepo.read();
}

export function saveDoctorAuditLogs(logs: DoctorAuditLog[]): void {
  auditRepo.write(logs);
}

export function logDoctorAudit(action: DoctorAuditLog['action'], doctorName: string, details: string): void {
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
