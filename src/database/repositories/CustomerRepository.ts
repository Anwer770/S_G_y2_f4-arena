import { BaseRepository } from './BaseRepository';
import { Customer, CustomerVisitRecord, DoctorRecord, DoctorVisitLog } from '../../types';
import { DEFAULT_CUSTOMERS, DEFAULT_CUSTOMER_VISITS } from '../../data/defaultCustomers';
import { DEFAULT_DOCTORS, DEFAULT_DOCTOR_VISITS } from '../../data/defaultDoctors';
import { auditService } from '../../core/audit/AuditService';
import { createCollectionRepository } from './CollectionRepository';

const CUSTOMERS_KEY = 'suite_customers_items_v2';
const CUSTOMER_VISITS_KEY = 'suite_customers_visits_v2';
const DOCTORS_KEY = 'suite_doctors_items_v1';
const DOCTOR_VISITS_KEY = 'suite_doctors_visits_v1';

/**
 * سجلّا الزيارات — كانا يقرآن/يكتبان عبر `indexedDBStorage` مباشرةً (R45).
 * على العقد نفسه: الغياب أو التلف ⇒ الافتراضي بلا كتابة · الفارغ صالح ⇒ [].
 */
const customerVisitsRepo = createCollectionRepository<CustomerVisitRecord>({
  key: CUSTOMER_VISITS_KEY,
  fallback: DEFAULT_CUSTOMER_VISITS,
});

const doctorVisitsRepo = createCollectionRepository<DoctorVisitLog>({
  key: DOCTOR_VISITS_KEY,
  fallback: DEFAULT_DOCTOR_VISITS,
});

export class CustomerRepository extends BaseRepository<Customer> {
  constructor() {
    super(CUSTOMERS_KEY, DEFAULT_CUSTOMERS);
  }

  public getVisits(): CustomerVisitRecord[] {
    return customerVisitsRepo.read();
  }

  public saveVisits(visits: CustomerVisitRecord[]): void {
    customerVisitsRepo.write(visits);
  }

  public addVisit(visit: CustomerVisitRecord): CustomerVisitRecord {
    const visits = this.getVisits();
    const updated = [visit, ...visits];
    this.saveVisits(updated);

    // Update customer lastVisitDate
    this.update(visit.customerId, { lastVisitDate: visit.date });

    auditService.log({
      action: 'Create',
      entity: 'CustomerVisit',
      recordId: visit.id,
      details: `تسجيل زيارة ميدانية للعميل ${visit.customerName}`,
      newValue: visit,
    });

    return visit;
  }
}

export class DoctorRepository extends BaseRepository<DoctorRecord> {
  constructor() {
    super(DOCTORS_KEY, DEFAULT_DOCTORS);
  }

  public getVisits(): DoctorVisitLog[] {
    return doctorVisitsRepo.read();
  }

  public saveVisits(visits: DoctorVisitLog[]): void {
    doctorVisitsRepo.write(visits);
  }

  public addVisit(visit: DoctorVisitLog): DoctorVisitLog {
    const visits = this.getVisits();
    const updated = [visit, ...visits];
    this.saveVisits(updated);

    // Update doctor lastVisitDate
    this.update(visit.doctorId, { lastVisitDate: visit.date });

    auditService.log({
      action: 'Create',
      entity: 'DoctorVisit',
      recordId: visit.id,
      details: `تسجيل زيارة طبية للدكتور ${visit.doctorName}`,
      newValue: visit,
    });

    return visit;
  }
}

export const customerRepository = new CustomerRepository();
export const doctorRepository = new DoctorRepository();
