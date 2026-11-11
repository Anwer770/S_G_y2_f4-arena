// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbStorage } from '../../src/database/dbStorage';
import {
  DEFAULT_DOCTORS,
  DEFAULT_DOCTOR_VISITS,
  DOCTOR_REGIONS,
  DOCTOR_RESPONSIBLES,
  DOCTOR_ROUTES,
  DOCTOR_SPECIALTIES,
} from '../../src/data/defaultDoctors';
import type { DoctorAuditLog } from '../../src/types';
import {
  loadDoctorAuditLogs,
  loadDoctorRegions,
  loadDoctorResponsibles,
  loadDoctorRoutes,
  loadDoctorSpecialties,
  loadDoctorVisits,
  loadDoctors,
  logDoctorAudit,
  saveDoctorAuditLogs,
  saveDoctorRegions,
  saveDoctorResponsibles,
  saveDoctorRoutes,
  saveDoctorSpecialties,
  saveDoctorVisits,
  saveDoctors,
} from '../../src/utils/storage/doctors';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

beforeEach(() => {
  dbStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
});

afterEach(() => {
  dbStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('R70 — استمرارية دفتر الأطباء', () => {
  it('يفصل الغياب عن الفراغ: دفتر الأطباء وقوائمه يعودان للبذور، أما الزيارات والتدقيق ففارغان مشروعان', () => {
    expect(loadDoctors()).toEqual(DEFAULT_DOCTORS);
    expect(loadDoctorVisits()).toEqual(DEFAULT_DOCTOR_VISITS);
    expect(loadDoctorRegions()).toEqual(DOCTOR_REGIONS);
    expect(loadDoctorRoutes()).toEqual(DOCTOR_ROUTES);
    expect(loadDoctorResponsibles()).toEqual(DOCTOR_RESPONSIBLES);
    expect(loadDoctorSpecialties()).toEqual(DOCTOR_SPECIALTIES);
    expect(loadDoctorAuditLogs()).toEqual([expect.objectContaining({ id: 'LOG-DOC-1', action: 'استيراد' })]);

    saveDoctors([]);
    saveDoctorRegions([]);
    saveDoctorRoutes([]);
    saveDoctorResponsibles([]);
    saveDoctorSpecialties([]);
    expect(loadDoctors()).toEqual(DEFAULT_DOCTORS);
    expect(loadDoctorRegions()).toEqual(DOCTOR_REGIONS);
    expect(loadDoctorRoutes()).toEqual(DOCTOR_ROUTES);
    expect(loadDoctorResponsibles()).toEqual(DOCTOR_RESPONSIBLES);
    expect(loadDoctorSpecialties()).toEqual(DOCTOR_SPECIALTIES);

    saveDoctorVisits([]);
    saveDoctorAuditLogs([]);
    expect(loadDoctorVisits()).toEqual([]);
    expect(loadDoctorAuditLogs()).toEqual([]);
  });

  it('يحفظ كل دفتر طبي على مفتاحه المستقل، ولا يخلط طبيباً أو زيارةً أو قائمة خيارات بأخرى', () => {
    const doctor = { ...DEFAULT_DOCTORS[0]!, id: 'DOC-R70', name: 'طبيب محفوظ R70' };
    const visit = { ...DEFAULT_DOCTOR_VISITS[0]!, id: 'DVL-R70', doctorId: doctor.id };

    saveDoctors([doctor]);
    saveDoctorVisits([visit]);
    saveDoctorRegions(['منطقة R70']);
    saveDoctorRoutes(['مسار R70']);
    saveDoctorResponsibles(['مسؤول R70']);
    saveDoctorSpecialties(['تخصص R70']);

    expect(loadDoctors()).toEqual([doctor]);
    expect(loadDoctorVisits()).toEqual([visit]);
    expect(loadDoctorRegions()).toEqual(['منطقة R70']);
    expect(loadDoctorRoutes()).toEqual(['مسار R70']);
    expect(loadDoctorResponsibles()).toEqual(['مسؤول R70']);
    expect(loadDoctorSpecialties()).toEqual(['تخصص R70']);
    expect(dbStorage.getItem(STORAGE_KEYS.DOCTORS_VISITS)).not.toContain('طبيب محفوظ R70');
    expect(dbStorage.getItem(STORAGE_KEYS.DOCTORS_ITEMS)).not.toContain('DVL-R70');
  });

  it('يرفض JSON التالف والشكل غير المصفوفي بأمان ولا يمرر بيانات دخيلة إلى الدفاتر', () => {
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_ITEMS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_VISITS, JSON.stringify({ visit: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_REGIONS, JSON.stringify({ region: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_ROUTES, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_RESPONSIBLES, JSON.stringify({ responsible: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_SPECIALTIES, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.DOCTORS_AUDIT, JSON.stringify({ audit: 'ليست قائمة' }));

    expect(loadDoctors()).toEqual(DEFAULT_DOCTORS);
    expect(loadDoctorVisits()).toEqual(DEFAULT_DOCTOR_VISITS);
    expect(loadDoctorRegions()).toEqual(DOCTOR_REGIONS);
    expect(loadDoctorRoutes()).toEqual(DOCTOR_ROUTES);
    expect(loadDoctorResponsibles()).toEqual(DOCTOR_RESPONSIBLES);
    expect(loadDoctorSpecialties()).toEqual(DOCTOR_SPECIALTIES);
    expect(loadDoctorAuditLogs()).toEqual([expect.objectContaining({ id: 'LOG-DOC-1' })]);
  });

  it('يكتب أحدث تدقيق أولاً، ويبقي معرفه فريداً حتى لحدثين في اللحظة نفسها، ويقص السجل إلى 500', () => {
    saveDoctorAuditLogs([]);
    vi.spyOn(Date, 'now').mockReturnValue(1730000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    logDoctorAudit('إضافة', 'طبيب أول', 'حدث أول');
    const firstId = loadDoctorAuditLogs()[0]!.id;
    saveDoctorAuditLogs([
      {
        id: `${firstId}-1`,
        time: '2026-11-07T12:00:00.000Z',
        action: 'استيراد',
        doctorName: 'تضارب',
        details: 'لاحقة محجوزة',
      },
      ...loadDoctorAuditLogs(),
    ]);
    logDoctorAudit('تعديل', 'طبيب ثان', 'حدث ثان');

    const newLogs = loadDoctorAuditLogs();
    expect(newLogs).toEqual([
      expect.objectContaining({ id: `${firstId}-2`, action: 'تعديل', doctorName: 'طبيب ثان', details: 'حدث ثان' }),
      expect.objectContaining({ id: `${firstId}-1`, doctorName: 'تضارب' }),
      expect.objectContaining({ id: firstId, action: 'إضافة', doctorName: 'طبيب أول', details: 'حدث أول' }),
    ]);
    expect(new Set(newLogs.map((entry) => entry.id)).size).toBe(3);

    const logs: DoctorAuditLog[] = Array.from({ length: 501 }, (_, index) => ({
      id: `LOG-R70-${index}`,
      time: '2026-11-07T12:00:00.000Z',
      action: 'تعديل',
      doctorName: String(index),
      details: `تفصيل ${index}`,
    }));
    saveDoctorAuditLogs(logs);
    expect(loadDoctorAuditLogs()).toHaveLength(500);
    expect(loadDoctorAuditLogs()[0]?.id).toBe('LOG-R70-0');
    expect(loadDoctorAuditLogs()[499]?.id).toBe('LOG-R70-499');
  });

  it('يعزل القارئ البذور والمدخلات المحفوظة عن تعديل المستهلك من دون حفظ صريح', () => {
    const originalDoctorName = DEFAULT_DOCTORS[0]!.name;
    const originalRegion = DOCTOR_REGIONS[0]!;
    const doctors = loadDoctors();
    const regions = loadDoctorRegions();
    doctors[0]!.name = 'تعديل لا يلوّث البذرة';
    regions[0] = 'منطقة لا تلوّث البذرة';

    expect(DEFAULT_DOCTORS[0]!.name).toBe(originalDoctorName);
    expect(DOCTOR_REGIONS[0]).toBe(originalRegion);
    expect(loadDoctors()[0]!.name).toBe(originalDoctorName);
    expect(loadDoctorRegions()[0]).toBe(originalRegion);

    const saved = [{ ...DEFAULT_DOCTORS[0]!, id: 'DOC-IMMUTABLE' }];
    saveDoctors(saved);
    saved[0]!.name = 'تغيير الذاكرة بعد الحفظ';
    expect(loadDoctors()[0]!.name).toBe(originalDoctorName);
  });
});
