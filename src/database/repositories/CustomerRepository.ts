import { BaseRepository } from './BaseRepository';
import { Customer, CustomerVisitRecord, DoctorRecord, DoctorVisitLog } from '../../types';
import { DEFAULT_CUSTOMERS, DEFAULT_CUSTOMER_VISITS } from '../../data/defaultCustomers';
import { DEFAULT_DOCTORS, DEFAULT_DOCTOR_VISITS } from '../../data/defaultDoctors';
import { auditService } from '../../core/audit/AuditService';
import { indexedDBStorage } from '../adapters/IndexedDBAdapter';

const CUSTOMERS_KEY = 'suite_customers_items_v2';
const CUSTOMER_VISITS_KEY = 'suite_customers_visits_v2';
const DOCTORS_KEY = 'suite_doctors_items_v1';
const DOCTOR_VISITS_KEY = 'suite_doctors_visits_v1';

export class CustomerRepository extends BaseRepository<Customer> {
  constructor() {
    super(CUSTOMERS_KEY, DEFAULT_CUSTOMERS);
  }

  public getVisits(): CustomerVisitRecord[] {
    const visits = indexedDBStorage.getItemSync<CustomerVisitRecord[]>(CUSTOMER_VISITS_KEY);
    return Array.isArray(visits) ? visits : DEFAULT_CUSTOMER_VISITS;
  }

  public saveVisits(visits: CustomerVisitRecord[]): void {
    indexedDBStorage.setItemSync(CUSTOMER_VISITS_KEY, visits);
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
    const visits = indexedDBStorage.getItemSync<DoctorVisitLog[]>(DOCTOR_VISITS_KEY);
    return Array.isArray(visits) ? visits : DEFAULT_DOCTOR_VISITS;
  }

  public saveVisits(visits: DoctorVisitLog[]): void {
    indexedDBStorage.setItemSync(DOCTOR_VISITS_KEY, visits);
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
