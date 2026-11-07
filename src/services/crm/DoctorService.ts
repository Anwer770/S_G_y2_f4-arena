import { DoctorRecord, DoctorVisitLog } from '../../types';
import { doctorRepository, DoctorRepository } from '../../database/repositories/CustomerRepository';
import { auditService } from '../../core/audit/AuditService';
import { Outbox } from '../../sync/Outbox';

export class DoctorService {
  private repo: DoctorRepository;

  constructor(repo: DoctorRepository = doctorRepository) {
    this.repo = repo;
  }

  public getAll(): DoctorRecord[] {
    return this.repo.getAll();
  }

  public getById(id: string): DoctorRecord | null {
    return this.repo.getById(id);
  }

  public getVisits(): DoctorVisitLog[] {
    return this.repo.getVisits();
  }

  public saveDoctor(doctor: DoctorRecord): DoctorRecord {
    const isNew = !this.repo.getById(doctor.id);
    let saved: DoctorRecord;

    if (isNew) {
      saved = this.repo.add(doctor);
      auditService.log({
        action: 'Create',
        entity: 'Doctor',
        recordId: doctor.id,
        details: `إضافة طبيب جديد: د. ${doctor.name} (${doctor.specialty || ''})`,
        newValue: doctor,
      });
      Outbox.enqueue('Doctor', 'INSERT', doctor.id, doctor);
    } else {
      const old = this.repo.getById(doctor.id);
      saved = this.repo.update(doctor.id, doctor) || doctor;
      auditService.log({
        action: 'Update',
        entity: 'Doctor',
        recordId: doctor.id,
        details: `تحديث بيانات الطبيب: د. ${doctor.name}`,
        oldValue: old,
        newValue: doctor,
      });
      Outbox.enqueue('Doctor', 'UPDATE', doctor.id, doctor);
    }

    return saved;
  }

  public deleteDoctor(id: string): boolean {
    const old = this.repo.getById(id);
    if (!old) return false;

    const res = this.repo.delete(id);
    if (res) {
      auditService.log({
        action: 'Delete',
        entity: 'Doctor',
        recordId: id,
        details: `حذف الطبيب: د. ${old.name}`,
        oldValue: old,
      });
      Outbox.enqueue('Doctor', 'DELETE', id, old);
    }
    return res;
  }

  public recordVisit(visit: DoctorVisitLog): DoctorVisitLog {
    const saved = this.repo.addVisit(visit);
    Outbox.enqueue('DoctorVisit', 'INSERT', visit.id, visit);
    return saved;
  }

  public saveVisits(visits: DoctorVisitLog[]): void {
    this.repo.saveVisits(visits);
  }
}

export const doctorService = new DoctorService();
