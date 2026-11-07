import { BaseRepository } from './BaseRepository';
import { Item, Movement } from '../../types';
import { DEFAULT_PRODUCTS } from '../../data/defaultProducts';
import { INITIAL_RECORDS } from '../../data/defaultRecords';
import { auditService } from '../../core/audit/AuditService';

const PRODUCTS_KEY = 'suite_stock_products_v2';
const MOVEMENTS_KEY = 'suite_stock_records_v2';

export class ProductRepository extends BaseRepository<Item> {
  constructor() {
    super(PRODUCTS_KEY, DEFAULT_PRODUCTS);
  }

  public findByName(name: string): Item | null {
    return this.findOne((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  }

  public getActiveProducts(): Item[] {
    return this.find((p) => p.isActive);
  }

  public override add(item: Item): Item {
    const res = super.add(item);
    auditService.log({
      action: 'Create',
      entity: 'Product',
      recordId: item.id,
      details: `إضافة صنف جديد: ${item.name}`,
      newValue: item,
    });
    return res;
  }

  public override update(id: string, updatedItem: Partial<Item>): Item | null {
    const old = this.getById(id);
    const res = super.update(id, updatedItem);
    if (res) {
      auditService.log({
        action: 'Update',
        entity: 'Product',
        recordId: id,
        details: `تحديث بيانات الصنف: ${res.name}`,
        oldValue: old,
        newValue: res,
      });
    }
    return res;
  }

  public override delete(id: string): boolean {
    const old = this.getById(id);
    const res = super.delete(id);
    if (res && old) {
      auditService.log({
        action: 'Delete',
        entity: 'Product',
        recordId: id,
        details: `حذف الصنف: ${old.name}`,
        oldValue: old,
      });
    }
    return res;
  }
}

export class StockMovementRepository extends BaseRepository<Movement> {
  constructor() {
    super(MOVEMENTS_KEY, INITIAL_RECORDS);
  }

  public findBySubId(subId: string): Movement | null {
    return this.findOne((m) => m.subId === subId);
  }

  public override add(record: Movement): Movement {
    const res = super.add(record);
    auditService.log({
      action: 'Inventory Adjustment',
      entity: 'StockMovement',
      recordId: record.subId,
      details: `تسجيل حركة ${record.movementType} جديدة رقم ${record.subId} لـ ${record.beneficiary}`,
      newValue: record,
    });
    return res;
  }

  public override update(id: string, record: Partial<Movement>): Movement | null {
    const old = this.getById(id) || this.findBySubId(id);
    const res = super.update(id, record);
    if (res) {
      auditService.log({
        action: 'Update',
        entity: 'StockMovement',
        recordId: res.subId,
        details: `تعديل الحركة رقم ${res.subId} (${res.beneficiary})`,
        oldValue: old,
        newValue: res,
      });
    }
    return res;
  }

  public override delete(id: string): boolean {
    const old = this.getById(id) || this.findBySubId(id);
    const res = super.delete(id);
    if (res && old) {
      auditService.log({
        action: 'Delete',
        entity: 'StockMovement',
        recordId: old.subId,
        details: `حذف الحركة رقم ${old.subId} (${old.beneficiary})`,
        oldValue: old,
      });
    }
    return res;
  }
}

export const productRepository = new ProductRepository();
export const stockMovementRepository = new StockMovementRepository();
