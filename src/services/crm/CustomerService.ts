import { Customer, CustomerVisitRecord } from '../../types';
import { customerRepository, CustomerRepository } from '../../database/repositories/CustomerRepository';
import { auditService } from '../../core/audit/AuditService';
import { Outbox } from '../../sync/Outbox';

export class CustomerService {
  private repo: CustomerRepository;

  constructor(repo: CustomerRepository = customerRepository) {
    this.repo = repo;
  }

  public getAll(): Customer[] {
    return this.repo.getAll();
  }

  public getById(id: string): Customer | null {
    return this.repo.getById(id);
  }

  public getVisits(): CustomerVisitRecord[] {
    return this.repo.getVisits();
  }

  public saveCustomer(customer: Customer): Customer {
    const isNew = !this.repo.getById(customer.id);
    let saved: Customer;

    if (isNew) {
      saved = this.repo.add(customer);
      auditService.log({
        action: 'Create',
        entity: 'Customer',
        recordId: customer.id,
        details: `إضافة عميل جديد: ${customer.name} (${customer.region || ''})`,
        newValue: customer,
      });
      Outbox.enqueue('Customer', 'INSERT', customer.id, customer);
    } else {
      const old = this.repo.getById(customer.id);
      saved = this.repo.update(customer.id, customer) || customer;
      auditService.log({
        action: 'Update',
        entity: 'Customer',
        recordId: customer.id,
        details: `تحديث بيانات العميل: ${customer.name}`,
        oldValue: old,
        newValue: customer,
      });
      Outbox.enqueue('Customer', 'UPDATE', customer.id, customer);
    }

    return saved;
  }

  public deleteCustomer(id: string): boolean {
    const old = this.repo.getById(id);
    if (!old) return false;

    const res = this.repo.delete(id);
    if (res) {
      auditService.log({
        action: 'Delete',
        entity: 'Customer',
        recordId: id,
        details: `حذف العميل: ${old.name}`,
        oldValue: old,
      });
      Outbox.enqueue('Customer', 'DELETE', id, old);
    }
    return res;
  }

  public recordVisit(visit: CustomerVisitRecord): CustomerVisitRecord {
    const saved = this.repo.addVisit(visit);
    Outbox.enqueue('CustomerVisit', 'INSERT', visit.id, visit);
    return saved;
  }

  public saveVisits(visits: CustomerVisitRecord[]): void {
    this.repo.saveVisits(visits);
  }
}

export const customerService = new CustomerService();
